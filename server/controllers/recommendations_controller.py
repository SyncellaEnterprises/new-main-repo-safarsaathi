from app import app
from flask import jsonify, request
from model.recommendation_model import RecommendationModel
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.logger import logging

@app.route('/user/recommendation', methods=['POST'])
def get_user_recommendations():
    try:
        # Get current user's username from JWT token
        current_user = 'shrey2'
        logging.info(f"get user reccommendations of current user: {current_user}")
        
        # Initialize recommendation model
        recommendation_model = RecommendationModel()
        
        # Create vector DB and get documents
        vector_store = recommendation_model.create_vector_db()

        return "vector db is created successfully"        
    
        
    except Exception as e:
        logging.error(f"Error in get_user_recommendations: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "details": "Failed to give recommendations"
        }), 500