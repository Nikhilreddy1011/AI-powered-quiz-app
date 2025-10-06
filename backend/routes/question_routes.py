from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Literal, Union
from controllers.question_controller import QuestionController

# Create router
router = APIRouter(prefix="/api", tags=["questions"])

# Initialize controller
question_controller = QuestionController()

# Request models
class GenerateQuestionsRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200, description="Topic for question generation")
    number_questions: int = Field(..., ge=1, le=50, description="Number of questions to generate")
    difficulty: Literal["easy", "medium", "hard"] = Field(
        ..., description="Difficulty level for the quiz"
    )

# Response models
class Question(BaseModel):
    question: str
    options: List[str]
    answers: List[str]
    explanation: str

class GenerateQuestionsResponse(BaseModel):
    questions: List[Question]

@router.post("/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions(request: GenerateQuestionsRequest):
    """
    Generate questions for a given topic using Gemini LLM
    
    Args:
        request: Request containing topic and number of questions
        
    Returns:
        GenerateQuestionsResponse: Response containing generated questions
        
    Raises:
        HTTPException: If there's an error in question generation
    """
    try:
        result = await question_controller.generate_questions(
            topic=request.topic,
            number_questions=request.number_questions,
            difficulty=request.difficulty
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )