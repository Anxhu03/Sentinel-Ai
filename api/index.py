import os
import sys
from pathlib import Path

# Ensure repository root is in sys.path so backend package is importable on Vercel Serverless
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app
handler = app
