# Travel Mate Backend

A Flask-based backend service for the Travel Mate application that provides user authentication, profile management, and AI-powered user recommendations.

## Project Structure

```
server/
├── config/
│   ├── __init__.py
│   ├── verify_email.py   # verify email to verify real emails right now it is commented
│   └── config.py         # Configuration settings and environment variables
├── controllers/
│   ├── __init__.py
│   ├── user_auth_controller.py      # Authentication endpoints
│   ├── user_onboarding_controller.py # User profile management
│   └── home_screen_controller.py     # Recommendation endpoints
├── model/
│   ├── user_auth_model.py           # Authentication business logic
│   ├── user_onboarding_model.py     # Profile management logic
│   ├── home_screen_model.py         # Home screen related logic not started yet it will have swipe, match logics 
│   └── recommendation_model.py       # AI recommendation system
├── utils/
│   ├── jwt_utils.py      # JWT blacklist lists
│   ├── logger.py         # Logging configuration
│   └── exception.py      # Custom exception handling
├── logs/                 # Application logs
├── app.py               # Main application entry point
├── .env                 # This mf consists of environment variables which I won't be sharing in my public repository
├── requirements.txt     # Project dependencies
├── render.yaml         # I don't know why the fuck I made it, its just mf gpt told me.
├── .gitignore          # Project dependencies
└── gunicorn.conf.py    # Gunicorn server configuration

```

## API Endpoints


### Authentication Endpoints
- `POST /api/user/register`
  - Register a new user
  - Body: 
    ```json
    {
        "username": "string",
        "email": "string",
        "password": "string",
        "confirmPassword": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Registration successful",
        "access_token": "JWT_token_string",
        "user": {
            // User details
        }
    }
    ```

- `POST /api/user/login`
  - Login existing user
  - Body:
    ```json
    {
        "username": "string", // or "email": "string"
        "password": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Login successful",
        "access_token": "JWT_token_string",
        "user": {
            // User details
        }
    }
    ```

- `POST /user/logout`
  - Logout user
  - Requires: JWT Token
  - Response:
    ```json
    {
        "status": "success",
        "message": "Logged out successfully"
    }
    ```

### User Onboarding Endpoints
All onboarding endpoints require JWT Token in header: `Authorization: Bearer <token>`

- `POST /api/onboarding/age`
  - Update user age
  - Body:
    ```json
    {
        "age": "integer"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Age updated successfully"
    }
    ```

- `POST /api/onboarding/gender`
  - Update user gender
  - Body:
    ```json
    {
        "gender": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Gender updated successfully"
    }
    ```

- `POST /api/onboarding/location`
  - Update user location
  - Body:
    ```json
    {
        "location": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Location updated successfully"
    }
    ```

- `POST /api/onboarding/occupation`
  - Update user occupation
  - Body:
    ```json
    {
        "occupation": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Occupation updated successfully"
    }
    ```

- `POST /api/onboarding/interests`
  - Update user interests
  - Body:
    ```json
    {
        "interests": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Interests updated successfully"
    }
    ```

- `POST /api/onboarding/bio`
  - Update user bio
  - Body:
    ```json
    {
        "bio": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Bio Added successfully"
    }
    ```

- `POST /api/onboarding/videos`
  - Upload user video
  - Body: Form-data with key "video" and file upload
  - Response:
    ```json
    {
        "status": "success",
        "message": "Video uploaded successfully",
        "video_url": "/static/uploads/username_video.extension"
    }
    ```

- `POST /api/onboarding/prompts`
  - Update user prompts
  - Body:
    ```json
    {
        "prompt": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Prompt updated successfully"
    }
    ```

### Recommendation Endpoints
- `POST /user/recommendation`
  - Get personalized user recommendations
  - Requires: JWT Token
  - Response:
    ```json
    {
    "recommended_users": [
        1,
        8,
        4,
        3,
        7,
        5,
        6
    ],
    "similarity_scores": [
        0.6919771432876587,
        0.45753663778305054,
        0.43995487689971924,
        0.40719473361968994,
        0.38178613781929016,
        0.31774523854255676,
        0.26357322931289673
    ],
    "status": "success"
    }

    ```

### Swipe and Match Enpoints
- `POST /api/swipes/remaining`
    - Get remaining user swipes
    - Requires: JWT Token
    - Response:
    ```json
    {
    "remaining_swipes": 9,
    "status": "success",
    "total_limit": 10
    }
    ```

- `POST /api/swipe`
    - User Swipes
    - Requires: JWT Token
    - Body:
    ```json
    {
    "target_username": "user9",
    "direction":"right"
    }
    ```
    - Response:
    ```json
    {
    "remaining_swipes": 9,
    "status": "success",
    "total_limit": 10
    }
    ```

