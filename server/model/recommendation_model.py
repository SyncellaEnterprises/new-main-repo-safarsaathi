import os
import sys
import psycopg2
from psycopg2.extras import DictCursor
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document
from langchain_pinecone import PineconeVectorStore
from config.config import *
from utils.exception import CustomException
from utils.logger import logging
from langchain_pinecone import PineconeVectorStore

from pinecone import Pinecone, ServerlessSpec

class RecommendationModel:
    DEFAULT_RECOMMENDATION_LIMIT = 50

    def __init__(self):
        try:
            self.embeddeding_model= HuggingFaceEmbeddings(
                                    model_name="sentence-transformers/all-mpnet-base-v2"
                                    )
            logging.info("model: %s" % self.embeddeding_model)

            # Define the index name and embedding dimension
            self.INDEX_NAME = "travel-mate"
            self.INDEX_DIMENSION = 1024
            logging.info(f"Index name: {self.INDEX_NAME} & Index dimension: {self.INDEX_DIMENSION}")

            # Initialize Pinecone
            if not PINECONE_API_KEY:
                raise CustomException("PINECONE_API_KEY not found in environment variables", sys)
            
            # Initialize Pinecone client
            self.pc = Pinecone(api_key=PINECONE_API_KEY)

            logging.info("Pinecone initalized")
            
            # Get list of existing indexes
            existing_indexes = self.pc.list_indexes()

            logging.info(f"existing indexes {existing_indexes}")

            # Create the index if it doesn't exist
            if self.INDEX_NAME not in [idx['name'] for idx in existing_indexes]:
                logging.info(f"Creating new Pinecone index: {self.INDEX_NAME}")
                self.pc.create_index(
                    name=self.INDEX_NAME,
                    dimension=self.INDEX_DIMENSION,
                    metric='cosine',
                    spec=ServerlessSpec(cloud="aws", region="us-east-1")
                )
            else:
                logging.info(f"Pinecone index {self.INDEX_NAME} already exists")

            # Connect to PostgreSQL
            self.connection = psycopg2.connect(
                host=POSTGRES_HOST,
                database=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                port=POSTGRES_PORT
            )
            self.cursor = self.connection.cursor(cursor_factory=DictCursor)
            logging.info("Database connection established")

        except Exception as e:
            logging.error(f"Error during RecommendationModel initialization: {str(e)}")
            raise CustomException(e, sys)

    def create_vector_db(self):
        try:
            logging.info("Creating and populating vector database...")
            
            # Query to get user data from user_profile table
            query = '''
                SELECT 
                    user_id,
                    location,
                    interest as interests
                FROM user_profile 
                WHERE location IS NOT NULL 
                OR interest IS NOT NULL
            '''

            
            self.cursor.execute(query)
            user_profiles = self.cursor.fetchall()

            
            
            if not user_profiles:
                logging.warning("No user profiles found with location or interests")
                return None
            else:
                logging.info(f"User profile {user_profiles}")

            # Create documents for vector store
            documents = []
            for profile in user_profiles:
                profile_dict = dict(profile)
                
                # Create content string combining location and interests
                content = f"Location: {profile_dict.get('location', 'Not specified')}, "
                content += f"Interests: {profile_dict.get('interests', 'Not specified')}"
                
                # Create Document object with metadata
                doc = Document(
                    page_content=content,
                    metadata={
                        "user_id": profile_dict['user_id'],
                        "location": profile_dict.get('location'),
                        "interests": profile_dict.get('interests')
                    }
                )
                documents.append(doc)
                
            logging.info(f"Created {len(documents)} documents from user profiles")

            vector_store = PineconeVectorStore.from_documents(
                documents=documents,
                index_name=self.INDEX_NAME,
                embedding=self.embeddeding_model
            )   
            logging.info(f"vector_store successfully created")
            
            return vector_store

        except Exception as e:
            logging.error(f"Error creating vector database: {str(e)}")
            raise CustomException(e, sys)

    def __del__(self):
        try:
            if hasattr(self, 'cursor') and self.cursor:
                self.cursor.close()
            if hasattr(self, 'connection') and self.connection:
                self.connection.close()
        except Exception as e:
            logging.error(f"Error closing database connections: {str(e)}")
        
