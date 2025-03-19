from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.chat_db import ChatDB
from typing import List, Dict

@jwt_required()
def get_chats():
    current_user = get_jwt_identity()
    try:
        conn = ChatDB.get_connection()
        with conn.cursor() as cursor:
            # Get both private and group chats
            cursor.execute("""
                SELECT 
                    CASE WHEN m.group_id IS NOT NULL THEN m.group_id ELSE u.id END as chat_id,
                    CASE WHEN m.group_id IS NOT NULL THEN g.group_name ELSE u.username END as name,
                    CASE WHEN m.group_id IS NOT NULL THEN 'group' ELSE 'private' END as type,
                    MAX(m.sent_at) as last_active,
                    COUNT(m.message_id) FILTER (WHERE m.status != 'read' AND m.receiver_id = %s) as unread
                FROM messages m
                LEFT JOIN groups g ON m.group_id = g.group_id
                LEFT JOIN user_db u ON (m.sender_id = u.id OR m.receiver_id = u.id) AND u.id != %s
                WHERE m.sender_id = %s OR m.receiver_id = %s OR m.group_id IN (
                    SELECT group_id FROM group_members WHERE user_id = %s
                )
                GROUP BY chat_id, name, type
                ORDER BY last_active DESC
            """, (current_user['id'], current_user['id'], current_user['id'], current_user['id'], current_user['id']))
            
            chats = []
            for row in cursor.fetchall():
                chats.append({
                    'id': row[0],
                    'name': row[1],
                    'type': row[2],
                    'last_active': row[3].isoformat(),
                    'unread': row[4],
                    'image': f"http://10.0.2.2:4000/avatar/{row[0]}"  # Example avatar URL
                })
            return jsonify(chats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def get_chat_messages(chat_id: str):
    current_user = get_jwt_identity()
    try:
        # Determine if it's a group or private chat
        conn = ChatDB.get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT group_id FROM groups WHERE group_id = %s
                UNION
                SELECT user_id FROM user_db WHERE user_id = %s
            """, (chat_id, chat_id))
            
            result = cursor.fetchone()
            chat_type = 'group' if result and result[0] == chat_id else 'private'
            
            messages = ChatDB.get_message_history(
                current_user['id'],
                group_id=chat_id if chat_type == 'group' else None,
                other_user_id=chat_id if chat_type == 'private' else None
            )
            return jsonify(messages), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def get_matches():
    current_user = get_jwt_identity()
    try:
        conn = ChatDB.get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT u.id, u.username, u.profile_picture
                FROM user_db u
                WHERE u.id != %s
                AND NOT EXISTS (
                    SELECT 1 FROM messages m
                    WHERE (m.sender_id = %s AND m.receiver_id = u.id)
                    OR (m.receiver_id = %s AND m.sender_id = u.id)
                )
                ORDER BY u.username
            """, (current_user['id'], current_user['id'], current_user['id']))
            
            matches = []
            for row in cursor.fetchall():
                matches.append({
                    'id': row[0],
                    'username': row[1],
                    'image': row[2] or 'default-avatar-url'
                })
            return jsonify(matches), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500