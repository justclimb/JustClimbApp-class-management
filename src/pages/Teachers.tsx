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
} from '@devexpress/dx-react-grid';
import { teachersApi, classesApi } from '../services/api';
import { Teacher, Class } from '../types';

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

const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Partial<Teacher> | null>(null);
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
        const [teachersData, classesData] = await Promise.all([
          teachersApi.getAll(),
          classesApi.getAll()
        ]);
        setTeachers(teachersData);
        setClasses(classesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddTeacher = () => {
    setIsNew(true);
    setCurrentTeacher({
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

  const handleEditTeacher = (id: number) => {
    const teacherToEdit = teachers.find(t => t.id === id);
    if (teacherToEdit) {
      setIsNew(false);
      setCurrentTeacher({ ...teacherToEdit });
      setSelectedClasses([...teacherToEdit.classes]);
      setShowForm(true);
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const success = await teachersApi.delete(id);
        if (success) {
          setTeachers(teachers.filter(t => t.id !== id));
        } else {
          alert('This teacher is assigned to one or more classes and cannot be deleted.');
        }
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Error deleting the teacher');
      }
    }
  };

  const handleFormSubmit = async () => {
    if (!currentTeacher) return;

    // Update the classes array with selected classes
    const teacherData = {
      ...currentTeacher,
      classes: selectedClasses
    };

    try {
      if (isNew) {
        // Create new teacher
        const newTeacher = await teachersApi.create(teacherData as Omit<Teacher, 'id'>);
        setTeachers([...teachers, newTeacher]);
      } else {
        // Update existing teacher
        const updatedTeacher = await teachersApi.update(teacherData.id!, teacherData);
        if (updatedTeacher) {
          setTeachers(teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
        }
      }
      setShowForm(false);
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert('Error saving the teacher');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentTeacher(prev => {
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
    return <Typography>Loading teachers data...</Typography>;
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Teachers Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleAddTeacher}
        >
          Add Teacher
        </Button>
      </Box>

      <Paper>
        <DataGrid
          rows={teachers}
          columns={columns}
        >
          <SortingState defaultSorting={[{ columnName: 'lastName', direction: 'asc' }]} />
          <IntegratedSorting />
          <PagingState defaultCurrentPage={0} pageSize={10} />
          <IntegratedPaging />
          <DateTypeProvider for={dateColumns} />
          <ClassesTypeProvider for={classesColumns} classes={classes} />
          <Table />
          <TableHeaderRow showSortingControls />
          <TableEditColumn
            showEditCommand
            showDeleteCommand
            commandComponent={({ id, onExecute }) => {
              const handleClick = () => {
                if (id === 'edit') {
                  const rowId = onExecute() as any;
                  handleEditTeacher(rowId);
                } else if (id === 'delete') {
                  const rowId = onExecute() as any;
                  handleDeleteTeacher(rowId);
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
        <DialogTitle>{isNew ? 'Add New Teacher' : 'Edit Teacher'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={currentTeacher?.firstName || ''}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={currentTeacher?.lastName || ''}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={currentTeacher?.email || ''}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={currentTeacher?.phone || ''}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Specialization"
                name="specialization"
                value={currentTeacher?.specialization || ''}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hire Date"
                name="hireDate"
                type="date"
                value={currentTeacher?.hireDate 
                  ? new Date(currentTeacher.hireDate).toISOString().slice(0, 10) 
                  : ''}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Assigned Classes
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {classes.map((classItem) => {
                  // Check if this teacher is already assigned to this class in the backend
                  const isAssignedInBackend = classItem.teacherId === currentTeacher?.id;
                  
                  return (
                    <Chip
                      key={classItem.id}
                      label={classItem.name}
                      color={selectedClasses.includes(classItem.id) ? 'primary' : 'default'}
                      onClick={() => handleClassToggle(classItem.id)}
                      disabled={isAssignedInBackend && !selectedClasses.includes(classItem.id)}
                      sx={{ 
                        margin: 0.5,
                        opacity: isAssignedInBackend && !selectedClasses.includes(classItem.id) ? 0.7 : 1
                      }}
                    />
                  );
                })}
              </Box>
              {classes.some(c => c.teacherId === currentTeacher?.id) && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Note: Classes that are already assigned to this teacher in the system cannot be deselected.
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Cancel</Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained" 
            color="primary"
            disabled={!currentTeacher?.firstName || !currentTeacher?.lastName || !currentTeacher?.email || !currentTeacher?.specialization}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TeachersPage; 