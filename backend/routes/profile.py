from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from database import get_db
from models import User, UserPreference
from auth_utils import verify_token, get_password_hash

router = APIRouter(prefix="/profile", tags=["profile"])

# Pydantic models
class ProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class PreferenceUpdate(BaseModel):
    preferred_categories: List[int] = []
    default_difficulty: str = "medium"
    notifications_enabled: bool = True

def get_current_user(db: Session, token: str):
    """Helper function to get current user from token"""
    username = verify_token(token)
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/me")
async def get_profile(token: str, db: Session = Depends(get_db)):
    """Get current user profile"""
    user = get_current_user(db, token)
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar": user.avatar,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "is_active": user.is_active
    }

@router.put("/update")
async def update_profile(
    profile: ProfileUpdate,
    token: str,
    db: Session = Depends(get_db)
):
    """Update user profile"""
    user = get_current_user(db, token)
    
    # Update fields if provided
    if profile.email:
        # Check if email already exists
        existing = db.query(User).filter(
            User.email == profile.email,
            User.id != user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = profile.email
    
    if profile.avatar is not None:
        user.avatar = profile.avatar
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar
        }
    }

@router.put("/change-password")
async def change_password(
    password_data: PasswordChange,
    token: str,
    db: Session = Depends(get_db)
):
    """Change user password"""
    from auth_utils import verify_password
    
    user = get_current_user(db, token)
    
    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.get("/preferences")
async def get_preferences(token: str, db: Session = Depends(get_db)):
    """Get user preferences"""
    user = get_current_user(db, token)
    
    prefs = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    
    if not prefs:
        # Create default preferences
        prefs = UserPreference(user_id=user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    
    return {
        "preferred_categories": prefs.preferred_categories or [],
        "default_difficulty": prefs.default_difficulty,
        "notifications_enabled": prefs.notifications_enabled
    }

@router.put("/preferences")
async def update_preferences(
    preferences: PreferenceUpdate,
    token: str,
    db: Session = Depends(get_db)
):
    """Update user preferences"""
    user = get_current_user(db, token)
    
    prefs = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    
    if not prefs:
        prefs = UserPreference(user_id=user.id)
        db.add(prefs)
    
    prefs.preferred_categories = preferences.preferred_categories
    prefs.default_difficulty = preferences.default_difficulty
    prefs.notifications_enabled = preferences.notifications_enabled
    
    db.commit()
    db.refresh(prefs)
    
    return {
        "message": "Preferences updated successfully",
        "preferences": {
            "preferred_categories": prefs.preferred_categories,
            "default_difficulty": prefs.default_difficulty,
            "notifications_enabled": prefs.notifications_enabled
        }
    }

@router.get("/stats")
async def get_profile_stats(token: str, db: Session = Depends(get_db)):
    """Get user profile statistics"""
    from models import QuizAttempt
    
    user = get_current_user(db, token)
    
    # Count statistics
    total_quizzes = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.status == "completed"
    ).count()
    
    ongoing = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.status == "ongoing"
    ).count()
    
    return {
        "username": user.username,
        "email": user.email,
        "avatar": user.avatar,
        "member_since": user.created_at.isoformat() if user.created_at else None,
        "total_completed_quizzes": total_quizzes,
        "ongoing_quizzes": ongoing,
        "is_active": user.is_active
    }
