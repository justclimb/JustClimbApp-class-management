import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, CssBaseline, Box } from '@mui/material';
import './App.css';

// Pages
import Dashboard from './pages/Dashboard';
import ClassesPage from './pages/Classes';
import SchedulePage from './pages/Schedule';
import StudentsPage from './pages/Students';
import TeachersPage from './pages/Teachers';

// Components
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Navigation />
        <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: '64px' }}>
          <Container maxWidth="lg">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
