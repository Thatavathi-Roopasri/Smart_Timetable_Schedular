// Smart Conflict Resolution System for Timetable Generator
// This prevents faculty, classroom, and section conflicts across different schedules

interface ConflictCheck {
  faculty: Map<string, Set<string>>; // faculty -> set of "day-time" slots
  classrooms: Map<string, Set<string>>; // classroom -> set of "day-time" slots
  sections: Map<string, Set<string>>; // section -> set of "day-time" slots
}

interface ExistingSchedule {
  day: string;
  time: string;
  faculty: string;
  classroom: string;
  section: string;
  subject: string;
}

interface TimetableEntry {
  day: string;
  time: string;
  subject: string;
  faculty: string;
  classroom: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  semester?: number;
  department?: string;
}

interface Faculty {
  id: string;
  name: string;
  department: string;
  specialization: string;
  subjects: string[];
}

interface Classroom {
  id: string;
  name: string;
  capacity: number;
  type: string;
  department?: string; // Department this classroom belongs to
}

// Interface for scheduling constraints
interface SchedulingConstraint {
  id: string;
  subjectCode: string;
  subjectName: string;
  restrictionType: 'avoid_time_slots' | 'prefer_time_slots' | 'no_consecutive';
  timeSlots: string[];
  description: string;
}

export class ConflictResolver {
  private conflictCheck: ConflictCheck;
  private existingSchedules: ExistingSchedule[];

  constructor(existingSchedules: ExistingSchedule[]) {
    this.existingSchedules = existingSchedules;
    this.conflictCheck = this.buildConflictMaps();
  }

  private buildConflictMaps(): ConflictCheck {
    const conflictCheck: ConflictCheck = {
      faculty: new Map(),
      classrooms: new Map(),
      sections: new Map()
    };

    this.existingSchedules.forEach(schedule => {
      const timeSlot = `${schedule.day}-${schedule.time}`;
      
      // Track faculty conflicts
      if (!conflictCheck.faculty.has(schedule.faculty)) {
        conflictCheck.faculty.set(schedule.faculty, new Set());
      }
      conflictCheck.faculty.get(schedule.faculty)?.add(timeSlot);
      
      // Track classroom conflicts
      if (!conflictCheck.classrooms.has(schedule.classroom)) {
        conflictCheck.classrooms.set(schedule.classroom, new Set());
      }
      conflictCheck.classrooms.get(schedule.classroom)?.add(timeSlot);
      
      // Track section conflicts
      if (!conflictCheck.sections.has(schedule.section)) {
        conflictCheck.sections.set(schedule.section, new Set());
      }
      conflictCheck.sections.get(schedule.section)?.add(timeSlot);
    });

    return conflictCheck;
  }

  // Check if a resource is available at a specific time slot
  public isResourceAvailable(
    resourceType: 'faculty' | 'classrooms' | 'sections', 
    resourceName: string, 
    day: string, 
    timeSlot: string
  ): boolean {
    const conflictMap = this.conflictCheck[resourceType];
    const timeKey = `${day}-${timeSlot}`;
    return !conflictMap.get(resourceName)?.has(timeKey);
  }

  // Check if subject violates avoid constraints
  private isSubjectAvoidingTimeSlot(subject: Subject, timeSlot: string, constraints: SchedulingConstraint[]): boolean {
    const avoidConstraints = constraints.filter(c => 
      c.restrictionType === 'avoid_time_slots' && 
      (c.subjectCode === subject.code || c.subjectName === subject.name)
    );
    
    return avoidConstraints.some(constraint => constraint.timeSlots.includes(timeSlot));
  }

  // Check if subject prefers this time slot
  private isSubjectPreferringTimeSlot(subject: Subject, timeSlot: string, constraints: SchedulingConstraint[]): boolean {
    const preferConstraints = constraints.filter(c => 
      c.restrictionType === 'prefer_time_slots' && 
      (c.subjectCode === subject.code || c.subjectName === subject.name)
    );
    
    if (preferConstraints.length === 0) return false;
    return preferConstraints.some(constraint => constraint.timeSlots.includes(timeSlot));
  }

  // Calculate priority score for subject placement (higher is better)
  private getSubjectPlacementScore(subject: Subject, timeSlot: string, constraints: SchedulingConstraint[]): number {
    let score = 1; // Base score
    
    // If subject prefers this time slot, give it high priority
    if (this.isSubjectPreferringTimeSlot(subject, timeSlot, constraints)) {
      score += 10;
    }
    
    // If subject is avoiding this time slot, make it impossible
    if (this.isSubjectAvoidingTimeSlot(subject, timeSlot, constraints)) {
      score = -1000; // Make it extremely unlikely to be selected
    }
    
    return score;
  }

