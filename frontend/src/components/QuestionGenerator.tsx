import React, { useState } from 'react';
import './QuestionGenerator.css';

interface Question {
  question: string;
  options: string[];
  answer: string;
}

interface GenerateQuestionsRequest {
  topic: string;
  number_questions: number;
}

interface GenerateQuestionsResponse {
  questions: Question[];
}

const QuestionGenerator: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [numberQuestions, setNumberQuestions] = useState<number>(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
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
        number_questions: numberQuestions
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

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
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
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        correct++;
      }
    });
    return correct;
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
              {!showResults && (
                <button onClick={checkAnswers} className="check-btn">
                  Check Answers
                </button>
              )}
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
                  const isSelected = selectedAnswers[index] === option;
                  const isCorrect = option === question.answer;
                  const isWrong = isSelected && !isCorrect && showResults;
                  
                  return (
                    <label 
                      key={optionIndex} 
                      className={`option ${isSelected ? 'selected' : ''} ${showResults ? (isCorrect ? 'correct' : isWrong ? 'wrong' : '') : ''}`}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(index, option)}
                        disabled={showResults}
                      />
                      <span className="option-text">{option}</span>
                    </label>
                  );
                })}
              </div>

              {showResults && (
                <div className="answer-feedback">
                  <p className={`feedback ${selectedAnswers[index] === question.answer ? 'correct' : 'incorrect'}`}>
                    {selectedAnswers[index] === question.answer 
                      ? '✓ Correct!' 
                      : `✗ Incorrect. The correct answer is: ${question.answer}`
                    }
                  </p>
                </div>
              )}
            </div>
          ))}

          {showResults && (
            <div className="score-section">
              <h3>Quiz Results</h3>
              <div className="score-display">
                <span className="score">
                  {getScore()} / {questions.length}
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


