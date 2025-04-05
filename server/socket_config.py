# Socket Server Configuration
SOCKET_PORT = 5001
SOCKET_HOST = '10.0.2.2'  # Host for Android emulator to access local machine

def get_socket_config():
    """
    Returns socket server configuration dictionary.
    This function can be called by both the main API and the socket server.
    """
    return {
        'socket_port': SOCKET_PORT,
        'socket_host': SOCKET_HOST
    } 