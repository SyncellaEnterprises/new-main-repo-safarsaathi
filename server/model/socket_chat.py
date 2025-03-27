from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import random
import string
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
from config.config import *
from utils.logger import logging
from utils.exception import CustomException
from utils.get_user_id import get_user_id_from_username
import json

app = Flask(__name__)
CORS(app)  # Allow CORS for all origins
socketio = SocketIO(app, cors_allowed_origins="*")
    
PORT = 5000
chatgroups = []
users = {}  # Store users and their socket IDs for one-to-one chat

def create_unique_id():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=8))

def get_db_connection():
    return psycopg2.connect(
        host=POSTGRES_HOST,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        port=POSTGRES_PORT
    )

# Modified SocketIO handler class
class ChatHandler:
    def __init__(self, socketio):
        self.socketio = socketio
        self.users = {}  # {username: socket_id}
        self.setup_handlers()
        
    def setup_handlers(self):
        @self.socketio.on('connect')
        @jwt_required()
        def handle_connect():
            try:
                username = get_jwt_identity()
                user_id = get_user_id_from_username(username)
                
                if not user_id:
                    raise ConnectionRefusedError('Unauthorized')
                
                self.users[username] = request.sid
                join_room(f"user_{user_id}")
                logging.info(f"User {username} connected")
                
            except Exception as e:
                logging.error(f"Connection error: {str(e)}")
                raise ConnectionRefusedError('Authentication failed')

        @self.socketio.on('disconnect')
        def handle_disconnect():
            username = get_jwt_identity()
            if username in self.users:
                del self.users[username]
                logging.info(f"User {username} disconnected")

        @self.socketio.on('send_message')
        @jwt_required()
        def handle_send_message(data):
            try:
                username = get_jwt_identity()
                sender_id = get_user_id_from_username(username)
                content = data['content']
                message_type = data.get('type', 'text')
                receiver_id = data.get('receiver_id')
                group_id = data.get('group_id')

                # Validate message
                if not content or len(content) > 1000:
                    raise ValueError("Invalid message content")

                conn = get_db_connection()
                cursor = conn.cursor()

                # Save to database
                cursor.execute("""
                    INSERT INTO messages 
                    (sender_id, receiver_id, group_id, content, message_type)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING message_id, sent_at
                """, (sender_id, receiver_id, group_id, content, message_type))
                
                message_id, sent_at = cursor.fetchone()
                conn.commit()
                
                # Prepare response
                message_data = {
                    'message_id': message_id,
                    'sender': username,
                    'content': content,
                    'sent_at': sent_at.isoformat(),
                    'type': message_type
                }

                # Determine message destination
                if receiver_id:  # Private message
                    # Verify match relationship
                    cursor.execute("""
                        SELECT match_id FROM matches 
                        WHERE (user1_id = %s AND user2_id = %s)
                        OR (user1_id = %s AND user2_id = %s)
                        AND is_active = TRUE
                    """, (sender_id, receiver_id, receiver_id, sender_id))
                    
                    if not cursor.fetchone():
                        raise PermissionError("Users are not matched")
                    
                    # Get receiver's socket ID
                    cursor.execute("SELECT username FROM user_db WHERE id = %s", (receiver_id,))
                    receiver_username = cursor.fetchone()[0]
                    receiver_sid = self.users.get(receiver_username)
                    
                    if receiver_sid:
                        emit('new_message', message_data, room=receiver_sid)
                    
                    # Also send to sender's other devices
                    emit('new_message', message_data, room=f"user_{sender_id}")

                elif group_id:  # Group message
                    # Verify group membership
                    cursor.execute("""
                        SELECT 1 FROM group_members 
                        WHERE group_id = %s AND user_id = %s
                    """, (group_id, sender_id))
                    
                    if not cursor.fetchone():
                        raise PermissionError("Not a group member")
                    
                    emit('new_group_message', {**message_data, 'group_id': group_id}, room=f"group_{group_id}")

                cursor.close()
                conn.close()

            except Exception as e:
                logging.error(f"Message error: {str(e)}")
                emit('error', {'message': str(e)})

        @self.socketio.on('join_group')
        @jwt_required()
        def handle_join_group(data):
            try:
                username = get_jwt_identity()
                user_id = get_user_id_from_username(username)
                group_id = data['group_id']

                conn = get_db_connection()
                cursor = conn.cursor()

                # Verify membership
                cursor.execute("""
                    SELECT 1 FROM group_members 
                    WHERE group_id = %s AND user_id = %s
                """, (group_id, user_id))
                
                if not cursor.fetchone():
                    raise PermissionError("Not a group member")

                join_room(f"group_{group_id}")
                emit('group_joined', {'group_id': group_id})
                
                cursor.close()
                conn.close()

            except Exception as e:
                logging.error(f"Join group error: {str(e)}")
                emit('error', {'message': str(e)})

        # Add more handlers for message history, group creation, etc.

