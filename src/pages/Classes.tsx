import React, { useState, useEffect } from 'react';
import { Typography, Paper, Button, Box, Dialog, TextField, DialogTitle, DialogContent, DialogActions, MenuItem, Grid } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Grid as DataGrid,
  Table,
  TableHeaderRow,
  PagingPanel,
  TableEditColumn,
} from '@devexpress/dx-react-grid-material-ui';
import {
  PagingState,
  IntegratedPaging,
  EditingState,
  DataTypeProvider,
  DataTypeProviderProps,
  SortingState,
  IntegratedSorting,
} from '@devexpress/dx-react-grid';
import { classesApi, coachesApi } from '../services/api';
import { Class, Coach } from '../types';

const getRowId = (row: Class) => row.id;

// DateFormatter component
const DateFormatter = ({ value }: DataTypeProvider.ValueFormatterProps) => (
  <>{value ? new Date(value).toLocaleDateString() : ''}</>
);

const DateTypeProvider = (props: DataTypeProviderProps) => (
  <DataTypeProvider formatterComponent={DateFormatter} {...props} />
);

// Coach name formatter
const CoachFormatter = ({ value, coaches }: DataTypeProvider.ValueFormatterProps & { coaches: Coach[] }) => {
  const coach = coaches.find(t => t.id === value);
  return <>{coach ? `${coach.firstName} ${coach.lastName}` : ''}</>;
};

const CoachTypeProvider = ({ coaches, ...props }: DataTypeProviderProps & { coaches: Coach[] }) => (
  <DataTypeProvider
    formatterComponent={(formatterProps) => <CoachFormatter coaches={coaches} {...formatterProps} />}
    {...props}
  />
);

const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentClass, setCurrentClass] = useState<Partial<Class> | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const columns = [
    { name: 'name', title: 'Class Name' },
    { name: 'description', title: 'Description' },
    { name: 'coachId', title: 'Coach' },
    { name: 'capacity', title: 'Capacity' },
    { name: 'room', title: 'Room' }
  ];

  const dateColumns = ['startDate', 'endDate'];
  const coachColumns = ['coachId'];

  const fetchData = async () => {
    try {
      const [classesData, coachesData] = await Promise.all([
        classesApi.getAll(),
        coachesApi.getAll()
      ]);
      setClasses(classesData);
      setCoaches(coachesData);
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
    
    if (!currentClass?.name?.trim()) {
      errors.name = 'Class name is required';
    }
    
    if (!currentClass?.coachId) {
      errors.coachId = 'A coach must be assigned';
    }
    
    if (!currentClass?.room?.trim()) {
      errors.room = 'Room is required';
    }
    
    if (!currentClass?.capacity || currentClass.capacity <= 0) {
      errors.capacity = 'Capacity must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClass = () => {
    setIsNew(true);
    setCurrentClass({
      name: '',
      description: '',
      coachId: coaches.length > 0 ? coaches[0].id : 0,
      studentIds: [],
      schedule: [],
      capacity: 20,
      room: ''
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEditClass = (id: number) => {
    const classToEdit = classes.find(c => c.id === id);
    if (classToEdit) {
      setIsNew(false);
      setCurrentClass({ ...classToEdit });
      setFormErrors({});
      setShowForm(true);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        const success = await classesApi.delete(id);
        if (success) {
          setClasses(classes.filter(c => c.id !== id));
        } else {
          alert('Failed to delete the class. It may have associated schedules or students.');
        }
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Error deleting the class');
      }
    }
  };

  const handleFormSubmit = async () => {
    if (!currentClass) return;
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isNew) {
        // Create new class
        const newClass = await classesApi.create(currentClass as Omit<Class, 'id'>);
        setClasses([...classes, newClass]);
      } else {
        // Update existing class
        const updatedClass = await classesApi.update(currentClass.id!, currentClass);
        if (updatedClass) {
          setClasses(classes.map(c => c.id === updatedClass.id ? updatedClass : c));
        }
      }
      setShowForm(false);
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Error saving the class');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentClass(prev => {
      if (!prev) return null;
      
      // Handle capacity conversion to number
      if (name === 'capacity') {
        return { ...prev, [name]: parseInt(value) || 0 };
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

  // Handle DevExpress grid edit/delete actions
  const commitChanges = ({ deleted }: any) => {
    if (deleted) {
      handleDeleteClass(deleted[0]);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Classes Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleAddClass}
        >
          Add Class
        </Button>
      </Box>

      <Paper style={{ position: 'relative' }}>
        <DataGrid
          rows={classes}
          columns={columns}
          getRowId={getRowId}
        >
          <SortingState defaultSorting={[{ columnName: 'name', direction: 'asc' }]} />
          <IntegratedSorting />
          <PagingState defaultCurrentPage={0} pageSize={10} />
          <IntegratedPaging />
          <EditingState 
            onCommitChanges={commitChanges}
          />
          <DateTypeProvider for={dateColumns} />
          <CoachTypeProvider for={coachColumns} coaches={coaches} />
          <Table />
          <TableHeaderRow showSortingControls />
          <TableEditColumn
            showEditCommand
            showDeleteCommand
            commandComponent={({ id, onExecute }) => {
              const handleClick = () => {
                if (id === 'edit') {
                  const rowId = onExecute() as any;
                  handleEditClass(rowId);
                } else if (id === 'delete') {
                  const rowId = onExecute() as any;
                  handleDeleteClass(rowId);
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

      {/* Add/Edit Class Dialog */}
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
          {isNew ? 'Add New Class' : 'Edit Class'}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Class Name"
                name="name"
                value={currentClass?.name || ''}
                onChange={handleInputChange}
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
                variant="outlined"
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={currentClass?.description || ''}
                onChange={handleInputChange}
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Coach"
                name="coachId"
                value={currentClass?.coachId || ''}
                onChange={handleInputChange}
                required
                error={!!formErrors.coachId}
                helperText={formErrors.coachId}
                variant="outlined"
              >
                {coaches.map((coach) => (
                  <MenuItem key={coach.id} value={coach.id}>
                    {coach.firstName} {coach.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room"
                name="room"
                value={currentClass?.room || ''}
                onChange={handleInputChange}
                required
                error={!!formErrors.room}
                helperText={formErrors.room}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacity"
                name="capacity"
                type="number"
                value={currentClass?.capacity || ''}
                onChange={handleInputChange}
                required
                error={!!formErrors.capacity}
                helperText={formErrors.capacity}
                variant="outlined"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                After creating a class, you can set up the schedule from the Schedule page.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.default' }}>
          <Button onClick={() => setShowForm(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained" 
            color="primary"
          >
            {isNew ? 'Create Class' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ClassesPage; 