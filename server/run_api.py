"""
Run the API server on port 5000.
This runs the main Flask app with the API.
"""
import os
import sys
from app import app
from utils.logger import logging
import time

if __name__ == "__main__":
    # Add the server directory to the Python path to enable imports
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    
    # Log the server startup
    logging.info("=== API Server Starting ===")
    
    # Pre-warm the recommendation model by importing and creating an instance
    try:
        logging.info("Pre-warming recommendation model...")
        start_time = time.time()
        from model.recommendation_model import RecommendationModel
        model = RecommendationModel()
        elapsed_time = time.time() - start_time
        logging.info(f"Recommendation model pre-warmed in {elapsed_time:.2f} seconds")
    except Exception as e:
        logging.error(f"Failed to pre-warm recommendation model: {str(e)}")
        logging.info("API will continue to run, but first recommendation request may be slow")
    
    # Run the Flask app
    print("Starting API server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True) 