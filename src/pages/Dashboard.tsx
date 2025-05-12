import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, CardHeader } from '@mui/material';
import { 
  Class as ClassIcon, 
  Person as StudentIcon, 
  School as CoachIcon,
  Event as EventIcon 
} from '@mui/icons-material';
import { dashboardApi } from '../services/api';
import { Stats, ClassSchedule } from '../types';

// Helper to format date for display
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <Typography>Loading dashboard data...</Typography>;
  }

  if (!stats) {
    return <Typography color="error">Failed to load dashboard data</Typography>;
  }

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              bgcolor: '#e3f2fd',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ClassIcon sx={{ color: '#1976d2', mr: 1 }} />
              <Typography variant="h6" component="div">
                Classes
              </Typography>
            </Box>
            <Typography variant="h3" component="div">
              {stats.totalClasses}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              bgcolor: '#e8f5e9',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StudentIcon sx={{ color: '#2e7d32', mr: 1 }} />
              <Typography variant="h6" component="div">
                Students
              </Typography>
            </Box>
            <Typography variant="h3" component="div">
              {stats.totalStudents}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              bgcolor: '#fff8e1',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CoachIcon sx={{ color: '#ff8f00', mr: 1 }} />
              <Typography variant="h6" component="div">
                Coaches
              </Typography>
            </Box>
            <Typography variant="h3" component="div">
              {stats.totalCoaches}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              bgcolor: '#f3e5f5',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EventIcon sx={{ color: '#9c27b0', mr: 1 }} />
              <Typography variant="h6" component="div">
                Upcoming Classes
              </Typography>
            </Box>
            <Typography variant="h3" component="div">
              {stats.upcomingClasses.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Upcoming Classes */}
      <Card elevation={3}>
        <CardHeader title="Upcoming Classes" />
        <CardContent>
          {stats.upcomingClasses.length === 0 ? (
            <Typography>No upcoming classes</Typography>
          ) : (
            <Grid container spacing={2}>
              {stats.upcomingClasses.map((schedule: ClassSchedule) => (
                <Grid item xs={12} key={schedule.id}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: '4px solid #1976d2',
                    }}
                  >
                    <Box>
                      <Typography variant="h6">{schedule.title}</Typography>
                      <Typography variant="body1" color="textSecondary">
                        {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                      </Typography>
                    </Box>
                    <ClassIcon color="primary" />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard; 