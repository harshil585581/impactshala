"""Pytest configuration — add project root to sys.path."""
import sys
import os

# Ensure the project root is importable so `packages.*` and `apps.*` resolve.
sys.path.insert(0, os.path.dirname(__file__))
