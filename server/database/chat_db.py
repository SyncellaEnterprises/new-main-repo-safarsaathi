import psycopg2
from psycopg2 import pool
from config.config import *
from typing import List, Dict, Optional
import logging

class ChatDB:
    _connection_pool = None
    
    @classmethod
    def initialize(cls):
        try:
            cls._connection_pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dbname=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                host=POSTGRES_HOST,
                port=POSTGRES_PORT
            )
            logging.info("Chat database connection pool initialized")
        except Exception as e:
            logging.error(f"Failed to initialize connection pool: {e}")
            raise
    
    @classmethod
    def get_connection(cls):
        if cls._connection_pool is None:
            cls.initialize()
        return cls._connection_pool.getconn()

    @classmethod
    def return_connection(cls, connection):
        cls._connection_pool.putconn(connection)

    @classmethod
    def execute_query(cls, query: str, params: tuple = None, fetch: bool = False):
        conn = cls.get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                if fetch:
                    result = cursor.fetchall()
                    return result
                conn.commit()
        except Exception as e:
            conn.rollback()
            logging.error(f"Database error: {e}")
            raise
        finally:
            cls.return_connection(conn)

    # User and Match related operations
    @classmethod
    def get_user_info(cls, user_id: int) -> Dict:
        """Get user information from database"""
        query = """
            SELECT u.id, u.username, up.profile_photo
            FROM user_db u
            LEFT JOIN user_profile up ON u.id = up.user_id
            WHERE u.id = %s
        """
        result = cls.execute_query(query, (user_id,), fetch=True)
        if result and result[0]:
            row = result[0]
            profile_photo = row[2][0] if row[2] and isinstance(row[2], list) else None
            return {
                'id': row[0],
                'username': row[1],
                'profile_photo': profile_photo
            }
        return None

    @classmethod
    def verify_match(cls, user1_id: int, user2_id: int) -> bool:
        """Verify that two users have a mutual match"""
        query = """
            SELECT match_id FROM matches 
            WHERE ((user1_id = %s AND user2_id = %s)
                OR (user1_id = %s AND user2_id = %s))
                AND is_active = TRUE
        """
        result = cls.execute_query(query, (user1_id, user2_id, user2_id, user1_id), fetch=True)
        return result and len(result) > 0

    @classmethod
    def get_user_matches(cls, user_id: int) -> List[Dict]:
        """Get all matches for a user"""
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
        result = cls.execute_query(query, (user_id, user_id, user_id, user_id, user_id), fetch=True)
        
        matches = []
        for row in result:
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

    # Message-related operations
    @classmethod
    def save_message(cls, sender_id: int, receiver_id: int, content: str, message_type: str = 'text') -> int:
        """Save a message to the database"""
        query = """
            INSERT INTO messages 
            (sender_id, receiver_id, content, message_type, status)
            VALUES (%s, %s, %s, %s, 'sent')
            RETURNING message_id, sent_at
        """
        result = cls.execute_query(query, (sender_id, receiver_id, content, message_type), fetch=True)
        return result[0] if result else None

    @classmethod
    def update_message_status(cls, message_id: int, status: str) -> bool:
        """Update the status of a message"""
        query = """
            UPDATE messages
            SET status = %s
            WHERE message_id = %s
            RETURNING message_id
        """
        result = cls.execute_query(query, (status, message_id), fetch=True)
        return result and len(result) > 0

    @classmethod
    def mark_messages_as_read(cls, user_id: int, other_user_id: int) -> List[int]:
        """Mark all messages from other_user as read"""
        query = """
            UPDATE messages
            SET status = 'read'
            WHERE sender_id = %s AND receiver_id = %s AND status != 'read'
            RETURNING message_id
        """
        result = cls.execute_query(query, (other_user_id, user_id), fetch=True)
        return [row[0] for row in result] if result else []

    @classmethod
    def get_message_history(cls, user_id: int, other_user_id: Optional[int] = None, 
                           message_id: Optional[int] = None, limit: int = 50) -> List[Dict]:
        """Get message history between two users or for a specific message ID"""
        if message_id:
            query = """
                SELECT m.message_id, m.sender_id, m.receiver_id, m.content,
                    m.sent_at, m.message_type, m.status, u.username as sender_name
                FROM messages m
                JOIN user_db u ON m.sender_id = u.id
                WHERE m.message_id = %s
            """
            result = cls.execute_query(query, (message_id,), fetch=True)
        elif other_user_id:
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
            result = cls.execute_query(query, (user_id, other_user_id, other_user_id, user_id, limit), fetch=True)
        else:
            query = """
                SELECT m.message_id, m.sender_id, m.receiver_id, m.content,
                    m.sent_at, m.message_type, m.status, u.username as sender_name
                FROM messages m
                JOIN user_db u ON m.sender_id = u.id
                WHERE (m.sender_id = %s OR m.receiver_id = %s)
                ORDER BY m.sent_at DESC
                LIMIT %s
            """
            result = cls.execute_query(query, (user_id, user_id, limit), fetch=True)
        
        messages = []
        for row in result:
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
        if message_id:
            return messages
        else:
            return messages[::-1]

    @classmethod
    def get_chats(cls, user_id: int) -> List[Dict]:
        """Get all chats for a user"""
        query = """
            SELECT 
                CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END as chat_id,
                u.username as name,
                MAX(m.sent_at) as last_active,
                COUNT(m.message_id) FILTER (WHERE m.status != 'read' AND m.receiver_id = %s) as unread,
                m.content as last_message,
                up.profile_photo
            FROM messages m
            JOIN user_db u ON (m.sender_id = %s AND m.receiver_id = u.id) OR (m.receiver_id = %s AND m.sender_id = u.id)
            LEFT JOIN user_profile up ON u.id = up.user_id
            WHERE m.sender_id = %s OR m.receiver_id = %s
            GROUP BY chat_id, name, up.profile_photo
            ORDER BY last_active DESC
        """
        result = cls.execute_query(query, (user_id, user_id, user_id, user_id, user_id, user_id), fetch=True)
        
        chats = []
        for row in result:
            profile_photo = row[5][0] if row[5] and isinstance(row[5], list) else None
            chats.append({
                'id': row[0],
                'name': row[1],
                'last_active': row[2].isoformat() if row[2] else None,
                'unread': row[3],
                'last_message': row[4],
                'image': profile_photo
            })
        return chats

    # Group-related operations
    @classmethod
    def create_group(cls, group_name: str, created_by: int) -> int:
        query = """
            INSERT INTO groups (group_name, created_by)
            VALUES (%s, %s)
            RETURNING group_id
        """
        result = cls.execute_query(query, (group_name, created_by), fetch=True)
        return result[0][0] if result else None

    @classmethod
    def add_group_member(cls, group_id: int, user_id: int):
        query = """
            INSERT INTO group_members (group_id, user_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
        """
        cls.execute_query(query, (group_id, user_id))

    @classmethod
    def save_message(cls, sender_id: int, receiver_id: Optional[int], group_id: Optional[int], 
                    content: str, message_type: str = 'text') -> int:
        query = """
            INSERT INTO messages (sender_id, receiver_id, group_id, content, message_type)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING message_id
        """
        result = cls.execute_query(query, (sender_id, receiver_id, group_id, content, message_type), fetch=True)
        return result[0][0] if result else None

    @classmethod
    def update_message_status(cls, message_id: int, status: str):
        query = """
            UPDATE messages
            SET status = %s
            WHERE message_id = %s
        """
        cls.execute_query(query, (status, message_id))

    @classmethod
    def get_message_history(cls, user_id: int, group_id: Optional[int] = None, 
                           other_user_id: Optional[int] = None) -> List[Dict]:
        query = """
            SELECT m.message_id, m.sender_id, m.receiver_id, m.group_id, m.content,
                   m.sent_at, m.message_type, m.status, u.username as sender_name
            FROM messages m
            JOIN user_db u ON m.sender_id = u.id
            WHERE 
        """
        params = []
        
        if group_id:
            query += "m.group_id = %s"
            params.append(group_id)
        else:
            query += "(m.receiver_id = %s OR m.sender_id = %s)"
            params.extend([user_id, user_id])
            if other_user_id:
                query += " AND (m.receiver_id = %s OR m.sender_id = %s)"
                params.extend([other_user_id, other_user_id])

        query += " ORDER BY m.sent_at ASC"
        result = cls.execute_query(query, tuple(params), fetch=True)
        
        return [{
            'message_id': row[0],
            'sender_id': row[1],
            'receiver_id': row[2],
            'group_id': row[3],
            'content': row[4],
            'sent_at': row[5].isoformat(),
            'type': row[6],
            'status': row[7],
            'sender_name': row[8]
        } for row in result] 