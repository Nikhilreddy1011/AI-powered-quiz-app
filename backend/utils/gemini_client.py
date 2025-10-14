import os
from typing import List, Dict, Any
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()


class QuestionModel(BaseModel):
    question: str = Field(..., description="The question text")
    options: List[str] = Field(..., description="Exactly 4 options")
    answers: List[str] = Field(..., description="One or more correct options, each must be in options")
    explanation: str = Field(..., description="1-2 sentence rationale for the answer(s)")


class QuestionsResponse(BaseModel):
    questions: List[QuestionModel]


class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY is not set. Please define it in your environment or .env file.")

        # Chat model from LangChain's Google GenAI integration
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            api_key=self.api_key,
            temperature=0.4,
        )

        # Prompt that strictly defines the structure and constraints
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You create high-quality multiple-choice questions. "
                "Always follow the requested structure and constraints."
            )),
            ("human", (
                "Generate {number_questions} multiple-choice question objects for topic: '{topic}'.\n"
                "Difficulty: {difficulty}.\n\n"
                "Constraints:\n"
                "- Each question must have exactly 4 options.\n"
                "- Some questions should have multiple correct answers (2-3); others may have exactly one.\n"
                "- Include a concise 1-2 sentence explanation for the correct answer(s).\n"
                "- Keep content educational and appropriate.\n"
                "- If multiple answers are correct, ensure 'answers' includes ALL correct options exactly as in 'options'.\n"
                "Return only structured data, no markdown."
            )),
        ])

        # Force the model to return Pydantic-validated structure
        self.structured_llm = self.llm.with_structured_output(QuestionsResponse)

    def generate_questions(self, topic: str, number_questions: int, difficulty: str) -> List[Dict[str, Any]]:
        """
        Generate questions using Gemini via LangChain with Pydantic-validated structured output.

        Args:
            topic: The topic for question generation
            number_questions: Number of questions to generate
            difficulty: Difficulty level (e.g., easy, medium, hard)

        Returns:
            List[Dict[str, Any]]: List of question dicts with keys: question, options, answers, explanation
        """

        chain = self.prompt | self.structured_llm

        try:
            result: QuestionsResponse = chain.invoke({
                "topic": topic,
                "number_questions": number_questions,
                "difficulty": difficulty,
            })

            # Convert Pydantic models to plain dicts
            return [q.model_dump() for q in result.questions]
        except Exception as e:
            # Surface a concise error upward to controller
            raise Exception(f"Error generating questions: {str(e)}")