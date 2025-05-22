# Use official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy all files from server folder into the container
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Command to run the app
CMD ["python", "run_unified.py"]
