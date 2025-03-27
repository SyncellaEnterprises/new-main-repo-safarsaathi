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
