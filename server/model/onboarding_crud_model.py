from config.config import POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT
import psycopg2
from psycopg2.extras import DictCursor
from utils.logger import logging
from utils.exception import CustomException
import sys
from flask_jwt_extended import get_jwt_identity
import json


class UserUpdateDetailmodel:
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
            logging.error(f"Error while connecting to PostgreSQL database: {e}")
            raise CustomException(e, sys)

    def __del__(self):
        if hasattr(self, 'connection'):
            self.connection.close()

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

    def _update_field(self, field_name, value):
        try:
            user_id = self.get_user_id()
            if not user_id:
                return {"status": "error", "message": "User not found"}

            # Handle JSON fields
            if field_name in ['interests', 'prompts']:
                value = json.dumps(value)

            query = f'''
                INSERT INTO user_profile (user_id, {field_name}) 
                VALUES (%s, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET {field_name} = EXCLUDED.{field_name}
            '''
            self.cursor.execute(query, (user_id, value))
            self.connection.commit()
            return {"status": "success"}
            
        except Exception as e:
            logging.error(f"Error in update_{field_name}: {e}")
            self.connection.rollback()
            raise CustomException(e, sys)

    # Field-specific update methods
    def update_age(self, age):
        return self._update_field('age', age)

    def update_gender(self, gender):
        return self._update_field('gender', gender)

    def update_location(self, location):
        return self._update_field('location', location)

    def update_occupation(self, occupation):
        return self._update_field('occupation', occupation)

    def update_interests(self, interests):
        return self._update_field('interests', interests)

    def update_bio(self, bio):
        return self._update_field('bio', bio)

    def update_prompts(self, prompts):
        return self._update_field('prompts', prompts)

