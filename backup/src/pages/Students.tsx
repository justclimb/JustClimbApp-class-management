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
import { studentsApi, classesApi } from '../services/api';
import { Student, Class } from '../types';

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

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);

  // Grid columns
  const columns = [
    { name: 'id', title: 'ID' },
    { name: 'firstName', title: 'First Name' },
    { name: 'lastName', title: 'Last Name' },
    { name: 'email', title: 'Email' },
    { name: 'phone', title: 'Phone' },
    { name: 'enrollmentDate', title: 'Enrollment Date' },
    { name: 'classes', title: 'Classes' },
  ];

  const dateColumns = ['enrollmentDate'];
  const classesColumns = ['classes'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsData, classesData] = await Promise.all([
          studentsApi.getAll(),
          classesApi.getAll()
        ]);
        setStudents(studentsData);
        setClasses(classesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddStudent = () => {
    setIsNew(true);
    setCurrentStudent({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      enrollmentDate: new Date(),
      classes: []
    });
    setSelectedClasses([]);
    setShowForm(true);
  };

  const handleEditStudent = (id: number) => {
    const studentToEdit = students.find(s => s.id === id);
    if (studentToEdit) {
      setIsNew(false);
      setCurrentStudent({ ...studentToEdit });
      setSelectedClasses([...studentToEdit.classes]);
      setShowForm(true);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const success = await studentsApi.delete(id);
        if (success) {
          setStudents(students.filter(s => s.id !== id));
        } else {
          alert('Failed to delete the student');
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting the student');
      }
    }
  };

  const handleFormSubmit = async () => {
    if (!currentStudent) return;

    // Update the classes array with selected classes
    const studentData = {
      ...currentStudent,
      classes: selectedClasses
    };

    try {
      if (isNew) {
        // Create new student
        const newStudent = await studentsApi.create(studentData as Omit<Student, 'id'>);
        setStudents([...students, newStudent]);
      } else {
        // Update existing student
        const updatedStudent = await studentsApi.update(studentData.id!, studentData);
        if (updatedStudent) {
          setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
        }
      }
      setShowForm(false);
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Error saving the student');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentStudent(prev => {
      if (name === 'enrollmentDate') {
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
    return <Typography>Loading students data...</Typography>;
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Students Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleAddStudent}
        >
          Add Student
        </Button>
      </Box>

      <Paper>
        <DataGrid
          rows={students}
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
                  handleEditStudent(rowId);
                } else if (id === 'delete') {
                  const rowId = onExecute() as any;
                  handleDeleteStudent(rowId);
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
        <DialogTitle>{isNew ? 'Add New Student' : 'Edit Student'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={currentStudent?.firstName || ''}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={currentStudent?.lastName || ''}
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
                value={currentStudent?.email || ''}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={currentStudent?.phone || ''}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Enrollment Date"
                name="enrollmentDate"
                type="date"
                value={currentStudent?.enrollmentDate 
                  ? new Date(currentStudent.enrollmentDate).toISOString().slice(0, 10) 
                  : ''}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Enrolled Classes
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {classes.map((classItem) => (
                  <Chip
                    key={classItem.id}
                    label={classItem.name}
                    color={selectedClasses.includes(classItem.id) ? 'primary' : 'default'}
                    onClick={() => handleClassToggle(classItem.id)}
                    sx={{ margin: 0.5 }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Cancel</Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained" 
            color="primary"
            disabled={!currentStudent?.firstName || !currentStudent?.lastName || !currentStudent?.email}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StudentsPage; 