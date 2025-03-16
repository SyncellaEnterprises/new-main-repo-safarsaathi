from app import app
from flask import jsonify, request
from model.recommendation_model import RecommendationModel
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.logger import logging
from utils.get_user_id import get_user_id_from_username

@app.route('/user/recommendation', methods=['POST'])
@jwt_required()
def get_user_recommendations():
    try:
        # Get current user's username from JWT token
        current_user = get_jwt_identity()
        current_user_id = get_user_id_from_username(current_user)
        logging.info(f"get user reccommendations of current user: {current_user}")
        
        # Initialize recommendation model
        recommendation_model = RecommendationModel()
        recommendations, status_code = recommendation_model.user_recommendation_model(current_user_id)

        return recommendations, status_code     
    
        
    except Exception as e:
        logging.error(f"Error in get_user_recommendations: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "details": "Failed to give recommendations"
        }), 500