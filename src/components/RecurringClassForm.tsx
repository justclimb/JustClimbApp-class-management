import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  MenuItem, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  FormGroup,
  SelectChangeEvent
} from '@mui/material';
import { Class, ClassSchedule } from '../types';
import { RRule, Weekday } from 'rrule';

interface RecurringClassFormProps {
  open: boolean;
  onClose: () => void;
  classes: Class[];
  onSave: (schedules: Omit<ClassSchedule, 'id'>[]) => Promise<void>;
}

const RecurringClassForm: React.FC<RecurringClassFormProps> = ({ 
  open, 
  onClose, 
  classes, 
  onSave 
}) => {
  const [classId, setClassId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [frequency, setFrequency] = useState<string>('WEEKLY');
  const [interval, setInterval] = useState<number>(1);
  const [weekdays, setWeekdays] = useState<number[]>([RRule.MO.weekday]);
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const handleClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClassId(value === '' ? '' : Number(value));
    const selectedClass = classes.find(c => c.id === Number(value));
    if (selectedClass) {
      setTitle(selectedClass.name);
    }
  };

  const handleFrequencyChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    setFrequency(value);
    // Reset weekdays if not weekly
    if (value !== 'WEEKLY') {
      setWeekdays([]);
    } else {
      setWeekdays([RRule.MO.weekday]);
    }
  };

  const handleWeekdayToggle = (weekday: number) => {
    if (weekdays.includes(weekday)) {
      setWeekdays(weekdays.filter(day => day !== weekday));
    } else {
      setWeekdays([...weekdays, weekday]);
    }
  };

  const getWeekdayLabel = (weekday: number): string => {
    switch (weekday) {
      case 0: return 'Monday';
      case 1: return 'Tuesday';
      case 2: return 'Wednesday';
      case 3: return 'Thursday';
      case 4: return 'Friday';
      case 5: return 'Saturday';
      case 6: return 'Sunday';
      default: return '';
    }
  };

  const handleSubmit = async () => {
    if (!classId || !startDate || !endDate || !startTime || !endTime || 
        (frequency === 'WEEKLY' && weekdays.length === 0)) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create RRule for recurrence
      const dtstart = new Date(`${startDate}T${startTime}`);
      const until = new Date(`${endDate}T23:59:59`);
      
      // Calculate class duration in milliseconds
      const startDateTime = new Date(`1970-01-01T${startTime}:00`);
      const endDateTime = new Date(`1970-01-01T${endTime}:00`);
      const durationMs = endDateTime.getTime() - startDateTime.getTime();
      
      // Build the rule
      const rRuleOptions: any = {
        freq: RRule[frequency as keyof typeof RRule],
        interval: interval,
        dtstart: dtstart,
        until: until
      };

      // Add byweekday for weekly recurrence
      if (frequency === 'WEEKLY' && weekdays.length > 0) {
        rRuleOptions.byweekday = weekdays.map(day => {
          switch (day) {
            case 0: return RRule.MO;
            case 1: return RRule.TU;
            case 2: return RRule.WE;
            case 3: return RRule.TH;
            case 4: return RRule.FR;
            case 5: return RRule.SA;
            case 6: return RRule.SU;
            default: return RRule.MO;
          }
        });
      }

      // Add count if specified
      if (count !== null && count > 0) {
        rRuleOptions.count = count;
        delete rRuleOptions.until;
      }

      const rule = new RRule(rRuleOptions);
      
      // Generate all occurrence dates
      const occurrences = rule.all();
      
      // Create schedule objects for each occurrence
      const schedules: Omit<ClassSchedule, 'id'>[] = occurrences.map(date => {
        const startDateTime = new Date(date);
        const endDateTime = new Date(startDateTime.getTime() + durationMs);
        
        return {
          classId: classId as number,
          startDate: startDateTime,
          endDate: endDateTime,
          title: title || undefined,
          notes: notes || undefined,
          rRule: rule.toString()
        };
      });
      
      // Save all schedules
      await onSave(schedules);
      handleClose();
    } catch (error) {
      console.error('Error creating recurring class:', error);
      alert('Failed to create recurring class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setClassId('');
    setStartDate('');
    setEndDate('');
    setStartTime('09:00');
    setEndTime('10:00');
    setFrequency('WEEKLY');
    setInterval(1);
    setWeekdays([RRule.MO.weekday]);
    setCount(null);
    setTitle('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>Create Recurring Class</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Class"
              value={classId}
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
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={frequency}
                label="Frequency"
                onChange={handleFrequencyChange}
              >
                <MenuItem value="DAILY">Daily</MenuItem>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="MONTHLY">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Interval"
              type="number"
              value={interval}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
              helperText={`Every ${interval} ${frequency.toLowerCase()}${interval > 1 ? 's' : ''}`}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 1 }}
            />
          </Grid>

          {frequency === 'WEEKLY' && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Repeat on:
              </Typography>
              <FormGroup row>
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <FormControlLabel
                    key={day}
                    control={
                      <Checkbox
                        checked={weekdays.includes(day)}
                        onChange={() => handleWeekdayToggle(day)}
                      />
                    }
                    label={getWeekdayLabel(day)}
                  />
                ))}
              </FormGroup>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Number of Occurrences (optional)"
              type="number"
              value={count === null ? '' : count}
              onChange={(e) => setCount(e.target.value === '' ? null : Math.max(1, parseInt(e.target.value)))}
              helperText="Leave empty to repeat until end date"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 1 }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title (Optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to use class name"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Recurring Classes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringClassForm; 