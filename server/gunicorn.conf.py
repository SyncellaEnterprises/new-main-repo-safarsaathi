import os
import multiprocessing

# Use a fixed number of workers for Render free tier
workers = 2  # Limited workers for free tier
timeout = 120
bind = "0.0.0.0:10000"
worker_class = "sync"
preload_app = True

# Log settings
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"
