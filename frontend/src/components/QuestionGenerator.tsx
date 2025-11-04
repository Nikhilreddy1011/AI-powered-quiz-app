import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
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
  const navigate = useNavigate();
  const location = useLocation();
  
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
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [quizId, setQuizId] = useState<number | null>(null);
  const [initialTimeOffset, setInitialTimeOffset] = useState<number>(0);
  const [timeWarningShown, setTimeWarningShown] = useState<boolean>(false);

  // Check for resume quiz on mount
  useEffect(() => {
    const resumeQuizId = (location.state as any)?.resumeQuizId;
    if (resumeQuizId) {
      loadQuizState(resumeQuizId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!showQuiz || showResults || !questions.length || !quizId) return;

    console.log('Auto-save timer started');
    const autoSaveInterval = setInterval(() => {
      console.log('Auto-save triggered');
      saveQuizState();
    }, 30000); // 30 seconds

    return () => {
      console.log('Auto-save timer cleared');
      clearInterval(autoSaveInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuiz, showResults, questions.length, quizId]);

  // Update timer every second and auto-submit when time runs out
  useEffect(() => {
    if (!showQuiz || showResults || !quizStartTime) return;

    console.log('Timer started with:', {
      initialTimeOffset,
      quizStartTime: new Date(quizStartTime).toISOString(),
      questionsLength: questions.length,
      totalTime: questions.length * 60
    });

    const timerInterval = setInterval(() => {
      const currentSessionTime = Math.floor((Date.now() - quizStartTime) / 1000);
      const newElapsedTime = initialTimeOffset + currentSessionTime;
      setElapsedTime(newElapsedTime);

      // Check if time is up
      const totalTime = questions.length * 60;
      const remaining = totalTime - newElapsedTime;
      
      // Show warning at 1 minute remaining
      if (remaining === 60 && !timeWarningShown) {
        setTimeWarningShown(true);
        // You could add a toast notification here
      }
      
      if (newElapsedTime >= totalTime) {
        clearInterval(timerInterval);
        // Auto-submit quiz when time runs out
        submitQuiz();
      }
    }, 1000);

    return () => {
      console.log('Timer stopped');
      clearInterval(timerInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuiz, showResults, quizStartTime, initialTimeOffset, questions.length, timeWarningShown]);

  // Save on page unload or navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showQuiz && !showResults && questions.length > 0) {
        // Use synchronous approach for reliability
        const token = authService.getToken();
        if (!token) return;

        const currentSessionTime = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;
        const totalTimeTaken = initialTimeOffset + currentSessionTime;

        const quizData = {
          quiz_id: quizId,
          topic: topic,
          difficulty: difficulty,
          total_questions: questions.length,
          current_question_index: currentQuestion,
          questions_data: questions,
          user_answers: selectedAnswers,
          time_taken: totalTimeTaken
        };

        // Use sendBeacon for reliable async save on unload
        const blob = new Blob([JSON.stringify(quizData)], { type: 'application/json' });
        navigator.sendBeacon(`http://localhost:8000/dashboard/save-state?token=${token}`, blob);
        
        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = 'Your quiz progress will be saved. You can resume it later from the dashboard.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuiz, showResults, questions, quizStartTime, initialTimeOffset, quizId, topic, difficulty, currentQuestion, selectedAnswers]);

  const loadQuizState = async (resumeQuizId: number) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(`http://localhost:8000/dashboard/resume/${resumeQuizId}?token=${token}`);
      if (!response.ok) throw new Error('Failed to load quiz');

      const data = await response.json();
      
      // Store the already elapsed time from previous sessions
      const alreadyElapsed = data.time_taken || 0;
      const totalTime = (data.questions_data?.length || 0) * 60;
      const remainingTime = totalTime - alreadyElapsed;
      
      console.log('Resume quiz:', {
        quiz_id: data.quiz_id,
        total_questions: data.questions_data?.length,
        current_question: data.current_question_index,
        elapsed_time: alreadyElapsed,
        total_time: totalTime,
        remaining_time: remainingTime
      });
      
      setQuizId(data.quiz_id);
      setTopic(data.topic);
      setDifficulty(data.difficulty);
      setQuestions(data.questions_data || []);
      setNumberQuestions(data.total_questions);
      setCurrentQuestion(data.current_question_index || 0);
      setSelectedAnswers(data.user_answers || {});
      setInitialTimeOffset(alreadyElapsed);
      setElapsedTime(alreadyElapsed);
      setQuizStartTime(Date.now());
      setTimeWarningShown(false); // Reset warning flag
      setShowQuiz(true);
      
      console.log('Quiz state loaded successfully');
    } catch (error) {
      console.error('Failed to load quiz state:', error);
      setError('Failed to resume quiz');
    }
  };

  const saveInitialQuizState = async (questionsData: Question[]) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const quizData = {
        quiz_id: null,
        topic: topic,
        difficulty: difficulty,
        total_questions: questionsData.length,
        current_question_index: 0,
        questions_data: questionsData,
        user_answers: {},
        time_taken: 0
      };

      const response = await fetch(`http://localhost:8000/dashboard/save-state?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData)
      });

      if (response.ok) {
        const result = await response.json();
        setQuizId(result.quiz_id);
        console.log('Initial quiz saved with ID:', result.quiz_id);
      }
    } catch (error) {
      console.error('Failed to save initial quiz state:', error);
    }
  };

  const saveQuizState = async () => {
    try {
      const token = authService.getToken();
      if (!token || !questions.length) return;

      // Calculate total time: initial offset + time since this session started
      const currentSessionTime = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;
      const totalTimeTaken = initialTimeOffset + currentSessionTime;

      const quizData = {
        quiz_id: quizId,
        topic: topic,
        difficulty: difficulty,
        total_questions: questions.length,
        current_question_index: currentQuestion,
        questions_data: questions,
        user_answers: selectedAnswers,
        time_taken: totalTimeTaken
      };

      console.log('Saving quiz state:', { quiz_id: quizId, current_question: currentQuestion, time_taken: totalTimeTaken });

      const response = await fetch(`http://localhost:8000/dashboard/save-state?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData)
      });

      if (response.ok) {
        const result = await response.json();
        if (!quizId) {
          setQuizId(result.quiz_id);
          console.log('Quiz ID set:', result.quiz_id);
        }
      }
    } catch (error) {
      console.error('Failed to save quiz state:', error);
    }
  };

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
      setInitialTimeOffset(0); // Reset for fresh quiz
      setElapsedTime(0);
      setQuizId(null); // No quiz ID for fresh quiz
      setTimeWarningShown(false); // Reset warning flag
      
      // Save initial quiz state immediately
      setTimeout(() => {
        saveInitialQuizState(data.questions);
      }, 100);
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

  const handleCloseQuiz = async () => {
    // Save quiz progress before closing
    if (showQuiz && !showResults && questions.length > 0) {
      console.log('Closing quiz, saving state...');
      await saveQuizState();
      console.log('Quiz state saved, navigating to dashboard');
    }
    // Navigate to dashboard
    navigate('/dashboard');
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

  const getTotalTimeAllowed = () => {
    // 1 minute per question
    return questions.length * 60;
  };

  const getRemainingTime = () => {
    const totalTime = getTotalTimeAllowed();
    const remaining = totalTime - elapsedTime;
    return Math.max(0, remaining); // Never go below 0
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const submitQuiz = async () => {
    const endTime = Date.now();
    setQuizEndTime(endTime);
    setShowResults(true);

    // Save quiz results to database
    try {
      const token = authService.getToken();
      if (token) {
        const score = getScore();
        // Calculate total time: initial offset + current session time
        const currentSessionTime = quizStartTime ? Math.floor((endTime - quizStartTime) / 1000) : 0;
        const totalTimeTaken = initialTimeOffset + currentSessionTime;
        
        const quizData = {
          quiz_id: quizId, // Include quiz_id if resuming
          subcategory_name: topic,
          category_name: 'General',
          difficulty: difficulty,
          total_questions: questions.length,
          correct_answers: Math.round(score),
          percentage: (score / questions.length) * 100,
          time_taken: totalTimeTaken
        };

        console.log('Saving quiz data:', quizData);

        const response = await fetch(`http://localhost:8000/dashboard/save-quiz?token=${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quizData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to save quiz:', errorData);
        } else {
          const result = await response.json();
          console.log('Quiz saved successfully:', result);
        }
      }
    } catch (error) {
      console.error('Failed to save quiz results:', error);
      // Don't show error to user, results are still displayed
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showQuiz && !showResults && quizStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - quizStartTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showQuiz, showResults, quizStartTime]);

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
                  <div className={`quiz-timer ${getRemainingTime() < 60 ? 'timer-warning' : getRemainingTime() < 30 ? 'timer-critical' : ''}`}>
                    ⏱️ {formatTime(getRemainingTime())}
                  </div>
                  <button onClick={handleCloseQuiz} className="exit-btn" title="Save & Exit Quiz">
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
                <div className="time-info">
                  <span className="time-allocation">⏱️ {questions.length} questions × 1 min = {questions.length} minutes total</span>
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
                <button onClick={() => navigate('/dashboard')} className="action-btn secondary">
                  <span className="btn-icon">📊</span>
                  View Dashboard
                </button>
                <button onClick={() => window.location.reload()} className="action-btn primary">
                  <span className="btn-icon">🎯</span>
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



