# from app import app
# from flask import jsonify, request
# from model.recommendation_model import RecommendationModel
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from utils.logger import logging

# @app.route('/user/recommendation', methods=['POST'])
# @jwt_required()
# def get_user_recommendations():
#     try:
#         # Get current user's username from JWT token
#         current_user = get_jwt_identity()
#         logging.info(f"Generating recommendations for user: {current_user}")
        
#         # Initialize recommendation model
#         recommendation_model = RecommendationModel()
        
#         # Get recommendations
#         recommendations, status_code = recommendation_model.get_recommendations(current_user)
        
#         return jsonify(recommendations), status_code
        
#     except Exception as e:
#         logging.error(f"Error in get_user_recommendations: {str(e)}")
#         return jsonify({"error": "Failed to get recommendations"}), 500