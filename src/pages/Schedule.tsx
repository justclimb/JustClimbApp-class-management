import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, Chip, Divider, FormControl, RadioGroup, FormControlLabel, Radio, Switch } from '@mui/material';
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
  ConfirmationDialog,
  EditRecurrenceMenu,
  Resources,
  GroupingPanel,
  DragDropProvider,
  AllDayPanel,
  CurrentTimeIndicator,
} from '@devexpress/dx-react-scheduler-material-ui';
import {
  ViewState,
  EditingState,
  IntegratedEditing,
  GroupingState,
  IntegratedGrouping,
  AppointmentModel,
  ChangeSet,
  DragDropProvider as DragDropProviderCore,
} from '@devexpress/dx-react-scheduler';
import { schedulesApi, classesApi, coachesApi } from '../services/api';
import { ClassSchedule, Class, Coach } from '../types';
import DeleteIcon from '@mui/icons-material/Delete';

// Add exDate property to ClassSchedule for handling recurring exceptions
// Add coachId to the ExtendedClassSchedule interface for grouping functionality
interface ExtendedClassSchedule extends ClassSchedule {
  exDate?: string;
  // Recurrence form properties
  recurrenceType?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval?: number;
  selectedDays?: string[];
  monthDay?: number;
  endType?: 'never' | 'count' | 'until';
  endCount?: number;
  endDate: Date;
  // Add coach information for grouping
  coachId?: number;
}

// Helper function to parse UNTIL date from RRULE
const parseUntilDate = (rRule: string): Date => {
  try {
    if (rRule.includes('UNTIL=')) {
      const untilMatch = rRule.match(/UNTIL=(\d{8}T\d{6}Z)/);
      if (untilMatch && untilMatch[1]) {
        const untilStr = untilMatch[1];
        const year = parseInt(untilStr.substring(0, 4));
        const month = parseInt(untilStr.substring(4, 6)) - 1; // JS months are 0-indexed
        const day = parseInt(untilStr.substring(6, 8));
        return new Date(Date.UTC(year, month, day));
      }
    }
    return new Date(); // Return today if parsing fails
  } catch (error) {
    console.error('Error parsing UNTIL date:', error);
    return new Date();
  }
};

