from app import app
from flask import jsonify, request
from model.recommendation_model import RecommendationModel
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.logger import logging
from utils.get_user_id import get_user_id_from_username
import time
import threading

# Global variables for tracking model loading status
model_loading_lock = threading.Lock()
model_loading_in_progress = False
recommendation_model_instance = None

def get_or_create_recommendation_model():
    """Get an existing model instance or create a new one with proper locking"""
    global model_loading_in_progress, recommendation_model_instance

    # Quick check without lock
    if recommendation_model_instance is not None:
        return recommendation_model_instance

    with model_loading_lock:
        # Check again with lock
        if recommendation_model_instance is not None:
            return recommendation_model_instance

        # Mark loading as in progress
        model_loading_in_progress = True
        
        try:
            # Create new model instance
            logging.info("Creating new RecommendationModel instance...")
            start_time = time.time()
            model = RecommendationModel()
            elapsed_time = time.time() - start_time
            logging.info(f"RecommendationModel instance created in {elapsed_time:.2f} seconds")
            
            # Store in global
            recommendation_model_instance = model
            return model
        except Exception as e:
            logging.error(f"Error creating RecommendationModel: {str(e)}")
            # Reset flag to allow future attempts
            model_loading_in_progress = False
            raise e

@app.route('/user/recommendation', methods=['POST'])
@jwt_required()
def get_user_recommendations():
    start_time = time.time()
    try:
        # Get current user's username from JWT token
        current_user = get_jwt_identity()
        current_user_id = get_user_id_from_username(current_user)
        logging.info(f"Getting recommendations for current user: {current_user}")
        
        if not current_user_id:
            logging.error(f"Could not find user ID for username: {current_user}")
            return jsonify({
                "status": "error",
                "message": "User not found in database"
            }), 404
            
        # Initialize recommendation model with improved error handling
        try:
            recommendation_model = get_or_create_recommendation_model()
            logging.info(f"Recommendation model initialized in {time.time() - start_time:.2f} seconds")
        except Exception as e:
            logging.error(f"Failed to initialize recommendation model: {str(e)}")
            return jsonify({
                "status": "error",
                "message": "Unable to load recommendation system. Please try again later.",
                "details": str(e)
            }), 503  # Service Unavailable
        
        # Get recommendations (model returns a tuple with (jsonify_response, status_code))
        recommendations, status_code = recommendation_model.user_recommendation_model(current_user_id)
        logging.info(f"Recommendations generated in {time.time() - start_time:.2f} seconds")

        return recommendations, status_code
        
    except Exception as e:
        elapsed_time = time.time() - start_time
        logging.error(f"Error in get_user_recommendations after {elapsed_time:.2f} seconds: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while generating recommendations",
            "details": str(e)
        }), 500