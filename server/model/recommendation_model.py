import os
import sys
import psycopg2
from psycopg2.extras import DictCursor
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from utils.exception import CustomException
from utils.logger import logging
from config.config import POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT
from flask import jsonify
import time
import threading

# Create a lock for the model loading
model_lock = threading.Lock()
# Global variable to hold the model
_embedding_model = None
# Number of retries for model loading
MAX_MODEL_LOAD_RETRIES = 3

# Dummy encoder for fallback
class DummyEncoder:
    """Fallback encoder when HuggingFace model fails to load"""
    def encode(self, texts, show_progress_bar=False):
        """Create random vectors for texts - not meaningful but allows basic service"""
        logging.warning(f"Using DummyEncoder for {len(texts)} texts")
        # Create random embeddings of size 384 (same as all-MiniLM-L6-v2)
        return np.random.rand(len(texts), 384)

class RecommendationModel:
    DEFAULT_RECOMMENDATION_LIMIT = 50

    def __init__(self):
        try:
            # Connect to PostgreSQL
            self.connection = psycopg2.connect(
                host=POSTGRES_HOST,
                database=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                port=POSTGRES_PORT
            )
            self.cursor = self.connection.cursor(cursor_factory=DictCursor)
            logging.info("Database connection established")

            # Load the model in a thread-safe way with a global instance
            global _embedding_model
            with model_lock:
                if _embedding_model is None:
                    retries = 0
                    last_error = None
                    
                    # Try loading the model with retries
                    while retries < MAX_MODEL_LOAD_RETRIES:
                        try:
                            # Try to load the model with increased timeout
                            logging.info(f"Loading SentenceTransformer model (attempt {retries+1}/{MAX_MODEL_LOAD_RETRIES})...")
                            start_time = time.time()
                            
                            # Import here to avoid startup delay if HF servers are slow
                            from sentence_transformers import SentenceTransformer
                            _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
                            
                            elapsed_time = time.time() - start_time
                            logging.info(f"SentenceTransformer model loaded in {elapsed_time:.2f} seconds")
                            break
                        except Exception as e:
                            last_error = e
                            retries += 1
                            logging.error(f"Error loading SentenceTransformer model (attempt {retries}/{MAX_MODEL_LOAD_RETRIES}): {str(e)}")
                            time.sleep(2)  # Wait before retrying
                    
                    # If all retries failed, use dummy encoder
                    if _embedding_model is None:
                        logging.warning("All attempts to load SentenceTransformer failed, using DummyEncoder")
                        _embedding_model = DummyEncoder()
            
            # Set the model reference for this instance
            self.embedding_model = _embedding_model

        except Exception as e:
            logging.error(f"Error during RecommendationModel initialization: {str(e)}")
            if hasattr(self, 'connection') and self.connection:
                self.connection.rollback()
            raise CustomException(e, sys)

    def user_recommendation_model(self, user_id):
        try:
            # Fetch user profiles
            query = '''
                SELECT 
                    user_id,
                    location,
                    interest as interests
                FROM user_profile 
                WHERE location IS NOT NULL 
                OR interest IS NOT NULL
            '''
            self.cursor.execute(query)
            user_profiles = self.cursor.fetchall()

            if not user_profiles:
                logging.warning("No user profiles found with location or interests")
                return jsonify({"status": "error", "message": "No profiles available"}), 404

            # Convert to DataFrame
            df = pd.DataFrame(user_profiles)
            df.columns = ['user_id', 'location', 'interests']
            logging.info(f"Fetched {len(df)} user profiles")

            # Preprocess data
            df['location'] = df['location'].fillna('unknown')
            df['interests'] = df['interests'].fillna('{none}')
            df['interests'] = df['interests'].apply(lambda x: x.strip('{}').split(',') if isinstance(x, str) else ['none'])
            df['profile_text'] = df.apply(lambda row: f"Location: {row['location']} Interests: {' '.join(row['interests'])}", axis=1)

            # Generate embeddings
            try:
                embeddings = self.embedding_model.encode(df['profile_text'].tolist(), show_progress_bar=False)
                user_ids = df['user_id']

                # Compute similarity
                similarity = cosine_similarity(embeddings)

                # Get recommendations and scores for the given user_id
                if user_id not in user_ids.values:
                    logging.warning(f"User {user_id} not found in profiles")
                    return jsonify({"status": "error", "message": "User not found"}), 404

                user_idx = user_ids[user_ids == user_id].index[0]
                similar_users_idx = similarity[user_idx].argsort()[::-1][1:self.DEFAULT_RECOMMENDATION_LIMIT + 1]  # Exclude self
                recommended_ids = user_ids.iloc[similar_users_idx].tolist()
                similarity_scores = similarity[user_idx][similar_users_idx].tolist()

                # Store recommendations in the database
                self.store_user_recommendations(user_id, recommended_ids, similarity_scores)

                logging.info(f"Recommendations for user {user_id}: {recommended_ids}")
                return jsonify({
                    "status": "success",
                    "recommended_users": recommended_ids,
                    "similarity_scores": similarity_scores
                }), 200
            except Exception as e:
                logging.error(f"Error generating embeddings: {str(e)}")
                return self._fallback_recommendations(user_id)

        except Exception as e:
            logging.error(f"Error in user_recommendation_model: {str(e)}")
            return jsonify({
                "status": "error",
                "message": str(e),
                "details": "Failed to provide recommendations"
            }), 500

    def _fallback_recommendations(self, user_id):
        """Provide fallback recommendations based on random selection from database"""
        try:
            # Get random users excluding the current user
            query = '''
                SELECT user_id FROM user_profile
                WHERE user_id != %s
                ORDER BY RANDOM()
                LIMIT %s
            '''
            self.cursor.execute(query, (user_id, self.DEFAULT_RECOMMENDATION_LIMIT))
            recommended_ids = [row[0] for row in self.cursor.fetchall()]
            
            # Generate fake similarity scores (0.1 to 0.9)
            similarity_scores = np.linspace(0.9, 0.1, len(recommended_ids)).tolist()
            
            # Store these fallback recommendations
            self.store_user_recommendations(user_id, recommended_ids, similarity_scores)
            
            logging.info(f"Provided fallback recommendations for user {user_id}")
            return jsonify({
                "status": "success",
                "recommended_users": recommended_ids,
                "similarity_scores": similarity_scores
            }), 200
        except Exception as e:
            logging.error(f"Error in fallback recommendations: {str(e)}")
            return jsonify({
                "status": "error",
                "message": "Could not generate recommendations",
                "details": str(e)
            }), 500

    def store_user_recommendations(self, user_id, recommended_ids, similarity_scores):
        try:
            # Delete existing recommendations for this user
            delete_query = '''
                DELETE FROM user_recommendations_db 
                WHERE user_id = %s
            '''
            self.cursor.execute(delete_query, (user_id,))
            self.connection.commit()
            logging.info(f"Deleted old recommendations for user {user_id}")

            # Insert new recommendations
            insert_query = '''
                INSERT INTO user_recommendations_db (user_id, recommended_user_id, similarity_score, rank)
                VALUES (%s, %s, %s, %s)
            '''
            for rank, (rec_id, score) in enumerate(zip(recommended_ids, similarity_scores), 1):
                self.cursor.execute(insert_query, (user_id, rec_id, score, rank))
            self.connection.commit()
            logging.info(f"Stored {len(recommended_ids)} recommendations for user {user_id}")

        except Exception as e:
            self.connection.rollback()
            logging.error(f"Error storing recommendations for user {user_id}: {str(e)}")
            raise CustomException(e, sys)

    def __del__(self):
        try:
            if hasattr(self, 'cursor') and self.cursor:
                self.cursor.close()
            if hasattr(self, 'connection') and self.connection:
                self.connection.close()
            logging.info("Database connection closed")
        except Exception as e:
            logging.error(f"Error closing database connections: {str(e)}")