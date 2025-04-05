from config.config import *
from utils.exception import CustomException
from utils.logger import logging
from psycopg2.extras import DictCursor
import sys


class MatchesGetModel:
    def __init__(self, connection):
        try:
            # Connect to PostgreSQL
            self.connection = connection
            self.cursor = self.connection.cursor(cursor_factory=DictCursor)
            logging.info("MatchesGetModel initialized successfully")

        except Exception as e:
            logging.error(f"Error initializing MatchesGetModel: {e}")
            raise CustomException(e, sys)

    def get_my_matches(self, user_id):
        """Fetch matches for a user from database"""
        try:
            logging.info(f"Fetching matches for {user_id}")

            self.cursor.execute("""
                SELECT 
                    ud.username,
                    ud.id as userId,
                    ud.email,
                    up.interest as interests,
                    up.location as location,
                    m.matched_at as matchDate,
                    up.bio
                FROM matches m
                JOIN user_db ud ON (
                    CASE 
                        WHEN m.user1_id = %s THEN ud.id = m.user2_id
                        WHEN m.user2_id = %s THEN ud.id = m.user1_id
                    END
                )
                JOIN user_profile up ON up.user_id = ud.id
                WHERE (m.user1_id = %s OR m.user2_id = %s)
                    AND m.is_active = TRUE
                ORDER BY m.matched_at DESC
            """, (user_id, user_id, user_id, user_id))

            logging.info(f"Found matches for user {user_id}")
            matches_data = self.cursor.fetchall()
            
            if not matches_data:
                return {"matches": []}, 200  # Return empty array instead of 404
            
            matches = []
            for row in matches_data:
                match_info = {
                    "username": row["username"],
                    "userId": row["userid"],  # PostgreSQL converts to lowercase
                    "email": row["email"],
                    "interests": row["interests"],
                    "matchDate": row["matchdate"].isoformat() if row["matchdate"] else None,  # Convert timestamp to ISO format
                    "bio": row["bio"]
                }
                matches.append(match_info)
            
            return {"matches": matches}

        except Exception as e:
            logging.error(f"Error in get_my_matches: {str(e)}")
            return {"error": str(e)}, 500

    