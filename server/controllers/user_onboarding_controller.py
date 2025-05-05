from app import app 
from flask import jsonify, request
from utils.logger import logging
from flask_jwt_extended import jwt_required
from utils.jwt_utils import jwt_blacklist
from utils.exception import CustomException
from utils.logger import logging
from model.user_onboarding_model import UserOnboardingmodel
import os
from utils.cloudinary import upload_video, upload_image
import time
from werkzeug.utils import secure_filename
import sys

TEMP_IMAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'files', 'images')
if not os.path.exists(TEMP_IMAGE_DIR):
    os.makedirs(TEMP_IMAGE_DIR)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi', 'wmv','jpg', 'jpeg', 'png'}

# Create upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/onboarding/age', methods=['POST']) 
@jwt_required()
def onboarding_age():
    try:
        data = request.get_json()
        age = data.get('age')
        
        if not age:
            return jsonify({
                "status": "error",
                "message": "Age is required"
            }), 400
            
        user_onboarding_model = UserOnboardingmodel()
        result = user_onboarding_model.add_age(age)
        
        if result["status"] == "success":
            return jsonify({
                "status": "success",
                "message": "Age updated successfully"
            }), 200
        return jsonify({
            "status": "error",
            "message": result["message"]
        }), 400
    except Exception as e:
        logging.error(f"Error in onboarding_age: {e}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while updating age"
        }), 500

@app.route('/api/onboarding/gender', methods=['POST'])
@jwt_required()
def onboarding_gender():
    try:
        data = request.get_json()
        gender = data.get('gender')
        
        if not gender:
            return jsonify({
                "status": "error",
                "message": "Gender is required"
            }), 400
            
        user_onboarding_model = UserOnboardingmodel()
        result = user_onboarding_model.add_gender(gender)
        
        if result["status"] == "success":
            return jsonify({
                "status": "success",
                "message": "Gender updated successfully"
            }), 200
        return jsonify({
            "status": "error",
            "message": result["message"]
        }), 400
    except Exception as e:
        logging.error(f"Error in onboarding_gender: {e}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while updating gender"
        }), 500

@app.route('/api/onboarding/location', methods=['POST'])
@jwt_required()
def onboarding_location():
    try:
        logging.info("onboarding_location called")
        data = request.get_json()
        location = data.get('location')
        
        if not location:
            return jsonify({
                "status": "error",
                "message": "Location is required"
            }), 400
            
        user_onboarding_model = UserOnboardingmodel()
        result = user_onboarding_model.add_location(location)
        
        if result["status"] == "success":
            return jsonify({
                "status": "success",
                "message": "Location updated successfully"
            }), 200
        return jsonify({
            "status": "error",
            "message": result["message"]
        }), 400
    except Exception as e:
        logging.error(f"Error in onboarding_location: {e}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while updating location"
        }), 500

@app.route('/api/onboarding/occupation', methods=['POST'])
@jwt_required()
def onboarding_occupation():
    try:
        data = request.get_json()
        occupation = data.get('occupation')
        
        if not occupation:
            return jsonify({
                "status": "error",
                "message": "Occupation is required"
            }), 400
            
        user_onboarding_model = UserOnboardingmodel()
        result = user_onboarding_model.add_occupation(occupation)
        
        if result["status"] == "success":
            return jsonify({
                "status": "success",
                "message": "Occupation updated successfully"
            }), 200
        return jsonify({
            "status": "error",
            "message": result["message"]
        }), 400
    except Exception as e:
        logging.error(f"Error in onboarding_occupation: {e}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while updating occupation"
        }), 500

@app.route('/api/onboarding/interests', methods=['POST'])
@jwt_required()
def onboarding_interests():
    try:
        data = request.get_json()
        interests = data.get('interests')
        logging.info(f"Interests received: {interests}")
        if not interests:
            return jsonify({
                "status": "error",
                "message": "Interests are required"
            }), 400
            
        user_onboarding_model = UserOnboardingmodel()
        result = user_onboarding_model.add_interests(interests)
        
        if result["status"] == "success":
            return jsonify({
                "status": "success",
                "message": "Interests updated successfully"
            }), 200
        return jsonify({
            "status": "error",
            "message": result["message"]
        }), 400
    except Exception as e:
        logging.error(f"Error in onboarding_interests: {e}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while updating interests"
        }), 500

@app.route('/api/onboarding/bio', methods=['POST'])
@jwt_required()
def onboarding_bio():
    try:
        data = request.get_json()
        bio = data.get('bio')
        
        if not bio:
            return jsonify({
                "status": "error",
                "message": "Bio is required"
            }), 400
            
        user_onboarding_model = UserOnboardingmodel()
        result = user_onboarding_model.add_bio(bio)
        
        if result["status"] == "success":
            return jsonify({
                "status": "success",
                "message": "Bio Added successfully"
            }), 200
        return jsonify({
            "status": "error",
            "message": result["message"]
        }), 400
    except Exception as e:
        logging.error(f"Error in onboarding_bio: {e}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while updating bio"
        }), 500

