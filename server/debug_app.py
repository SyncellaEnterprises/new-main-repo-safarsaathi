from flask import Flask
import importlib
import sys
import inspect

# Create an app for debugging only
debug_app = Flask(__name__)

# Register a simple test route
@debug_app.route('/debug', methods=['GET'])
def debug_route():
    return "Debug route works"

# Print all currently registered routes
print("\nInitial routes in debug_app:")
for rule in debug_app.url_map.iter_rules():
    print(f" - {rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")

# Try importing controllers one by one to see which one causes the conflict
try:
    # Import config
    from config.config import *
    print("\nImported config")
    
    # Set up JWT
    from flask_jwt_extended import JWTManager
    debug_app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
    jwt = JWTManager(debug_app)
    print("Set up JWT")
    
    # Import controllers one by one
    with debug_app.app_context():
        # First, try just the chat_controller
        print("\nImporting chat_controller...")
        from controllers.chat_controller import get_chats, get_chat_messages, get_matches
        
        # Print routes after importing
        print("\nRoutes after importing chat_controller:")
        for rule in debug_app.url_map.iter_rules():
            print(f" - {rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")
        
        # Now try other controllers
        from controllers.user_auth_controller import *
        print("\nImported user_auth_controller")
        for rule in debug_app.url_map.iter_rules():
            if rule.endpoint not in ['static', 'debug_route']:
                print(f" - {rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")
        
        from controllers.user_onboarding_controller import *
        print("\nImported user_onboarding_controller")
        for rule in debug_app.url_map.iter_rules():
            if rule.endpoint not in ['static', 'debug_route']:
                print(f" - {rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")
                
        # Continue with other imports and check after each one
        print("\nTrying to import socket_chat...")
        try:
            from model.socket_chat import socket_server_info
            print("Imported socket_chat successfully")
        except Exception as e:
            print(f"Error importing socket_chat: {str(e)}")
            
except Exception as e:
    print(f"Error during imports: {str(e)}")
    import traceback
    traceback.print_exc()

# Final check of all routes
print("\nFinal routes in debug_app:")
for rule in debug_app.url_map.iter_rules():
    print(f" - {rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")

if __name__ == '__main__':
    print("\nDebug script completed. Not starting the server.") 