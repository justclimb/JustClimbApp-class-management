import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Chip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Grid as DataGrid,
  Table,
  TableHeaderRow,
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    fetchData();
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!currentCoach?.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!currentCoach?.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!currentCoach?.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(currentCoach.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!currentCoach?.specialization?.trim()) {
      errors.specialization = 'Specialization is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
    setFormErrors({});
    setShowForm(true);
  };

  const handleEditCoach = (id: number) => {
    const coachToEdit = coaches.find(t => t.id === id);
    if (coachToEdit) {
      setIsNew(false);
      setCurrentCoach({ ...coachToEdit });
      setSelectedClasses([...coachToEdit.classes]);
      setFormErrors({});
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

    if (!validateForm()) {
      return;
    }

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
      if (!prev) return null;
      
      if (name === 'hireDate') {
        return { ...prev, [name]: new Date(value) };
      }
      return { ...prev, [name]: value };
    });
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleClassToggle = (classId: number) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  // Handle DevExpress grid edit/delete actions
  const commitChanges = ({ deleted }: any) => {
    if (deleted) {
      handleDeleteCoach(deleted[0]);
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
          <EditingState 
            onCommitChanges={commitChanges}
          />
          <Table />
          <TableHeaderRow showSortingControls />
          <DateTypeProvider for={dateColumns} />
          <ClassesTypeProvider for={classesColumns} classes={classes} />
          <TableEditColumn
            showEditCommand
            showDeleteCommand
            commandComponent={({ id, onExecute }) => {
              const handleClick = () => {
                if (id === 'edit') {
                  const rowId = onExecute() as any;
                  handleEditCoach(rowId);
                } else if (id === 'delete') {
                  const rowId = onExecute() as any;
                  handleDeleteCoach(rowId);
                }
              };

              return (
                <Button
                  size="small"
                  color={id === 'delete' ? 'error' : 'primary'}
                  onClick={handleClick}
                  startIcon={id === 'edit' ? <EditIcon /> : <DeleteIcon />}
                >
                  {id === 'edit' ? 'Edit' : 'Delete'}
                </Button>
              );
            }}
          />
          <PagingPanel />
        </DataGrid>
      </Paper>

      {/* Form Dialog */}
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
          {isNew ? 'Add New Coach' : 'Edit Coach'}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  label="First Name"
                  fullWidth
                  value={currentCoach?.firstName || ''}
                  onChange={handleInputChange}
                  required
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  variant="outlined"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  label="Last Name"
                  fullWidth
                  value={currentCoach?.lastName || ''}
                  onChange={handleInputChange}
                  required
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  value={currentCoach?.email || ''}
                  onChange={handleInputChange}
                  required
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Phone"
                  fullWidth
                  value={currentCoach?.phone || ''}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="specialization"
                  label="Specialization"
                  fullWidth
                  value={currentCoach?.specialization || ''}
                  onChange={handleInputChange}
                  required
                  error={!!formErrors.specialization}
                  helperText={formErrors.specialization}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="hireDate"
                  label="Hire Date"
                  type="date"
                  fullWidth
                  value={currentCoach?.hireDate
                    ? new Date(currentCoach.hireDate).toISOString().slice(0, 10)
                    : ''}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
            </Grid>

            {/* Class selection */}
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Assigned Classes
            </Typography>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'background.paper' }}>
              <Grid container spacing={1}>
                {classes.length > 0 ? (
                  classes.map((classItem) => {
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
                          sx={{ m: 0.5 }}
                        />
                      </Grid>
                    );
                  })
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      No classes available
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Warning for classes that can't be unassigned */}
              {classes.some(c => c.coachId === currentCoach?.id) && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 2 }}>
                  Note: Classes that are directly assigned to this coach in the class settings cannot be unassigned here.
                  You need to modify the class settings to change those assignments.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.default' }}>
          <Button 
            onClick={() => setShowForm(false)} 
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            color="primary"
          >
            {isNew ? 'Create Coach' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CoachesPage; 