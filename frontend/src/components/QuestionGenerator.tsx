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
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string[] }>({});
  const [showResults, setShowResults] = useState<boolean>(false);

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

  const checkAnswers = () => {
    setShowResults(true);
  };

  const resetQuiz = () => {
    setQuestions([]);
    setSelectedAnswers({});
    setShowResults(false);
    setError('');
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
      <div className="generator-form">
        <h2>Generate Questions</h2>
        <div className="form-group">
          <label htmlFor="topic">Topic:</label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic (e.g., Python programming, Machine Learning, History)"
            className="topic-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="numberQuestions">Number of Questions:</label>
          <select
            id="numberQuestions"
            value={numberQuestions}
            onChange={(e) => setNumberQuestions(Number(e.target.value))}
            className="number-select"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="difficulty">Difficulty:</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            className="number-select"
          >
            {['easy', 'medium', 'hard'].map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={generateQuestions} 
          disabled={loading || !topic.trim()}
          className="generate-btn"
        >
          {loading ? 'Generating...' : 'Generate Questions'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      {questions.length > 0 && (
        <div className="questions-section">
          <div className="questions-header">
            <h3>Generated Questions</h3>
            <div className="questions-actions">
              <button onClick={resetQuiz} className="reset-btn">
                Generate New Questions
              </button>
            </div>
          </div>

          {questions.map((question, index) => (
            <div key={index} className="question-card">
              <h4>Question {index + 1}</h4>
              <p className="question-text">{question.question}</p>
              
              <div className="options">
                {question.options.map((option, optionIndex) => {
                  const selectedForQ = selectedAnswers[index] || [];
                  const isSelected = selectedForQ.includes(option);
                  const isCorrect = question.answers.includes(option);
                  const isWrong = isSelected && !isCorrect && showResults;
                  const isMulti = question.answers.length > 1;
                  
                  return (
                    <label 
                      key={optionIndex} 
                      className={`option ${isSelected ? 'selected' : ''} ${showResults ? (isCorrect ? 'correct' : isWrong ? 'wrong' : '') : ''}`}
                    >
                      <input
                        type={isMulti ? 'checkbox' : 'radio'}
                        name={`question-${index}`}
                        value={option}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(index, option, isMulti)}
                        disabled={showResults}
                      />
                      <span className="option-text">{option}</span>
                    </label>
                  );
                })}
              </div>

              {showResults && (
                <div className="answer-feedback">
                  {(() => {
                    const selected = new Set((selectedAnswers[index] || []).map(s => s.trim()));
                    const correctSet = new Set(question.answers.map(s => s.trim()));
                    const totalCorrect = correctSet.size;
                    const totalOptions = question.options.length;
                    let correctSelected = 0;
                    let incorrectSelected = 0;
                    Array.from(selected).forEach(ans => {
                      if (correctSet.has(ans)) correctSelected += 1; else incorrectSelected += 1;
                    });
                    const gain = totalCorrect > 0 ? correctSelected / totalCorrect : 0;
                    const penalty = totalOptions > 0 ? incorrectSelected / totalOptions : 0;
                    const normalized = Math.max(0, Math.min(1, gain - penalty));
                    const cls = normalized === 1 ? 'correct' : (normalized === 0 ? 'incorrect' : '');
                    const indicator = normalized === 1 ? '✓ Correct' : (normalized === 0 ? '✗ Incorrect' : '◐ Partially correct');
                    return (
                      <>
                        <p className={`feedback ${cls}`}>{indicator}</p>
                        <p className="feedback" style={{ marginTop: 8 }}>Explanation: {question.explanation}</p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}

          {!showResults && (
            (() => {
              const allAnswered = questions.every((_, idx) => (selectedAnswers[idx] || []).length > 0);
              return (
                <div className="questions-actions" style={{ marginTop: 16 }}>
                  <button 
                    onClick={checkAnswers} 
                    className="check-btn"
                    disabled={!allAnswered}
                  >
                    Submit
                  </button>
                </div>
              );
            })()
          )}

          {showResults && (
            <div className="score-section">
              <h3>Quiz Results</h3>
              <div className="score-display">
                <span className="score">
                  {getScore().toFixed(2)} / {questions.length}
                </span>
                <span className="percentage">
                  ({Math.round((getScore() / questions.length) * 100)}%)
                </span>
              </div>
              <p className="score-message">
                {getScore() === questions.length 
                  ? 'Perfect! 🎉' 
                  : getScore() >= questions.length * 0.8 
                    ? 'Great job! 👍' 
                    : getScore() >= questions.length * 0.6 
                      ? 'Good effort! 💪' 
                      : 'Keep studying! 📚'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionGenerator;



