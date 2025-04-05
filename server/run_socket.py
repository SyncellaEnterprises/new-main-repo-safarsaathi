"""
Run the socket server on port 5001.
This runs only the Socket.IO server for real-time chat.
"""
from model.socket_chat import socketio, app, SOCKET_PORT

if __name__ == "__main__":
    print(f"Starting socket server on port {SOCKET_PORT}...")
    socketio.run(app, host='0.0.0.0', port=SOCKET_PORT, debug=True) 