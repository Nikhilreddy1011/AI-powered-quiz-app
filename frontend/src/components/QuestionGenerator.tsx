import React, { useState } from 'react';
import './QuestionGenerator.css';

interface Question {
  question: string;
  options: string[];
  answers: string[];
  explanation: string;
}

interface GenerateQuestionsRequest {
  topic: string;
  number_questions: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GenerateQuestionsResponse {
  questions: Question[];
}

const QuestionGenerator: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [numberQuestions, setNumberQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string[] }>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [quizEndTime, setQuizEndTime] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);

  const generateQuestions = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError('');
    setQuestions([]);
    setSelectedAnswers({});
    setShowResults(false);

    try {
      const request: GenerateQuestionsRequest = {
        topic: topic.trim(),
        number_questions: numberQuestions,
        difficulty,
      };

      const response = await fetch('http://localhost:8000/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate questions');
      }

      const data: GenerateQuestionsResponse = await response.json();
      setQuestions(data.questions);
      setShowQuiz(true);
      setCurrentQuestion(0);
      setQuizStartTime(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: string, isMulti: boolean) => {
    setSelectedAnswers(prev => {
      const current = prev[questionIndex] || [];
      if (isMulti) {
        // toggle selection
        const exists = current.includes(answer);
        const next = exists ? current.filter(a => a !== answer) : [...current, answer];
        return { ...prev, [questionIndex]: next };
      } else {
        return { ...prev, [questionIndex]: [answer] };
      }
    });
  };

  const resetQuiz = () => {
    setQuestions([]);
    setSelectedAnswers({});
    setShowResults(false);
    setError('');
    setShowQuiz(false);
    setCurrentQuestion(0);
    setQuizStartTime(null);
    setQuizEndTime(null);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getTimeTaken = () => {
    if (!quizStartTime || !quizEndTime) return 0;
    return Math.floor((quizEndTime - quizStartTime) / 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const submitQuiz = () => {
    setQuizEndTime(Date.now());
    setShowResults(true);
  };

  const getScore = () => {
    // New formula: (CorrectlySelected / TotalCorrect) - (IncorrectlySelected / TotalOptions), clamped to [0, 1] per question
    let total = 0;
    questions.forEach((question, index) => {
      const selected = new Set((selectedAnswers[index] || []).map(s => s.trim()));
      const correctSet = new Set(question.answers.map(s => s.trim()));
      const totalCorrect = correctSet.size;
      const totalOptions = question.options.length;

      let correctlySelected = 0;
      let incorrectlySelected = 0;
      Array.from(selected).forEach(ans => {
        if (correctSet.has(ans)) correctlySelected += 1; else incorrectlySelected += 1;
      });

      const gain = totalCorrect > 0 ? correctlySelected / totalCorrect : 0;
      const penalty = totalOptions > 0 ? incorrectlySelected / totalOptions : 0;
      const normalized = Math.max(0, Math.min(1, gain - penalty));
      total += normalized;
    });
    return total;
  };

  return (
    <div className="question-generator">
      {!showQuiz ? (
      <div className="generator-form">
        <div className="form-icon">🎯</div>
        <h2>Create Your Quiz</h2>
        <p className="form-subtitle">Generate AI-powered questions on any topic</p>
        <div className="form-group">
          <label htmlFor="topic">
            <span className="label-icon">📚</span>
            Topic
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Python Programming, World History, Biology"
            className="topic-input"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="numberQuestions">
              <span className="label-icon">🔢</span>
              Questions
            </label>
            <select
              id="numberQuestions"
              value={numberQuestions}
              onChange={(e) => setNumberQuestions(Number(e.target.value))}
              className="number-select"
            >
              {[3, 5, 7, 10, 15, 20].map(num => (
                <option key={num} value={num}>{num} questions</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">
              <span className="label-icon">⚡</span>
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="number-select"
            >
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>
          </div>
        </div>

        <button 
          onClick={generateQuestions} 
          disabled={loading || !topic.trim()}
          className="generate-btn"
        >
          {loading ? (
            <>
              <span className="btn-spinner"></span>
              Generating Quiz...
            </>
          ) : (
            <>
              <span className="btn-icon">✨</span>
              Generate Quiz
            </>
          )}
        </button>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>
      ) : (

        <div className="quiz-container">
          {!showResults ? (
            <>
              {/* Progress Bar */}
              <div className="quiz-progress">
                <div className="progress-header">
                  <span className="progress-text">
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                  <button onClick={resetQuiz} className="exit-btn" title="Exit Quiz">
                    ✕
                  </button>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
                <div className="progress-indicators">
                  {questions.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`progress-dot ${
                        idx === currentQuestion ? 'active' : 
                        (selectedAnswers[idx] || []).length > 0 ? 'completed' : ''
                      }`}
                      onClick={() => setCurrentQuestion(idx)}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Current Question */}
              <div className="question-card">
                <div className="question-header">
                  <span className="question-badge">
                    {questions[currentQuestion].answers.length > 1 ? 'Multiple Choice' : 'Single Choice'}
                  </span>
                  <span className="difficulty-badge difficulty-{difficulty}">
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </span>
                </div>
                <h3 className="question-text">{questions[currentQuestion].question}</h3>
                
                <div className="options">
                  {questions[currentQuestion].options.map((option, optionIndex) => {
                    const selectedForQ = selectedAnswers[currentQuestion] || [];
                    const isSelected = selectedForQ.includes(option);
                    const isMulti = questions[currentQuestion].answers.length > 1;
                    const optionLetter = String.fromCharCode(65 + optionIndex);
                    
                    return (
                      <label 
                        key={optionIndex} 
                        className={`option ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          type={isMulti ? 'checkbox' : 'radio'}
                          name={`question-${currentQuestion}`}
                          value={option}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(currentQuestion, option, isMulti)}
                        />
                        <span className="option-letter">{optionLetter}</span>
                        <span className="option-text">{option}</span>
                        {isSelected && <span className="check-mark">✓</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="quiz-navigation">
                <button 
                  onClick={previousQuestion}
                  disabled={currentQuestion === 0}
                  className="nav-btn prev-btn"
                >
                  ← Previous
                </button>
                
                <div className="nav-center">
                  {currentQuestion === questions.length - 1 ? (
                    <button 
                      onClick={submitQuiz}
                      className="submit-btn"
                      disabled={questions.some((_, idx) => (selectedAnswers[idx] || []).length === 0)}
                    >
                      Submit Quiz
                    </button>
                  ) : (
                    <button 
                      onClick={nextQuestion}
                      className="nav-btn next-btn"
                      disabled={currentQuestion === questions.length - 1}
                    >
                      Next →
                    </button>
                  )}
                </div>
                
                <div className="nav-spacer"></div>
              </div>
            </>
          ) : (

            <div className="results-container">
              <div className="results-header">
                <div className="results-icon">🎉</div>
                <h2>Quiz Complete!</h2>
                <p className="results-subtitle">Here's how you did</p>
              </div>

              <div className="results-stats">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-value">{Math.round((getScore() / questions.length) * 100)}%</div>
                  <div className="stat-label">Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-value">{getScore().toFixed(1)}/{questions.length}</div>
                  <div className="stat-label">Correct</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-value">{formatTime(getTimeTaken())}</div>
                  <div className="stat-label">Time</div>
                </div>
              </div>

              <div className="performance-message">
                {getScore() === questions.length 
                  ? '🌟 Perfect Score! Outstanding work!' 
                  : getScore() >= questions.length * 0.8 
                    ? '🎯 Excellent! You did great!' 
                    : getScore() >= questions.length * 0.6 
                      ? '👍 Good job! Keep practicing!' 
                      : '💪 Keep learning! You\'ll do better next time!'
                }
              </div>

              {/* Question Review */}
              <div className="review-section">
                <h3>Review Your Answers</h3>
                {questions.map((question, index) => {
                  const selected = new Set((selectedAnswers[index] || []).map(s => s.trim()));
                  const correctSet = new Set(question.answers.map(s => s.trim()));
                  let correctSelected = 0;
                  let incorrectSelected = 0;
                  Array.from(selected).forEach(ans => {
                    if (correctSet.has(ans)) correctSelected += 1; else incorrectSelected += 1;
                  });
                  const isFullyCorrect = correctSelected === correctSet.size && incorrectSelected === 0;
                  
                  return (
                    <div key={index} className="review-card">
                      <div className="review-header">
                        <span className="review-number">Question {index + 1}</span>
                        <span className={`review-status ${isFullyCorrect ? 'correct' : 'incorrect'}`}>
                          {isFullyCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <p className="review-question">{question.question}</p>
                      
                      <div className="review-options">
                        {question.options.map((option, optIdx) => {
                          const isCorrect = question.answers.includes(option);
                          const wasSelected = (selectedAnswers[index] || []).includes(option);
                          
                          return (
                            <div 
                              key={optIdx}
                              className={`review-option ${
                                isCorrect ? 'correct-answer' : ''
                              } ${
                                wasSelected && !isCorrect ? 'wrong-answer' : ''
                              } ${
                                wasSelected && isCorrect ? 'correct-selected' : ''
                              }`}
                            >
                              <span className="option-letter">{String.fromCharCode(65 + optIdx)}</span>
                              <span className="option-text">{option}</span>
                              {isCorrect && <span className="correct-indicator">✓</span>}
                              {wasSelected && !isCorrect && <span className="wrong-indicator">✗</span>}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="review-explanation">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="results-actions">
                <button onClick={resetQuiz} className="action-btn primary">
                  <span className="btn-icon">🔄</span>
                  Take Another Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionGenerator;



