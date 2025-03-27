import psycopg2
from psycopg2 import pool
from config.config import *
from typing import List, Dict, Optional
import logging

class ChatDB:
    _connection_pool = None
    
    @classmethod
    def initialize(cls):
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

    @classmethod
    def get_connection(cls):
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

    # Message-related operations
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