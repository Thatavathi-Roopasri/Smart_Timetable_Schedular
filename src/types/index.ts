export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  color: string; // For UI representation
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  subjects: string[]; // Subject IDs
  phone?: string;
  availability: TimeSlot[];
  semester?: number;
}

export interface ClassRoom {
  id: string;
  name: string;
  type: string;
  building: string;
  isAvailable: boolean;
  department?: string;
}

export interface TimeSlot {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
}

export interface TimetableEntry {
  id: string;
  subjectId: string;
  facultyId: string;
  classRoomId: string;
  timeSlot: TimeSlot;
  semester: string;
  section: string;
  type: 'theory' | 'practical' | 'tutorial';
  createdAt: Date;
  updatedAt: Date;
}

export interface Semester {
  id: string;
  name: string;
  year: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface Section {
  id: string;
  name: string;
  department: string;
  semester: number;
  classTeacher?: string;
}

export interface TimetableData {
  subjects: Subject[];
  faculty: Faculty[];
  classRooms: ClassRoom[];
  entries: TimetableEntry[];
  semesters: Semester[];
  sections: Section[];
}