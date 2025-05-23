"""
Unified server runner that starts both the API server (port 5000) and the Socket server (port 5002).
Run this file to start both servers in a single process.
"""
import os
import sys
import threading
import time
from socket_config import SOCKET_PORT

# Add the server directory to the Python path to enable imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import the Flask app at the module level for Gunicorn
from app import app

def run_api_server():
    """Run the API server on port 5000"""
    from utils.logger import logging

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
    print(f"API server running on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)

def run_socket_server():
    """Run the Socket.IO server on port 5002"""
    from model.socket_chat import app as socket_app, socketio, initialize_app
    
    # Initialize the Flask app
    initialize_app()
    
    # Run the socket server
    print(f"Socket server running on port {SOCKET_PORT}...")
    socketio.run(socket_app, host='0.0.0.0', port=SOCKET_PORT, debug=False, use_reloader=False)

if __name__ == "__main__":
    print("Starting unified server...")
    
    # Create threads for each server
    api_thread = threading.Thread(target=run_api_server, daemon=True)
    socket_thread = threading.Thread(target=run_socket_server, daemon=True)
    
    # Start both servers
    api_thread.start()
    print(f"API server thread started")
    
    socket_thread.start()
    print(f"Socket server thread started")
    
    try:
        # Keep the main thread alive to prevent the daemon threads from exiting
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        # The threads will terminate when the main thread exits
        # since they are daemon threads
        print("Server shutdown complete") 