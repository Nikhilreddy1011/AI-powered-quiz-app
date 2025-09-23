# Backend API

This is a FastAPI backend service that provides question generation functionality using Google's Gemini LLM.

## Features

- Generate multiple choice questions on any topic
- RESTful API with proper validation
- Integration with Google Gemini LLM
- CORS support for frontend integration

## API Endpoints

### POST /api/generate-questions

Generate questions for a given topic using Gemini LLM.

**Request:**
```json
{
    "topic": "Python programming",
    "number_questions": 5
}
```

**Response:**
```json
{
    "questions": [
        {
            "question": "What is the correct way to declare a variable in Python?",
            "options": ["var x = 5", "x = 5", "int x = 5", "declare x = 5"],
            "answer": "x = 5"
        }
    ]
}
```

**Parameters:**
- `topic` (string): The topic for question generation (1-200 characters)
- `number_questions` (integer): Number of questions to generate (1-50)

**Status Codes:**
- `200`: Success
- `400`: Bad request (invalid parameters)
- `500`: Internal server error

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the development server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Testing

You can test the API using the provided test script:
```bash
python test_api.py
```

Or using curl:
```bash
curl -X POST "http://localhost:8000/api/generate-questions" \
     -H "Content-Type: application/json" \
     -d '{"topic": "Machine Learning", "number_questions": 3}'
```

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── test_api.py            # API testing script
├── routes/
│   ├── __init__.py
│   └── question_routes.py  # Question generation routes
├── controllers/
│   ├── __init__.py
│   └── question_controller.py  # Business logic
└── utils/
    ├── __init__.py
    └── gemini_client.py    # Gemini LLM integration
```

## Configuration

The Gemini API key is currently hardcoded in `utils/gemini_client.py`. In production, use environment variables:

```python
import os
self.api_key = os.getenv("GEMINI_API_KEY")
```

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

- `GET /` - Hello World
- `GET /health` - Health check
- `POST /api/generate-questions` - Generate questions using Gemini LLM