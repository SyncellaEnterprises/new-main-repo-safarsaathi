"""
Run the main API server on port 5000.
This runs only the main Flask API without any socket functionality.
"""
import logging
import os
import sys

logging.basicConfig(level=logging.DEBUG)

# Print startup message for clarity
print("-" * 50)
print("Starting main API server on port 5000...")
print("-" * 50)

if __name__ == "__main__":
    # Add the server directory to the Python path to enable imports
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    
    # Import the Flask app
    from app import app
    
    # Run the API server
    print("Starting main API server on port 5000...")
    app.run(host='0.0.0.0', port=5000) 