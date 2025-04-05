import subprocess
import threading
import os
import time
import signal
import sys
import requests
import socket

def check_port_in_use(port):
    """Check if a port is already in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def run_main_api():
    """Run the main API server on port 5000"""
    # Check if port is already in use
    if check_port_in_use(5000):
        print("Warning: Port 5000 is already in use. API server may not start properly.")
    
    print("Starting main API server on port 5000...")
    return subprocess.Popen(["python", "run_api.py"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

def run_socket_server():
    """Run the socket server on port 5001"""
    # Check if port is already in use
    if check_port_in_use(5001):
        print("Warning: Port 5001 is already in use. Socket server may not start properly.")
    
    print("Starting socket server on port 5001...")
    return subprocess.Popen(["python", "run_socket.py"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

def stream_output(process, prefix):
    """Stream and print the output of a process with a prefix"""
    for line in iter(process.stdout.readline, ''):
        if not line:
            break
        print(f"{prefix} | {line.strip()}")

def verify_servers_running():
    """Verify that the servers are actually running and reachable"""
    # Give servers more time to start
    print("\nWaiting for servers to initialize (10 seconds)...")
    time.sleep(10)
    
    # Check API server
    print("\nVerifying API server...")
    api_running = False
    for attempt in range(3):
        try:
            response = requests.get("http://localhost:5000/api/socket/info", timeout=5)
            if response.status_code == 200:
                print("✅ API server is running and socket info endpoint is accessible")
                print(f"Socket info: {response.json()}")
                api_running = True
                break
            else:
                print(f"❌ API server returned status code {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Attempt {attempt+1}/3 failed: {str(e)}")
            time.sleep(2)  # Wait before retrying
    
    if not api_running:
        print("❌ Could not verify API server after multiple attempts")
    
    # Check Socket server
    print("\nVerifying Socket server...")
    socket_running = False
    for attempt in range(3):
        try:
            # Just check if the port is open
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(5)
                result = s.connect_ex(('localhost', 5001))
                if result == 0:
                    print("✅ Socket server port is open")
                    socket_running = True
                    break
                else:
                    print(f"❌ Socket server port is not accessible, error code: {result}")
        except Exception as e:
            print(f"❌ Attempt {attempt+1}/3 failed: {str(e)}")
            time.sleep(2)  # Wait before retrying
    
    if not socket_running:
        print("❌ Could not verify Socket server after multiple attempts")
        
    return api_running and socket_running

def handle_shutdown(api_process, socket_process):
    """Handle graceful shutdown of both servers"""
    def signal_handler(sig, frame):
        print("\nShutting down servers...")
        api_process.terminate()
        socket_process.terminate()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

if __name__ == "__main__":
    # Start both servers using the dedicated runner scripts
    api_process = run_main_api()
    time.sleep(1)  # Small delay to allow the main API to initialize first
    socket_process = run_socket_server()
    
    # Set up signal handlers for graceful shutdown
    handle_shutdown(api_process, socket_process)
    
    # Verify that the servers are running
    servers_verified = verify_servers_running()
    
    if not servers_verified:
        print("\n⚠️ Warning: One or both servers could not be verified.")
        print("   However, we'll continue running in case there was just a temporary issue.")
    else:
        print("\n✅ Both servers are up and running!")
    
    # Create threads to stream output from both processes
    api_thread = threading.Thread(target=stream_output, args=(api_process, "API"), daemon=True)
    socket_thread = threading.Thread(target=stream_output, args=(socket_process, "SOCKET"), daemon=True)
    
    # Start the output threads
    api_thread.start()
    socket_thread.start()
    
    # Wait for processes to complete (they won't unless terminated)
    try:
        api_process.wait()
        socket_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        api_process.terminate()
        socket_process.terminate() 