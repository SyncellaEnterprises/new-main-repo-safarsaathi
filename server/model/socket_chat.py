from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_jwt_extended.utils import decode_token
from config.config import *
from utils.logger import logging
import psycopg2
from datetime import datetime
from socket_config import SOCKET_PORT, SOCKET_HOST
import sys
import os

# Add the server directory to the Python path to enable imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.travel_group_db import TravelGroupDB

# Create a separate Flask app for the socket server
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'query_string']
jwt = JWTManager(app)
CORS(app)  # Allow CORS for all origins

# Initialize TravelGroupDB
travel_group_db = TravelGroupDB()

# API route to provide socket server information
@app.route('/api/socket_server/info', methods=['GET'])
def get_socket_info():
    """API endpoint to provide socket server information"""
    return jsonify({
        'socket_host': SOCKET_HOST,
        'socket_port': SOCKET_PORT,
        'status': 'running'
    })

# Initialize SocketIO with this app
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    http_compression=True
)

# Use socket port from config
online_users = {}  # {user_id: socket_id}

def get_db_connection():
    """Create a new database connection"""
    try:
        conn = psycopg2.connect(
        host=POSTGRES_HOST,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        port=POSTGRES_PORT
    )
        return conn
    except Exception as e:
        logging.error(f"Database connection error: {str(e)}")
        raise

def get_user_id_from_token(token):
    """Helper function to extract user ID from a token with different formats"""
    decoded_token = decode_token(token)
    
    # Log token structure for debugging
    logging.debug(f"Token payload: {decoded_token}")
    
    # Handle different token structures
    if isinstance(decoded_token['sub'], dict) and 'id' in decoded_token['sub']:
        # Original expected format: {'sub': {'id': 123, ...}}
        return decoded_token['sub']['id']
    elif isinstance(decoded_token['sub'], str):
        # New format: {'sub': 'username', ...}
        username = decoded_token['sub']
        logging.info(f"Resolving user ID for username: {username}")
        
        # Connect to database to get user ID from username
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM user_db WHERE username = %s", (username,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result:
            user_id = result[0]
            logging.info(f"Resolved user ID {user_id} for username {username}")
            return user_id
        else:
            logging.error(f"User not found for username: {username}")
            raise ValueError(f"User not found for username: {username}")
    else:
        logging.error(f"Unexpected token format: {decoded_token}")
        raise ValueError("Invalid token format")

def get_user_info(user_id):
    """Get user information from database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.username, up.profile_photo
            FROM user_db u
            LEFT JOIN user_profile up ON u.id = up.user_id
            WHERE u.id = %s
        """, (user_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result:
            profile_photo = result[2][0] if result[2] and isinstance(result[2], list) else None
            return {
                'id': result[0],
                'username': result[1],
                'profile_photo': profile_photo
            }
        return None
    except Exception as e:
        logging.error(f"Error getting user info: {str(e)}")
        return None

def verify_match(user1_id, user2_id):
    """Verify that two users have a mutual match"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT match_id FROM matches 
            WHERE ((user1_id = %s AND user2_id = %s)
                OR (user1_id = %s AND user2_id = %s))
                AND is_active = TRUE
        """, (user1_id, user2_id, user2_id, user1_id))
        match = cursor.fetchone()
        cursor.close()
        conn.close()
        return match is not None
    except Exception as e:
        logging.error(f"Error verifying match: {str(e)}")
        return False

