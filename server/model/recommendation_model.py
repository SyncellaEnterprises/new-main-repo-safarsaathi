import os
import sys
import psycopg2
from psycopg2.extras import DictCursor
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from utils.exception import CustomException
from utils.logger import logging
from config.config import POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT
from flask import jsonify

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

            # Load pre-trained embedding model
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logging.info("SentenceTransformer model loaded")

        except Exception as e:
            logging.error(f"Error during RecommendationModel initialization: {str(e)}")
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
            logging.error(f"Error in user_recommendation_model: {str(e)}")
            raise CustomException(e, sys)

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