const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<ExtendedClassSchedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentViewName, setCurrentViewName] = useState('Week');
  // Add state for grouping by coach
  const [groupByCoach, setGroupByCoach] = useState(false);

  // State for custom appointment form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<ExtendedClassSchedule>>({});
  const [isNew, setIsNew] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedulesData, classesData, coachesData] = await Promise.all([
          schedulesApi.getAll(),
          classesApi.getAll(),
          coachesApi.getAll(),
        ]);
        setSchedules(schedulesData);
        setClasses(classesData);
        setCoaches(coachesData);
      } catch (error) {
        console.error('Error fetching schedule data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get class name by ID
  const getClassName = (classId?: number): string => {
    if (classId === undefined || classId === null) return 'Unknown Class';
    const classItem = classes ? classes.find(c => c && c.id === classId) : undefined;
    return classItem ? classItem.name : 'Unknown Class';
  };

  // Get coach name by class ID
  const getCoachName = (classId?: number): string => {
    if (classId === undefined || classId === null) return 'Unknown Coach';
    const classItem = classes ? classes.find(c => c && c.id === classId) : undefined;
    if (!classItem) return 'Unknown Coach';

    const coach = coaches && classItem.coachId ? coaches.find(t => t && t.id === classItem.coachId) : undefined;
    return coach ? `${coach.firstName || ''} ${coach.lastName || ''}`.trim() : 'Unknown Coach';
  };

  // Get coach ID by class ID
  const getCoachId = (classId?: number): number | undefined => {
    if (classId === undefined || classId === null) return undefined;
    const classItem = classes ? classes.find(c => c && c.id === classId) : undefined;
    return classItem && classItem.coachId ? classItem.coachId : undefined;
  };

  // Handling scheduler views
  const handleCurrentDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleCurrentViewNameChange = (viewName: string) => {
    setCurrentViewName(viewName);
  };

  // Toggle group by coach
  const handleGroupByCoachChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGroupByCoach(event.target.checked);
  };

  // Custom appointment component
  const Appointment = ({ children, data, ...restProps }: any) => {
    // Add a safety check for data being undefined
    if (!data || data.classId === undefined) {
      return (
        <Appointments.Appointment
          {...restProps}
          style={{
            backgroundColor: '#757575',
            borderRadius: '4px',
          }}
        >
          <div style={{ padding: '2px 8px', color: 'white' }}>
            <strong>Invalid Appointment</strong>
          </div>
        </Appointments.Appointment>
      );
    }

    const classItem = classes?.find(c => c?.id === data.classId);
    // Check if this is a recurring class
    const isRecurring = data.rRule !== undefined;
    
    // Different style for recurring classes
    const backgroundColor = isRecurring ? '#8c6cef' : (classItem ? '#1976d2' : '#757575');
    const borderStyle = isRecurring ? '2px dashed rgba(255,255,255,0.5)' : 'none';
    
    return (
      <Appointments.Appointment
        {...restProps}
        data={data}
        style={{
          backgroundColor,
          borderRadius: '4px',
          borderLeft: borderStyle,
          borderRight: borderStyle,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isRecurring && (
          <div 
            style={{ 
              position: 'absolute', 
              top: 0, 
              right: 0, 
              backgroundColor: 'rgba(255,255,255,0.3)', 
              padding: '1px 4px',
              borderBottomLeftRadius: '4px',
              fontSize: '10px',
              color: 'white'
            }}
          >
            ↻
          </div>
        )}
        <div style={{ padding: '2px 8px', color: 'white' }}>
          <strong>{data.title}</strong>
          {!groupByCoach && <div>Coach: {getCoachName(data.classId)}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Room: {classItem?.room || 'N/A'}</span>
          </div>
        </div>
      </Appointments.Appointment>
    );
  };

  // Custom tooltip component
  const AppointmentContent = ({ children, data, ...restProps }: any) => {
    // Add a safety check for data being undefined
    if (!data || data.classId === undefined) {
      return (
        <AppointmentTooltip.Content {...restProps}>
          <Typography>No appointment data available</Typography>
        </AppointmentTooltip.Content>
      );
    }

    const classItem = classes?.find(c => c?.id === data.classId);
    const coach = classItem && coaches
      ? coaches.find(t => t?.id === data.coachId)
      : null;
    
    // Check if this is a recurring class
    const isRecurring = data.rRule !== undefined;

    return (
      <AppointmentTooltip.Content {...restProps} data={data}>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Class:</Grid>
          <Grid item xs={8}>{data.title}</Grid>
          
          <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Coach:</Grid>
          <Grid item xs={8}>
            {coach ? `${coach.firstName} ${coach.lastName}` : 'N/A'}
          </Grid>
          
          <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Room:</Grid>
          <Grid item xs={8}>{classItem?.room || 'N/A'}</Grid>
          
          <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Time:</Grid>
          <Grid item xs={8}>
            {new Date(data.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
            {new Date(data.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Grid>
          
          {isRecurring && (
            <>
              <Grid item xs={4} sx={{ fontWeight: 'bold' }}>Recurrence:</Grid>
              <Grid item xs={8}>
                <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {data.rRule}
                </Typography>
              </Grid>
            </>
          )}
          
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

  // Handle opening form for new appointment or editing existing one
  const handleOpenForm = (appointmentData?: any) => {
    if (appointmentData) {
      // Editing existing appointment
      setIsNew(false);
      setFormData({
        id: appointmentData.id,
        classId: appointmentData.classId,
        startDate: appointmentData.startDate,
        title: appointmentData.title,
        notes: appointmentData.notes,
        rRule: appointmentData.rRule,
        exDate: appointmentData.exDate,
        coachId: appointmentData.coachId,
        
        // Set recurrence form fields based on rRule if it exists
        recurrenceType: appointmentData.rRule ? 
          (appointmentData.rRule.includes('FREQ=DAILY') ? 'daily' : 
          appointmentData.rRule.includes('FREQ=WEEKLY') ? 'weekly' :
          appointmentData.rRule.includes('FREQ=MONTHLY') ? 'monthly' :
          appointmentData.rRule.includes('FREQ=YEARLY') ? 'yearly' : 'custom') : 'none',
        
        // Try to parse interval
        interval: appointmentData.rRule?.match(/INTERVAL=(\d+)/)?.[1] 
          ? parseInt(appointmentData.rRule.match(/INTERVAL=(\d+)/)[1]) : 1,
        
        // Try to parse selected days for weekly recurrence
        selectedDays: appointmentData.rRule?.includes('BYDAY=') 
          ? appointmentData.rRule.match(/BYDAY=([^;]+)/)[1].split(',') 
          : ['MO'],
        
        // Try to parse monthly day
        monthDay: appointmentData.rRule?.includes('BYMONTHDAY=') 
          ? parseInt(appointmentData.rRule.match(/BYMONTHDAY=(\d+)/)[1]) 
          : new Date(appointmentData.startDate).getDate(),
        
        // Parse end type
        endType: appointmentData.rRule?.includes('COUNT=') 
          ? 'count' 
          : appointmentData.rRule?.includes('UNTIL=') 
          ? 'until' 
          : 'never',
        
        // Parse count if present
        endCount: appointmentData.rRule?.includes('COUNT=') 
          ? parseInt(appointmentData.rRule.match(/COUNT=(\d+)/)[1]) 
          : 10,
        
        // Set end date (for both the appointment end and recurrence end)
        endDate: appointmentData.rRule?.includes('UNTIL=') 
          ? parseUntilDate(appointmentData.rRule) 
          : appointmentData.endDate,
      });
    } else {
      // Creating new appointment
      setIsNew(true);
      setFormData({
        classId: undefined,
        startDate: new Date(Math.ceil(new Date().getTime() / (30*60*1000)) * (30*60*1000)), // Round to next half hour
        endDate: new Date(Math.ceil(new Date().getTime() / (30*60*1000)) * (30*60*1000) + 60*60*1000), // 1 hour later
        title: '',
        notes: '',
        recurrenceType: 'none',
      });
    }
    setShowForm(true);
  };

  // Handle commit changes
  const commitChanges = async ({ added, changed, deleted }: ChangeSet) => {
    try {
      let updatedSchedules = [...schedules];

      if (added) {
        // For recurrence handling, we'll use the DevExpress scheduler's built-in functionality
        const newSchedule = await schedulesApi.create(added as Omit<ExtendedClassSchedule, 'id'>);
        updatedSchedules = [...updatedSchedules, newSchedule];
      }

      if (changed) {
        const changedAppointment = Object.keys(changed)[0];
        const appointmentIndex = updatedSchedules.findIndex(
          appointment => appointment.id === parseInt(changedAppointment)
        );
        
        if (appointmentIndex > -1) {
          const originalAppointment = updatedSchedules[appointmentIndex];
          const changesObj = changed[changedAppointment];
          
          // Check if this is a recurring appointment
          const isRecurring = originalAppointment.rRule;
          
          // Create the updated appointment object
          const updatedAppointment = {
            ...originalAppointment,
            ...changesObj
          };
          
          // If it's a recurring appointment and we're modifying the date/time,
          // confirm with the user which instances to update
          if (isRecurring && 
              (changesObj.startDate || changesObj.endDate) &&
              !window.confirm('This is a recurring appointment. Do you want to update all instances?')) {
            // User chose not to update all instances
            // Here you would typically handle exception dates with exDate
            // For simplicity, we'll just cancel the edit
            return;
          }
          
          const result = await schedulesApi.update(
            updatedAppointment.id, 
            updatedAppointment
          );
          
          if (result) {
            updatedSchedules = [
              ...updatedSchedules.slice(0, appointmentIndex),
              updatedAppointment,
              ...updatedSchedules.slice(appointmentIndex + 1)
            ];
          }
        }
      }

      if (deleted !== undefined) {
        // Check if it's a recurring appointment
        const appointmentToDelete = schedules.find(s => s.id === deleted);
        if (appointmentToDelete?.rRule && 
            !window.confirm('This is a recurring appointment. Do you want to delete all instances?')) {
          // User chose not to delete all instances
          return;
        }
        
        const success = await schedulesApi.delete(deleted as number);
        if (success) {
          updatedSchedules = updatedSchedules.filter(
            appointment => appointment.id !== deleted
          );
        }
      }

      setSchedules(updatedSchedules);
    } catch (error) {
      console.error('Error managing schedule:', error);
      alert('Error updating schedule');
    }
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      setFormSubmitting(true);

      // Validate form data
      if (!formData.title && !formData.classId) {
        setFormError('Please fill in all required fields');
        setFormSubmitting(false);
        return;
      }

      // Make sure we always have a valid endDate
      const endDate = formData.endDate || new Date();

      // Get coach ID for the selected class
      const coachId = getCoachId(formData.classId);

      if (isNew) {
        // Create new schedule
        const newSchedule = await schedulesApi.create({
          ...formData,
          endDate, // Use the validated endDate
          coachId, // Add coach ID
          title: formData.title || getClassName(formData.classId) // Use class name if title not provided
        } as Omit<ExtendedClassSchedule, 'id'>);
        setSchedules([...schedules, newSchedule]);
      } else {
        // Update existing schedule
        const updatedSchedule = await schedulesApi.update(formData.id!, {
          ...formData,
          endDate, // Use the validated endDate
          coachId, // Add coach ID
          title: formData.title || getClassName(formData.classId) // Use class name if title not provided
        } as Omit<ExtendedClassSchedule, 'id'>);
        if (updatedSchedule) {
          setSchedules(schedules.map(s => s.id === updatedSchedule.id ? updatedSchedule : s));
        }
      }

      setShowForm(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormError('An error occurred while saving the schedule');
    } finally {
      setFormSubmitting(false);
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

  // Handle class selection change
  const handleClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const classId = Number(e.target.value);
    const classItem = classes.find(c => c.id === classId);
    const coachId = classItem?.coachId;
    
    setFormData({
      ...formData,
      classId,
      coachId,
      // If title is empty, use class name as default title
      title: formData.title || (classItem ? classItem.name : '')
    });
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
  const appointments = schedules
    // Filter out null or undefined schedules
    .filter(schedule => schedule !== null && schedule !== undefined)
    // Map schedules to appointment format with better error handling
    .map(schedule => {
      // Check if schedule is a valid object and has the required properties
      if (!schedule || typeof schedule !== 'object' || schedule.classId === undefined) {
        console.warn('Invalid schedule data found:', schedule);
        return null;
      }
      
      try {
        // Get the coach ID for this class
        const coachId = getCoachId(schedule.classId);
        
        // Create appointment with safe access to properties, providing fallbacks
        return {
          id: schedule.id,
          classId: schedule.classId,
          startDate: schedule.startDate ? new Date(schedule.startDate) : new Date(),
          endDate: schedule.endDate ? new Date(schedule.endDate) : new Date(),
          title: schedule.title || getClassName(schedule.classId) || 'Untitled Class',
          notes: schedule.notes || '',
          rRule: schedule.rRule || undefined,
          exDate: schedule.exDate || undefined,
          // Add coach ID for grouping
          coachId: coachId || 0 // Default to 0 if no coach is found
        };
      } catch (error) {
        console.error('Error converting schedule to appointment:', error, schedule);
        return null;
      }
    })
    // Filter out any null appointments that resulted from errors
    .filter(Boolean) as AppointmentModel[];

  // Create resources for coach grouping
  const resources = [{
    fieldName: 'coachId',
    title: 'Coach',
    instances: coaches && coaches.length > 0 
      ? coaches?.map(coach => ({
          id: coach?.id || 0,
          text: coach ? `${coach.firstName || ''} ${coach.lastName || ''}`.trim() : 'Unknown Coach'
        })) || []
      : [{ id: 0, text: 'No Coaches Available' }],
    allowMultiple: false,
  }];

  if (loading) {
    return <Typography>Loading schedule data...</Typography>;
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Schedule Management
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={groupByCoach}
                onChange={handleGroupByCoachChange}
                color="primary"
              />
            }
            label="Group by Coach"
            sx={{ mr: 2 }}
          />
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => handleOpenForm()}
          >
            Add Class
          </Button>
        </Box>
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
            onCommitChanges={commitChanges}
          />
          <IntegratedEditing />
          
          <DayView startDayHour={8} endDayHour={21} />
          <WeekView startDayHour={8} endDayHour={21} />
          <MonthView />

          <Toolbar />
          <DateNavigator />
          <TodayButton />
          <ViewSwitcher />
          
          {/* Appointments must come before Resources */}
          <Appointments appointmentComponent={Appointment} />
          
          {/* Resources now comes after Appointments */}
          <Resources
            data={resources || [{ 
              fieldName: 'coachId',
              title: 'Coach',
              instances: [{ id: 0, text: 'No Coaches Available' }],
              allowMultiple: false,
            }]}
          />
          
          {/* Only include GroupingState when groupByCoach is true */}
          {groupByCoach ? (
            <>
              <GroupingState
                grouping={[{ resourceName: 'coachId' }]}
              />
              <IntegratedGrouping />
              <GroupingPanel />
            </>
          ) : null}
          
          {/* EditRecurrenceMenu must come before DragDropProvider */}
          <EditRecurrenceMenu />
          
          {/* Support for all-day appointments - must come before DragDropProvider */}
          <AllDayPanel />
          
          {/* Add support for drag-and-drop */}
          <DragDropProvider />
          
          {/* Show current time indicator */}
          <CurrentTimeIndicator updateInterval={60000} />
          
          <ConfirmationDialog />
          <AppointmentTooltip
            showOpenButton
            showDeleteButton
            contentComponent={AppointmentContent}
          />
          <AppointmentForm />
        </Scheduler>
      </Paper>

      {/* Custom Appointment Form */}
      <Dialog 
        open={showForm} 
        onClose={() => setShowForm(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, boxShadow: 24 }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
          {isNew ? 'Add New Class Schedule' : 'Edit Class Schedule'}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Class"
                name="classId"
                value={formData.classId || ''}
                onChange={handleClassChange}
                required
                variant="outlined"
                error={!formData.classId}
                helperText={!formData.classId ? "Please select a class" : ""}
              >
                {(classes || []).map((classItem) => (
                  <MenuItem key={classItem?.id || 'unknown'} value={classItem?.id || ''}>
                    {classItem?.name || 'Unknown'} - Room: {classItem?.room || 'N/A'} (Coach: {getCoachName(classItem?.id)})
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
                variant="outlined"
                error={!formData.startDate}
                helperText={!formData.startDate ? "Start date and time is required" : ""}
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
                variant="outlined"
                error={!formData.endDate}
                helperText={!formData.endDate ? "End date and time is required" : formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate) ? "End time must be after start time" : ""}
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
                variant="outlined"
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
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom component="div" sx={{ mt: 1 }}>
                Recurrence Pattern (Optional)
              </Typography>
              
              <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
                {/* Recurrence Type Selector */}
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Repeat"
                      value={formData.recurrenceType || 'none'}
                      onChange={(e) => {
                        const value = e.target.value;
                        const recType = value as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
                        const newFormData = { ...formData, recurrenceType: recType };
                        
                        // Clear the rRule when changing recurrence type
                        if (value === 'none') {
                          delete newFormData.rRule;
                        }
                        
                        setFormData(newFormData);
                      }}
                      variant="outlined"
                    >
                      <MenuItem value="none">Does not repeat</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                      <MenuItem value="custom">Custom...</MenuItem>
                    </TextField>
                  </Grid>
                  
                  {/* Conditional recurrence options based on selected type */}
                  {formData.recurrenceType === 'daily' && (
                    <Grid item xs={12}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Typography>Every</Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            type="number"
                            inputProps={{ min: 1, max: 365 }}
                            value={formData.interval || 1}
                            onChange={(e) => {
                              const interval = parseInt(e.target.value) || 1;
                              const rRule = `FREQ=DAILY;INTERVAL=${interval}`;
                              setFormData({ ...formData, interval, rRule });
                            }}
                            size="small"
                          />
                        </Grid>
                        <Grid item>
                          <Typography>day(s)</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  )}
                  
                  {formData.recurrenceType === 'weekly' && (
                    <Grid item xs={12}>
                      <Grid container spacing={2} direction="column">
                        <Grid item container alignItems="center" spacing={2}>
                          <Grid item>
                            <Typography>Every</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <TextField
                              type="number"
                              inputProps={{ min: 1, max: 52 }}
                              value={formData.interval || 1}
                              onChange={(e) => {
                                const interval = parseInt(e.target.value) || 1;
                                setFormData({ ...formData, interval });
                                
                                // Update the rRule based on days of week and interval
                                const selectedDays = formData.selectedDays || ['MO'];
                                const rRule = `FREQ=WEEKLY;INTERVAL=${interval};BYDAY=${selectedDays.join(',')}`;
                                setFormData(prev => ({ ...prev, interval, rRule }));
                              }}
                              size="small"
                            />
                          </Grid>
                          <Grid item>
                            <Typography>week(s) on:</Typography>
                          </Grid>
                        </Grid>
                        
                        <Grid item container spacing={1} sx={{ mt: 1 }}>
                          {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((day, index) => {
                            const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                            const selectedDays = formData.selectedDays || ['MO'];
                            const isSelected = selectedDays.includes(day);
                            
                            return (
                              <Grid item key={day}>
                                <Chip 
                                  label={dayLabels[index]?.substring(0, 3) || day} 
                                  color={isSelected ? "primary" : "default"}
                                  onClick={() => {
                                    let newSelectedDays;
                                    if (isSelected) {
                                      // Remove day, but ensure at least one day remains selected
                                      newSelectedDays = selectedDays.filter(d => d !== day);
                                      if (newSelectedDays.length === 0) {
                                        newSelectedDays = ['MO']; // Default to Monday if nothing selected
                                      }
                                    } else {
                                      // Add day
                                      newSelectedDays = [...selectedDays, day];
                                    }
                                    
                                    // Update the rRule
                                    const interval = formData.interval || 1;
                                    const rRule = `FREQ=WEEKLY;INTERVAL=${interval};BYDAY=${newSelectedDays.join(',')}`;
                                    setFormData({ ...formData, selectedDays: newSelectedDays, rRule });
                                  }}
                                />
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Grid>
                    </Grid>
                  )}
                  
                  {formData.recurrenceType === 'monthly' && (
                    <Grid item xs={12}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Typography>Day</Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            type="number"
                            inputProps={{ min: 1, max: 31 }}
                            value={formData.monthDay || new Date(formData.startDate || new Date()).getDate()}
                            onChange={(e) => {
                              const monthDay = parseInt(e.target.value) || 1;
                              const rRule = `FREQ=MONTHLY;BYMONTHDAY=${monthDay}`;
                              setFormData({ ...formData, monthDay, rRule });
                            }}
                            size="small"
                          />
                        </Grid>
                        <Grid item>
                          <Typography>of every</Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            type="number"
                            inputProps={{ min: 1, max: 12 }}
                            value={formData.interval || 1}
                            onChange={(e) => {
                              const interval = parseInt(e.target.value) || 1;
                              const monthDay = formData.monthDay || new Date(formData.startDate || new Date()).getDate();
                              const rRule = `FREQ=MONTHLY;INTERVAL=${interval};BYMONTHDAY=${monthDay}`;
                              setFormData({ ...formData, interval, rRule });
                            }}
                            size="small"
                          />
                        </Grid>
                        <Grid item>
                          <Typography>month(s)</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  )}
                  
                  {formData.recurrenceType === 'yearly' && (
                    <Grid item xs={12}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Typography>Every</Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            type="number"
                            inputProps={{ min: 1, max: 10 }}
                            value={formData.interval || 1}
                            onChange={(e) => {
                              const interval = parseInt(e.target.value) || 1;
                              const startDate = new Date(formData.startDate || new Date());
                              const month = startDate.getMonth() + 1;
                              const day = startDate.getDate();
                              const rRule = `FREQ=YEARLY;INTERVAL=${interval};BYMONTH=${month};BYMONTHDAY=${day}`;
                              setFormData({ ...formData, interval, rRule });
                            }}
                            size="small"
                          />
                        </Grid>
                        <Grid item>
                          <Typography>year(s) on the same date</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  )}
                  
                  {formData.recurrenceType === 'custom' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Custom Recurrence Rule (RRULE format)"
                        name="rRule"
                        value={formData.rRule || ''}
                        onChange={handleInputChange}
                        placeholder="e.g. FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        For advanced recurrence rules, enter in iCalendar RRULE format
                      </Typography>
                    </Grid>
                  )}
                  
                  {/* End recurrence options */}
                  {formData.recurrenceType && formData.recurrenceType !== 'none' && formData.recurrenceType !== 'custom' && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2">Ends</Typography>
                      <FormControl component="fieldset">
                        <RadioGroup
                          value={formData.endType || 'never'}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Ensure value is cast to proper type
                            const endTypeValue = value as 'never' | 'count' | 'until';
                            setFormData({ ...formData, endType: endTypeValue });
                            
                            // Update rRule based on end type
                            let rRule = formData.rRule || '';
                            
                            // Remove any existing end conditions
                            rRule = rRule.replace(/;COUNT=\d+/, '').replace(/;UNTIL=\d+T\d+Z/, '');
                            
                            if (endTypeValue === 'count' && formData.endCount) {
                              rRule += `;COUNT=${formData.endCount}`;
                            } else if (endTypeValue === 'until' && formData.endDate) {
                              const date = new Date(formData.endDate);
                              const untilStr = date.getUTCFullYear() +
                                String(date.getUTCMonth() + 1).padStart(2, '0') +
                                String(date.getUTCDate()).padStart(2, '0') + 'T000000Z';
                              rRule += `;UNTIL=${untilStr}`;
                            }
                            
                            setFormData(prev => ({ ...prev, endType: endTypeValue, rRule }));
                          }}
                        >
                          <FormControlLabel value="never" control={<Radio />} label="Never" />
                          <FormControlLabel value="count" control={<Radio />} label={
                            <Box display="flex" alignItems="center">
                              <Typography sx={{ mr: 1 }}>After</Typography>
                              <TextField
                                type="number"
                                inputProps={{ min: 1, max: 999 }}
                                value={formData.endCount || 10}
                                disabled={formData.endType !== 'count'}
                                onChange={(e) => {
                                  const endCount = parseInt(e.target.value) || 10;
                                  let rRule = (formData.rRule || '').replace(/;COUNT=\d+/, '');
                                  rRule += `;COUNT=${endCount}`;
                                  setFormData({ ...formData, endCount, rRule });
                                }}
                                size="small"
                                sx={{ width: '80px', mx: 1 }}
                              />
                              <Typography>occurrences</Typography>
                            </Box>
                          } />
                          <FormControlLabel value="until" control={<Radio />} label={
                            <Box display="flex" alignItems="center">
                              <Typography sx={{ mr: 1 }}>On</Typography>
                              <TextField
                                type="date"
                                value={formData.endDate 
                                  ? new Date(formData.endDate).toISOString().slice(0, 10) 
                                  : new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10)}
                                disabled={formData.endType !== 'until'}
                                onChange={(e) => {
                                  const endDate = new Date(e.target.value);
                                  let rRule = (formData.rRule || '').replace(/;UNTIL=\d+T\d+Z/, '');
                                  const untilStr = endDate.getUTCFullYear() +
                                    String(endDate.getUTCMonth() + 1).padStart(2, '0') +
                                    String(endDate.getUTCDate()).padStart(2, '0') + 'T000000Z';
                                  rRule += `;UNTIL=${untilStr}`;
                                  setFormData({ ...formData, endDate, rRule });
                                }}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Box>
                          } />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                  )}
                  
                  {formData.rRule && (
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ bgcolor: 'info.50', p: 1, borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {formData.rRule}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Grid>
            {formData.rRule && !isNew && (
              <Grid item xs={12}>
                <Box sx={{ bgcolor: 'warning.100', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" color="warning.dark">
                    <b>Warning:</b> You are editing a recurring class. Changes will affect all instances of this class.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.default' }}>
          <Button 
            onClick={() => setShowForm(false)} 
            variant="outlined"
          >
            Cancel
          </Button>
          {!isNew && (
            <Button 
              onClick={() => handleDeleteAppointment(formData.id!)} 
              color="error"
              variant="outlined"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          )}
          <Button 
            onClick={handleFormSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.classId || !formData.startDate || !formData.endDate || 
                      (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate))}
          >
            {isNew ? 'Create Schedule' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SchedulePage; 