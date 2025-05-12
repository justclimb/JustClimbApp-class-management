export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  enrollmentDate: Date;
  classes: number[]; // Array of class IDs
}

export interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  hireDate: Date;
  classes: number[]; // Array of class IDs
}

export interface Class {
  id: number;
  name: string;
  description: string;
  teacherId: number;
  studentIds: number[];
  schedule: ClassSchedule[];
  capacity: number;
  room: string;
}

export interface ClassSchedule {
  id: number;
  classId: number;
  startDate: Date;
  endDate: Date;
  title?: string;
  rRule?: string; // Recurrence rule
  notes?: string;
}

export interface Stats {
  totalClasses: number;
  totalStudents: number;
  totalTeachers: number;
  upcomingClasses: ClassSchedule[];
} 