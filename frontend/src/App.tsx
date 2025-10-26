import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import QuestionGenerator from './components/QuestionGenerator';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <Hero />
                </PublicRoute>
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <div className="quiz-page">
                    <main className="app-main">
                      <QuestionGenerator />
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
