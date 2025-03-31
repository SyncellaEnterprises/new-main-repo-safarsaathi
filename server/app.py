import eventlet
eventlet.monkey_patch()
from flask import Flask, jsonify
from config.config import *
import psycopg2
from flask_jwt_extended import JWTManager
from utils.logger import logging
from utils.exception import CustomException
from flask_socketio import SocketIO 
import eventlet 
from model.socket_chat import ChatHandler, get_db_connection
from database.chat_db import ChatDB
from controllers.chat_controller import get_chats, get_chat_messages, get_matches

#eventlet.monkey_patch()
app = Flask(__name__)
logging.info("Flask app initialized")

app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
jwt = JWTManager(app)

# Initialize SocketIO
# socketio = SocketIO(
#     app,
#     cors_allowed_origins="*",
#     async_mode='eventlet',
#     logger=True,
#     engineio_logger=True,
#     ping_timeout=60,
#     ping_interval=25,
#     http_compression=True
# )
# ChatDB.initialize()
# chat_handler = ChatHandler(socketio)
# logging.info("SocketIO initialized") 

# Connect to PostgreSQL database
def get_db_connection():
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
get_db_connection()
    
with app.app_context():
    from controllers.user_auth_controller import *
    from controllers.user_onboarding_controller import *
    from controllers.swipe_controller import *
    from controllers.recommendations_controller import *
    from controllers.districts_get_controller import *
    from database.user_db_get_controller import *   
    from database.recommendations_db_get_controller import * 
    from controllers.onboarding_crud_controller import *
    from database.matches_db_get_controller import *
    #from controllers.chat_controller import * 
    

# @app.teardown_appcontext
# def close_db_connections(exception=None):
#     if ChatDB._connection_pool:
#         ChatDB._connection_pool.closeall()

# # Add these routes
# app.add_url_rule('/api/chats', view_func=get_chats, methods=['GET'])
# app.add_url_rule('/api/messages/<chat_id>', view_func=get_chat_messages, methods=['GET'])
# app.add_url_rule('/api/matches', view_func=get_matches, methods=['GET'])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)