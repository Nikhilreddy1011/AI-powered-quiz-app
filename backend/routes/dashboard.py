from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import get_db
from models import QuizAttempt, User
from auth_utils import verify_token
from typing import Dict, Any
from datetime import datetime

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def get_current_user(db: Session, token: str):
    """Helper function to get current user from token"""
    username = verify_token(token)
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/stats")
async def get_dashboard_stats(
    token: str,
    db: Session = Depends(get_db)
):
    """Get user dashboard statistics"""
    user = get_current_user(db, token)
    
    # Total completed quizzes
    total_quizzes = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.status == "completed"
    ).count()
    
    # Ongoing quizzes
    ongoing_quizzes = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.status == "ongoing"
    ).count()
    
    # Get completed quizzes for calculations
    completed = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.status == "completed"
    ).all()
    
    # Calculate statistics
    avg_score = sum(q.percentage for q in completed) / len(completed) if completed else 0
    total_time_spent = sum(q.time_taken or 0 for q in completed)
    total_correct = sum(q.correct_answers for q in completed)
    total_questions = sum(q.total_questions for q in completed)
    
    # Best and lowest score
    best_score = max((q.percentage for q in completed), default=0)
    lowest_score = min((q.percentage for q in completed), default=0)
    
    return {
        "total_quizzes": total_quizzes,
        "ongoing_quizzes": ongoing_quizzes,
        "average_score": round(avg_score, 2),
        "best_score": round(best_score, 2),
        "lowest_score": round(lowest_score, 2),
        "total_time_spent": total_time_spent,
        "total_correct": total_correct,
        "total_questions": total_questions,
        "accuracy": round((total_correct / total_questions * 100) if total_questions > 0 else 0, 2)
    }

@router.get("/history")
async def get_quiz_history(
    token: str,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get user quiz history"""
    user = get_current_user(db, token)
    
    quizzes = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.status == "completed"
    ).order_by(desc(QuizAttempt.completed_at)).limit(limit).offset(offset).all()
    
    return [
        {
            "id": quiz.id,
            "subcategory": quiz.topic,
            "category": "General",
            "category_icon": "📚",
            "difficulty": quiz.difficulty,
            "score": quiz.score,
            "percentage": round(quiz.percentage, 2),
            "correct_answers": quiz.correct_answers,
            "total_questions": quiz.total_questions,
            "time_taken": quiz.time_taken,
            "started_at": quiz.started_at.isoformat() if quiz.started_at else None,
            "completed_at": quiz.completed_at.isoformat() if quiz.completed_at else None
        }
        for quiz in quizzes
    ]

@router.get("/ongoing")
async def get_ongoing_quizzes(
    token: str,
    db: Session = Depends(get_db)
):
    """Get user's ongoing quizzes"""
    user = get_current_user(db, token)
    
    quizzes = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.status == "ongoing"
    ).order_by(desc(QuizAttempt.started_at)).all()
    
    return [
        {
            "id": quiz.id,
            "subcategory": quiz.topic,
            "category": "General",
            "category_icon": "📚",
            "difficulty": quiz.difficulty,
            "total_questions": quiz.total_questions,
            "current_question": quiz.current_question_index + 1,
            "progress_percentage": round((quiz.current_question_index + 1) / quiz.total_questions * 100, 1),
            "started_at": quiz.started_at.isoformat() if quiz.started_at else None
        }
        for quiz in quizzes
    ]

