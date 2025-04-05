from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.travel_group_db import TravelGroupDB
import logging
import psycopg2
from config.config import *

def get_user_id_from_identity(current_user):
    """Helper function to extract user ID from token identity in different formats"""
    logging.debug(f"Token identity: {current_user}")
    
    if isinstance(current_user, dict) and 'id' in current_user:
        # Format: {'id': 123, ...}
        return current_user['id']
    elif isinstance(current_user, str):
        # Format: 'username'
        # Connect to database to get user ID from username
        try:
            conn = psycopg2.connect(
                host=POSTGRES_HOST,
                database=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                port=POSTGRES_PORT
            )
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM user_db WHERE username = %s", (current_user,))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if result:
                user_id = result[0]
                logging.info(f"Resolved user ID {user_id} for username {current_user}")
                return user_id
            else:
                logging.error(f"User not found for username: {current_user}")
                raise ValueError(f"User not found for username: {current_user}")
        except Exception as e:
            logging.error(f"Error getting user ID from username: {str(e)}")
            raise ValueError(f"Error getting user ID: {str(e)}")
    else:
        logging.error(f"Unexpected token format: {current_user}")
        raise ValueError("Invalid token format")

@jwt_required()
def create_travel_group():
    """Create a new travel group with the current user as admin"""
    current_user = get_jwt_identity()
    
    try:
        # Get user ID from token identity
        user_id = get_user_id_from_identity(current_user)
        
        data = request.json
        logging.info(f"Creating travel group with data: {data}")
        
        if not data:
            logging.error("No data provided for travel group creation")
            return jsonify({"error": "No data provided"}), 400
        
        # Required field
        name = data.get('name')
        if not name or not name.strip():
            logging.error("Group name is required but was not provided")
            return jsonify({"error": "Group name is required"}), 400
        
        # Optional fields
        description = data.get('description')
        destination = data.get('destination')
        start_date = data.get('startDate')  # Match frontend casing (startDate not start_date)
        end_date = data.get('endDate')      # Match frontend casing (endDate not end_date)
        
        logging.info(f"Processed group data: name={name}, description={description}, destination={destination}, start_date={start_date}, end_date={end_date}")
        
        # Create the group with the current user as admin
        logging.info(f"Creating group with user_id={user_id} as admin")
        
        try:
            group_id = TravelGroupDB.create_travel_group(
                name=name,
                description=description,
                destination=destination,
                start_date=start_date,
                end_date=end_date,
                created_by=user_id
            )
            logging.info(f"Successfully created group with ID: {group_id}")
        except Exception as db_error:
            logging.error(f"Database error creating travel group: {str(db_error)}")
            return jsonify({"error": f"Database error: {str(db_error)}"}), 500
        
        # Add specified members to the group
        member_ids = data.get('selectedMembers', [])  # Match frontend casing (selectedMembers not members)
        logging.info(f"Adding {len(member_ids)} members to group: {member_ids}")
        
        added_members = []
        for member_id in member_ids:
            try:
                if TravelGroupDB.add_member_to_group(group_id, int(member_id)):
                    added_members.append(int(member_id))
                    logging.info(f"Added member {member_id} to group {group_id}")
                else:
                    logging.warning(f"Failed to add member {member_id} to group {group_id}")
            except (ValueError, TypeError) as e:
                logging.warning(f"Invalid member ID: {member_id} - {str(e)}")
                continue
        
        # Get the created group details
        group = TravelGroupDB.get_travel_group_details(group_id)
        logging.info(f"Retrieved group details for ID {group_id}: {group}")
        
        return jsonify({
            "success": True,
            "message": "Travel group created successfully",
            "group": group,
            "added_members": added_members
        }), 201
    
    except Exception as e:
        logging.error(f"Error creating travel group: {str(e)}")
        return jsonify({"error": f"Failed to create travel group: {str(e)}"}), 500

@jwt_required()
def get_user_travel_groups():
    """Get all travel groups for the current user"""
    current_user = get_jwt_identity()
    
    try:
        # Get user ID from token identity
        user_id = get_user_id_from_identity(current_user)
        
        groups = TravelGroupDB.get_user_travel_groups(user_id)
        
        return jsonify({
            "success": True,
            "groups": groups
        }), 200
    
    except Exception as e:
        logging.error(f"Error getting user travel groups: {str(e)}")
        return jsonify({"error": "Failed to get travel groups"}), 500

