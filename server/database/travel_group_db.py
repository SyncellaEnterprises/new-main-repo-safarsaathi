import psycopg2
from config.config import *
from typing import List, Dict, Optional
import logging
from datetime import datetime

class TravelGroupDB:
    """Database operations for travel groups"""
    
    @staticmethod
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
    
    @classmethod
    def create_travel_group(cls, name: str, created_by: int, description: str = None, 
                           destination: str = None, start_date: str = None, 
                           end_date: str = None) -> int:
        """
        Create a new travel group
        Returns the group_id of the created group
        """
        conn = cls.get_db_connection()
        cursor = conn.cursor()
        try:
            # Insert the group
            logging.info(f"Creating travel group: name={name}, created_by={created_by}, description={description}, destination={destination}, start_date={start_date}, end_date={end_date}")
            query = """
            INSERT INTO travel_groups 
            (name, description, destination, start_date, end_date, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING group_id
            """
            cursor.execute(query, (name, description, destination, start_date, end_date, created_by))
            group_id = cursor.fetchone()[0]
            logging.info(f"Created travel group with ID: {group_id}")
            
            # Add the creator as an admin member
            logging.info(f"Adding creator {created_by} as admin member to group {group_id}")
            cls.add_member_to_group(group_id, created_by, is_admin=True, cursor=cursor)
            
            conn.commit()
            logging.info(f"Committed travel group creation transaction for group {group_id}")
            return group_id
        except Exception as e:
            conn.rollback()
            logging.error(f"Error creating travel group: {str(e)}")
            raise
        finally:
            cursor.close()
            conn.close()
    
    @classmethod
    def add_member_to_group(cls, group_id: int, user_id: int, is_admin: bool = False, 
                           cursor = None) -> bool:
        """
        Add a user to a travel group
        Returns True if successful, False otherwise
        """
        close_conn = False
        conn = None
        
        if cursor is None:
            conn = cls.get_db_connection()
            cursor = conn.cursor()
            close_conn = True
        
        try:
            logging.info(f"Adding user {user_id} to group {group_id} (admin: {is_admin})")
            query = """
            INSERT INTO travel_group_members 
            (group_id, user_id, is_admin)
            VALUES (%s, %s, %s)
            ON CONFLICT (group_id, user_id) DO NOTHING
            RETURNING id
            """
            cursor.execute(query, (group_id, user_id, is_admin))
            result = cursor.fetchone()
            
            if close_conn:
                conn.commit()
                logging.info(f"Committed adding user {user_id} to group {group_id}")
            
            if result is not None:
                logging.info(f"Successfully added user {user_id} to group {group_id}")
                return True
            else:
                logging.info(f"User {user_id} already a member of group {group_id} or insert failed")
                return False
        except Exception as e:
            if close_conn and conn:
                conn.rollback()
            logging.error(f"Error adding member to group: {str(e)}")
            return False
        finally:
            if close_conn and conn:
                cursor.close()
                conn.close()
    
    @classmethod
    def remove_member_from_group(cls, group_id: int, user_id: int) -> bool:
        """
        Remove a user from a travel group
        Returns True if successful, False otherwise
        """
        conn = cls.get_db_connection()
        cursor = conn.cursor()
        try:
            query = """
            DELETE FROM travel_group_members 
            WHERE group_id = %s AND user_id = %s
            RETURNING id
            """
            cursor.execute(query, (group_id, user_id))
            result = cursor.fetchone()
            conn.commit()
            return result is not None
        except Exception as e:
            conn.rollback()
            logging.error(f"Error removing member from group: {str(e)}")
            return False
        finally:
            cursor.close()
            conn.close()
    
    @classmethod
    def get_user_travel_groups(cls, user_id: int) -> List[Dict]:
        """
        Get all travel groups a user is a member of
        Returns a list of group details
        """
        conn = cls.get_db_connection()
        cursor = conn.cursor()
        try:
            query = """
            SELECT g.group_id, g.name, g.description, g.destination, 
                   g.start_date, g.end_date, g.created_by, g.created_at, g.is_active,
                   gm.is_admin,
                   (SELECT COUNT(*) FROM travel_group_members WHERE group_id = g.group_id) as member_count,
                   (SELECT MAX(sent_at) FROM travel_group_messages WHERE group_id = g.group_id) as last_activity
            FROM travel_groups g
            JOIN travel_group_members gm ON g.group_id = gm.group_id
            WHERE gm.user_id = %s AND g.is_active = TRUE
            ORDER BY last_activity DESC NULLS LAST, g.created_at DESC
            """
            cursor.execute(query, (user_id,))
            
            groups = []
            for row in cursor.fetchall():
                groups.append({
                    'group_id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'destination': row[3],
                    'start_date': row[4].isoformat() if row[4] else None,
                    'end_date': row[5].isoformat() if row[5] else None,
                    'created_by': row[6],
                    'created_at': row[7].isoformat() if row[7] else None,
                    'is_active': row[8],
                    'is_admin': row[9],
                    'member_count': row[10],
                    'last_activity': row[11].isoformat() if row[11] else None
                })
            
            return groups
        except Exception as e:
            logging.error(f"Error getting user travel groups: {str(e)}")
            return []
        finally:
            cursor.close()
            conn.close()
    
    @classmethod
    def get_travel_group_details(cls, group_id: int) -> Optional[Dict]:
        """
        Get details of a specific travel group
        Returns group details or None if not found
        """
        conn = cls.get_db_connection()
        cursor = conn.cursor()
        try:
            # Get group basic info
            query = """
            SELECT g.group_id, g.name, g.description, g.destination, 
                   g.start_date, g.end_date, g.created_by, g.created_at, g.is_active,
                   (SELECT COUNT(*) FROM travel_group_members WHERE group_id = g.group_id) as member_count
            FROM travel_groups g
            WHERE g.group_id = %s AND g.is_active = TRUE
            """
            cursor.execute(query, (group_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            group = {
                'group_id': row[0],
                'name': row[1],
                'description': row[2],
                'destination': row[3],
                'start_date': row[4].isoformat() if row[4] else None,
                'end_date': row[5].isoformat() if row[5] else None,
                'created_by': row[6],
                'created_at': row[7].isoformat() if row[7] else None,
                'is_active': row[8],
                'member_count': row[9],
                'members': []
            }
            
            # Get group members
            members_query = """
            SELECT gm.user_id, u.username, up.profile_photo, gm.is_admin, gm.joined_at
            FROM travel_group_members gm
            JOIN user_db u ON gm.user_id = u.id
            LEFT JOIN user_profile up ON u.id = up.user_id
            WHERE gm.group_id = %s
            ORDER BY gm.is_admin DESC, gm.joined_at ASC
            """
            cursor.execute(members_query, (group_id,))
            
            for member_row in cursor.fetchall():
                profile_photo = member_row[2][0] if member_row[2] and isinstance(member_row[2], list) else None
                group['members'].append({
                    'user_id': member_row[0],
                    'username': member_row[1],
                    'profile_photo': profile_photo,
                    'is_admin': member_row[3],
                    'joined_at': member_row[4].isoformat() if member_row[4] else None
                })
            
            return group
        except Exception as e:
            logging.error(f"Error getting travel group details: {str(e)}")
            return None
        finally:
            cursor.close()
            conn.close()
    
    @classmethod
    def send_group_message(cls, group_id: int, sender_id: int, content: str, 
                          message_type: str = 'text') -> Optional[Dict]:
        """
        Send a message to a travel group
        Returns the created message details or None if failed
        """
        conn = cls.get_db_connection()
        cursor = conn.cursor()
        try:
            # Check if user is a member of the group
            cursor.execute(
                "SELECT COUNT(*) FROM travel_group_members WHERE group_id = %s AND user_id = %s",
                (group_id, sender_id)
            )
            if cursor.fetchone()[0] == 0:
                logging.warning(f"User {sender_id} tried to send message to group {group_id} but is not a member")
                return None
            
            # Insert the message
            query = """
            INSERT INTO travel_group_messages 
            (group_id, sender_id, content, message_type)
            VALUES (%s, %s, %s, %s)
            RETURNING message_id, sent_at
            """
            cursor.execute(query, (group_id, sender_id, content, message_type))
            message_id, sent_at = cursor.fetchone()
            
            # Get sender username
            cursor.execute("SELECT username FROM user_db WHERE id = %s", (sender_id,))
            sender_name = cursor.fetchone()[0]
            
            conn.commit()
            
            # Return message details
            return {
                'message_id': message_id,
                'group_id': group_id,
                'sender_id': sender_id,
                'sender_name': sender_name,
                'content': content,
                'sent_at': sent_at.isoformat(),
                'type': message_type,
                'status': 'sent'
            }
        except Exception as e:
            conn.rollback()
            logging.error(f"Error sending group message: {str(e)}")
            return None
        finally:
            cursor.close()
            conn.close()
    
    @classmethod
    def get_group_messages(cls, group_id: int, limit: int = 50) -> List[Dict]:
        """
        Get messages for a specific travel group
        Returns a list of messages, oldest first
        """
        conn = cls.get_db_connection()
        cursor = conn.cursor()
        try:
            query = """
            SELECT m.message_id, m.group_id, m.sender_id, u.username, 
                   m.content, m.sent_at, m.message_type, m.status
            FROM travel_group_messages m
            JOIN user_db u ON m.sender_id = u.id
            WHERE m.group_id = %s
            ORDER BY m.sent_at DESC
            LIMIT %s
            """
            cursor.execute(query, (group_id, limit))
            
            messages = []
            for row in cursor.fetchall():
                messages.append({
                    'message_id': row[0],
                    'group_id': row[1],
                    'sender_id': row[2],
                    'sender_name': row[3],
                    'content': row[4],
                    'sent_at': row[5].isoformat() if row[5] else None,
                    'type': row[6],
                    'status': row[7]
                })
            
            # Return oldest messages first
            return messages[::-1]
        except Exception as e:
            logging.error(f"Error getting group messages: {str(e)}")
            return []
        finally:
            cursor.close()
            conn.close()
    
    def is_group_member(self, group_id: int, user_id: int) -> bool:
        """
        Check if a user is a member of a specific group
        Returns True if the user is a member, False otherwise
        """
        conn = self.get_db_connection()
        cursor = conn.cursor()
        try:
            query = """
            SELECT COUNT(*)
            FROM travel_group_members
            WHERE group_id = %s AND user_id = %s
            """
            cursor.execute(query, (group_id, user_id))
            count = cursor.fetchone()[0]
            return count > 0
        except Exception as e:
            logging.error(f"Error checking group membership: {str(e)}")
            return False
        finally:
            cursor.close()
            conn.close()
    
    def add_group_message(self, group_id: int, sender_id: int, content: str, 
                           message_type: str = 'text') -> Optional[int]:
        """
        Add a message to a group chat
        Returns the message_id if successful, None otherwise
        """
        conn = self.get_db_connection()
        cursor = conn.cursor()
        try:
            # Check if user is a member of the group
            if not self.is_group_member(group_id, sender_id):
                logging.warning(f"User {sender_id} tried to send message to group {group_id} but is not a member")
                return None
            
            # Insert the message
            query = """
            INSERT INTO travel_group_messages 
            (group_id, sender_id, content, message_type)
            VALUES (%s, %s, %s, %s)
            RETURNING message_id
            """
            cursor.execute(query, (group_id, sender_id, content, message_type))
            message_id = cursor.fetchone()[0]
            conn.commit()
            return message_id
        except Exception as e:
            conn.rollback()
            logging.error(f"Error adding group message: {str(e)}")
            return None
        finally:
            cursor.close()
            conn.close()
    
    def update_message_status(self, message_id: int, status: str) -> bool:
        """
        Update the status of a message (e.g., 'sent', 'delivered', 'read')
        Returns True if successful, False otherwise
        """
        conn = self.get_db_connection()
        cursor = conn.cursor()
        try:
            query = """
            UPDATE travel_group_messages
            SET status = %s, updated_at = NOW()
            WHERE message_id = %s
            RETURNING message_id
            """
            cursor.execute(query, (status, message_id))
            result = cursor.fetchone()
            conn.commit()
            return result is not None
        except Exception as e:
            conn.rollback()
            logging.error(f"Error updating message status: {str(e)}")
            return False
        finally:
            cursor.close()
            conn.close()
    
    def get_group_members(self, group_id: int) -> List[Dict]:
        """
        Get all members of a specific group
        Returns a list of member details
        """
        conn = self.get_db_connection()
        cursor = conn.cursor()
        try:
            query = """
            SELECT gm.user_id, u.username, up.profile_photo, gm.is_admin, gm.joined_at
            FROM travel_group_members gm
            JOIN user_db u ON gm.user_id = u.id
            LEFT JOIN user_profile up ON u.id = up.user_id
            WHERE gm.group_id = %s
            ORDER BY gm.is_admin DESC, gm.joined_at ASC
            """
            cursor.execute(query, (group_id,))
            
            members = []
            for row in cursor.fetchall():
                profile_photo = row[2][0] if row[2] and isinstance(row[2], list) else None
                members.append({
                    'user_id': row[0],
                    'username': row[1],
                    'profile_photo': profile_photo,
                    'is_admin': row[3],
                    'joined_at': row[4].isoformat() if row[4] else None
                })
            
            return members
        except Exception as e:
            logging.error(f"Error getting group members: {str(e)}")
            return []
        finally:
            cursor.close()
            conn.close() 