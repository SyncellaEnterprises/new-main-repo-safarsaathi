from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import random
import string
from datetime import datetime
from typing import Dict, List, Optional
from database.chat_db import ChatDB
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

app = Flask(__name__)
CORS(app)  # Allow CORS for all origins
socketio = SocketIO(app, cors_allowed_origins="*")

PORT = 5000
chatgroups = []
users = {}  # Store users and their socket IDs for one-to-one chat

# Add these new models
class Message:
    def __init__(self, id: str, content: str, sender: str, receiver: str, 
                 sent_at: str, type: str = 'text', status: str = 'sent'):
        self.id = id
        self.content = content
        self.sender = sender
        self.receiver = receiver
        self.sent_at = sent_at
        self.type = type
        self.status = status

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'sender': self.sender,
            'receiver': self.receiver,
            'sent_at': self.sent_at,
            'type': self.type,
            'status': self.status
        }

# Store active chats and messages
active_chats: Dict[str, List[Message]] = {}
user_typing_status: Dict[str, Dict[str, bool]] = {}
online_users: Dict[str, str] = {}  # username -> socket_id

def create_unique_id():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=8))

@app.route("/api/groups", methods=["GET"])
def get_all_groups():
    return jsonify(chatgroups)

class ChatHandler:
    def __init__(self, socketio: SocketIO):
        self.socketio = socketio
        self.active_typing = {}
        self.setup_handlers()

    def setup_handlers(self):
        @self.socketio.on('connect')
        @jwt_required(optional=True)
        def handle_connect():
            try:
                current_user = get_jwt_identity()
                if current_user:
                    logging.info(f"User {current_user['id']} connected")
                    emit('connection_status', {'status': 'authenticated'})
                else:
                    emit('connection_status', {'status': 'unauthenticated'})
            except Exception as e:
                logging.error(f"Connection error: {str(e)}")
                emit('connection_error', {'error': 'Authentication failed'})

        @self.socketio.on('join_chat')
        @jwt_required()
        def handle_join_chat(data):
            current_user = get_jwt_identity()
            chat_type = data.get('chat_type')
            chat_id = data.get('chat_id')
            
            room = f"{chat_type}_{chat_id}"
            join_room(room)
            
            # Get chat history
            messages = ChatDB.get_message_history(
                current_user['id'],
                group_id=chat_id if chat_type == 'group' else None,
                other_user_id=data.get('other_user_id')
            )
            emit('chat_history', messages)
            
            # Notify others about user presence
            emit('user_joined', {'user_id': current_user['id']}, room=room)

        @self.socketio.on('send_message')
        @jwt_required()
        def handle_send_message(data):
            current_user = get_jwt_identity()
            try:
                message_id = ChatDB.save_message(
                    sender_id=current_user['id'],
                    receiver_id=data.get('receiver_id'),
                    group_id=data.get('group_id'),
                    content=data['content'],
                    message_type=data.get('type', 'text')
                )
                
                # Get the saved message
                message = ChatDB.get_message_history(
                    current_user['id'], 
                    message_id=message_id
                )[0]
                
                # Determine room
                room = f"{'group' if message['group_id'] else 'private'}_{message['group_id'] or message['receiver_id']}"
                
                # Broadcast message
                emit('new_message', message, room=room)
                
                # Update status to delivered
                ChatDB.update_message_status(message_id, 'delivered')
                emit('message_status', {
                    'message_id': message_id,
                    'status': 'delivered'
                }, room=room)

            except Exception as e:
                emit('message_error', {'error': str(e)})

        @self.socketio.on('typing')
        @jwt_required()
        def handle_typing(data):
            current_user = get_jwt_identity()
            chat_type = data['chat_type']
            chat_id = data['chat_id']
            
            room = f"{chat_type}_{chat_id}"
            self.active_typing.setdefault(room, set()).add(current_user['id'])
            
            emit('typing_status', {
                'users': list(self.active_typing[room]),
                'chat_id': chat_id
            }, room=room)

        @self.socketio.on('stop_typing')
        @jwt_required()
        def handle_stop_typing(data):
            current_user = get_jwt_identity()
            chat_type = data['chat_type']
            chat_id = data['chat_id']
            
            room = f"{chat_type}_{chat_id}"
            if current_user['id'] in self.active_typing.get(room, set()):
                self.active_typing[room].remove(current_user['id'])
                
            emit('typing_status', {
                'users': list(self.active_typing.get(room, set())),
                'chat_id': chat_id
            }, room=room)

        @self.socketio.on('message_read')
        @jwt_required()
        def handle_message_read(data):
            message_id = data['message_id']
            ChatDB.update_message_status(message_id, 'read')
            emit('message_status', {
                'message_id': message_id,
                'status': 'read'
            }, broadcast=True)

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
    for username, sid in list(online_users.items()):
        if sid == request.sid:
            del online_users[username]
            emit('user_status', {'username': username, 'status': 'offline'}, broadcast=True)
            break

@socketio.on('leave_chat')
def handle_leave_chat(data):
    chat_id = data['chatId']
    leave_room(chat_id)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=PORT, debug=True)
    print(f"Server is running on port {PORT}")
