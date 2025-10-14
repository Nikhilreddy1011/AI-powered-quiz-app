import React from 'react';
import './App.css';
import QuestionGenerator from './components/QuestionGenerator';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>AI Powered Quiz Generator</h1>
        <p>Generate multiple choice questions on any topic using AI</p>
      </header>
      <main className="app-main">
        <QuestionGenerator />
      </main>
    </div>
  );
}

export default App;