@jwt_required()
def get_travel_group(group_id):
    """Get details for a specific travel group"""
    current_user = get_jwt_identity()
    
    try:
        # Get user ID from token identity
        user_id = get_user_id_from_identity(current_user)
        
        # First check if user is a member of this group
        user_groups = TravelGroupDB.get_user_travel_groups(user_id)
        if not any(g['group_id'] == int(group_id) for g in user_groups):
            return jsonify({"error": "You are not a member of this group"}), 403
        
        # Get group details
        group = TravelGroupDB.get_travel_group_details(int(group_id))
        if not group:
            return jsonify({"error": "Group not found"}), 404
        
        return jsonify({
            "success": True,
            "group": group
        }), 200
    
    except Exception as e:
        logging.error(f"Error getting travel group details: {str(e)}")
        return jsonify({"error": "Failed to get travel group details"}), 500

@jwt_required()
def add_member_to_group(group_id):
    """Add a member to a travel group"""
    current_user = get_jwt_identity()
    
    try:
        # Get user ID from token identity
        user_id = get_user_id_from_identity(current_user)
        
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        member_id = data.get('user_id')
        
        if not member_id:
            return jsonify({"error": "Member ID is required"}), 400
        
        # Check if current user is an admin of the group
        group = TravelGroupDB.get_travel_group_details(int(group_id))
        if not group:
            return jsonify({"error": "Group not found"}), 404
        
        is_admin = False
        for member in group['members']:
            if member['user_id'] == user_id and member['is_admin']:
                is_admin = True
                break
        
        if not is_admin:
            return jsonify({"error": "Only group admins can add members"}), 403
        
        # Add the member
        if TravelGroupDB.add_member_to_group(int(group_id), int(member_id)):
            return jsonify({
                "success": True,
                "message": "Member added to group successfully"
            }), 200
        else:
            return jsonify({"error": "Failed to add member to group"}), 400
    
    except Exception as e:
        logging.error(f"Error adding member to group: {str(e)}")
        return jsonify({"error": "Failed to add member to group"}), 500

@jwt_required()
def remove_member_from_group(group_id, member_id):
    """Remove a member from a travel group"""
    current_user = get_jwt_identity()
    
    try:
        # Get user ID from token identity
        user_id = get_user_id_from_identity(current_user)
        
        # Check if current user is an admin of the group or removing themselves
        group = TravelGroupDB.get_travel_group_details(int(group_id))
        if not group:
            return jsonify({"error": "Group not found"}), 404
        
        is_admin = False
        for member in group['members']:
            if member['user_id'] == user_id and member['is_admin']:
                is_admin = True
                break
        
        # Allow if user is admin or removing themselves
        if not is_admin and user_id != int(member_id):
            return jsonify({"error": "Only group admins can remove other members"}), 403
        
        # Check if target is the last admin
        if int(member_id) == user_id and is_admin:
            # Count admins
            admin_count = sum(1 for m in group['members'] if m['is_admin'])
            if admin_count <= 1:
                return jsonify({"error": "Cannot remove the last admin from the group"}), 400
        
        # Remove the member
        if TravelGroupDB.remove_member_from_group(int(group_id), int(member_id)):
            return jsonify({
                "success": True,
                "message": "Member removed from group successfully"
            }), 200
        else:
            return jsonify({"error": "Failed to remove member from group"}), 400
    
    except Exception as e:
        logging.error(f"Error removing member from group: {str(e)}")
        return jsonify({"error": "Failed to remove member from group"}), 500

@jwt_required()
def get_group_messages(group_id):
    """Get messages for a specific travel group"""
    current_user = get_jwt_identity()
    
    try:
        # Get user ID from token identity
        user_id = get_user_id_from_identity(current_user)
        
        # Check if user is a member of this group
        user_groups = TravelGroupDB.get_user_travel_groups(user_id)
        if not any(g['group_id'] == int(group_id) for g in user_groups):
            return jsonify({"error": "You are not a member of this group"}), 403
        
        # Get the messages
        messages = TravelGroupDB.get_group_messages(int(group_id))
        
        return jsonify({
            "success": True,
            "messages": messages
        }), 200
    
    except Exception as e:
        logging.error(f"Error getting group messages: {str(e)}")
        return jsonify({"error": "Failed to get group messages"}), 500

@jwt_required()
def send_group_message(group_id):
    """Send a message to a travel group"""
    current_user = get_jwt_identity()
    
    try:
        # Get user ID from token identity
        user_id = get_user_id_from_identity(current_user)
        
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        content = data.get('content')
        if not content or not content.strip():
            return jsonify({"error": "Message content is required"}), 400
        
        message_type = data.get('type', 'text')
        
        # Send the message
        message = TravelGroupDB.send_group_message(
            group_id=int(group_id),
            sender_id=user_id,
            content=content,
            message_type=message_type
        )
        
        if message:
            return jsonify({
                "success": True,
                "message": "Message sent successfully",
                "message_data": message
            }), 201
        else:
            return jsonify({"error": "Failed to send message"}), 400
    
    except Exception as e:
        logging.error(f"Error sending group message: {str(e)}")
        return jsonify({"error": "Failed to send message"}), 500 