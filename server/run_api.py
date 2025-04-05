"""
Run the main API server on port 5000.
This runs only the main Flask API without any socket functionality.
"""
import logging
logging.basicConfig(level=logging.DEBUG)

# Print startup message for clarity
print("-" * 50)
print("Starting main API server on port 5000...")
print("-" * 50)

# Direct import of the Flask app
import app

if __name__ == "__main__":
    print("Running main API server on port 5000...")
    app.app.run(host='0.0.0.0', port=5000, debug=True) 