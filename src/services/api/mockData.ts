import { Student, Coach, Class, ClassSchedule } from '../../types';

// Mock Students Data
export const students: Student[] = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    enrollmentDate: new Date('2023-01-15'),
    classes: [1, 3]
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '123-456-7891',
    enrollmentDate: new Date('2023-02-10'),
    classes: [2, 4]
  },
  {
    id: 3,
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.johnson@example.com',
    phone: '123-456-7892',
    enrollmentDate: new Date('2023-03-05'),
    classes: [1, 2]
  },
  {
    id: 4,
    firstName: 'Emily',
    lastName: 'Williams',
    email: 'emily.williams@example.com',
    phone: '123-456-7893',
    enrollmentDate: new Date('2023-03-20'),
    classes: [3, 4]
  },
  {
    id: 5,
    firstName: 'Robert',
    lastName: 'Brown',
    email: 'robert.brown@example.com',
    phone: '123-456-7894',
    enrollmentDate: new Date('2023-04-10'),
    classes: [2, 4]
  }
];

// Mock Coaches Data
export const coaches: Coach[] = [
  {
    id: 1,
    firstName: 'David',
    lastName: 'Miller',
    email: 'david.miller@example.com',
    phone: '987-654-3210',
    specialization: 'Mathematics',
    hireDate: new Date('2022-08-15'),
    classes: [1, 3]
  },
  {
    id: 2,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '987-654-3211',
    specialization: 'Science',
    hireDate: new Date('2022-09-01'),
    classes: [2]
  },
  {
    id: 3,
    firstName: 'James',
    lastName: 'Anderson',
    email: 'james.anderson@example.com',
    phone: '987-654-3212',
    specialization: 'English',
    hireDate: new Date('2022-10-10'),
    classes: [4]
  }
];

// Mock Classes Data
export const classes: Class[] = [
  {
    id: 1,
    name: 'Algebra 101',
    description: 'Introduction to Algebra',
    coachId: 1,
    studentIds: [1, 3],
    schedule: [],
    capacity: 20,
    room: 'Room 101'
  },
  {
    id: 2,
    name: 'Physics Fundamentals',
    description: 'Basic principles of physics',
    coachId: 2,
    studentIds: [2, 3, 5],
    schedule: [],
    capacity: 15,
    room: 'Room 102'
  },
  {
    id: 3,
    name: 'Calculus Advanced',
    description: 'Advanced calculus techniques',
    coachId: 1,
    studentIds: [1, 4],
    schedule: [],
    capacity: 12,
    room: 'Room 103'
  },
  {
    id: 4,
    name: 'Literature & Composition',
    description: 'English literature and writing',
    coachId: 3,
    studentIds: [2, 4, 5],
    schedule: [],
    capacity: 25,
    room: 'Room 104'
  }
];

// Mock schedule data
const today = new Date();
const startDate = new Date(today);
startDate.setHours(9, 0, 0, 0);

// Helper function to create date with specific day offset and hours
const createDateTime = (dayOffset: number, hours = 9, minutes = 0) => {
  const date = new Date(today);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const schedules: ClassSchedule[] = [
  {
    id: 1,
    classId: 1,
    startDate: createDateTime(1),
    endDate: createDateTime(1, 10, 30),
    title: 'Algebra 101'
  },
  {
    id: 2,
    classId: 2,
    startDate: createDateTime(1, 11, 0),
    endDate: createDateTime(1, 12, 30),
    title: 'Physics Fundamentals'
  },
  {
    id: 3,
    classId: 3,
    startDate: createDateTime(2),
    endDate: createDateTime(2, 10, 30),
    title: 'Calculus Advanced'
  },
  {
    id: 4,
    classId: 4,
    startDate: createDateTime(2, 11, 0),
    endDate: createDateTime(2, 12, 30),
    title: 'Literature & Composition'
  },
  {
    id: 5,
    classId: 1,
    startDate: createDateTime(3),
    endDate: createDateTime(3, 10, 30),
    title: 'Algebra 101'
  }
];

// Initialize classes with schedules
classes.forEach(classItem => {
  classItem.schedule = schedules.filter(schedule => schedule.classId === classItem.id);
});

// Helper function to get upcoming classes for the dashboard
export const getUpcomingClasses = (): ClassSchedule[] => {
  const now = new Date();
  return schedules
    .filter(schedule => schedule.startDate > now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 5);
};

// Helper function to get dashboard stats
export const getDashboardStats = () => {
  return {
    totalClasses: classes.length,
    totalStudents: students.length,
    totalCoaches: coaches.length,
    upcomingClasses: getUpcomingClasses()
  };
};

// Export stats for direct use
export const stats = {
  totalClasses: classes.length,
  totalStudents: students.length,
  totalCoaches: coaches.length,
  upcomingClasses: getUpcomingClasses()
}; 