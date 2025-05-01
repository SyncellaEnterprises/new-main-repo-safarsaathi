from config.config import *
from utils.exception import CustomException
from utils.logger import logging
from psycopg2.extras import DictCursor
import sys


class RecommendationModel:
    def __init__(self, connection):
        try:
            # Connect to PostgreSQL
            self.connection = connection
            self.cursor = self.connection.cursor(cursor_factory=DictCursor)
            logging.info("RecommmendationModel initialized successfully")

        except Exception as e:
            logging.error(f"Error initializing RecommendationModel: {e}")
            raise CustomException(e, sys)

    def get_recommendations(self, user_id):
        """Fetch recommendations for a user from database"""
        try:
            logging.info(f"Fetching recommendations for {user_id}")

            self.cursor.execute("""SELECT 
                                ud.username AS recommended_user_username,
                                ud.created_at AS recommended_user_created_at,
                                up_recommended.user_id AS recommended_user_profile_user_id,
                                up_recommended.age AS recommended_user_age,
                                up_recommended.bio AS recommended_user_bio,
                                up_recommended.gender AS recommended_user_gender,
                                up_recommended.interest AS recommended_user_interest,
                                up_recommended.location AS recommended_user_location,
                                up_recommended.occupation AS recommended_user_occupation,
                                up_recommended.prompts AS recommended_user_prompts,
                                up_recommended.profile_photo AS recommended_user_photo,
                                up_recommended.created_at AS recommended_user_created_at,
                                ur.similarity_score
                            FROM 
                                user_recommendations_db ur

                            -- Join for current user's profile
                            JOIN 
                                user_profile up_current ON ur.user_id = up_current.user_id

                            -- Join for recommended user's profile
                            JOIN 
                                user_profile up_recommended ON ur.recommended_user_id = up_recommended.user_id
                                
                            -- Join to get username from user_db
                            JOIN 
                                user_db ud ON up_recommended.user_id = ud.id

                            WHERE 
                                ur.user_id = %s

                            ORDER BY 
                                ur.rank ASC;""", (user_id,))
            logging.info(f"Found recommendations for {user_id}")
            user_data = self.cursor.fetchall()
            if not user_data:
                return {"error": "User not found"}, 404
            
            recommended_users = []
            for row in user_data:
                recommended_users.append(dict(row))
            
            return {"recommended_users": recommended_users}

        except Exception as e:
            logging.error(f"Error in get_recommendations: {str(e)}")
            return {"error": str(e)}, 500

    