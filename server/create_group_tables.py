import psycopg2
from config.config import *
import os

def create_tables():
    # Connect to the database
    conn = psycopg2.connect(
        host=POSTGRES_HOST,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        port=POSTGRES_PORT
    )
    cursor = conn.cursor()
    
    try:
        # Define SQL statements for creating tables
        create_travel_groups_table = """
        CREATE TABLE IF NOT EXISTS travel_groups (
            group_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            destination VARCHAR(100),
            start_date DATE,
            end_date DATE,
            created_by INTEGER REFERENCES user_db(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE
        );
        """
        
        create_travel_group_members_table = """
        CREATE TABLE IF NOT EXISTS travel_group_members (
            id SERIAL PRIMARY KEY,
            group_id INTEGER REFERENCES travel_groups(group_id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES user_db(id) ON DELETE CASCADE,
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            is_admin BOOLEAN DEFAULT FALSE,
            UNIQUE(group_id, user_id)
        );
        """
        
        create_travel_group_messages_table = """
        CREATE TABLE IF NOT EXISTS travel_group_messages (
            message_id SERIAL PRIMARY KEY,
            group_id INTEGER REFERENCES travel_groups(group_id) ON DELETE CASCADE,
            sender_id INTEGER REFERENCES user_db(id) ON DELETE SET NULL,
            content TEXT NOT NULL,
            message_type VARCHAR(20) DEFAULT 'text',
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) DEFAULT 'sent'
        );
        """
        
        create_indexes = """
        CREATE INDEX IF NOT EXISTS idx_travel_group_members_group_id ON travel_group_members(group_id);
        CREATE INDEX IF NOT EXISTS idx_travel_group_members_user_id ON travel_group_members(user_id);
        CREATE INDEX IF NOT EXISTS idx_travel_group_messages_group_id ON travel_group_messages(group_id);
        CREATE INDEX IF NOT EXISTS idx_travel_group_messages_sender_id ON travel_group_messages(sender_id);
        """
        
        # Execute SQL statements
        cursor.execute(create_travel_groups_table)
        print("Created travel_groups table")
        
        cursor.execute(create_travel_group_members_table)
        print("Created travel_group_members table")
        
        cursor.execute(create_travel_group_messages_table)
        print("Created travel_group_messages table")
        
        cursor.execute(create_indexes)
        print("Created indexes")
        
        # Commit the changes
        conn.commit()
        print("All tables created successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error creating tables: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_tables() 