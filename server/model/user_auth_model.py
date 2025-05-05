import bcrypt
from flask_jwt_extended import create_access_token, get_jwt_identity
import psycopg2
from psycopg2.extras import DictCursor
from utils.logger import logging
from utils.exception import CustomException
from config.verifyEmail import VerifyEmail
import sys
from config.config import *

class UserAuthModel:
    def __init__(self):
        self.connection = None
        self.cursor = None
        try:
            logging.info("Attempting to connect to database...")
            self.connection = psycopg2.connect(
                host=POSTGRES_HOST,
                database=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                port=POSTGRES_PORT,
                connect_timeout=3  # Add 3 second timeout
            )
            self.cursor = self.connection.cursor(cursor_factory=DictCursor)
            logging.info("Successfully connected to PostgreSQL database for user auth")
        except Exception as e:
            logging.error(f"Error while connecting to PostgreSQL database: {e}")
            if self.connection:
                self.connection.close()
            raise CustomException(e, sys)
        
    def __del__(self):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
            logging.info("Database connection closed")
        
    def register_user(self, username, email, password, confirm_password):
        try:
            logging.info(f"Starting registration for user: {username}")
            if username == '' or email == '' or password == '' or confirm_password == '':
                logging.warning("Empty fields in registration")
                return {"status": "error", "message": "Please fill in all fields"}

            if password != confirm_password:
                logging.warning("Passwords do not match")
                return {"status": "error", "message": "Passwords do not match"}
        
            # Check if email exists
            logging.info("Checking if email exists")
            self.cursor.execute('SELECT * FROM user_db WHERE email = %s', (email,))
            existing_email = self.cursor.fetchone()
            if existing_email:
                logging.warning("Email already exists")
                return {"status": "error", "message": "Email already registered"}

            # Check if username exists
            logging.info("Checking if username exists")
            self.cursor.execute('SELECT * FROM user_db WHERE username = %s', (username,))
            existing_user = self.cursor.fetchone()
            if existing_user:
                logging.warning("Username already exists")
                return {"status": "error", "message": "Username already taken"}
            
            # If neither exists, proceed with registration
            logging.info("Creating new user")
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            self.cursor.execute('INSERT INTO user_db (username, email, password) VALUES (%s, %s, %s)', 
                        (username, email, hashed_password))
            self.connection.commit()
            
            # Generate JWT token for the new user
            access_token = create_access_token(identity=username)
            logging.info("Registration successful")
            return {
                "status": "success",
                "message": "Registration successful",
                "access_token": access_token,
                "user": {
                    "username": username,
                    "email": email
                }
            }
        except Exception as e:
            if self.connection:
                self.connection.rollback()
            logging.error(f"Error in register_user: {e}")
            raise CustomException(e, sys)
        
    def login_user(self, username, password):
        try:
            logging.info("Logging in user")
            # Try to find user by username or email
            self.cursor.execute('SELECT * FROM user_db WHERE username = %s OR email = %s', (username, username))
            user = self.cursor.fetchone()

            
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                access_token = create_access_token(identity=user['username'])
                return {
                    "status": "success",
                    "message": "Login successful",
                    "access_token": access_token,
                    "user": {
                        "username": user['username'],
                        "email": user['email']
                    }
                }
            else:
                logging.info("Invalid credentials")
                return {
                    "status": "error",
                    "message": "Invalid username/email or password"
                }
        except Exception as e:
            logging.error(f"Error in login_user: {e}")
            raise CustomException(e, sys)