@router.get("/quiz/{quiz_id}")
async def get_quiz_details(
    quiz_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """Get detailed results for a specific quiz"""
    user = get_current_user(db, token)
    
    quiz = db.query(QuizAttempt).filter(
        QuizAttempt.id == quiz_id,
        QuizAttempt.user_id == user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return {
        "id": quiz.id,
        "subcategory": quiz.topic,
        "category": "General",
        "difficulty": quiz.difficulty,
        "status": quiz.status,
        "score": quiz.score,
        "percentage": round(quiz.percentage, 2),
        "correct_answers": quiz.correct_answers,
        "incorrect_answers": quiz.incorrect_answers,
        "total_questions": quiz.total_questions,
        "time_taken": quiz.time_taken,
        "questions": quiz.questions_data,
        "user_answers": quiz.user_answers,
        "started_at": quiz.started_at.isoformat() if quiz.started_at else None,
        "completed_at": quiz.completed_at.isoformat() if quiz.completed_at else None
    }

@router.get("/performance-by-category")
async def get_performance_by_category(
    token: str,
    db: Session = Depends(get_db)
):
    """Get user performance breakdown by topic"""
    user = get_current_user(db, token)
    
    # Get all completed quizzes
    quizzes = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.status == "completed"
    ).all()
    
    # Group by topic
    topic_stats = {}
    for quiz in quizzes:
        topic_name = quiz.topic
        if topic_name not in topic_stats:
            topic_stats[topic_name] = {
                "category": topic_name,
                "icon": "📚",
                "total_quizzes": 0,
                "total_score": 0,
                "total_questions": 0,
                "total_correct": 0
            }
        
        topic_stats[topic_name]["total_quizzes"] += 1
        topic_stats[topic_name]["total_score"] += quiz.percentage
        topic_stats[topic_name]["total_questions"] += quiz.total_questions
        topic_stats[topic_name]["total_correct"] += quiz.correct_answers
    
    # Calculate averages
    result = []
    for topic_name, stats in topic_stats.items():
        result.append({
            "category": stats["category"],
            "icon": stats["icon"],
            "total_quizzes": stats["total_quizzes"],
            "average_score": round(stats["total_score"] / stats["total_quizzes"], 2),
            "accuracy": round((stats["total_correct"] / stats["total_questions"] * 100) if stats["total_questions"] > 0 else 0, 2)
        })
    
    return sorted(result, key=lambda x: x["average_score"], reverse=True)

@router.delete("/quiz/{quiz_id}")
async def delete_quiz_attempt(
    quiz_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """Delete a quiz attempt (for ongoing quizzes)"""
    user = get_current_user(db, token)
    
    quiz = db.query(QuizAttempt).filter(
        QuizAttempt.id == quiz_id,
        QuizAttempt.user_id == user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()
    
    return {"message": "Quiz deleted successfully"}

@router.post("/save-quiz")
async def save_quiz_result(
    token: str,
    quiz_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Save quiz results after completion"""
    try:
        user = get_current_user(db, token)
        
        # Get topic name
        topic_name = quiz_data.get("subcategory_name", quiz_data.get("topic", "Custom Quiz"))
        quiz_id = quiz_data.get("quiz_id")
        
        print(f"Saving quiz for user {user.username}: {topic_name}, quiz_id: {quiz_id}")
        
        # Check if this is updating an existing quiz (from resume)
        if quiz_id:
            # Update existing ongoing quiz
            quiz_attempt = db.query(QuizAttempt).filter(
                QuizAttempt.id == quiz_id,
                QuizAttempt.user_id == user.id
            ).first()
            
            if quiz_attempt:
                # Update to completed status
                quiz_attempt.correct_answers = quiz_data.get("correct_answers", 0)
                quiz_attempt.incorrect_answers = quiz_data.get("total_questions", 0) - quiz_data.get("correct_answers", 0)
                quiz_attempt.percentage = quiz_data.get("percentage", 0)
                quiz_attempt.score = quiz_data.get("correct_answers", 0)
                quiz_attempt.time_taken = quiz_data.get("time_taken", 0)
                quiz_attempt.completed_at = datetime.utcnow()
                quiz_attempt.status = "completed"
                
                db.commit()
                db.refresh(quiz_attempt)
                
                print(f"Quiz updated successfully with ID: {quiz_attempt.id}")
                
                return {
                    "message": "Quiz updated successfully",
                    "quiz_id": quiz_attempt.id
                }
            else:
                raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Create new quiz attempt (fresh quiz, not resumed)
        quiz_attempt = QuizAttempt(
            user_id=user.id,
            topic=topic_name,
            difficulty=quiz_data.get("difficulty", "medium"),
            total_questions=quiz_data.get("total_questions", 0),
            correct_answers=quiz_data.get("correct_answers", 0),
            incorrect_answers=quiz_data.get("total_questions", 0) - quiz_data.get("correct_answers", 0),
            percentage=quiz_data.get("percentage", 0),
            score=quiz_data.get("correct_answers", 0),
            time_taken=quiz_data.get("time_taken", 0),
            completed_at=datetime.utcnow(),
            questions_data=None,  # Not storing full questions for completed quizzes
            user_answers={},  # Not storing individual answers for completed quizzes
            status="completed"
        )
        
        db.add(quiz_attempt)
        db.commit()
        db.refresh(quiz_attempt)
        
        print(f"Quiz saved successfully with ID: {quiz_attempt.id}")
        
        return {
            "message": "Quiz saved successfully",
            "quiz_id": quiz_attempt.id
        }
    except Exception as e:
        print(f"Error saving quiz: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save quiz: {str(e)}")

@router.post("/save-state")
async def save_quiz_state(
    token: str,
    quiz_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Save ongoing quiz state for resume functionality"""
    try:
        user = get_current_user(db, token)
        quiz_id = quiz_data.get("quiz_id")
        
        if quiz_id:
            # Update existing quiz
            quiz = db.query(QuizAttempt).filter(
                QuizAttempt.id == quiz_id,
                QuizAttempt.user_id == user.id
            ).first()
            
            if not quiz:
                raise HTTPException(status_code=404, detail="Quiz not found")
            
            quiz.current_question_index = quiz_data.get("current_question_index", 0)
            quiz.questions_data = quiz_data.get("questions_data")
            quiz.user_answers = quiz_data.get("user_answers", {})
            quiz.time_taken = quiz_data.get("time_taken", 0)
        else:
            # Create new ongoing quiz
            quiz = QuizAttempt(
                user_id=user.id,
                topic=quiz_data.get("topic", "Custom Quiz"),
                difficulty=quiz_data.get("difficulty", "medium"),
                total_questions=quiz_data.get("total_questions", 0),
                current_question_index=quiz_data.get("current_question_index", 0),
                questions_data=quiz_data.get("questions_data"),
                user_answers=quiz_data.get("user_answers", {}),
                time_taken=quiz_data.get("time_taken", 0),
                status="ongoing",
                started_at=datetime.utcnow()
            )
            db.add(quiz)
        
        db.commit()
        db.refresh(quiz)
        
        return {
            "message": "Quiz state saved successfully",
            "quiz_id": quiz.id
        }
    except Exception as e:
        print(f"Error saving quiz state: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save quiz state: {str(e)}")

@router.get("/resume/{quiz_id}")
async def resume_quiz(
    quiz_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """Get saved quiz state to resume"""
    user = get_current_user(db, token)
    
    quiz = db.query(QuizAttempt).filter(
        QuizAttempt.id == quiz_id,
        QuizAttempt.user_id == user.id,
        QuizAttempt.status == "ongoing"
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or already completed")
    
    return {
        "quiz_id": quiz.id,
        "topic": quiz.topic,
        "difficulty": quiz.difficulty,
        "total_questions": quiz.total_questions,
        "current_question_index": quiz.current_question_index,
        "questions_data": quiz.questions_data,
        "user_answers": quiz.user_answers,
        "time_taken": quiz.time_taken or 0,
        "started_at": quiz.started_at.isoformat() if quiz.started_at else None
    }