@app.route("/api/groups", methods=["GET"])
def get_all_groups():
    return jsonify(chatgroups)

@socketio.on('getAllGroups')
def get_all_groups_socket():
    emit('groupList', chatgroups)

@socketio.on('createNewGroup')
def create_new_group(data):
    current_group_name = data['currentGroupName']
    print(f"Creating new group: {current_group_name}")
    
    new_group = {
        'id': len(chatgroups) + 1,
        'currentGroupName': current_group_name,
        'messages': []
    }
    
    chatgroups.insert(0, new_group)
    emit('groupList', chatgroups, broadcast=True)  # Update all clients

@socketio.on('joinGroup')
def join_group(data):
    group_name = data['groupName']
    join_room(group_name)
    print(f"User {request.sid} joined group {group_name}")

@socketio.on('leaveGroup')
def leave_group(data):
    group_name = data['groupName']
    leave_room(group_name)
    print(f"User {request.sid} left group {group_name}")

@socketio.on('findGroup')
def find_group(data):
    group_id = data['groupId']
    filtered_group = next((group for group in chatgroups if group['id'] == group_id), None)
    if filtered_group:
        emit('foundGroup', filtered_group['messages'])

@socketio.on('newChatMessage')
def new_chat_message(data):
    group_id = data['groupIdentifier']
    message_text = data['currentChatMessage']
    current_user = data['currentUser']
    time_data = data['timeData']

    filtered_group = next((group for group in chatgroups if group['id'] == group_id), None)

    if filtered_group:
        new_message = {
            'id': create_unique_id(),
            'text': message_text,
            'currentUser': current_user,
            'time': f"{time_data['hr']}:{time_data['mins']}"
        }

        filtered_group['messages'].append(new_message)
        emit('groupMessage', new_message, room=filtered_group['currentGroupName'])
        emit('groupList', chatgroups, broadcast=True)  # Update all clients

# One-to-One Chat functionality
@socketio.on('registerUser')
def register_user(data):
    username = data['username']
    users[username] = request.sid  # Store user socket ID
    print(f"{username} registered with socket ID {request.sid}")

@socketio.on('sendPrivateMessage')
def send_private_message(data):
    sender = data['sender']
    recipient = data['recipient']
    message = data['message']
    time_data = data['timeData']

    if recipient in users:
        recipient_sid = users[recipient]
        private_message = {
            'id': create_unique_id(),
            'text': message,
            'currentUser': sender,
            'time': f"{time_data['hr']}:{time_data['mins']}"
        }
        emit('privateMessage', private_message, room=recipient_sid)
        print(f"Private message sent from {sender} to {recipient}")
    else:
        print(f"User {recipient} not found")

@socketio.on('disconnect')
def handle_disconnect():
    for username, sid in list(users.items()):
        if sid == request.sid:
            del users[username]
            print(f"{username} disconnected and removed from users list")
            break