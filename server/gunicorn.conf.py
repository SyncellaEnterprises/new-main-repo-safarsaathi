import os
import multiprocessing

workers = multiprocessing.cpu_count() * 2 + 1
timeout = 120
bind = "0.0.0.0:10000"
worker_class = "gevent"
preload_app = True

# Log settings
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"
