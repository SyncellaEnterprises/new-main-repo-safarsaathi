from config.config import POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT
import psycopg2
from psycopg2.extras import DictCursor
from utils.logger import logging
from utils.exception import CustomException
import sys
from flask_jwt_extended import get_jwt_identity
import json


class UserOnboardingmodel:
    def __init__(self):
        try:
            self.connection = psycopg2.connect(
                host=POSTGRES_HOST,
                database=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                port=POSTGRES_PORT
            )
            self.cursor = self.connection.cursor(cursor_factory=DictCursor)
        except Exception as e:
            logging.info(f"Error while connecting to PostgreSQL database: {e}")
            raise CustomException(e, sys)
    
    def get_user_id(self):
        try:
            logging.info("Getting user id")
            current_user = get_jwt_identity()
            self.cursor.execute('SELECT id FROM user_db WHERE username = %s', (current_user,))
            user = self.cursor.fetchone()
            if not user:
                return None
            return user['id']
        except Exception as e:
            logging.error(f"Error in get_user_id: {e}")
            raise CustomException(e,sys)

    def add_age(self, age):
        try:
            logging.info("adding age")
            user_id = self.get_user_id()
            if not user_id:
                return {"status": "error", "message": "User not found"}
        except Exception as e:
            logging.error(f"Error in update_age: {e}")
            raise CustomException(e,sys)
        
        try:
            logging.info("adding age to user_profile")
            self.cursor.execute('''
                INSERT INTO user_profile (user_id, age) 
                VALUES (%s, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET age = EXCLUDED.age
            ''', (user_id, age))
            self.connection.commit()
            logging.info("Age updated successfully")
            return {"status": "success"}
        except Exception as e:
            logging.error(f"Error in update_age: {e}")
            raise CustomException(e,sys)

    def add_gender(self, gender):
        try:
            logging.info("adding gender")
            user_id = self.get_user_id()
            if not user_id:
                return {"status": "error", "message": "User not found"}
        except Exception as e:
            logging.error(f"Error in update_gender: {e}")
            raise CustomException(e,sys)

        try:
            logging.info("adding gender to user_profile")
            self.cursor.execute('''
                INSERT INTO user_profile (user_id, gender) 
                VALUES (%s, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET gender = EXCLUDED.gender
            ''', (user_id, gender))
            self.connection.commit()
            logging.info("Gender updated successfully")
            return {"status": "success"}
        except Exception as e:
            logging.error(f"Error in update_gender: {e}")
            raise CustomException(e,sys)

    def add_location(self, location):
        try:
            logging.info("adding location")
            user_id = self.get_user_id()
            if not user_id:
                return {"status": "error", "message": "User not found"}
        except Exception as e:
            logging.error(f"Error in update_location: {e}")
            raise CustomException(e,sys)
        
        try:
            logging.info("adding location to user_profile")
            self.cursor.execute('''
                INSERT INTO user_profile (user_id, location) 
                VALUES (%s, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET location = EXCLUDED.location
            ''', (user_id, location))
            self.connection.commit()
            logging.info("Location updated successfully")
            return {"status": "success"}
        except Exception as e:
            logging.error(f"Error in update_location: {e}")
            raise CustomException(e,sys)

    def add_occupation(self, occupation):
        try:
            logging.info("adding occupation")
            user_id = self.get_user_id()
            if not user_id:
                return {"status": "error", "message": "User not found"}
        except Exception as e:
            logging.error(f"Error in update_occupation: {e}")
            raise CustomException(e,sys)
        
        try:
            logging.info("adding occupation to user_profile")
            self.cursor.execute('''
                INSERT INTO user_profile (user_id, occupation) 
                VALUES (%s, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET occupation = EXCLUDED.occupation
            ''', (user_id, occupation))
            self.connection.commit()
            logging.info("Occupation updated successfully")
            return {"status": "success"}
        except Exception as e:
            logging.error(f"Error in update_occupation: {e}")
            raise CustomException(e,sys)

    def add_interests(self, interests):
        try:
            logging.info("adding interests")
            user_id = self.get_user_id()
            if not user_id:
                return {"status": "error", "message": "User not found"}
        except Exception as e:
            logging.error(f"Error in update_interests: {e}")
            raise CustomException(e,sys)
        
        try:
            logging.info("adding interests to user_profile")
            self.cursor.execute('''
                INSERT INTO user_profile (user_id, interest) 
                VALUES (%s, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET interest = EXCLUDED.interest
            ''', (user_id, interests))
            self.connection.commit()
            logging.info("Interests updated successfully")
            return {"status": "success"}
        except Exception as e:
            logging.error(f"Error in update_interests: {e}")
            raise CustomException(e,sys)


    def add_bio(self, bio):
        try:
            logging.info("adding bio")
            user_id = self.get_user_id()
            if not user_id:
                return {"status": "error", "message": "User not found"}
        except Exception as e:
            logging.error(f"Error in update_bio: {e}")
            raise CustomException(e,sys)
        
        try:
            logging.info("adding bio to user_profile")
            self.cursor.execute('''
                INSERT INTO user_profile (user_id, bio) 
                VALUES (%s, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET bio = EXCLUDED.bio
            ''', (user_id, bio))
            self.connection.commit()
            return {"status": "success"}
        except Exception as e:
            logging.error(f"Error in update_bio: {e}")
            raise CustomException(e,sys)

    def add_prompt(self, prompts):
        try:
            logging.info("Adding prompts")
            user_id = self.get_user_id()  # Fetch the logged-in user's ID
            if not user_id:
                return {"status": "error", "message": "User not found"}
        except Exception as e:
            logging.error(f"Error in add_prompt: {e}")
            raise CustomException(e, sys)

        try:
            logging.info("Adding prompts to user_profile")
            prompts_json = json.dumps({"prompts": prompts})  # Convert to JSON format

            self.cursor.execute('''
                INSERT INTO user_profile (user_id, prompts) 
                VALUES (%s, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET prompts = EXCLUDED.prompts
            ''', (user_id, prompts_json))

            self.connection.commit()
            logging.info("Prompts updated successfully")
            return {"status": "success"}
        except Exception as e:
            logging.error(f"Error in add_prompt: {e}")
            raise CustomException(e, sys)
    
    def add_videos(self, filename):
        try:
            user_id = self.get_user_id()
            if not user_id:
                return {"status": "error", "message": "User not found"}
        except Exception as e:
            logging.error(f"Error in update_videos: {e}")
            raise CustomException(e,sys)
        
        try:
            # Save the video filename to the database
            self.cursor.execute('''
                INSERT INTO user_profile (user_id, videos) 
                VALUES (%s, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET videos = EXCLUDED.videos
            ''', (user_id, json.dumps([filename])))
            self.connection.commit()
            logging.info("Videos updated successfully")
            return {"status": "success"}
        except Exception as e:
            logging.error(f"Error in update_videos: {e}")
            raise CustomException(e,sys)
        
    def add_images(self, image_urls):
        """
        Add multiple image URLs to the user's profile
        Args:
            image_urls (list): List of image URLs to be saved
        Returns:
            dict: Status of the operation
        """
        try:
            # Get user_id from username
            user_id = self.get_user_id()
            if not user_id:
                return {"status": "error", "message": "User not found"}
            
            # Convert list of URLs to JSON string
            image_urls_json = json.dumps(image_urls)
            
            # Update user's images in database
            self.cursor.execute(
                '''INSERT INTO user_profile (user_id, images) 
                VALUES (%s, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET images = EXCLUDED.images''',
                (user_id, image_urls_json)
            )
            self.connection.commit()
            
            return {
                "status": "success",
                "message": "Images saved successfully"
            }
        except Exception as e:
            if self.connection:
                self.connection.rollback()
            logging.error(f"Error in add_images: {e}")
            raise CustomException(e, sys)
        

    