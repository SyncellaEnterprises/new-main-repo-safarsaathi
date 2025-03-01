from app import app
from flask import jsonify
import json
import os

# Load the JSON file
def load_districts_data():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(current_dir, '../database/indian_districts.json')
        with open(json_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading JSON file: {e}")
        return None

# Get all states
@app.route('/api/states', methods=['GET'])
def get_states():
    try:
        districts_data = load_districts_data()
        if districts_data:
            states = list(districts_data.keys())
            return jsonify({
                "status": "success",
                "data": states
            }), 200
        return jsonify({
            "status": "error",
            "message": "Unable to load data"
        }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Get districts for a specific state
@app.route('/api/districts/<state>', methods=['GET'])
def get_districts(state):
    try:
        districts_data = load_districts_data()
        if districts_data and state in districts_data:
            return jsonify({
                "status": "success",
                "state": state,
                "districts": districts_data[state]
            }), 200
        return jsonify({
            "status": "error",
            "message": "State not found"
        }), 404
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Get all states with their districts
@app.route('/api/all-districts', methods=['GET'])
def get_all_districts():
    try:
        districts_data = load_districts_data()
        if districts_data:
            return jsonify({
                "status": "success",
                "data": districts_data
            }), 200
        return jsonify({
            "status": "error",
            "message": "Unable to load data"
        }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500