import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './DashboardNew.css';

interface DashboardStats {
  total_quizzes: number;
  ongoing_quizzes: number;
  average_score: number;
  best_score: number;
  lowest_score: number;
  total_time_spent: number;
  total_correct: number;
  total_questions: number;
  accuracy: number;
}

interface QuizHistory {
  id: number;
  subcategory: string;
  category: string;
  category_icon: string;
  difficulty: string;
  score: number;
  percentage: number;
  correct_answers: number;
  total_questions: number;
  time_taken: number | null;
  completed_at: string;
  status?: string;
}

interface OngoingQuiz {
  id: number;
  subcategory: string;
  category: string;
  category_icon: string;
  difficulty: string;
  total_questions: number;
  current_question: number;
  progress_percentage: number;
  started_at: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [ongoing, setOngoing] = useState<OngoingQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        navigate('/');
        return;
      }

      // Fetch stats
      const statsRes = await fetch(`http://localhost:8000/dashboard/stats?token=${token}`);
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch history
      const historyRes = await fetch(`http://localhost:8000/dashboard/history?token=${token}&limit=10`);
      const historyData = await historyRes.json();
      setHistory(historyData);

      // Fetch ongoing
      const ongoingRes = await fetch(`http://localhost:8000/dashboard/ongoing?token=${token}`);
      const ongoingData = await ongoingRes.json();
      setOngoing(ongoingData);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-skeleton">
            <div className="skeleton-header"></div>
            <div className="skeleton-stats">
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
            </div>
            <div className="skeleton-chart"></div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="dashboard-container">
      {/* Enterprise Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your learning progress overview.</p>
        </div>
        <div className="header-right">
          <button className="btn-secondary" onClick={() => navigate('/profile')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM8 10c-3.3 0-6 2-6 4v1h12v-1c0-2-2.7-4-6-4z" fill="currentColor"/>
            </svg>
            Profile
          </button>
          <button className="btn-primary" onClick={() => navigate('/quiz')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Start New Quiz
          </button>
        </div>
      </header>

      {/* Enterprise KPI Cards */}
      {stats && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Completed</div>
              <div className="kpi-value">{stats.total_quizzes}</div>
              <div className="kpi-meta">
                {stats.ongoing_quizzes > 0 && (
                  <span className="kpi-badge">{stats.ongoing_quizzes} ongoing</span>
                )}
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Average Score</div>
              <div className="kpi-value">{stats.average_score.toFixed(1)}%</div>
              <div className="kpi-progress">
                <div className="kpi-progress-bar">
                  <div className="kpi-progress-fill kpi-fill-green" style={{ width: `${stats.average_score}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Best Score</div>
              <div className="kpi-value">{stats.best_score.toFixed(1)}%</div>
              <div className="kpi-meta">
                <span className="kpi-subtext">Lowest: {stats.lowest_score.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon kpi-icon-orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Accuracy</div>
              <div className="kpi-value">{stats.accuracy.toFixed(1)}%</div>
              <div className="kpi-meta">
                <span className="kpi-subtext">{stats.total_correct}/{stats.total_questions} correct</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Analytics */}
      {stats && stats.total_quizzes > 0 && (
        <section className="analytics-section">
          <div className="section-header">
            <h2 className="section-title">Performance Analytics</h2>
            <p className="section-subtitle">Visual insights into your quiz performance trends</p>
          </div>

          <div className="analytics-grid">
            {/* Performance Overview - Bar Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Score Overview</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Average', score: stats.average_score },
                  { name: 'Highest', score: stats.best_score },
                  { name: 'Lowest', score: stats.lowest_score }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" />
                  <XAxis dataKey="name" stroke="#6B778C" style={{ fontSize: '12px', fontWeight: 500 }} />
                  <YAxis stroke="#6B778C" style={{ fontSize: '12px', fontWeight: 500 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #DFE1E6', 
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  />
                  <Bar dataKey="score" fill="#0066FF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quiz Distribution - Pie Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Quiz Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: stats.total_quizzes, color: '#00875A' },
                      { name: 'Incomplete', value: stats.ongoing_quizzes, color: '#FF8B00' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#0066FF"
                    dataKey="value"
                  >
                    {[
                      { name: 'Completed', value: stats.total_quizzes, color: '#00875A' },
                      { name: 'Incomplete', value: stats.ongoing_quizzes, color: '#FF8B00' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #DFE1E6', 
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Accuracy Trends - Line Chart */}
            <div className="chart-card chart-card-wide">
              <h3 className="chart-title">Recent Performance Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history.slice(0, 10).reverse().map((quiz, idx) => ({
                  quiz: `Q${idx + 1}`,
                  score: quiz.percentage
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" />
                  <XAxis dataKey="quiz" stroke="#6B778C" style={{ fontSize: '12px', fontWeight: 500 }} />
                  <YAxis stroke="#6B778C" style={{ fontSize: '12px', fontWeight: 500 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #DFE1E6', 
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#0066FF" strokeWidth={3} dot={{ fill: '#0066FF', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Quiz Activity Table */}
      <section className="quiz-table-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Recent Activity</h2>
            <p className="section-subtitle">Track your quiz history and resume incomplete quizzes</p>
          </div>
        </div>

        {history.length === 0 && ongoing.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">
              <div className="empty-circle"></div>
              <span className="empty-icon">📝</span>
            </div>
            <h3 className="empty-title">No quizzes yet</h3>
            <p className="empty-description">Start your learning journey by taking your first quiz</p>
            <button className="start-quiz-btn" onClick={() => navigate('/quiz')}>
              <span className="btn-icon">🎯</span>
              <span>Start Your First Quiz</span>
            </button>
          </div>
        ) : (
          <div className="quiz-table-container">
            <table className="quiz-table">
              <thead>
                <tr>
                  <th>Topic / Category</th>
                  <th>Date</th>
                  <th>Difficulty</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Incomplete Quizzes First */}
                {ongoing.map((quiz) => (
                  <tr key={`ongoing-${quiz.id}`} className="quiz-row incomplete-row">
                    <td className="quiz-topic">
                      <div className="topic-cell">
                        <span className="topic-icon">{quiz.category_icon}</span>
                        <div className="topic-info">
                          <span className="topic-name">{quiz.subcategory}</span>
                          <span className="topic-category">{quiz.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="quiz-date">
                      {new Date(quiz.started_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="quiz-difficulty">
                      <span className={`difficulty-badge badge-${quiz.difficulty.toLowerCase()}`}>
                        {quiz.difficulty}
                      </span>
                    </td>
                    <td className="quiz-score">
                      <span className="progress-indicator">
                        {quiz.current_question}/{quiz.total_questions}
                      </span>
                    </td>
                    <td className="quiz-status">
                      <span className="status-badge status-incomplete">
                        ⏸ Incomplete
                      </span>
                    </td>
                    <td className="quiz-action">
                      <button 
                        className="resume-btn"
                        onClick={() => navigate(`/quiz`, { state: { resumeQuizId: quiz.id } })}
                      >
                        <span className="btn-icon">▶️</span>
                        Resume
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Completed Quizzes */}
                {history.map((quiz) => (
                  <tr key={`completed-${quiz.id}`} className="quiz-row completed-row">
                    <td className="quiz-topic">
                      <div className="topic-cell">
                        <span className="topic-icon">{quiz.category_icon}</span>
                        <div className="topic-info">
                          <span className="topic-name">{quiz.subcategory}</span>
                          <span className="topic-category">{quiz.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="quiz-date">
                      {new Date(quiz.completed_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="quiz-difficulty">
                      <span className={`difficulty-badge badge-${quiz.difficulty.toLowerCase()}`}>
                        {quiz.difficulty}
                      </span>
                    </td>
                    <td className="quiz-score">
                      <div className="score-cell">
                        <span className={`score-percentage ${quiz.percentage >= 80 ? 'score-high' : quiz.percentage >= 60 ? 'score-medium' : 'score-low'}`}>
                          {quiz.percentage.toFixed(0)}%
                        </span>
                        <span className="score-fraction">
                          {quiz.correct_answers}/{quiz.total_questions}
                        </span>
                      </div>
                    </td>
                    <td className="quiz-status">
                      <span className="status-badge status-completed">
                        ✓ Completed
                      </span>
                    </td>
                    <td className="quiz-action">
                      <span className="time-taken">
                        ⏱ {formatTime(quiz.time_taken)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
