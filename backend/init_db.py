#!/usr/bin/env python3
"""
Simple database initialization script.
Creates all tables based on models.
"""

from database import engine, Base
from models import User, UserPreference, QuizAttempt, QuestionAnswer, Leaderboard

def init_database():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
    print("\nTables created:")
    print("  - users")
    print("  - user_preferences")
    print("  - quiz_attempts")
    print("  - question_answers")
    print("  - leaderboards")

if __name__ == "__main__":
    init_database()
