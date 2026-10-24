"""Application entry point.

Run with: uvicorn main:app --reload (from the backend/ directory)
"""

from app.main import app

__all__ = ["app"]
