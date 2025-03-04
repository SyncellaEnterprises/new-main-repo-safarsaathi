from app import app
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.logger import logging
from database.user_db_get_model import GetUserData
import psycopg2
from config.config import POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT

@app.route('/api/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        logging.info("Starting get_current_user request")
        current_user = get_jwt_identity()
        
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            database=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            port=POSTGRES_PORT
        )
        
        logging.info("Database connection successful")
        
        user_onboarding_model = GetUserData(conn)
        result = user_onboarding_model.get_current_user(current_user)
        
        conn.close()
        
        if result["status"] == "success":
            return jsonify(result), 200
        return jsonify(result), 404 if result["message"] == "User not found" else 400

    except Exception as e:
        logging.error(f"Error in get_current_user: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": "An error occurred"
        }), 500