def get_message_history(user_id, other_user_id=None, limit=50):
    """Get message history between two users"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if other_user_id:
            cursor.execute("""
                SELECT m.message_id, m.sender_id, m.receiver_id, m.content,
                       m.sent_at, m.message_type, m.status, u.username as sender_name
                FROM messages m
                JOIN user_db u ON m.sender_id = u.id
                WHERE ((m.sender_id = %s AND m.receiver_id = %s)
                    OR (m.sender_id = %s AND m.receiver_id = %s))
                ORDER BY m.sent_at DESC
                LIMIT %s
            """, (user_id, other_user_id, other_user_id, user_id, limit))
        else:
            cursor.execute("""
                SELECT m.message_id, m.sender_id, m.receiver_id, m.content,
                       m.sent_at, m.message_type, m.status, u.username as sender_name
                FROM messages m
                JOIN user_db u ON m.sender_id = u.id
                WHERE (m.sender_id = %s OR m.receiver_id = %s)
                ORDER BY m.sent_at DESC
                LIMIT %s
            """, (user_id, user_id, limit))
        
        messages = []
        for row in cursor.fetchall():
            messages.append({
                'message_id': row[0],
                'sender_id': row[1],
                'receiver_id': row[2],
                'content': row[3],
                'sent_at': row[4].isoformat(),
                'type': row[5],
                'status': row[6],
                'sender_name': row[7]
            })
        
        cursor.close()
        conn.close()
        return messages[::-1]  # Reverse to get oldest messages first
    except Exception as e:
        logging.error(f"Error getting message history: {str(e)}")
        return []

def mark_messages_as_read(user_id, other_user_id):
    """Mark all messages from other_user as read"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE messages
            SET status = 'read'
            WHERE sender_id = %s AND receiver_id = %s AND status != 'read'
            RETURNING message_id
        """, (other_user_id, user_id))
        
        read_message_ids = [row[0] for row in cursor.fetchall()]
        conn.commit()
        cursor.close()
        conn.close()
        return read_message_ids
    except Exception as e:
        logging.error(f"Error marking messages as read: {str(e)}")
        return []

# Socket.IO Event Handlers
@socketio.on('connect')
def handle_connect(auth=None):
    token = request.args.get('token')
    if not token:
        logging.warning("Connection attempt without token - allowing anonymous connection")
        emit('connection_status', {'status': 'connected', 'message': 'Connected anonymously'})
        return
    
    try:
        decoded_token = decode_token(token)
        
        # Check token structure
        logging.info(f"Decoded token: {decoded_token}")
        
        # Extract user info based on token structure
        if isinstance(decoded_token['sub'], dict) and 'id' in decoded_token['sub']:
            user_id = decoded_token['sub']['id'] 
        else:
            # The token has 'sub' as username instead of a dict with id
            username = decoded_token['sub']
            logging.info(f"Looking up user ID for username: {username}")
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM user_db WHERE username = %s", (username,))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not result:
                logging.error(f"User not found: {username}")
                emit('connection_status', {'status': 'anonymous', 'message': 'User not found but connected anonymously'})
                return
                
            user_id = result[0]
            logging.info(f"Found user ID: {user_id} for username: {username}")
        
        # Store user's socket ID
        online_users[user_id] = request.sid
        
        # Join user's personal room
        join_room(f"user_{user_id}")
        
        # Let everyone know user is online
        emit('user_status', {'user_id': user_id, 'status': 'online'}, broadcast=True)
        
        logging.info(f"User {user_id} connected with socket ID {request.sid}")
        emit('connection_status', {'status': 'connected', 'message': 'Successfully connected'})
    except Exception as e:
        logging.error(f"Authentication error: {str(e)}")
        emit('connection_status', {'status': 'error', 'message': f'Authentication error: {str(e)}'})
        # Allow connection but mark it as unauthenticated
        return

@socketio.on('disconnect')
def handle_disconnect():
    for user_id, sid in list(online_users.items()):
        if sid == request.sid:
            del online_users[user_id]
            emit('user_status', {'user_id': user_id, 'status': 'offline'}, broadcast=True)
            logging.info(f"User {user_id} disconnected")
            break

@socketio.on('join_chat')
def handle_join_chat(data):
    try:
        token = request.args.get('token')
        decoded_token = decode_token(token)
        
        # Extract user info based on token structure
        if isinstance(decoded_token['sub'], dict) and 'id' in decoded_token['sub']:
            user_id = decoded_token['sub']['id'] 
        else:
            # The token has 'sub' as username instead of a dict with id
            username = decoded_token['sub']
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM user_db WHERE username = %s", (username,))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not result:
                logging.error(f"User not found: {username}")
                raise ValueError('User not found')
                
            user_id = result[0]
        
        other_user_id = data.get('other_user_id')
        
        # Verify users have a match
        if other_user_id and not verify_match(user_id, int(other_user_id)):
            emit('error', {'message': 'No match exists between these users'})
            return
        
        # Create a unique chat room ID (smaller ID first to make it consistent)
        if other_user_id:
            user_ids = sorted([int(user_id), int(other_user_id)])
            room_id = f"chat_{user_ids[0]}_{user_ids[1]}"
            join_room(room_id)
            logging.info(f"User {user_id} joined chat room {room_id}")
            
            # Mark messages as read
            read_message_ids = mark_messages_as_read(user_id, other_user_id)
            
            # Notify about read messages
            if read_message_ids and int(other_user_id) in online_users:
                for msg_id in read_message_ids:
                    emit('message_status', {
                        'message_id': msg_id,
                        'status': 'read'
                    }, room=online_users[int(other_user_id)])
            
            # Get and send message history
            messages = get_message_history(user_id, other_user_id)
            recipient_info = get_user_info(other_user_id)
            
            emit('chat_joined', {
                'room_id': room_id,
                'recipient': recipient_info,
                'is_online': int(other_user_id) in online_users,
                'messages': messages
            })
    except Exception as e:
        logging.error(f"Error joining chat: {str(e)}")
        emit('error', {'message': 'Failed to join chat'})

@socketio.on('send_message')
def handle_send_message(data):
    try:
        token = request.args.get('token')
        decoded_token = decode_token(token)
        
        # Extract user info based on token structure
        if isinstance(decoded_token['sub'], dict) and 'id' in decoded_token['sub']:
            sender_id = decoded_token['sub']['id'] 
        else:
            # The token has 'sub' as username instead of a dict with id
            username = decoded_token['sub']
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM user_db WHERE username = %s", (username,))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not result:
                logging.error(f"User not found: {username}")
                raise ValueError('User not found')
                
            sender_id = result[0]
        
        content = data.get('content')
        receiver_id = data.get('receiver_id')
        message_type = data.get('type', 'text')
        
        if not content or not receiver_id:
            emit('error', {'message': 'Missing message content or receiver'})
            return
        
        # Verify match between users
        if not verify_match(sender_id, int(receiver_id)):
            emit('error', {'message': 'No match exists between these users'})
            return
        
        # Save message to database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO messages 
            (sender_id, receiver_id, content, message_type, status)
            VALUES (%s, %s, %s, %s, 'sent')
            RETURNING message_id, sent_at
        """, (sender_id, receiver_id, content, message_type))
        
        message_id, sent_at = cursor.fetchone()
        
        # Get sender username
        cursor.execute("SELECT username FROM user_db WHERE id = %s", (sender_id,))
        sender_name = cursor.fetchone()[0]
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # Prepare message data
        message_data = {
            'message_id': message_id,
            'sender_id': sender_id,
            'sender_name': sender_name,
            'receiver_id': receiver_id,
            'content': content,
            'sent_at': sent_at.isoformat(),
            'type': message_type,
            'status': 'sent'
        }
        
        # Create room ID (consistent for both users)
        user_ids = sorted([int(sender_id), int(receiver_id)])
        room_id = f"chat_{user_ids[0]}_{user_ids[1]}"
        
        # Send to the room (both users if both are in the room)
        emit('new_message', message_data, room=room_id)
        
        # If receiver is not in the room but online, send to their personal room
        if int(receiver_id) in online_users:
            emit('new_message', message_data, room=f"user_{receiver_id}")
            
            # Update message status to delivered
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE messages SET status = 'delivered'
                WHERE message_id = %s
                RETURNING message_id
            """, (message_id,))
            conn.commit()
            cursor.close()
            conn.close()
            
            # Notify about delivery
            emit('message_status', {
                'message_id': message_id,
                'status': 'delivered'
            }, room=room_id)
        
    except Exception as e:
        logging.error(f"Error sending message: {str(e)}")
        emit('error', {'message': 'Failed to send message'})

@socketio.on('message_read')
def handle_message_read(data):
    try:
        token = request.args.get('token')
        decoded_token = decode_token(token)
        
        # Extract user info based on token structure
        if isinstance(decoded_token['sub'], dict) and 'id' in decoded_token['sub']:
            user_id = decoded_token['sub']['id'] 
        else:
            # The token has 'sub' as username instead of a dict with id
            username = decoded_token['sub']
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM user_db WHERE username = %s", (username,))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not result:
                logging.error(f"User not found: {username}")
                raise ValueError('User not found')
                
            user_id = result[0]
        
        message_id = data.get('message_id')
        
        if not message_id:
            return
        
        # Update message status
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE messages 
            SET status = 'read'
            WHERE message_id = %s AND receiver_id = %s
            RETURNING sender_id
        """, (message_id, user_id))
        
        result = cursor.fetchone()
        if not result:
            cursor.close()
            conn.close()
            return
            
        sender_id = result[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        # Create room ID
        user_ids = sorted([int(user_id), int(sender_id)])
        room_id = f"chat_{user_ids[0]}_{user_ids[1]}"
        
        # Notify about read status
        emit('message_status', {
            'message_id': message_id,
            'status': 'read'
        }, room=room_id)
        
    except Exception as e:
        logging.error(f"Error marking message as read: {str(e)}")

@socketio.on('typing')
def handle_typing(data):
    try:
        token = request.args.get('token')
        decoded_token = decode_token(token)
        
        # Extract user info based on token structure
        if isinstance(decoded_token['sub'], dict) and 'id' in decoded_token['sub']:
            user_id = decoded_token['sub']['id'] 
        else:
            # The token has 'sub' as username instead of a dict with id
            username = decoded_token['sub']
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM user_db WHERE username = %s", (username,))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not result:
                logging.error(f"User not found: {username}")
                raise ValueError('User not found')
                
            user_id = result[0]
        
        receiver_id = data.get('receiver_id')
        is_typing = data.get('is_typing', True)
        
        if not receiver_id:
            return
            
        # Create room ID
        user_ids = sorted([int(user_id), int(receiver_id)])
        room_id = f"chat_{user_ids[0]}_{user_ids[1]}"
        
        # Send typing status to room
        emit('typing_status', {
            'user_id': user_id,
            'is_typing': is_typing
        }, room=room_id, include_self=False)
        
    except Exception as e:
        logging.error(f"Error handling typing status: {str(e)}")

# Group-related socket events
@socketio.on('join_group_chat')
def handle_join_group(data):
    try:
        token = request.args.get('token')
        logging.info(f"Join group request received with token: {token}")
        
        if not token:
            logging.error("No token provided")
            emit('error', {'message': 'No token provided'})
            return
        
        decoded_token = decode_token(token)
        sub = decoded_token.get('sub', {})
        
        user_id = None
        if isinstance(sub, dict) and 'id' in sub:
            user_id = sub['id']
        elif isinstance(sub, str):
            # If sub is a username string, look up the user_id
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM user_db WHERE username = %s", (sub,))
            result = cursor.fetchone()
            if result:
                user_id = result[0]
            cursor.close()
            conn.close()
        
        if not user_id:
            logging.error(f"Failed to extract user_id from token: {decoded_token}")
            emit('error', {'message': 'Invalid token'})
            return
        
        group_id = data.get('group_id')
        if not group_id:
            logging.error("No group_id provided")
            emit('error', {'message': 'No group_id provided'})
            return
        
        # Check if user is a member of the group
        is_member = travel_group_db.is_group_member(group_id, user_id)
        if not is_member:
            logging.error(f"User {user_id} is not a member of group {group_id}")
            emit('error', {'message': 'You are not a member of this group'})
            return
        
        room = f"group_{group_id}"
        join_room(room)
        logging.info(f"User {user_id} joined group room {room}")
        emit('joined_group', {'group_id': group_id, 'user_id': user_id}, room=room)
    except Exception as e:
        logging.error(f"Error in join_group: {str(e)}")
        emit('error', {'message': str(e)})

@socketio.on('group_message')
def handle_group_message(data):
    try:
        token = request.args.get('token')
        logging.info(f"Group message request received with token: {token}")
        
        if not token:
            logging.error("No token provided")
            emit('error', {'message': 'No token provided'})
            return
        
        decoded_token = decode_token(token)
        sub = decoded_token.get('sub', {})
        
        user_id = None
        if isinstance(sub, dict) and 'id' in sub:
            user_id = sub['id']
        elif isinstance(sub, str):
            # If sub is a username string, look up the user_id
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM user_db WHERE username = %s", (sub,))
            result = cursor.fetchone()
            if result:
                user_id = result[0]
            cursor.close()
            conn.close()
        
        if not user_id:
            logging.error(f"Failed to extract user_id from token: {decoded_token}")
            emit('error', {'message': 'Invalid token'})
            return
        
        group_id = data.get('group_id')
        message_content = data.get('message')
        
        if not group_id:
            logging.error("No group_id provided")
            emit('error', {'message': 'No group_id provided'})
            return
        
        if not message_content:
            logging.error("No message provided")
            emit('error', {'message': 'No message provided'})
            return
        
        # Check if user is a member of the group
        is_member = travel_group_db.is_group_member(group_id, user_id)
        if not is_member:
            logging.error(f"User {user_id} is not a member of group {group_id}")
            emit('error', {'message': 'You are not a member of this group'})
            return
        
        # Save message to database
        message_id = travel_group_db.add_group_message(group_id, user_id, message_content)
        
        if not message_id:
            logging.error("Failed to save message to database")
            emit('error', {'message': 'Failed to save message'})
            return
        
        # Get user details
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT username, email FROM user_db WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            logging.error(f"User {user_id} not found")
            emit('error', {'message': 'User not found'})
            return
        
        username, email = user
        
        # Send message to group room
        room = f"group_{group_id}"
        timestamp = datetime.now().isoformat()
        message_data = {
            'id': message_id,
            'group_id': group_id,
            'sender_id': user_id,
            'sender_username': username,
            'sender_email': email,
            'content': message_content,
            'timestamp': timestamp,
            'status': 'sent'
        }
        
        emit('group_message', message_data, room=room)
        logging.info(f"Group message sent to room {room}: {message_data}")
    except Exception as e:
        logging.error(f"Error in group_message: {str(e)}")
        emit('error', {'message': str(e)})

@socketio.on('group_typing')
def handle_group_typing(data):
    try:
        token = request.args.get('token')
        logging.info(f"Group typing request received with token: {token}")
        
        if not token:
            logging.error("No token provided")
            emit('error', {'message': 'No token provided'})
            return
        
        decoded_token = decode_token(token)
        sub = decoded_token.get('sub', {})
        
        user_id = None
        if isinstance(sub, dict) and 'id' in sub:
            user_id = sub['id']
        elif isinstance(sub, str):
            # If sub is a username string, look up the user_id
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM user_db WHERE username = %s", (sub,))
            result = cursor.fetchone()
            if result:
                user_id = result[0]
            cursor.close()
            conn.close()
        
        if not user_id:
            logging.error(f"Failed to extract user_id from token: {decoded_token}")
            emit('error', {'message': 'Invalid token'})
            return
        
        group_id = data.get('group_id')
        is_typing = data.get('is_typing', False)
        
        if not group_id:
            logging.error("No group_id provided")
            emit('error', {'message': 'No group_id provided'})
            return
        
        # Check if user is a member of the group
        is_member = travel_group_db.is_group_member(group_id, user_id)
        if not is_member:
            logging.error(f"User {user_id} is not a member of group {group_id}")
            emit('error', {'message': 'You are not a member of this group'})
            return
        
        # Get user details
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM user_db WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            logging.error(f"User {user_id} not found")
            emit('error', {'message': 'User not found'})
            return
        
        username = user[0]
        
        # Send typing status to group room
        room = f"group_{group_id}"
        typing_data = {
            'group_id': group_id,
            'user_id': user_id,
            'username': username,
            'is_typing': is_typing
        }
        
        emit('group_typing', typing_data, room=room)
        logging.info(f"Group typing status sent to room {room}: {typing_data}")
    except Exception as e:
        logging.error(f"Error in group_typing: {str(e)}")
        emit('error', {'message': str(e)})

def initialize_app():
    """Initialize the Flask app with proper configurations"""
    try:
        app.config['SECRET_KEY'] = JWT_SECRET_KEY  # Use the same secret key as main app
        app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY  # Use the same JWT secret as main app
        app.config['CORS_HEADERS'] = 'Content-Type'
        
        # Configure Flask-JWT-Extended
        jwt.init_app(app)
        
        # Enable CORS for all origins
        CORS(app, resources={r"/*": {"origins": "*"}})
        
        logging.info(f"Socket server initialized on port {SOCKET_PORT}")
    except Exception as e:
        logging.error(f"Error initializing app: {e}")
        raise

# Run the socket server standalone if this file is executed directly
if __name__ == '__main__':
    initialize_app()
    logging.info(f"Starting socket server on port {SOCKET_PORT}...")
    socketio.run(app, host='0.0.0.0', port=SOCKET_PORT)