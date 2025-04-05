-- Create travel_groups table
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

-- Create travel_group_members table
CREATE TABLE IF NOT EXISTS travel_group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES travel_groups(group_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES user_db(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    UNIQUE(group_id, user_id)
);

-- Create travel_group_messages table
CREATE TABLE IF NOT EXISTS travel_group_messages (
    message_id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES travel_groups(group_id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES user_db(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent'
);

-- Create indexes to speed up queries
CREATE INDEX IF NOT EXISTS idx_travel_group_members_group_id ON travel_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_travel_group_members_user_id ON travel_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_group_messages_group_id ON travel_group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_travel_group_messages_sender_id ON travel_group_messages(sender_id); 