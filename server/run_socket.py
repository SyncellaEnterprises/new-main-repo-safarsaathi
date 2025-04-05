"""
Run the socket server on port 5001.
This runs only the Socket.IO server for real-time chat.
"""
import os
import sys
from model.socket_chat import app, socketio, initialize_app
from socket_config import SOCKET_PORT

if __name__ == "__main__":
    # Add the server directory to the Python path to enable imports
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    
    # Initialize the Flask app
    initialize_app()
    
    # Run the socket server
    print(f"Starting socket server on port {SOCKET_PORT}...")
    socketio.run(app, host='0.0.0.0', port=SOCKET_PORT) 