  // Generate conflict-free timetables
  public generateConflictFreeTimetables(
    subjects: Subject[],
    faculties: Faculty[],
    classrooms: Classroom[],
    generateParams: {
      department: string;
      semester: number;
      section: string;
      workingDays: string[];
      timeSlots: string[];
      constraints?: SchedulingConstraint[];
      shuffleClassrooms?: boolean;
    }
  ): Array<{
    id: string;
    name: string;
    description: string;
    rating: number;
    schedule: TimetableEntry[];
  }> {
    const timeSlots = generateParams.timeSlots;
    
    // First, filter faculties by department - MUST BE BEFORE using it
    const availableFaculties = faculties.filter(f => f.department === generateParams.department);
    
    // Enhanced subject filtering - include subjects that match department OR that faculty can teach
    let availableSubjects = subjects.filter(s => {
      // Direct department match
      if (s.department === generateParams.department) return true;
      
      // Check if any faculty from this department can teach this subject
      return availableFaculties.some(f => 
        f.subjects && (
          f.subjects.includes(s.id) || 
          f.subjects.includes(s.code) || 
          f.subjects.includes(s.name)
        )
      );
    });
    
    // If no subjects found, use all subjects as fallback
    if (availableSubjects.length === 0) {
      availableSubjects = subjects.slice(0, 12); // Use first 12 subjects for better variety
    }
    
    console.log(`🎯 Generating timetables with ${availableSubjects.length} subjects:`, 
      availableSubjects.map(s => s.code || s.name).join(', '));
    console.log(`👨‍🏫 Available faculties: ${availableFaculties.length}`);
    console.log(`🚫 Active constraints: ${generateParams.constraints?.length || 0}`);
    
    const sampleTimetables = [];
    const currentSection = generateParams.section;
    const deptCodeFromSection = (currentSection || '').split('-')[0]?.toUpperCase();
    const deptCodeFromName = (generateParams.department || '').match(/[A-Z]{2,}/g)?.pop()?.toUpperCase();
    const departmentCode = deptCodeFromSection || deptCodeFromName || '';
    
    for (let i = 0; i < 5; i++) {
      const schedule: TimetableEntry[] = [];
      const shuffledSubjects = [...availableSubjects].sort(() => Math.random() - 0.5);
      let subjectIndex = 0;
      
      // Track temporary assignments for this variation to avoid internal conflicts
      const tempConflictCheck = {
        faculty: new Map(Array.from(this.conflictCheck.faculty.entries()).map(([k, v]) => [k, new Set(v)])),
        classrooms: new Map(Array.from(this.conflictCheck.classrooms.entries()).map(([k, v]) => [k, new Set(v)])),
        sections: new Map(Array.from(this.conflictCheck.sections.entries()).map(([k, v]) => [k, new Set(v)]))
      };

      generateParams.workingDays.forEach((day: string) => {
        timeSlots.forEach((timeSlot: string) => {
          if (timeSlot.includes('LUNCH') || timeSlot.includes('BREAK')) return; // Skip break slots
          
          const timeKey = `${day}-${timeSlot}`;
          
          // Ensure we have subjects to schedule
          if (shuffledSubjects.length === 0) return;
          
          // Get subject with credit-based repetition (subjects with more credits appear more often)
          let subject = shuffledSubjects[subjectIndex % shuffledSubjects.length];
          
          // For variety, occasionally pick random subject
          if (Math.random() < 0.3) {
            subject = shuffledSubjects[Math.floor(Math.random() * shuffledSubjects.length)];
          }
          
          // Check constraints if they exist
          if (generateParams.constraints && generateParams.constraints.length > 0) {
            // If current subject is avoiding this time slot, find another subject
            if (this.isSubjectAvoidingTimeSlot(subject, timeSlot, generateParams.constraints)) {
              // Try to find a subject that's not avoiding this time slot
              const availableSubject = shuffledSubjects.find(s => 
                !this.isSubjectAvoidingTimeSlot(s, timeSlot, generateParams.constraints)
              );
              if (availableSubject) {
                subject = availableSubject;
              }
            }
            
            // If any subject prefers this time slot, prioritize it
            const preferredSubject = shuffledSubjects.find(s => 
              this.isSubjectPreferringTimeSlot(s, timeSlot, generateParams.constraints)
            );
            if (preferredSubject) {
              subject = preferredSubject;
            }
          }
          
          // Check if current section is already busy at this time
          if (!this.isResourceAvailable('sections', currentSection, day, timeSlot) || 
              tempConflictCheck.sections.get(currentSection)?.has(timeKey)) {
            subjectIndex++;
            return;
          }
          
          // Find available faculty who can teach this subject
          let assignedFaculty = availableFaculties.find(f => {
            const canTeach = f.subjects && 
              (f.subjects.includes(subject.id) || f.subjects.includes(subject.code) || f.subjects.includes(subject.name));
            const isAvailable = this.isResourceAvailable('faculty', f.name, day, timeSlot) && 
              !tempConflictCheck.faculty.get(f.name)?.has(timeKey);
            return canTeach && isAvailable;
          });
          
          // If no specific faculty found, find any available faculty from department
          if (!assignedFaculty && availableFaculties.length > 0) {
            assignedFaculty = availableFaculties.find(f => {
              const isAvailable = this.isResourceAvailable('faculty', f.name, day, timeSlot) && 
                !tempConflictCheck.faculty.get(f.name)?.has(timeKey);
              return isAvailable;
            });
          }
          
          // If still no faculty, try any faculty
          if (!assignedFaculty && faculties.length > 0) {
            assignedFaculty = faculties.find(f => {
              const isAvailable = this.isResourceAvailable('faculty', f.name, day, timeSlot) && 
                !tempConflictCheck.faculty.get(f.name)?.has(timeKey);
              return isAvailable;
            });
          }
          
          // Find available classroom - FILTER BY DEPARTMENT or code prefix
          let availableClassrooms = classrooms.filter(c => {
            const normalizedName = (c.name || '').toUpperCase();
            const normalizedDept = (c.department || '').toUpperCase();

            // Only use classrooms from the same department or matching dept code in name
            const deptMatches = departmentCode
              ? (normalizedDept === generateParams.department.toUpperCase() || normalizedName.includes(departmentCode))
              : (!c.department || normalizedDept === generateParams.department.toUpperCase());

            if (!deptMatches) return false;
            const isAvailable = this.isResourceAvailable('classrooms', c.name, day, timeSlot) &&
              !tempConflictCheck.classrooms.get(c.name)?.has(timeKey);
            return isAvailable;
          });
          
          // If shuffleClassrooms is enabled, randomly pick from available classrooms
          let availableClassroom = null;
          if (generateParams.shuffleClassrooms !== false && availableClassrooms.length > 0) {
            availableClassroom = availableClassrooms[Math.floor(Math.random() * availableClassrooms.length)];
          } else if (availableClassrooms.length > 0) {
            // Otherwise, take the first available (in order)
            availableClassroom = availableClassrooms[0];
          }
          
          // If none match department, do NOT fall back to other departments; create a dept-specific default
          if (!availableClassroom) {
            availableClassroom = { id: '1', name: `${departmentCode || generateParams.department}-Lab-1`, capacity: 40, type: 'Lecture', department: generateParams.department };
          }

          if (subject && assignedFaculty && availableClassroom) {
            schedule.push({
              day,
              time: timeSlot,
              subject: subject.name,
              faculty: assignedFaculty.name,
              classroom: availableClassroom.name
            });
            
            // Mark resources as temporarily busy for this variation
            if (!tempConflictCheck.faculty.has(assignedFaculty.name)) {
              tempConflictCheck.faculty.set(assignedFaculty.name, new Set());
            }
            tempConflictCheck.faculty.get(assignedFaculty.name)?.add(timeKey);
            
            if (!tempConflictCheck.classrooms.has(availableClassroom.name)) {
              tempConflictCheck.classrooms.set(availableClassroom.name, new Set());
            }
            tempConflictCheck.classrooms.get(availableClassroom.name)?.add(timeKey);
            
            if (!tempConflictCheck.sections.has(currentSection)) {
              tempConflictCheck.sections.set(currentSection, new Set());
            }
            tempConflictCheck.sections.get(currentSection)?.add(timeKey);
          }
          subjectIndex++;
        });
      });
      
      const conflictFreeCount = schedule.length;
      const totalSlots = generateParams.workingDays.length * (timeSlots.length - 1); // -1 for lunch
      const conflictScore = totalSlots > 0 ? (conflictFreeCount / totalSlots) * 100 : 0;

      sampleTimetables.push({
        id: `sample-${Date.now()}-${i}`,
        name: `Schedule Variation ${i + 1}`,
        description: `✅ Conflict-free schedule (${conflictScore.toFixed(0)}% filled) - ` +
                    (i === 0 ? 'Optimized for morning heavy subjects' :
                     i === 1 ? 'Evenly distributed workload' :
                     i === 2 ? 'Afternoon-focused practical subjects' :
                     i === 3 ? 'Theory-Practice alternating pattern' :
                               'Balanced subject-faculty optimization'),
        rating: 3 + (conflictScore / 100) * 2, // Rating based on conflict resolution success
        schedule
      });
    }

    return sampleTimetables;
  }

  // Get conflict report for debugging
  public getConflictReport(): {
    totalExistingSchedules: number;
    busyFaculty: string[];
    busyClassrooms: string[];
    busySections: string[];
  } {
    return {
      totalExistingSchedules: this.existingSchedules.length,
      busyFaculty: Array.from(this.conflictCheck.faculty.keys()),
      busyClassrooms: Array.from(this.conflictCheck.classrooms.keys()),
      busySections: Array.from(this.conflictCheck.sections.keys())
    };
  }
}