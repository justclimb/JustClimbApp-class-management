import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Chip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Grid as DataGrid,
  Table,
  TableHeaderRow,
  TableEditRow,
  TableEditColumn,
  PagingPanel,
} from '@devexpress/dx-react-grid-material-ui';
import {
  PagingState,
  IntegratedPaging,
  SortingState,
  IntegratedSorting,
  DataTypeProvider,
  DataTypeProviderProps,
  EditingState,
} from '@devexpress/dx-react-grid';
import { coachesApi, classesApi } from '../services/api';
import { Coach, Class } from '../types';

// Date formatter
const DateFormatter = ({ value }: DataTypeProvider.ValueFormatterProps) => (
  <>{value ? new Date(value).toLocaleDateString() : ''}</>
);

const DateTypeProvider = (props: DataTypeProviderProps) => (
  <DataTypeProvider formatterComponent={DateFormatter} {...props} />
);

// Classes formatter
const ClassesFormatter = ({ value, classes }: DataTypeProvider.ValueFormatterProps & { classes: Class[] }) => {
  if (!value || !Array.isArray(value) || value.length === 0) {
    return <Typography variant="body2">No classes</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {value.map((classId: number) => {
        const classItem = classes.find(c => c.id === classId);
        return classItem ? (
          <Chip
            key={classId}
            label={classItem.name}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        ) : null;
      })}
    </Box>
  );
};

const ClassesTypeProvider = ({ classes, ...props }: DataTypeProviderProps & { classes: Class[] }) => (
  <DataTypeProvider
    formatterComponent={(formatterProps) => <ClassesFormatter classes={classes} {...formatterProps} />}
    {...props}
  />
);

const CoachesPage: React.FC = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentCoach, setCurrentCoach] = useState<Partial<Coach> | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);

  // Grid columns
  const columns = [
    { name: 'id', title: 'ID' },
    { name: 'firstName', title: 'First Name' },
    { name: 'lastName', title: 'Last Name' },
    { name: 'email', title: 'Email' },
    { name: 'phone', title: 'Phone' },
    { name: 'specialization', title: 'Specialization' },
    { name: 'hireDate', title: 'Hire Date' },
    { name: 'classes', title: 'Classes' },
  ];

  const dateColumns = ['hireDate'];
  const classesColumns = ['classes'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coachesData, classesData] = await Promise.all([
          coachesApi.getAll(),
          classesApi.getAll()
        ]);
        setCoaches(coachesData);
        setClasses(classesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddCoach = () => {
    setIsNew(true);
    setCurrentCoach({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialization: '',
      hireDate: new Date(),
      classes: []
    });
    setSelectedClasses([]);
    setShowForm(true);
  };

  const handleEditCoach = (id: number) => {
    const coachToEdit = coaches.find(t => t.id === id);
    if (coachToEdit) {
      setIsNew(false);
      setCurrentCoach({ ...coachToEdit });
      setSelectedClasses([...coachToEdit.classes]);
      setShowForm(true);
    }
  };

  const handleDeleteCoach = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this coach?')) {
      try {
        const success = await coachesApi.delete(id);
        if (success) {
          setCoaches(coaches.filter(t => t.id !== id));
        } else {
          alert('This coach is assigned to one or more classes and cannot be deleted.');
        }
      } catch (error) {
        console.error('Error deleting coach:', error);
        alert('Error deleting the coach');
      }
    }
  };

  const handleFormSubmit = async () => {
    if (!currentCoach) return;

    // Update the classes array with selected classes
    const coachData = {
      ...currentCoach,
      classes: selectedClasses
    };

    try {
      if (isNew) {
        // Create new coach
        const newCoach = await coachesApi.create(coachData as Omit<Coach, 'id'>);
        setCoaches([...coaches, newCoach]);
      } else {
        // Update existing coach
        const updatedCoach = await coachesApi.update(coachData.id!, coachData);
        if (updatedCoach) {
          setCoaches(coaches.map(t => t.id === updatedCoach.id ? updatedCoach : t));
        }
      }
      setShowForm(false);
    } catch (error) {
      console.error('Error saving coach:', error);
      alert('Error saving the coach');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentCoach(prev => {
      if (name === 'hireDate') {
        return { ...prev, [name]: new Date(value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleClassToggle = (classId: number) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  if (loading) {
    return <Typography>Loading coaches data...</Typography>;
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Coaches Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCoach}
        >
          Add Coach
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <DataGrid
          rows={coaches}
          columns={columns}
        >
          <SortingState
            defaultSorting={[{ columnName: 'id', direction: 'asc' }]}
          />
          <IntegratedSorting />
          <PagingState defaultCurrentPage={0} pageSize={10} />
          <IntegratedPaging />
          <Table />
          <TableHeaderRow showSortingControls />
          <DateTypeProvider for={dateColumns} />
          <ClassesTypeProvider for={classesColumns} classes={classes} />
          <TableEditColumn
            showEditCommand
            showDeleteCommand
            commandComponent={({ id, executeCommand }) => {
              const handleClick = () => {
                if (id === 'edit') {
                  const rowId = executeCommand.args[0];
                  handleEditCoach(rowId);
                } else if (id === 'delete') {
                  const rowId = executeCommand.args[0];
                  handleDeleteCoach(rowId);
                }
              };

              return (
                <IconButton onClick={handleClick} size="small">
                  {id === 'edit' ? <EditIcon /> : <DeleteIcon />}
                </IconButton>
              );
            }}
          />
          <PagingPanel />
        </DataGrid>
      </Paper>

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isNew ? 'Add New Coach' : 'Edit Coach'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  label="First Name"
                  fullWidth
                  margin="normal"
                  value={currentCoach?.firstName || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  label="Last Name"
                  fullWidth
                  margin="normal"
                  value={currentCoach?.lastName || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={currentCoach?.email || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Phone"
                  fullWidth
                  margin="normal"
                  value={currentCoach?.phone || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="specialization"
                  label="Specialization"
                  fullWidth
                  margin="normal"
                  value={currentCoach?.specialization || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="hireDate"
                  label="Hire Date"
                  type="date"
                  fullWidth
                  margin="normal"
                  value={currentCoach?.hireDate
                    ? new Date(currentCoach.hireDate).toISOString().slice(0, 10)
                    : ''}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {/* Class selection */}
            <Typography variant="h6" sx={{ mt: 2 }}>
              Assigned Classes
            </Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {classes.map((classItem) => {
                const isAssignedInBackend = classItem.coachId === currentCoach?.id;
                const isAssignedInState = selectedClasses.includes(classItem.id);
                const isDisabled = isAssignedInBackend && !isAssignedInState;

                return (
                  <Grid item key={classItem.id}>
                    <Chip
                      label={classItem.name}
                      color={isAssignedInState ? "primary" : "default"}
                      onClick={() => handleClassToggle(classItem.id)}
                      disabled={isDisabled}
                    />
                  </Grid>
                );
              })}
            </Grid>

            {/* Warning for classes that can't be unassigned */}
            {classes.some(c => c.coachId === currentCoach?.id) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Note: Classes that are directly assigned to this coach in the class settings cannot be unassigned here.
                You need to modify the class settings to change those assignments.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Cancel</Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            color="primary"
            disabled={!currentCoach?.firstName || !currentCoach?.lastName || !currentCoach?.email || !currentCoach?.specialization}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CoachesPage; 