from flask import Flask, jsonify

# Create test app
test_app = Flask(__name__)

@test_app.route('/test', methods=['GET'])
def test_route():
    return jsonify({"status": "success", "message": "Test route working"})

if __name__ == '__main__':
    test_app.run(host='0.0.0.0', port=5005, debug=True) 