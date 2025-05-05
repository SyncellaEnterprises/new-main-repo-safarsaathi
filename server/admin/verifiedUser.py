from app import app
from flask import request, jsonify
from utils.logger import logging
import sys
from utils.exception import CustomException
from config.config import POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT
import psycopg2
from psycopg2.extras import DictCursor




@app.route('/api/admin/isVerified', methods=['POST'])
def isVerified():
    try:
        data = request.get_json()
        
        is_verified = data.get('is_verified')
        user_id = data.get('user_id')

        logging.info(f"User ID: {user_id}, Is Verified: {is_verified}")
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "user_id is required"
            }), 400
        
        if is_verified is None:
            return jsonify({
                "status": "error",
                "message": "is_verified is required"
            }), 400
            
        # Create an instance of UserVerifiedModel
        user_verified_model = UserVerifiedModel()
        result = user_verified_model.add_is_verified(user_id, is_verified)
        
        if result["status"] == "success":
            return jsonify({
                "status": "success",
                "message": "Verification status updated successfully"
            }), 200
        return jsonify({
            "status": "error",
            "message": result["message"]
        }), 400
    except Exception as e:
        logging.error(f"Error in onboarding_isVerified: {e}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while updating verification status"
        }), 500


class UserVerifiedModel:
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

    def add_is_verified(self, user_id,is_verified):
        try:
            if not user_id:
                return {"status": "error", "message": "User not found"}
        except Exception as e:
            logging.error(f"Error in update_is_verified: {e}")
            raise CustomException(e,sys)
        try:
            logging.info("adding is_verified to user_profile")
            self.cursor.execute('''
                INSERT INTO user_profile (user_id, isVerified) 
                VALUES (%s, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET isVerified = EXCLUDED.isVerified
            ''', (user_id, is_verified))
            self.connection.commit()
            logging.info("is_verified updated successfully")
            return {"status": "success"}
        except Exception as e:
            logging.error(f"Error in update_is_verified: {e}")
            raise CustomException(e,sys)