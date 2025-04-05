from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from typing import List, Dict
import psycopg2
from config.config import *
import logging

def get_db_connection():
    """Create a new database connection for the chat controller"""
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

def get_user_matches(user_id: int) -> List[Dict]:
    """Get all matches for a user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            SELECT 
                m.match_id,
                CASE 
                    WHEN m.user1_id = %s THEN m.user2_id 
                    ELSE m.user1_id 
                END as matched_user_id,
                m.matched_at,
                u.username,
                up.profile_photo,
                up.bio,
                up.interest
            FROM matches m
            JOIN user_db u ON (m.user1_id = %s AND m.user2_id = u.id) OR (m.user2_id = %s AND m.user1_id = u.id)
            LEFT JOIN user_profile up ON u.id = up.user_id
            WHERE (m.user1_id = %s OR m.user2_id = %s) 
            AND m.is_active = TRUE
            ORDER BY m.matched_at DESC
        """
        cursor.execute(query, (user_id, user_id, user_id, user_id, user_id))
        
        matches = []
        for row in cursor.fetchall():
            profile_photo = row[4][0] if row[4] and isinstance(row[4], list) else None
            matches.append({
                'match_id': row[0],
                'userId': row[1],
                'matchDate': row[2].isoformat() if row[2] else None,
                'username': row[3],
                'profile_photo': profile_photo,
                'bio': row[5],
                'interests': row[6]
            })
        return matches
    except Exception as e:
        logging.error(f"Error getting matches: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

def get_user_chats(user_id: int) -> List[Dict]:
    """Get all chats for a user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            SELECT 
                CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END as chat_id,
                u.username as name,
                MAX(m.sent_at) as last_active,
                COUNT(m.message_id) FILTER (WHERE m.status != 'read' AND m.receiver_id = %s) as unread,
                MAX(m.content) OVER (PARTITION BY CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END ORDER BY m.sent_at DESC) as last_message,
                up.profile_photo
            FROM messages m
            JOIN user_db u ON (m.sender_id = %s AND m.receiver_id = u.id) OR (m.receiver_id = %s AND m.sender_id = u.id)
            LEFT JOIN user_profile up ON u.id = up.user_id
            WHERE m.sender_id = %s OR m.receiver_id = %s
            GROUP BY chat_id, name, up.profile_photo, m.content, m.sent_at
            ORDER BY last_active DESC
        """
        cursor.execute(query, (user_id, user_id, user_id, user_id, user_id, user_id, user_id))
        
        chats = []
        seen_chats = set()
        for row in cursor.fetchall():
            chat_id = row[0]
            if chat_id in seen_chats:
                continue
                
            seen_chats.add(chat_id)
            profile_photo = row[5][0] if row[5] and isinstance(row[5], list) else None
            chats.append({
                'id': chat_id,
                'name': row[1],
                'last_active': row[2].isoformat() if row[2] else None,
                'unread': row[3],
                'last_message': row[4],
                'image': profile_photo
            })
        return chats
    except Exception as e:
        logging.error(f"Error getting chats: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

def verify_match(user1_id: int, user2_id: int) -> bool:
    """Verify that two users have a mutual match"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            SELECT match_id FROM matches 
            WHERE ((user1_id = %s AND user2_id = %s)
                OR (user1_id = %s AND user2_id = %s))
                AND is_active = TRUE
        """
        cursor.execute(query, (user1_id, user2_id, user2_id, user1_id))
        match = cursor.fetchone()
        return match is not None
    except Exception as e:
        logging.error(f"Error verifying match: {str(e)}")
        return False
    finally:
        cursor.close()
        conn.close()

def get_chat_messages_between(user_id: int, other_user_id: int, limit: int = 50) -> List[Dict]:
    """Get message history between two users"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            SELECT m.message_id, m.sender_id, m.receiver_id, m.content,
                   m.sent_at, m.message_type, m.status, u.username as sender_name
            FROM messages m
            JOIN user_db u ON m.sender_id = u.id
            WHERE ((m.sender_id = %s AND m.receiver_id = %s)
                OR (m.sender_id = %s AND m.receiver_id = %s))
            ORDER BY m.sent_at DESC
            LIMIT %s
        """
        cursor.execute(query, (user_id, other_user_id, other_user_id, user_id, limit))
        
        messages = []
        for row in cursor.fetchall():
            messages.append({
                'message_id': row[0],
                'sender_id': row[1],
                'receiver_id': row[2],
                'content': row[3],
                'sent_at': row[4].isoformat() if row[4] else None,
                'type': row[5],
                'status': row[6],
                'sender_name': row[7]
            })
        
        # Return in chronological order (oldest first)
        return messages[::-1]
    except Exception as e:
        logging.error(f"Error getting messages: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

def mark_messages_as_read(user_id: int, other_user_id: int) -> List[int]:
    """Mark all messages from other_user as read"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            UPDATE messages
            SET status = 'read'
            WHERE sender_id = %s AND receiver_id = %s AND status != 'read'
            RETURNING message_id
        """
        cursor.execute(query, (other_user_id, user_id))
        read_message_ids = [row[0] for row in cursor.fetchall()]
        conn.commit()
        return read_message_ids
    except Exception as e:
        conn.rollback()
        logging.error(f"Error marking messages as read: {str(e)}")
        return []
    finally:
        cursor.close()
        conn.close()

@jwt_required()
def get_chats():
    current_user = get_jwt_identity()
    try:
        # Get user's chats from database
        user_id = current_user['id']
        chats = get_user_chats(user_id)
        return jsonify({"chats": chats}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def get_chat_messages(chat_id):
    current_user = get_jwt_identity()
    try:
        # Get messages between current user and the specified user
        user_id = current_user['id']
        other_user_id = int(chat_id)
        
        # Verify these users have a match
        if not verify_match(user_id, other_user_id):
            return jsonify({"error": "No match exists between these users"}), 403
        
        # Mark messages as read
        mark_messages_as_read(user_id, other_user_id)
        
        # Get message history
        messages = get_chat_messages_between(user_id, other_user_id)
        return jsonify({"messages": messages}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def get_matches():
    current_user = get_jwt_identity()
    try:
        # Get user's matches from database
        user_id = current_user['id']
        matches = get_user_matches(user_id)
        
        # Convert to the format expected by the client
        formatted_matches = []
        for match in matches:
            formatted_matches.append({
                'userId': match['userId'],
                'username': match['username'],
                'email': '',  # Email is usually not shared
                'interests': match['interests'] or '',
                'matchDate': match['matchDate'],
                'bio': match['bio'] or '',
                'profile_photo': match['profile_photo']
            })
        
        return jsonify({"matches": formatted_matches}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500