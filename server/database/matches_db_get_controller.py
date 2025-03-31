from flask import jsonify
from app import app
import psycopg2
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.logger import logging
from utils.get_user_id import get_user_id_from_username
from database.matches_db_get_model import MatchesGetModel
from config.config import POSTGRES_DB, POSTGRES_HOST,POSTGRES_PASSWORD,POSTGRES_PORT,POSTGRES_USER

@app.route('/api/swipe/me', methods=['GET'])
@jwt_required()
def get_current_user_matches_data():
    try:
        logging.info("Fetching matches for current user")
        current_user = get_jwt_identity()
        current_user_id = get_user_id_from_username(current_user)

        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            database=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            port=POSTGRES_PORT
        )

        # Connect to database
        
        model = MatchesGetModel(conn)
        response = model.get_my_matches(current_user_id)
        
        conn.close()
        
        # Check if response is an error tuple
        if isinstance(response, tuple):
            return jsonify(response[0]), response[1]
            
        return jsonify(response)

    except Exception as e:
        logging.error(f"Error in get_current_user: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred"}), 500
