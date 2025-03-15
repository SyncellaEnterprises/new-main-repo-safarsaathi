import logging
import os
from datetime import datetime

# Define a constant log file name instead of timestamp-based name
LOG_FILE = "app.log"

# Create logs directory if it doesn't exist
logs_path = os.path.join(os.getcwd(), "logs")
os.makedirs(logs_path, exist_ok=True)

# Get the full log file path
LOG_FILE_PATH = os.path.join(logs_path, LOG_FILE)

# Clear previous logs and add session start marker
with open(LOG_FILE_PATH, 'w') as f:
    f.write(f"=== New Session Started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===\n")

logging.basicConfig(
    filename=LOG_FILE_PATH,
    format="[ %(asctime)s ] %(lineno)d %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
    # Add filemode='a' to append logs within the same session
    filemode='a'
)
