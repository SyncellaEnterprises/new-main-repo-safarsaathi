# Use official Python image
FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /app

# Copy contents of server folder into the container's /app directory
COPY server/ .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Start the app
CMD ["python", "run_unified.py"]
