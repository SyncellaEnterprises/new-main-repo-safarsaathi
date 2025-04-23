"""
SOS Controller for handling emergency alerts
"""

import json
import logging
from datetime import datetime
from flask import jsonify, request, g
import psycopg2
from psycopg2.extras import RealDictCursor
from database.db_connection import get_db_connection
from utils.auth import jwt_required

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@jwt_required
def create_sos_alert():
    """
    Create a new SOS alert from a user in distress
    Requires JWT authentication
    """
    try:
        # Get the user ID from JWT token
        user_id = g.user_id
        
        # Extract data from request
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        # Required fields validation
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if not latitude or not longitude:
            return jsonify({"success": False, "error": "Latitude and longitude are required"}), 400
            
        # Optional fields
        accuracy = data.get('accuracy')
        location_text = data.get('location_text')
        notes = data.get('notes', 'Emergency alert triggered by user')
        
        # Get user's emergency contacts if available
        emergency_contacts = get_user_emergency_contacts(user_id)
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get user details to include in the alert
        cursor.execute("""
            SELECT u.username, p.gender, p.age 
            FROM user_db u
            LEFT JOIN user_profile p ON u.id = p.user_id
            WHERE u.id = %s
        """, (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        # Insert SOS alert into database
        cursor.execute("""
            INSERT INTO sos_alerts 
            (user_id, latitude, longitude, accuracy, location_text, emergency_contacts, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING alert_id, created_at
        """, (
            user_id, 
            latitude, 
            longitude, 
            accuracy,
            location_text,
            json.dumps(emergency_contacts) if emergency_contacts else None,
            notes
        ))
        
        result = cursor.fetchone()
        conn.commit()
        
        # Format response data
        response_data = {
            "success": True,
            "message": "SOS alert created successfully",
            "alert_id": result['alert_id'],
            "created_at": result['created_at'].isoformat(),
            "user_details": {
                "username": user_data['username'],
                "gender": user_data['gender'],
                "age": user_data['age']
            }
        }
        
        # Log the SOS alert for monitoring
        logger.info(f"SOS ALERT: User {user_data['username']} (ID: {user_id}) triggered an emergency alert at coordinates: {latitude}, {longitude}")
        
        # In a real app, you would trigger notifications to emergency services and contacts here
        # send_emergency_notifications(user_id, result['alert_id'], emergency_contacts)
        
        cursor.close()
        conn.close()
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error creating SOS alert: {str(e)}")
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

@jwt_required
def update_sos_alert_status():
    """
    Update the status of an SOS alert (resolve or cancel)
    Requires JWT authentication
    """
    try:
        # Get the user ID from JWT token
        user_id = g.user_id
        
        # Extract data from request
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        alert_id = data.get('alert_id')
        status = data.get('status')
        
        if not alert_id or not status:
            return jsonify({"success": False, "error": "Alert ID and status are required"}), 400
            
        # Validate status value
        if status not in ['resolved', 'cancelled']:
            return jsonify({"success": False, "error": "Status must be either 'resolved' or 'cancelled'"}), 400
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if alert exists and belongs to user
        cursor.execute("""
            SELECT * FROM sos_alerts
            WHERE alert_id = %s AND user_id = %s
        """, (alert_id, user_id))
        
        alert = cursor.fetchone()
        
        if not alert:
            return jsonify({"success": False, "error": "Alert not found or unauthorized"}), 404
            
        # Update alert status
        cursor.execute("""
            UPDATE sos_alerts
            SET status = %s, resolved_at = %s
            WHERE alert_id = %s
            RETURNING alert_id, status, resolved_at
        """, (status, datetime.now(), alert_id))
        
        result = cursor.fetchone()
        conn.commit()
        
        logger.info(f"SOS Alert {alert_id} status updated to {status} by user {user_id}")
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": f"SOS alert {status} successfully",
            "alert_id": result['alert_id'],
            "status": result['status'],
            "resolved_at": result['resolved_at'].isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating SOS alert: {str(e)}")
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

@jwt_required
def get_active_sos_alerts():
    """
    Get all active SOS alerts for a user
    Requires JWT authentication
    """
    try:
        # Get the user ID from JWT token
        user_id = g.user_id
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get active alerts for user
        cursor.execute("""
            SELECT * FROM sos_alerts
            WHERE user_id = %s AND status = 'active'
            ORDER BY created_at DESC
        """, (user_id,))
        
        alerts = cursor.fetchall()
        
        # Convert datetime objects to ISO format for JSON serialization
        for alert in alerts:
            alert['created_at'] = alert['created_at'].isoformat()
            if alert['resolved_at']:
                alert['resolved_at'] = alert['resolved_at'].isoformat()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "active_alerts": alerts
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching active SOS alerts: {str(e)}")
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

def get_user_emergency_contacts(user_id):
    """
    Helper function to get a user's emergency contacts
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT * FROM emergency_contacts
            WHERE user_id = %s
            ORDER BY is_primary DESC
        """, (user_id,))
        
        contacts = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return contacts
        
    except Exception as e:
        logger.error(f"Error fetching emergency contacts: {str(e)}")
        return None

@jwt_required
def add_emergency_contact():
    """
    Add a new emergency contact for a user
    Requires JWT authentication
    """
    try:
        # Get the user ID from JWT token
        user_id = g.user_id
        
        # Extract data from request
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        name = data.get('name')
        phone_number = data.get('phone_number')
        
        if not name or not phone_number:
            return jsonify({"success": False, "error": "Name and phone number are required"}), 400
            
        # Optional fields
        relationship = data.get('relationship')
        is_primary = data.get('is_primary', False)
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # If this is a primary contact, unset any existing primary contacts
        if is_primary:
            cursor.execute("""
                UPDATE emergency_contacts
                SET is_primary = FALSE
                WHERE user_id = %s AND is_primary = TRUE
            """, (user_id,))
        
        # Insert emergency contact
        cursor.execute("""
            INSERT INTO emergency_contacts
            (user_id, name, phone_number, relationship, is_primary)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING contact_id, created_at
        """, (user_id, name, phone_number, relationship, is_primary))
        
        result = cursor.fetchone()
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Emergency contact added successfully",
            "contact_id": result['contact_id'],
            "created_at": result['created_at'].isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error adding emergency contact: {str(e)}")
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

@jwt_required
def get_emergency_contacts():
    """
    Get all emergency contacts for a user
    Requires JWT authentication
    """
    try:
        # Get the user ID from JWT token
        user_id = g.user_id
        
        # Get emergency contacts
        contacts = get_user_emergency_contacts(user_id)
        
        # Convert datetime objects to ISO format for JSON serialization
        for contact in contacts:
            contact['created_at'] = contact['created_at'].isoformat()
        
        return jsonify({
            "success": True,
            "contacts": contacts
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching emergency contacts: {str(e)}")
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500 