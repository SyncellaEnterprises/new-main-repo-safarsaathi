from langchain_community.embeddings import HuggingFaceEmbeddings
from pinecone import Pinecone
import psycopg2
from config.config import *
from utils.exception import CustomException
from utils.logger import logging
import sys


class RecommendationModel:
    DEFAULT_RECOMMENDATION_LIMIT = 50  # Limit for recommendations

    def __init__(self):
        try:
            # Load Embedding Model
            self.embed_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")

            # Connect to PostgreSQL
            self.connection = psycopg2.connect(
                host=POSTGRES_HOST,
                database=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                port=POSTGRES_PORT
            )
            self.cursor = self.connection.cursor()

            # Connect to Pinecone
            self.pinecone = Pinecone(api_key=PINECONE_API_KEY)
            self.index = self.pinecone.Index("user-recommendations")

        except Exception as e:
            logging.error(f"Error initializing RecommendationModel: {e}")
            raise CustomException(e, sys)

    def get_recommendations(self, username):
        """Fetch recommendations for a user from Pinecone"""
        try:
            logging.info(f"Fetching recommendations for {username}")

            # Get user ID
            self.cursor.execute("SELECT id FROM user_db WHERE username = %s", (username,))
            user_data = self.cursor.fetchone()
            if not user_data:
                return {"error": "User not found"}, 404
            
            user_id = user_data[0]

            # Get user embedding from Pinecone
            response = self.index.query(
                vector=self.embed_model.embed_query(username),  # Generate embedding
                top_k=self.DEFAULT_RECOMMENDATION_LIMIT,
                include_metadata=True
            )

            # Format Recommendations
            recommendations = []
            for match in response["matches"]:
                recommendations.append({
                    "username": match["metadata"]["username"],
                    "similarity_score": round(match["score"], 3),
                })

            # Store recommendations in PostgreSQL
            self.store_recommendations(user_id, recommendations)

            return {"recommendations": recommendations}, 200

        except Exception as e:
            logging.error(f"Error in get_recommendations: {str(e)}")
            return {"error": str(e)}, 500

    def store_recommendations(self, user_id, recommendations):
        """Store recommendations in PostgreSQL"""
        try:
            logging.info(f"Storing recommendations for user_id: {user_id}")

            # Delete existing recommendations
            self.cursor.execute("DELETE FROM user_recommendation_entries WHERE user_id = %s", (user_id,))

            # Batch Insert Recommendations
            insert_query = """
                INSERT INTO user_recommendation_entries (user_id, recommended_user_id, similarity_score, rank)
                VALUES %s;
            """
            records = [
                (user_id, self.get_user_id(rec["username"]), rec["similarity_score"], idx + 1)
                for idx, rec in enumerate(recommendations)
            ]

            psycopg2.extras.execute_values(self.cursor, insert_query, records)
            self.connection.commit()
            logging.info("Recommendations stored successfully")

        except Exception as e:
            logging.error(f"Error storing recommendations: {str(e)}")
            self.connection.rollback()
