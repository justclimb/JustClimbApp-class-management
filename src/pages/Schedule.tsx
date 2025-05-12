import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid } from '@mui/material';
import {
  Scheduler,
  WeekView,
  MonthView,
  DayView,
  Appointments,
  Toolbar,
  DateNavigator,
  TodayButton,
  ViewSwitcher,
  AppointmentForm,
  AppointmentTooltip,
} from '@devexpress/dx-react-scheduler-material-ui';
import {
  ViewState,
  EditingState,
  IntegratedEditing,
} from '@devexpress/dx-react-scheduler';
import { schedulesApi, classesApi, teachersApi } from '../services/api';
import { ClassSchedule, Class, Teacher } from '../types';

const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentViewName, setCurrentViewName] = useState('Week');

  // State for custom appointment form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<ClassSchedule>>({});
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedulesData, classesData, teachersData] = await Promise.all([
          schedulesApi.getAll(),
          classesApi.getAll(),
          teachersApi.getAll(),
        ]);
        setSchedules(schedulesData);
        setClasses(classesData);
        setTeachers(teachersData);
      } catch (error) {
        console.error('Error fetching schedule data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get class name by ID
  const getClassName = (classId: number): string => {
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.name : 'Unknown Class';
  };

  // Get teacher name by class ID
  const getTeacherName = (classId: number): string => {
    const classItem = classes.find(c => c.id === classId);
    if (!classItem) return 'Unknown Teacher';

    const teacher = teachers.find(t => t.id === classItem.teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher';
  };

  // Handling scheduler views
  const handleCurrentDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleCurrentViewNameChange = (viewName: string) => {
    setCurrentViewName(viewName);
  };

  // Custom appointment component
  const Appointment = ({ children, data, ...restProps }: any) => {
    const classItem = classes.find(c => c.id === data.classId);
    return (
      <Appointments.Appointment
        {...restProps}
        data={data}
        style={{
          backgroundColor: classItem ? '#1976d2' : '#757575',
          borderRadius: '4px',
        }}
      >
        <div style={{ padding: '2px 8px', color: 'white' }}>
          <strong>{data.title}</strong>
          <div>Teacher: {getTeacherName(data.classId)}</div>
          <div>Room: {classItem?.room || 'N/A'}</div>
        </div>
      </Appointments.Appointment>
    );
  };

  // Custom tooltip component
  const AppointmentContent = ({ children, data, ...restProps }: any) => {
    const classItem = classes.find(c => c.id === data.classId);
    const teacher = classItem 
      ? teachers.find(t => t.id === classItem.teacherId)
      : null;

    return (
      <AppointmentTooltip.Content {...restProps} data={data}>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Class:</Grid>
          <Grid item xs={8}>{data.title}</Grid>
          
          <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Teacher:</Grid>
          <Grid item xs={8}>
            {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'N/A'}
          </Grid>
          
          <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Room:</Grid>
          <Grid item xs={8}>{classItem?.room || 'N/A'}</Grid>
          
          <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Capacity:</Grid>
          <Grid item xs={8}>{classItem?.capacity || 'N/A'}</Grid>
          
          {data.notes && (
            <>
              <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Notes:</Grid>
              <Grid item xs={8}>{data.notes}</Grid>
            </>
          )}
        </Grid>
      </AppointmentTooltip.Content>
    );
  };

  // Handle open form for editing
  const handleOpenForm = (appointmentData?: any) => {
    if (appointmentData) {
      // Edit existing appointment
      setIsNew(false);
      setFormData({
        id: appointmentData.id,
        classId: appointmentData.classId,
        startDate: appointmentData.startDate,
        endDate: appointmentData.endDate,
        title: appointmentData.title,
        notes: appointmentData.notes,
      });
    } else {
      // Create new appointment
      setIsNew(true);
      const now = new Date();
      const startDate = new Date(now);
      startDate.setHours(startDate.getHours() + 1, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);
      
      setFormData({
        classId: classes.length > 0 ? classes[0].id : 0,
        startDate,
        endDate,
        title: classes.length > 0 ? classes[0].name : '',
        notes: '',
      });
    }
    setShowForm(true);
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      if (isNew) {
        // Create new schedule
        const newSchedule = await schedulesApi.create(formData as Omit<ClassSchedule, 'id'>);
        setSchedules([...schedules, newSchedule]);
      } else {
        // Update existing schedule
        const updatedSchedule = await schedulesApi.update(formData.id!, formData);
        if (updatedSchedule) {
          setSchedules(schedules.map(s => s.id === updatedSchedule.id ? updatedSchedule : s));
        }
      }
      setShowForm(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving the schedule');
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle date/time changes
  const handleDateChange = (name: string, date: Date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const classId = parseInt(e.target.value);
    const classItem = classes.find(c => c.id === classId);
    setFormData(prev => ({ 
      ...prev, 
      classId, 
      title: classItem ? classItem.name : '' 
    }));
  };

  // Handle appointment deletion
  const handleDeleteAppointment = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        const success = await schedulesApi.delete(id);
        if (success) {
          setSchedules(schedules.filter(s => s.id !== id));
          setShowForm(false);
        } else {
          alert('Failed to delete the schedule');
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Error deleting the schedule');
      }
    }
  };

  // Convert schedules to appointments format
  const appointments = schedules.map(schedule => ({
    id: schedule.id,
    classId: schedule.classId,
    startDate: new Date(schedule.startDate),
    endDate: new Date(schedule.endDate),
    title: schedule.title || getClassName(schedule.classId),
    notes: schedule.notes,
  }));

  if (loading) {
    return <Typography>Loading schedule data...</Typography>;
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Schedule Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => handleOpenForm()}
        >
          Add Class Schedule
        </Button>
      </Box>

      <Paper>
        <Scheduler data={appointments} height={700}>
          <ViewState
            currentDate={currentDate}
            currentViewName={currentViewName}
            onCurrentDateChange={handleCurrentDateChange}
            onCurrentViewNameChange={handleCurrentViewNameChange}
          />
          <EditingState
            onCommitChanges={({ added, changed, deleted }) => {
              if (deleted !== undefined) {
                handleDeleteAppointment(deleted as number);
              } else if (added !== undefined) {
                handleOpenForm(added);
              } else if (changed !== undefined) {
                const id = Object.keys(changed)[0];
                const appointment = appointments.find(a => a.id === parseInt(id));
                if (appointment) {
                  handleOpenForm({
                    ...appointment,
                    ...changed[id],
                  });
                }
              }
            }}
          />
          <IntegratedEditing />

          <DayView startDayHour={8} endDayHour={21} />
          <WeekView startDayHour={8} endDayHour={21} />
          <MonthView />

          <Toolbar />
          <DateNavigator />
          <TodayButton />
          <ViewSwitcher />
          <Appointments appointmentComponent={Appointment} />
          <AppointmentTooltip
            showOpenButton
            showDeleteButton
            contentComponent={AppointmentContent}
          />
        </Scheduler>
      </Paper>

      {/* Custom Appointment Form */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isNew ? 'Add New Schedule' : 'Edit Schedule'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Class"
                name="classId"
                value={formData.classId || ''}
                onChange={handleClassChange}
                required
              >
                {classes.map((classItem) => (
                  <MenuItem key={classItem.id} value={classItem.id}>
                    {classItem.name} - Room: {classItem.room}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date & Time"
                type="datetime-local"
                value={formData.startDate 
                  ? new Date(formData.startDate).toISOString().slice(0, 16) 
                  : ''}
                onChange={(e) => handleDateChange('startDate', new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date & Time"
                type="datetime-local"
                value={formData.endDate 
                  ? new Date(formData.endDate).toISOString().slice(0, 16) 
                  : ''}
                onChange={(e) => handleDateChange('endDate', new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title (Optional)"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                placeholder="Leave blank to use class name"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Cancel</Button>
          {!isNew && (
            <Button 
              onClick={() => handleDeleteAppointment(formData.id!)} 
              color="error"
            >
              Delete
            </Button>
          )}
          <Button 
            onClick={handleFormSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.classId || !formData.startDate || !formData.endDate}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SchedulePage; 