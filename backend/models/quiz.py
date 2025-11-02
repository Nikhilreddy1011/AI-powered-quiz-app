from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .user import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String, nullable=False)  # User-entered topic name
    
    # Quiz Configuration
    difficulty = Column(String, nullable=False)  # easy, medium, hard
    total_questions = Column(Integer, nullable=False)
    time_limit = Column(Integer, nullable=True)  # in seconds, null = no limit
    
    # Quiz State
    status = Column(String, default="ongoing")  # ongoing, completed, abandoned
    current_question_index = Column(Integer, default=0)
    questions_data = Column(JSON, nullable=True)  # Stores all questions and options (optional for completed quizzes)
    user_answers = Column(JSON, default={})  # {question_index: selected_answer(s)}
    
    # Scoring
    score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    correct_answers = Column(Integer, default=0)
    incorrect_answers = Column(Integer, default=0)
    
    # Timing
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    time_taken = Column(Integer, nullable=True)  # in seconds
    
    # Relationships
    user = relationship("User", back_populates="quiz_attempts")
    answers = relationship("QuestionAnswer", back_populates="quiz_attempt", cascade="all, delete-orphan")


class QuestionAnswer(Base):
    __tablename__ = "question_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_index = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    user_answer = Column(JSON, nullable=True)  # Can be single or multiple answers
    correct_answer = Column(JSON, nullable=False)
    is_correct = Column(Boolean, default=False)
    explanation = Column(Text, nullable=True)
    reference_links = Column(JSON, default=[])  # List of helpful learning resources
    time_spent = Column(Integer, nullable=True)  # Time spent on this question in seconds
    
    # Relationships
    quiz_attempt = relationship("QuizAttempt", back_populates="answers")


class Leaderboard(Base):
    __tablename__ = "leaderboard"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_quizzes = Column(Integer, default=0)
    total_score = Column(Float, default=0.0)
    average_percentage = Column(Float, default=0.0)
    rank = Column(Integer, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
