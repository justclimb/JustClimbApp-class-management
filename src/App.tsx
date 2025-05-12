import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme, Box, Toolbar } from '@mui/material';
import './App.css';

// Pages
import DashboardPage from './pages/Dashboard';
import ClassesPage from './pages/Classes';
import SchedulePage from './pages/Schedule';
import StudentsPage from './pages/Students';
import CoachesPage from './pages/Coaches';

// Components
import Navigation from './components/Navigation';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: 'calc(100% - 240px)' } }}>
            <Toolbar />
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/coaches" element={<CoachesPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
