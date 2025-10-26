import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero: React.FC = () => {
  return (
    <div className="hero-container">
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-icon">✨</span>
          AI-Powered Learning
        </div>
        
        <h1 className="hero-title">
          Master Any Subject with
          <span className="gradient-text"> AI-Generated Quizzes</span>
        </h1>
        
        <p className="hero-description">
          Create personalized quizzes on any topic in seconds. Test your knowledge,
          track your progress, and learn smarter with our intelligent quiz generator.
        </p>

        <div className="hero-cta">
          <Link to="/register" className="cta-button primary">
            <span className="btn-icon">🚀</span>
            Get Started Free
          </Link>
          <Link to="/login" className="cta-button secondary">
            Sign In
          </Link>
        </div>
      </div>

      <div className="hero-features">
        <h2 className="features-title">Why Choose Our Quiz Generator?</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Any Topic</h3>
            <p>Generate quizzes on any subject - from programming to history, science to arts.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Generation</h3>
            <p>Get your personalized quiz in seconds powered by advanced AI technology.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3>Multiple Difficulty Levels</h3>
            <p>Choose from easy, medium, or hard difficulty to match your skill level.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Detailed Analytics</h3>
            <p>Track your performance with comprehensive results and explanations.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Instant Feedback</h3>
            <p>Get immediate feedback with detailed explanations for every question.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Unlimited Quizzes</h3>
            <p>Create as many quizzes as you want. Practice makes perfect!</p>
          </div>
        </div>
      </div>

      <div className="hero-cta-bottom">
        <h2>Ready to Start Learning?</h2>
        <p>Join thousands of learners improving their knowledge every day</p>
        <Link to="/register" className="cta-button primary large">
          <span className="btn-icon">🎓</span>
          Create Your First Quiz
        </Link>
      </div>
    </div>
  );
};

export default Hero;
