from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.question_routes import router as question_router
from routes.auth_routes import router as auth_router
from database import create_tables

app = FastAPI(title="Backend API", version="1.0.0")

# Create database tables
create_tables()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(question_router)
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)