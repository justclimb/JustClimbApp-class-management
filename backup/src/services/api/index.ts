import { Student, Teacher, Class, ClassSchedule, Stats } from '../../types';
import { students, teachers, classes, schedules, getDashboardStats } from './mockData';

// Helper to generate new IDs
const getNewId = (array: any[]): number => {
  return array.length > 0 ? Math.max(...array.map(item => item.id)) + 1 : 1;
};

// Students API
export const studentsApi = {
  getAll: (): Promise<Student[]> => {
    return Promise.resolve([...students]);
  },
  
  getById: (id: number): Promise<Student | undefined> => {
    const student = students.find(s => s.id === id);
    return Promise.resolve(student ? { ...student } : undefined);
  },
  
  create: (student: Omit<Student, 'id'>): Promise<Student> => {
    const newStudent = {
      ...student,
      id: getNewId(students)
    };
    students.push(newStudent);
    return Promise.resolve({ ...newStudent });
  },
  
  update: (id: number, studentData: Partial<Student>): Promise<Student | undefined> => {
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return Promise.resolve(undefined);
    
    const updatedStudent = { ...students[index], ...studentData };
    students[index] = updatedStudent;
    return Promise.resolve({ ...updatedStudent });
  },
  
  delete: (id: number): Promise<boolean> => {
    const initialLength = students.length;
    const studentIndex = students.findIndex(s => s.id === id);
    
    if (studentIndex !== -1) {
      students.splice(studentIndex, 1);
      
      // Remove student from classes
      classes.forEach(classItem => {
        const studentIdIndex = classItem.studentIds.indexOf(id);
        if (studentIdIndex !== -1) {
          classItem.studentIds.splice(studentIdIndex, 1);
        }
      });
    }
    
    return Promise.resolve(students.length < initialLength);
  }
};

// Teachers API
export const teachersApi = {
  getAll: (): Promise<Teacher[]> => {
    return Promise.resolve([...teachers]);
  },
  
  getById: (id: number): Promise<Teacher | undefined> => {
    const teacher = teachers.find(t => t.id === id);
    return Promise.resolve(teacher ? { ...teacher } : undefined);
  },
  
  create: (teacher: Omit<Teacher, 'id'>): Promise<Teacher> => {
    const newTeacher = {
      ...teacher,
      id: getNewId(teachers)
    };
    teachers.push(newTeacher);
    return Promise.resolve({ ...newTeacher });
  },
  
  update: (id: number, teacherData: Partial<Teacher>): Promise<Teacher | undefined> => {
    const index = teachers.findIndex(t => t.id === id);
    if (index === -1) return Promise.resolve(undefined);
    
    const updatedTeacher = { ...teachers[index], ...teacherData };
    teachers[index] = updatedTeacher;
    return Promise.resolve({ ...updatedTeacher });
  },
  
  delete: (id: number): Promise<boolean> => {
    const initialLength = teachers.length;
    const teacherIndex = teachers.findIndex(t => t.id === id);
    
    if (teacherIndex !== -1) {
      // Check if teacher is assigned to any classes
      const assignedClasses = classes.filter(c => c.teacherId === id);
      if (assignedClasses.length > 0) {
        // Cannot delete a teacher assigned to classes
        return Promise.resolve(false);
      }
      
      teachers.splice(teacherIndex, 1);
    }
    
    return Promise.resolve(teachers.length < initialLength);
  }
};

// Classes API
export const classesApi = {
  getAll: (): Promise<Class[]> => {
    return Promise.resolve(classes.map(c => ({ ...c })));
  },
  
  getById: (id: number): Promise<Class | undefined> => {
    const classItem = classes.find(c => c.id === id);
    return Promise.resolve(classItem ? { ...classItem } : undefined);
  },
  
  create: (classData: Omit<Class, 'id'>): Promise<Class> => {
    const newClass = {
      ...classData,
      id: getNewId(classes)
    };
    classes.push(newClass);
    return Promise.resolve({ ...newClass });
  },
  
  update: (id: number, classData: Partial<Class>): Promise<Class | undefined> => {
    const index = classes.findIndex(c => c.id === id);
    if (index === -1) return Promise.resolve(undefined);
    
    const updatedClass = { ...classes[index], ...classData };
    classes[index] = updatedClass;
    return Promise.resolve({ ...updatedClass });
  },
  
  delete: (id: number): Promise<boolean> => {
    const initialLength = classes.length;
    const classIndex = classes.findIndex(c => c.id === id);
    
    if (classIndex !== -1) {
      classes.splice(classIndex, 1);
      
      // Remove class schedules
      const scheduleIndices = schedules
        .map((s, index) => s.classId === id ? index : -1)
        .filter(index => index !== -1)
        .sort((a, b) => b - a); // Sort in descending order for accurate splicing
      
      scheduleIndices.forEach(index => {
        schedules.splice(index, 1);
      });
      
      // Remove class from students
      students.forEach(student => {
        const classIndex = student.classes.indexOf(id);
        if (classIndex !== -1) {
          student.classes.splice(classIndex, 1);
        }
      });
      
      // Remove class from teachers
      teachers.forEach(teacher => {
        const classIndex = teacher.classes.indexOf(id);
        if (classIndex !== -1) {
          teacher.classes.splice(classIndex, 1);
        }
      });
    }
    
    return Promise.resolve(classes.length < initialLength);
  }
};

// Schedules API
export const schedulesApi = {
  getAll: (): Promise<ClassSchedule[]> => {
    return Promise.resolve([...schedules]);
  },
  
  getByClassId: (classId: number): Promise<ClassSchedule[]> => {
    return Promise.resolve(schedules.filter(s => s.classId === classId).map(s => ({ ...s })));
  },
  
  create: (schedule: Omit<ClassSchedule, 'id'>): Promise<ClassSchedule> => {
    const newSchedule = {
      ...schedule,
      id: getNewId(schedules)
    };
    schedules.push(newSchedule);
    
    // Update class schedule
    const classItem = classes.find(c => c.id === schedule.classId);
    if (classItem) {
      classItem.schedule.push(newSchedule);
    }
    
    return Promise.resolve({ ...newSchedule });
  },
  
  update: (id: number, scheduleData: Partial<ClassSchedule>): Promise<ClassSchedule | undefined> => {
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) return Promise.resolve(undefined);
    
    const updatedSchedule = { ...schedules[index], ...scheduleData };
    schedules[index] = updatedSchedule;
    
    // Update class schedule if it exists
    const classItem = classes.find(c => c.id === updatedSchedule.classId);
    if (classItem) {
      const scheduleIndex = classItem.schedule.findIndex(s => s.id === id);
      if (scheduleIndex !== -1) {
        classItem.schedule[scheduleIndex] = { ...updatedSchedule };
      }
    }
    
    return Promise.resolve({ ...updatedSchedule });
  },
  
  delete: (id: number): Promise<boolean> => {
    const initialLength = schedules.length;
    const scheduleIndex = schedules.findIndex(s => s.id === id);
    
    if (scheduleIndex !== -1) {
      const classId = schedules[scheduleIndex].classId;
      schedules.splice(scheduleIndex, 1);
      
      // Remove schedule from class
      const classItem = classes.find(c => c.id === classId);
      if (classItem) {
        const classScheduleIndex = classItem.schedule.findIndex(s => s.id === id);
        if (classScheduleIndex !== -1) {
          classItem.schedule.splice(classScheduleIndex, 1);
        }
      }
    }
    
    return Promise.resolve(schedules.length < initialLength);
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: (): Promise<Stats> => {
    return Promise.resolve(getDashboardStats());
  }
}; 