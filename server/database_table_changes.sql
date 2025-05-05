CREATE TABLE user_db (
    id serial PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- First, create the ENUM type for gender
CREATE TYPE gender_enum AS ENUM ('Non-Binary', 'non-binary', 'male', 'female', 'Male', 'Female', 'Other', 'other', 'prefer not to say', 'Prefer not to say', 'Prefer Not To Say', 'Prefer not to say');

-- Now, create the user_profile table
CREATE TABLE user_profile (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,  -- Each user has a unique profile
    age INT DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    gender gender_enum DEFAULT NULL,  -- Using ENUM type for gender
    interest TEXT DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    occupation VARCHAR(100) DEFAULT NULL,
    videos JSON DEFAULT NULL,  -- Can store multiple video URLs or objects
    prompts JSON DEFAULT NULL,  -- Updated: Now stores an array of prompts & answers
    profile_photo JSON DEFAULT NULL,  -- Can store multiple profile pictures
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Track profile creation time
    FOREIGN KEY (user_id) REFERENCES user_db(id) ON DELETE CASCADE
);

-- Create user_recommendations_db table
CREATE TABLE user_recommendations_db (
    id SERIAL PRIMARY KEY,                  -- Auto-incrementing ID for the table
    user_id INT NOT NULL,          -- References user_db.user_id
	recommended_user_id INT NOT NULL, -- Recommended user ID
    similarity_score FLOAT NOT NULL,        -- Cosine similarity score
    rank INT NOT NULL,                      -- Rank of the recommendation (1 to N)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp for tracking
    FOREIGN KEY (user_id) REFERENCES user_db(id) ON DELETE CASCADE,
	FOREIGN KEY (recommended_user_id) REFERENCES user_db(id) ON DELETE CASCADE
);

-- Create an index for faster lookups by user_id
CREATE INDEX idx_user_recommendations_user_id ON user_recommendations_db(user_id);

CREATE TYPE swipe_direction_enum AS ENUM ('left', 'right');

CREATE TABLE swipe_logs (
    swipe_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    target_user_id INT NOT NULL,
    swipe_direction swipe_direction_enum NOT NULL,
    swiped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_db(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES user_db(id) ON DELETE CASCADE
); 

CREATE TABLE matches (
    match_id SERIAL PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user1_id) REFERENCES user_db(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES user_db(id) ON DELETE CASCADE,
    CONSTRAINT unique_match UNIQUE (user1_id, user2_id),
    CONSTRAINT no_self_match CHECK (user1_id <> user2_id)
);

-- Add these to your database schema

-- For group chats
CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    created_by INT NOT NULL REFERENCES user_db(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    group_id INT REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id INT REFERENCES user_db(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);

-- For private messages (one-to-one)
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES user_db(id),
    receiver_id INT REFERENCES user_db(id),  -- NULL for group messages
    group_id INT REFERENCES groups(group_id), -- NULL for private messages
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video')),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read'))
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_group ON messages(group_id); 


ALTER TABLE user_profile
RENAME COLUMN profile_photo TO images;

ALTER TABLE user_profile ADD COLUMN isVerified BOOLEAN DEFAULT FALSE;
