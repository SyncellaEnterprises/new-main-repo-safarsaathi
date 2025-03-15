from flask import jsonify
from app import app
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.logger import logging
from utils.get_user_id import get_user_id_from_username
from database.recommendations_db_get_model import RecommendationModel
import psycopg2
from config.config import POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT

@app.route('/api/recommended_users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        logging.info("Fetching recommendations for current user")
        current_user = get_jwt_identity()
        current_user_id = get_user_id_from_username(current_user["username"])

        # Connect to database
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            database=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            port=POSTGRES_PORT
        )
        
        model = RecommendationModel()
        result, status_code = model.get_recommendations(current_user_id)

        conn.close()
        return jsonify(result), status_code

    except Exception as e:
        logging.error(f"Error in get_current_user: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred"}), 500
