from config.config import *
from flask import jsonify
from utils.logger import logging
from utils.exception import CustomException
import json
import sys
from psycopg2.extras import DictCursor

class GetUserData:
    def __init__(self, connection):
        try:
            self.connection = connection
            self.cursor = self.connection.cursor(cursor_factory=DictCursor)
            logging.info("GetUserData initialized successfully")
        except Exception as e:
            logging.error(f"Error initializing GetUserData: {str(e)}")
            raise CustomException(e, sys)

    def get_current_user(self, username):
        try:
            logging.info(f"Fetching data for user: {username}")
            
            self.cursor.execute('''
                SELECT 
                    u.id AS user_id,
                    u.username,
                    u.email,
                    p.age,
                    p.bio,
                    p.gender,
                    p.interest,
                    p.location,
                    p.occupation,
                    p.prompts,
                    p.profile_photo,
                    p.created_at
                FROM user_db u
                LEFT JOIN user_profile p ON u.id = p.user_id
                WHERE u.username = %s
            ''', (username,))
            
            user = self.cursor.fetchone()
            
            if not user:
                return {"status": "error", "message": "User not found"}
            
            user_dict = dict(user)
            
            
            # Convert gender enum to string if present
            if user_dict.get('gender'):
                user_dict['gender'] = str(user_dict['gender'])
            
            return {
                "status": "success",
                "user": user_dict  # Changed to single user object since we're getting current user
            }

        except Exception as e:
            logging.error(f"Error in get_current_user: {str(e)}")
            return {"status": "error", "message": f"Failed to retrieve user data: {str(e)}"}
        finally:
            if self.cursor:
                self.cursor.close()

    def __del__(self):
        try:
            if hasattr(self, 'cursor') and self.cursor:
                self.cursor.close()
        except Exception as e:
            logging.error(f"Error closing cursor: {str(e)}")
