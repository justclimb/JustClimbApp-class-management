import React, { useState, useEffect } from 'react';
import { Typography, Paper, Button, Box, Dialog, TextField, DialogTitle, DialogContent, DialogActions, MenuItem, Grid } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Grid as DataGrid,
  Table,
  TableHeaderRow,
  PagingPanel,
  TableEditRow,
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
const DateFormatter: React.FC<DataTypeProvider.ValueFormatterProps> = ({ value }) => {
  return <>{value ? new Date(value).toLocaleDateString() : ''}</>;
};

const DateTypeProvider: React.FC<DataTypeProviderProps> = (props) => (
  <DataTypeProvider formatterComponent={DateFormatter} {...props} />
);

// Teacher name formatter
const CoachFormatter: React.FC<DataTypeProvider.ValueFormatterProps & { coaches: Coach[] }> = ({ value, coaches }) => {
  const coach = coaches.find(t => t.id === value);
  return <>{coach ? `${coach.firstName} ${coach.lastName}` : ''}</>;
};

const CoachTypeProvider: React.FC<DataTypeProviderProps & { coaches: Coach[] }> = ({ coaches, ...props }) => (
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

  const columns = [
    { name: 'name', title: 'Class Name' },
    { name: 'description', title: 'Description' },
    { name: 'coachId', title: 'Coach' },
    { name: 'capacity', title: 'Capacity' },
    { name: 'room', title: 'Room' }
  ];

  const dateColumns = ['startDate', 'endDate'];
  const coachColumns = ['coachId'];

  useEffect(() => {
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

    fetchData();
  }, []);

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
    setShowForm(true);
  };

  const handleEditClass = (id: number) => {
    const classToEdit = classes.find(c => c.id === id);
    if (classToEdit) {
      setIsNew(false);
      setCurrentClass({ ...classToEdit });
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
          alert('Failed to delete the class');
        }
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Error deleting the class');
      }
    }
  };

  const handleFormSubmit = async () => {
    if (!currentClass) return;

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
    setCurrentClass(prev => ({ ...prev, [name]: name === 'capacity' ? parseInt(value) : value }));
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
          <EditingState 
            onCommitChanges={() => {}}
          />
          <SortingState defaultSorting={[{ columnName: 'name', direction: 'asc' }]} />
          <IntegratedSorting />
          <PagingState defaultCurrentPage={0} pageSize={10} />
          <IntegratedPaging />
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

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isNew ? 'Add New Class' : 'Edit Class'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Class Name"
                name="name"
                value={currentClass?.name || ''}
                onChange={handleInputChange}
                required
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
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Cancel</Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained" 
            color="primary"
            disabled={!currentClass?.name || !currentClass?.coachId}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ClassesPage; 