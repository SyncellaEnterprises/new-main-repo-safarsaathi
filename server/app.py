import eventlet
eventlet.monkey_patch()
from flask import Flask, jsonify
from config.config import *
import psycopg2
#from supabase import create_client, Client
from flask_jwt_extended import JWTManager
from utils.logger import logging
from utils.exception import CustomException
from flask_socketio import SocketIO 
import eventlet 

#eventlet.monkey_patch()
app = Flask(__name__)
logging.info("Flask app initialized")

app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
jwt = JWTManager(app)

# Initialize SocketIO
#socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet') 
#logging.info("SocketIO initialized") 

# Initialize Supabase client
#supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Connect to PostgreSQL database
try:
    conn = psycopg2.connect(
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host=POSTGRES_HOST,
        port=POSTGRES_PORT
    )
    cursor = conn.cursor()
    logging.info("Connected to PostgreSQL database")
except Exception as e:
    logging.error(f"Database connection failed: {e}")
    raise CustomException(e)

with app.app_context():
    from controllers.user_auth_controller import *
    from controllers.user_onboarding_controller import *
    #from controllers.swipe_controller import *
    from controllers.recommendations_controller import *
    from controllers.districts_get_controller import *
    #from controllers.chat_controller import * 
    

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 
