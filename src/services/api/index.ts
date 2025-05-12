import { Student, Coach, Class, ClassSchedule, Stats } from '../../types';
import { students, coaches, classes, schedules, stats } from './mockData';

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
    const newId = Math.max(0, ...students.map(s => s.id)) + 1;
    const newStudent = {
      id: newId,
      ...student
    };
    students.push(newStudent);
    return Promise.resolve({ ...newStudent });
  },
  
  update: (id: number, studentData: Partial<Student>): Promise<Student | undefined> => {
    const index = students.findIndex(s => s.id === id);
    if (index === -1) {
      return Promise.resolve(undefined);
    }
    const updatedStudent = { ...students[index], ...studentData };
    students[index] = updatedStudent;
    return Promise.resolve({ ...updatedStudent });
  },
  
  delete: (id: number): Promise<boolean> => {
    const index = students.findIndex(s => s.id === id);
    if (index === -1) {
      return Promise.resolve(false);
    }
    // Check if this student is enrolled in any class
    const isEnrolled = classes.some(c => c.studentIds.includes(id));
    if (isEnrolled) {
      return Promise.resolve(false);
    }
    students.splice(index, 1);
    return Promise.resolve(true);
  }
};

// Coaches API
export const coachesApi = {
  getAll: (): Promise<Coach[]> => {
    return Promise.resolve([...coaches]);
  },
  
  getById: (id: number): Promise<Coach | undefined> => {
    const coach = coaches.find((t: Coach) => t.id === id);
    return Promise.resolve(coach ? { ...coach } : undefined);
  },
  
  create: (coach: Omit<Coach, 'id'>): Promise<Coach> => {
    const newId = Math.max(0, ...coaches.map((t: Coach) => t.id)) + 1;
    const newCoach = {
      id: newId,
      ...coach
    };
    coaches.push(newCoach);
    return Promise.resolve({ ...newCoach });
  },
  
  update: (id: number, coachData: Partial<Coach>): Promise<Coach | undefined> => {
    const index = coaches.findIndex((t: Coach) => t.id === id);
    if (index === -1) {
      return Promise.resolve(undefined);
    }
    const updatedCoach = { ...coaches[index], ...coachData };
    coaches[index] = updatedCoach;
    return Promise.resolve({ ...updatedCoach });
  },
  
  delete: (id: number): Promise<boolean> => {
    const index = coaches.findIndex((t: Coach) => t.id === id);
    if (index === -1) {
      return Promise.resolve(false);
    }
    // Check if this coach is assigned to any class
    const isAssigned = classes.some(c => c.coachId === id);
    if (isAssigned) {
      return Promise.resolve(false);
    }
    coaches.splice(index, 1);
    return Promise.resolve(true);
  }
};

// Classes API
export const classesApi = {
  getAll: (): Promise<Class[]> => {
    return Promise.resolve([...classes]);
  },
  
  getById: (id: number): Promise<Class | undefined> => {
    const classItem = classes.find(c => c.id === id);
    return Promise.resolve(classItem ? { ...classItem } : undefined);
  },
  
  create: (classData: Omit<Class, 'id'>): Promise<Class> => {
    const newId = Math.max(0, ...classes.map(c => c.id)) + 1;
    const newClass = {
      id: newId,
      ...classData
    };
    classes.push(newClass);
    return Promise.resolve({ ...newClass });
  },
  
  update: (id: number, classData: Partial<Class>): Promise<Class | undefined> => {
    const index = classes.findIndex(c => c.id === id);
    if (index === -1) {
      return Promise.resolve(undefined);
    }
    const updatedClass = { ...classes[index], ...classData };
    classes[index] = updatedClass;
    return Promise.resolve({ ...updatedClass });
  },
  
  delete: (id: number): Promise<boolean> => {
    const index = classes.findIndex(c => c.id === id);
    if (index === -1) {
      return Promise.resolve(false);
    }
    // Delete any schedules associated with this class
    const schedulesToDelete = schedules.filter(s => s.classId === id);
    schedulesToDelete.forEach(schedule => {
      const scheduleIndex = schedules.findIndex(s => s.id === schedule.id);
      if (scheduleIndex !== -1) {
        schedules.splice(scheduleIndex, 1);
      }
    });
    classes.splice(index, 1);
    return Promise.resolve(true);
  }
};

// Schedules API
export const schedulesApi = {
  getAll: (): Promise<ClassSchedule[]> => {
    return Promise.resolve([...schedules]);
  },
  
  getById: (id: number): Promise<ClassSchedule | undefined> => {
    const schedule = schedules.find(s => s.id === id);
    return Promise.resolve(schedule ? { ...schedule } : undefined);
  },
  
  getByClassId: (classId: number): Promise<ClassSchedule[]> => {
    return Promise.resolve(schedules.filter(s => s.classId === classId).map(s => ({ ...s })));
  },
  
  create: (scheduleData: Omit<ClassSchedule, 'id'>): Promise<ClassSchedule> => {
    const newId = Math.max(0, ...schedules.map(s => s.id)) + 1;
    const newSchedule = {
      id: newId,
      ...scheduleData
    };
    schedules.push(newSchedule);
    
    // Update class schedule
    const classItem = classes.find(c => c.id === scheduleData.classId);
    if (classItem) {
      classItem.schedule.push(newSchedule);
    }
    
    return Promise.resolve({ ...newSchedule });
  },
  
  update: (id: number, scheduleData: Partial<ClassSchedule>): Promise<ClassSchedule | undefined> => {
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) {
      return Promise.resolve(undefined);
    }
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
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) {
      return Promise.resolve(false);
    }
    schedules.splice(index, 1);
    return Promise.resolve(true);
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: (): Promise<Stats> => {
    // Get upcoming schedules (next 7 days)
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);

    const upcomingClasses = schedules.filter(schedule => {
      const startDate = new Date(schedule.startDate);
      return startDate >= now && startDate <= oneWeekLater;
    });

    const statsData: Stats = {
      totalClasses: classes.length,
      totalStudents: students.length,
      totalCoaches: coaches.length,
      upcomingClasses
    };

    return Promise.resolve(statsData);
  }
};

// Export all APIs
export default {
  studentsApi,
  coachesApi,
  classesApi,
  schedulesApi,
  dashboardApi
}; 