@app.route('/api/onboarding/prompts', methods=['POST'])
@jwt_required()
def onboarding_prompts():
    try:
        data = request.get_json()
        prompts = data.get('prompts')

        if not prompts or not isinstance(prompts, list):
            return jsonify({
                "status": "error",
                "message": "Invalid format. 'prompts' must be a non-empty list."
            }), 400
        
        user_onboarding_model = UserOnboardingmodel()
        result = user_onboarding_model.add_prompt(prompts)

        if result["status"] == "success":
            return jsonify({
                "status": "success",
                "message": "Prompts updated successfully"
            }), 200

        return jsonify({
            "status": "error",
            "message": result["message"]
        }), 400

    except Exception as e:
        logging.error(f"Error in onboarding_prompts: {e}")
        return jsonify({
            "status": "error",
            "message": "An error occurred while updating prompts"
        }), 500
    
@app.route('/api/onboarding/videos', methods=['POST'])
@jwt_required()
def onboarding_videos():
    """
    Handles video upload for user onboarding:
    1. Saves video temporarily
    2. Uploads to Cloudinary
    3. Stores Cloudinary URL in database
    4. Cleans up temporary file
    """
    try:

        video_file = request.files['video']
        
        if video_file.filename == '':
            return {"status": "error", "message": "No selected file"}, 400

        if not allowed_file(video_file.filename):
            return {"status": "error", "message": "File type not allowed"}, 400

        # Secure the filename and create temporary path
        filename = secure_filename(video_file.filename)
        temp_path = os.path.join(UPLOAD_FOLDER, filename)

        try:
            # Save file temporarily
            video_file.save(temp_path)
            logger.info(f"Video saved temporarily at: {temp_path}")

            # Upload to Cloudinary
            cloudinary_response = upload_video(temp_path)
            
            if not cloudinary_response:
                return {"status": "error", "message": "Failed to upload video to Cloudinary"}, 500

            # Get the video URL from Cloudinary response
            video_url = cloudinary_response.get('url')
            
            if not video_url:
                return {"status": "error", "message": "No URL received from Cloudinary"}, 500

            # Save to database
            user_model = UserOnboardingmodel()
            db_response = user_model.add_videos(video_url)

            if db_response.get("status") != "success":
                return {"status": "error", "message": "Failed to save video URL to database"}, 500

            return {
                "status": "success",
                "message": "Video uploaded successfully",
                "data": {
                    "video_url": video_url
                }
            }, 200

        except Exception as e:
            logger.error(f"Error processing video: {str(e)}")
            return {"status": "error", "message": str(e)}, 500

        finally:
            # Clean up temporary file if it exists
            if os.path.exists(temp_path):
                os.remove(temp_path)
                logger.info(f"Temporary file removed: {temp_path}")

    except Exception as e:
        logger.error(f"Error in onboarding_videos: {str(e)}")
        raise CustomException(e, sys)

@app.route('/api/onboarding/images', methods=['POST'])
@jwt_required()
def onboarding_images():
    """
    Handles multiple images upload for user onboarding:
    1. Validates 2-6 images are provided
    2. Saves images temporarily
    3. Uploads to Cloudinary
    4. Stores Cloudinary URLs in database
    5. Cleans up temporary files
    """
    try:
        # Check if 'images' field exists in request
        if 'images' not in request.files:
            return {"status": "error", "message": "No images provided"}, 400

        # Get all images from request
        image_files = request.files.getlist('images')
        
        # Validate number of images (2-6)
        if len(image_files) < 2 or len(image_files) > 6:
            return {"status": "error", "message": "2-6 images are required"}, 400

        # Validate each image
        for image_file in image_files:
            if image_file.filename == '':
                return {"status": "error", "message": "One or more files are empty"}, 400
            if not allowed_file(image_file.filename):
                return {"status": "error", "message": f"File type not allowed: {image_file.filename}"}, 400

        uploaded_urls = []
        temp_paths = []

        try:
            # Process each image
            for image_file in image_files:
                # Secure the filename and create temporary path
                filename = secure_filename(image_file.filename)
                temp_path = os.path.join(UPLOAD_FOLDER, filename)
                temp_paths.append(temp_path)

                # Save file temporarily
                image_file.save(temp_path)
                logger.info(f"Image saved temporarily at: {temp_path}")

                # Upload to Cloudinary
                cloudinary_response = upload_image(temp_path)
                
                if not cloudinary_response:
                    raise Exception(f"Failed to upload image to Cloudinary: {filename}")

                # Get the image URL from Cloudinary response
                image_url = cloudinary_response.get('url')
                
                if not image_url:
                    raise Exception(f"No URL received from Cloudinary for: {filename}")

                uploaded_urls.append(image_url)

            # Save all URLs to database
            user_model = UserOnboardingmodel()
            db_response = user_model.add_images(uploaded_urls)

            if db_response.get("status") != "success":
                raise Exception("Failed to save image URLs to database")

            return {
                "status": "success",
                "message": "All images uploaded successfully",
                "data": {
                    "image_urls": uploaded_urls
                }
            }, 200

        except Exception as e:
            logger.error(f"Error processing images: {str(e)}")
            return {"status": "error", "message": str(e)}, 500

        finally:
            # Clean up all temporary files
            for temp_path in temp_paths:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                    logger.info(f"Temporary file removed: {temp_path}")

    except Exception as e:
        logger.error(f"Error in onboarding_images: {str(e)}")
        raise CustomException(e, sys)
