from fastapi import HTTPException
from typing import List, Dict, Any
from utils.gemini_client import GeminiClient

class QuestionController:
    def __init__(self):
        self.gemini_client = GeminiClient()
    
    async def generate_questions(self, topic: str, number_questions: int, difficulty: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Generate questions for a given topic
        
        Args:
            topic (str): The topic for question generation
            number_questions (int): Number of questions to generate
            
        Returns:
            Dict: Response containing generated questions
            
        Raises:
            HTTPException: If there's an error in question generation
        """
        
        # Validate input
        if not topic or topic.strip() == "":
            raise HTTPException(status_code=400, detail="Topic cannot be empty")
        
        if number_questions <= 0 or number_questions > 50:
            raise HTTPException(
                status_code=400, 
                detail="Number of questions must be between 1 and 50"
            )
        
        try:
            # Generate questions using Gemini
            questions = self.gemini_client.generate_questions(topic, number_questions, difficulty)
            
            # Validate that we got the expected number of questions
            if len(questions) != number_questions:
                # If we didn't get the exact number, take what we got up to the limit
                questions = questions[:number_questions]
            
            # Validate question structure
            validated_questions = []
            for question in questions:
                if self._validate_question_structure(question):
                    validated_questions.append(question)
            
            if not validated_questions:
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to generate valid questions"
                )
            
            return {"questions": validated_questions}
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Internal server error: {str(e)}"
            )
    
    def _validate_question_structure(self, question: Dict[str, Any]) -> bool:
        """
        Validate that a question has the required structure
        
        Args:
            question (Dict): Question object to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        required_fields = ["question", "options", "answers", "explanation"]
        
        # Check if all required fields are present
        for field in required_fields:
            if field not in question:
                return False
        
        # Check if question is a non-empty string
        if not isinstance(question["question"], str) or not question["question"].strip():
            return False
        
        # Check if options is a list with at least 2 items
        if not isinstance(question["options"], list) or len(question["options"]) < 2:
            return False
        
        # Check if all options are non-empty strings
        for option in question["options"]:
            if not isinstance(option, str) or not option.strip():
                return False
        
        # Check if answers is a non-empty list and all exist in options
        if not isinstance(question["answers"], list) or len(question["answers"]) == 0:
            return False
        for ans in question["answers"]:
            if (not isinstance(ans, str) or not ans.strip() or ans not in question["options"]):
                return False

        # Explanation must be a non-empty string
        if not isinstance(question["explanation"], str) or not question["explanation"].strip():
            return False
        
        return True