-` POST /api/matches`
  - User Right Swipe match
  - Requires: JWT Token
  - Response:
  ```json
  {
    "matches": [
        {
            "is_active": true,
            "match_id": 1,
            "matched_at": "Tue, 18 Feb 2025 00:36:43 GMT",
            "matched_interests": "History, Books, Writing",
            "matched_location": "Oxford",
            "matched_user_id": 11,
            "matched_username": "user9"
        }
    ],
    "status": "success"
  }
  ```
### User Onboarding Endpoints
All onboarding endpoints require JWT Token in header: `Authorization: Bearer <token>`

- `PATCH /api/update/age`
  - Update user age
  - Body:
    ```json
    {
        "age": "integer"  
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Age updated successfully"
    }
    ```

- `PATCH /api/update/gender`
  - Update user gender
  - Body:
    ```json
    {
        "gender": "string"  
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Gender updated successfully"
    }
    ```

- `PATCH /api/update/location`
  - Update user location
  - Body:
    ```json
    {
        "location": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Location updated successfully"
    }
    ```

- `PATCH /api/update/occupation`
  - Update user occupation
  - Body:
    ```json
    {
        "occupation": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Occupation updated successfully"
    }
    ```

- `PATCH /api/update/interests`
  - Update user interests
  - Body:
    ```json
    {
        "interests": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Interests updated successfully"
    }
    ```

- `PATCH /api/update/bio`
  - Update user bio
  - Body:
    ```json
    {
        "bio": "string"
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Bio updated successfully"
    }
    ```

- `PATCH /api/update/prompts`
  - Update user prompts
  - Body:
    ```json
    {
        "prompts": [
            {
                "question": "string",
                "answer": "string"
            }
        ]
    }
    ```
  - Response:
    ```json
    {
        "status": "success",
        "message": "Prompts updated successfully"
    }
    ```

Error Response (for all endpoints):
```json
{
    "status": "error",
    "message": "Error description"
}
```

Status Codes:
- 200: Success
- 400: Bad Request (invalid data or validation failed)
- 401: Unauthorized (invalid or missing token)
- 500: Internal Server Error

-` POST /api/chat/send`
  - User Right Swipe match
  - Requires: JWT Token
  - Response:
  ```json
  {
    "matches": [
        {
            "is_active": true,
            "match_id": 1,
            "matched_at": "Tue, 18 Feb 2025 00:36:43 GMT",
            "matched_interests": "History, Books, Writing",
            "matched_location": "Oxford",
            "matched_user_id": 11,
            "matched_username": "user9"
        }
    ],
    "status": "success"
  }
  ```

-` POST /api/chat/send`
  - User Sending message who are matched
  - Requires: JWT Token
  - Body: 
  ```json
  {
    "receiver_username": "user_9",
    "message": "hello"
  }
  ```
  - Response:
  ```json
    {
    "message_id": "2",
    "sender_username": "user_9",
    "receiver_username": "user_10",
    "message": "hello",
    "sent_at": "18/02/2025:20:08"
    }
  ```

### Districts Endpoints

- `GET /api/states`
  - Get list of all states
  - Response:
    ```json
    {
        "status": "success",
        "data": ["State1", "State2", "State3", ...]
    }
    ```

- `GET /api/districts/<state>`
  - Get districts for a specific state
  - Response:
    ```json
    {
        "status": "success",
        "state": "State Name",
        "districts": ["District1", "District2", "District3", ...]
    }
    ```

- `GET /api/all-districts`
  - Get all districts sorted by name
  - Response:
    ```json
      {
    "data": [
      "Adilabad",
      "Agar Malwa",
      "Agra",
      "Ahmedabad",
      "Ahmednagar",
      "Aizawl",
      "Ajmer",
      "Akola",
      "Alappuzha",
      "Aligarh",
      "Alipurduar",
      "Alirajpur",
      "Alluri Sitharama Raju",
      "Almora",
      "Alwar",
      "Ambala",
      "Ambedkar Nagar",
      ....]
      }
    ```
### Get Endpoints

- `GET /api/users/me`
  - Get data of the logged in user
  - Requires: JWT Token
  - Response:
     ```json
    {
      "status": "success",
  "user": {
    "age": 22,
    "bio": "Myself nitin gupta I am better than you",
    "created_at": "Thu, 27 Mar 2025 17:58:28 GMT",
    "email": "lalu@gmail.com",
    "gender": "male",
    "interest": "{Cooking,\"Street Food\",Backpacking}",
    "location": "{\"state\":\"Gujarat\",\"city\":\"Ahmedabad\",\"latitude\":37.4220936,\"longitude\":-122.083922,\"address\":\"Mountain View, California\"}",
    "occupation": "entrepreneur",
    "profile_photo": null,
    "prompts": {
      "prompts": [
        {
          "answer": "hhhhhhhhhhhhhhhhhhh",
          "question": "My biggest adventure was..."
        },
        {
          "answer": "hhhhhhhhhhhhhhhhhhhhhhhh",
          "question": "I get way too excited about..."
        }
      ]
    },
    "user_id": 11,
    "username": "lalu"
  }
    }
    ```

    
- `GET /api/recommended_users/me`
  - Get data of the logged in user
  - Requires: JWT Token
  - Response:
     ```json
    {
    "recommended_users": [
        {
            "recommended_user_username": "nitin",
            "recommended_user_age": 28,
            "recommended_user_bio": "Naa bahi afhsahfshfhsdjfdaf asas",
            "recommended_user_created_at": "Thu, 06 Mar 2025 13:16:07 GMT",
            "recommended_user_gender": "male",
            "recommended_user_interest": "{Camping,Dance,\"Street Food\"}",
            "recommended_user_location": "Patna",
            "recommended_user_occupation": "student",
            "recommended_user_photo": null,
            "recommended_user_profile_id": 43,
            "recommended_user_prompts": {
                "prompts": [
                    {
                        "answer": "tumhe hamre bare me nh ijanafsa",
                        "question": "The one thing I want to know about you is..."
                    },
                    {
                        "answer": "stay away from contteojoij",
                        "question": "My most controversial opinion is..."
                    }
                ]
            },
            "similarity_score": 0.5441601276397705
        },
        ................
    }
    ```


Common Error Responses:
```json
{
    "status": "error",
    "message": "Error description"
}
```

Status Codes:
- 200: Success
- 404: State not found
- 500: Server error

### Matches of current user Endpoints

- `GET /api/matches/me`
  - Get all active matches for the logged-in user
  - Requires: JWT Token
  - Response:
    ```json
    {
        "matches": [
            {
                "username": "john_doe",
                "userId": 123,
                "email": "john@example.com",
                "interests": "travel, photography, hiking",
                "matchDate": "2024-03-20T15:30:00Z",
                "bio": "Adventure seeker and photography enthusiast",
                "location": "{\"state\":\"Karnataka\",\"city\":\"Hubballi\",\"latitude\":37.4220936,\"longitude\":-122.083922,\"address\":\"Mountain View, California\"}",
            },
            {
                "username": "jane_smith",
                "userId": 124,
                "email": "jane@example.com",
                "interests": "music, art, cooking",
                "matchDate": "2024-03-19T10:15:00Z",
                "bio": "Art lover and foodie",
                "location": "{\"state\":\"Maharashtra\",\"city\":\"Mumbai\",\"latitude\":19.0759837,\"longitude\":72.8776559,\"address\":\"Mumbai, Maharashtra\"}",
            }
        ]
    }
    ```

  - Empty Response (when no matches):
    ```json
    {
        "matches": []
    }
    ```

  - Error Response:
    ```json
    {
        "error": "Error description"
    }
    ```

  Status Codes:
  - 200: Success (including cases with no matches)
  - 401: Unauthorized (invalid or missing token)
  - 500: Internal Server Error

## Database Table schemas
### user_db: 
stores data during user registration

```SQL
CREATE TABLE user_db (
    id serial PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_profile: 
stores basic data of a user like age, gender, location etc.
```SQL
-- First, create the ENUM type for gender
CREATE TYPE gender_enum AS ENUM ('Non-Binary', 'non-binary', 'male', 'female', 'Male', 'Female', 'Other', 'other');

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
```

### user_recommendations_db: 
User recommendations data is stored in this table.
```SQL
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
```

### swipe_logs: 
user swipe logs data
```SQL
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
```

### matches:
user right swipe match data, if both user have right swipe direction they can chat.
```SQL
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
```

## Technologies Used
- Flask
- PostgreSQL
- JWT Authentication
- HuggingFace Embeddings
- Sentence Transformers

## Setup and Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables in config/config.py:
```python
POSTGRES_HOST
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_PORT
JWT_SECRET_KEY
```

3. Run the application:
```bash
python app.py
```

For production deployment:
```bash
gunicorn app:app
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Error Handling
The API returns standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

Each error response includes a message explaining the error:
```json
{
    "error": "Error message description"
}
```

## Rate Limiting
- API endpoints are rate-limited to prevent abuse
- Login attempts are limited to 5 per minute per IP
- Other endpoints are limited to 100 requests per minute per user 