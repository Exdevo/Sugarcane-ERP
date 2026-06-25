import os
import logging
from logging.handlers import RotatingFileHandler

# Ensure a dedicated logs directory exists next to this file
log_dir = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(log_dir, exist_ok=True)

log_path = os.path.join(log_dir, "backend.log")

# Configure a rotating handler (5 MB per file, keep 3 backups)
handler = RotatingFileHandler(log_path, maxBytes=5 * 1024 * 1024, backupCount=3)
formatter = logging.Formatter(
    "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    "%Y-%m-%d %H:%M:%S"
)
handler.setFormatter(formatter)

# Create a logger for the whole backend
logger = logging.getLogger("sugarcane_backend")
logger.setLevel(logging.INFO)
logger.addHandler(handler)
# Avoid double logging if the root logger has handlers
logger.propagate = False
