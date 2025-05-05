import eventlet
eventlet.monkey_patch()
from flask import Flask, jsonify, request
from config.config import *
from flask_cors import CORS
import psycopg2
from flask_jwt_extended import JWTManager
from utils.logger import logging
from utils.exception import CustomException
from controllers.chat_controller import get_chats, get_chat_messages, get_matches
from controllers.travel_group_controller import (
    create_travel_group, get_user_travel_groups, get_travel_group,
    add_member_to_group, remove_member_from_group, get_group_messages, send_group_message
)


# Initialize Flask app
app = Flask(__name__)
CORS(app)
logging.info("Flask app initialized")

# Add request logging
@app.before_request
def log_request_info():
    logging.info('Headers: %s', request.headers)
    logging.info('Body: %s', request.get_data())

app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
jwt = JWTManager(app)

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
     
        logging.info(f"Database connection established: {conn}")
        return conn, cursor
    except Exception as e:
        logging.error(f"Database connection failed: {e}")
        raise CustomException(e)

# Test database connection
try:
    conn, cursor = get_db_connection()
    cursor.close()
    conn.close()
except Exception as e:
    logging.error(f"Initial database connection test failed: {e}")
    
# Import controllers
with app.app_context():
    from controllers.user_auth_controller import *
    from admin.verifiedUser import *
    from controllers.user_onboarding_controller import *
    from controllers.swipe_controller import *
    from controllers.recommendations_controller import *
    from controllers.districts_get_controller import *
    from database.user_db_get_controller import *   
    from database.recommendations_db_get_controller import * 
    from controllers.onboarding_crud_controller import *
    from database.matches_db_get_controller import *

# Add chat API routes
app.add_url_rule('/api/chats', view_func=get_chats, methods=['GET'])
app.add_url_rule('/api/messages/<chat_id>', view_func=get_chat_messages, methods=['GET'])
app.add_url_rule('/api/matches/me', view_func=get_matches, methods=['GET'])

# Add travel group API routes
app.add_url_rule('/api/groups', view_func=get_user_travel_groups, methods=['GET'])
app.add_url_rule('/api/groups', view_func=create_travel_group, methods=['POST'])
app.add_url_rule('/api/groups/<group_id>', view_func=get_travel_group, methods=['GET'])
app.add_url_rule('/api/groups/<group_id>/members', view_func=add_member_to_group, methods=['POST'])
app.add_url_rule('/api/groups/<group_id>/members/<member_id>', view_func=remove_member_from_group, methods=['DELETE'])
app.add_url_rule('/api/groups/<group_id>/messages', view_func=get_group_messages, methods=['GET'])
app.add_url_rule('/api/groups/<group_id>/messages', view_func=send_group_message, methods=['POST'])

# Define function for socket info using the shared config
def socket_info_handler():
    from socket_config import get_socket_config
    config = get_socket_config()
    logging.info(f"Returning socket config: {config}")
    return jsonify(config)

# Register the route for socket info
app.add_url_rule('/api/socket/info', 'socket_info_endpoint', socket_info_handler, methods=['GET'])


if __name__ == '__main__':
    logging.info("Starting Flask server...")
    app.run(host='0.0.0.0', port=5000, debug=True)