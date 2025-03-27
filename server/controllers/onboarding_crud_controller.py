from app import app #, supabase_client, get_db_connection
from flask import jsonify, request
from utils.logger import logging
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from utils.jwt_utils import jwt_blacklist
from model.onboarding_crud_model import UserUpdateDetailmodel
import os

# Generic validation function
def validate_request_data(data, field_name):
    if not data or field_name not in data or not data.get(field_name):
        return jsonify({
            "status": "error",
            "message": f"{field_name.capitalize()} is required"
        }), 400
    return None

# Generic update function
def update_user_field(field_name, update_method):
    try:
        data = request.get_json()
        
        # Validate request data
        validation_error = validate_request_data(data, field_name)
        if validation_error:
            return validation_error
            
        field_value = data.get(field_name)
        
        # Additional validation for age
        if field_name == 'age':
            try:
                age = int(field_value)
                if not (18 <= age <= 120):
                    return jsonify({
                        "status": "error",
                        "message": "Age must be between 18 and 120"
                    }), 400
            except ValueError:
                return jsonify({
                    "status": "error",
                    "message": "Age must be a valid number"
                }), 400
        
        user_model = UserUpdateDetailmodel()
        result = update_method(field_value)
        
        if result.get("status") == "success":
            return jsonify({
                "status": "success",
                "message": f"{field_name.capitalize()} updated successfully"
            }), 200
            
        return jsonify({
            "status": "error",
            "message": result.get("message", f"Failed to update {field_name}")
        }), 400
        
    except Exception as e:
        logging.error(f"Error in update_{field_name}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred while updating {field_name}"
        }), 500

# CRUD Routes
@app.route('/api/update/age', methods=['PATCH'])
@jwt_required()
def update_age():
    return update_user_field('age', UserUpdateDetailmodel().update_age)

@app.route('/api/update/gender', methods=['PATCH'])
@jwt_required()
def update_gender():
    return update_user_field('gender', UserUpdateDetailmodel().update_gender)

@app.route('/api/update/location', methods=['PATCH'])
@jwt_required()
def update_location():
    return update_user_field('location', UserUpdateDetailmodel().update_location)

@app.route('/api/update/occupation', methods=['PATCH'])
@jwt_required()
def update_occupation():
    return update_user_field('occupation', UserUpdateDetailmodel().update_occupation)

@app.route('/api/update/interests', methods=['PATCH'])
@jwt_required()
def update_interests():
    return update_user_field('interests', UserUpdateDetailmodel().update_interests)

@app.route('/api/update/bio', methods=['PATCH'])
@jwt_required()
def update_bio():
    return update_user_field('bio', UserUpdateDetailmodel().update_bio)

@app.route('/api/update/prompts', methods=['PATCH'])
@jwt_required()
def update_prompts():
    return update_user_field('prompts', UserUpdateDetailmodel().update_prompts)

# @app.route('/api/onboarding/gender', methods=['POST'])
# @jwt_required()
# def onboarding_gender():
#     try:
#         data = request.get_json()
#         gender = data.get('gender')
        
#         if not gender:
#             return jsonify({
#                 "status": "error",
#                 "message": "Gender is required"
#             }), 400
            
#         user_onboarding_model = UserOnboardingmodel()
#         result = user_onboarding_model.add_gender(gender)
        
#         if result["status"] == "success":
#             return jsonify({
#                 "status": "success",
#                 "message": "Gender updated successfully"
#             }), 200
#         return jsonify({
#             "status": "error",
#             "message": result["message"]
#         }), 400
#     except Exception as e:
#         logging.error(f"Error in onboarding_gender: {e}")
#         return jsonify({
#             "status": "error",
#             "message": "An error occurred while updating gender"
#         }), 500

# @app.route('/api/onboarding/location', methods=['POST'])
# @jwt_required()
# def onboarding_location():
#     try:
#         data = request.get_json()
#         location = data.get('location')
        
#         if not location:
#             return jsonify({
#                 "status": "error",
#                 "message": "Location is required"
#             }), 400
            
#         user_onboarding_model = UserOnboardingmodel()
#         result = user_onboarding_model.add_location(location)
        
#         if result["status"] == "success":
#             return jsonify({
#                 "status": "success",
#                 "message": "Location updated successfully"
#             }), 200
#         return jsonify({
#             "status": "error",
#             "message": result["message"]
#         }), 400
#     except Exception as e:
#         logging.error(f"Error in onboarding_location: {e}")
#         return jsonify({
#             "status": "error",
#             "message": "An error occurred while updating location"
#         }), 500

# @app.route('/api/onboarding/occupation', methods=['POST'])
# @jwt_required()
# def onboarding_occupation():
#     try:
#         data = request.get_json()
#         occupation = data.get('occupation')
        
#         if not occupation:
#             return jsonify({
#                 "status": "error",
#                 "message": "Occupation is required"
#             }), 400
            
#         user_onboarding_model = UserOnboardingmodel()
#         result = user_onboarding_model.add_occupation(occupation)
        
#         if result["status"] == "success":
#             return jsonify({
#                 "status": "success",
#                 "message": "Occupation updated successfully"
#             }), 200
#         return jsonify({
#             "status": "error",
#             "message": result["message"]
#         }), 400
#     except Exception as e:
#         logging.error(f"Error in onboarding_occupation: {e}")
#         return jsonify({
#             "status": "error",
#             "message": "An error occurred while updating occupation"
#         }), 500

# @app.route('/api/onboarding/interests', methods=['POST'])
# @jwt_required()
# def onboarding_interests():
#     try:
#         data = request.get_json()
#         interests = data.get('interests')
        
#         if not interests:
#             return jsonify({
#                 "status": "error",
#                 "message": "Interests are required"
#             }), 400
            
#         user_onboarding_model = UserOnboardingmodel()
#         result = user_onboarding_model.add_interests(interests)
        
#         if result["status"] == "success":
#             return jsonify({
#                 "status": "success",
#                 "message": "Interests updated successfully"
#             }), 200
#         return jsonify({
#             "status": "error",
#             "message": result["message"]
#         }), 400
#     except Exception as e:
#         logging.error(f"Error in onboarding_interests: {e}")
#         return jsonify({
#             "status": "error",
#             "message": "An error occurred while updating interests"
#         }), 500

# @app.route('/api/onboarding/bio', methods=['POST'])
# @jwt_required()
# def onboarding_bio():
#     try:
#         data = request.get_json()
#         bio = data.get('bio')
        
#         if not bio:
#             return jsonify({
#                 "status": "error",
#                 "message": "Bio is required"
#             }), 400
            
#         user_onboarding_model = UserOnboardingmodel()
#         result = user_onboarding_model.add_bio(bio)
        
#         if result["status"] == "success":
#             return jsonify({
#                 "status": "success",
#                 "message": "Bio Added successfully"
#             }), 200
#         return jsonify({
#             "status": "error",
#             "message": result["message"]
#         }), 400
#     except Exception as e:
#         logging.error(f"Error in onboarding_bio: {e}")
#         return jsonify({
#             "status": "error",
#             "message": "An error occurred while updating bio"
#         }), 500

# @app.route('/api/onboarding/videos', methods=['POST'])
# @jwt_required()
# def onboarding_videos():
#     try:
#         if 'video' not in request.files:
#             return jsonify({
#                 "status": "error",
#                 "message": "No video file provided"
#             }), 400
            
#         video = request.files['video']
#         if not video or video.filename == '':
#             return jsonify({
#                 "status": "error",
#                 "message": "No video selected"
#             }), 400
            
#         # Get current user's username
#         username = get_jwt_identity()
        
#         # Save the video with a unique filename
#         extension = video.filename.split('.')[-1]
#         filename = f"{username}_video.{extension}"
#         video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#         video.save(video_path)

#         # Save the video filename to the database
#         user_onboarding_model = UserOnboardingmodel()
#         result = user_onboarding_model.add_videos(video)
        
#         if result["status"] == "success":
#             return jsonify({
#                 "status": "success",
#                 "message": "Video uploaded successfully",
#                 "video_url": f"/static/uploads/{filename}"
#             }), 200
#         else:
#             # Clean up the uploaded file if database operation failed
#             if os.path.exists(video_path):
#                 os.remove(video_path)
#             return jsonify({
#                 "status": "error",
#                 "message": result["message"]
#             }), 400
            
#     except Exception as e:
#         logging.error(f"Error in onboarding_videos: {e}")
#         return jsonify({
#             "status": "error",
#             "message": "An error occurred while uploading video"
#         }), 500

# @app.route('/api/onboarding/prompts', methods=['POST'])
# @jwt_required()
# def onboarding_prompts():
#     try:
#         data = request.get_json()
#         prompts = data.get('prompts')

#         if not prompts or not isinstance(prompts, list):
#             return jsonify({
#                 "status": "error",
#                 "message": "Invalid format. 'prompts' must be a non-empty list."
#             }), 400
        
#         user_onboarding_model = UserOnboardingmodel()
#         result = user_onboarding_model.add_prompt(prompts)

#         if result["status"] == "success":
#             return jsonify({
#                 "status": "success",
#                 "message": "Prompts updated successfully"
#             }), 200

#         return jsonify({
#             "status": "error",
#             "message": result["message"]
#         }), 400

#     except Exception as e:
#         logging.error(f"Error in onboarding_prompts: {e}")
#         return jsonify({
#             "status": "error",
#             "message": "An error occurred while updating prompts"
#         }), 500