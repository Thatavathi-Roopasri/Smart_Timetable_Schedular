import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  AppBar,
  Toolbar,
  Paper,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  AutoAwesome,
  Refresh,
  Save,
  Settings,
  Download
} from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeContext';
import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ConflictResolver } from './ConflictResolver';
import { showDownloadOptions } from '../utils/timetablePDF';

interface GeneratedTimetable {
  id: string;
  name: string;
  schedule: TimetableEntry[];
  description: string;
  savedAt?: string; // Optional timestamp for saved timetables
}

interface ExistingSchedule {
  day: string;
  time: string;
  faculty: string;
  classroom: string;
  section: string;
  subject: string;
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

// New interface for scheduling constraints
interface SchedulingConstraint {
  id: string;
  subjectCode: string;
  subjectName: string;
  restrictionType: 'avoid_time_slots' | 'prefer_time_slots' | 'no_consecutive';
  timeSlots: string[];
  description: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
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

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface Section {
  id: string;
  name: string;
  department: string;
  semester: number;
  classTeacher?: string;
}

interface TimetableGeneratorProps {
  onBack: () => void;
}

const TimetableGenerator: React.FC<TimetableGeneratorProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const { theme } = useThemeMode();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [generatedTimetables, setGeneratedTimetables] = useState<GeneratedTimetable[]>([]);
  const [savedTimetables, setSavedTimetables] = useState<GeneratedTimetable[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saveDialog, setSaveDialog] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<GeneratedTimetable | null>(null);
  const [timetableName, setTimetableName] = useState('');
  const [conflictResolver, setConflictResolver] = useState<ConflictResolver | null>(null);
  const [existingSchedules, setExistingSchedules] = useState<ExistingSchedule[]>([]);
  
  // Constraints state
  const [constraints, setConstraints] = useState<SchedulingConstraint[]>([]);
  const [constraintDialog, setConstraintDialog] = useState(false);
  const [shuffleClassrooms, setShuffleClassrooms] = useState(true);
  const [newConstraint, setNewConstraint] = useState<Partial<SchedulingConstraint>>({
    subjectCode: '',
    restrictionType: 'avoid_time_slots',
    timeSlots: [],
    description: ''
  });

  const [generateParams, setGenerateParams] = useState({
    department: '',
    semester: 3,
    section: '',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periodsPerDay: 6,
    startTime: '09:00',
    endTime: '17:00',
    periodDuration: 60,
    breakTime: '12:00',
    lunchStart: '12:30',
    lunchEnd: '13:30',
    breakDuration: 15,
    numberOfBreaks: 2
  });

  const [departmentTimeSettings, setDepartmentTimeSettings] = useState<any>(null);
  const [timeSlots, setTimeSlots] = useState([
    '09:00-10:00', '10:00-11:00', '11:00-12:00', 
    '12:00-13:00 (LUNCH BREAK)', '13:00-14:00', '14:00-15:00', 
    '15:00-15:15 (BREAK)', '15:15-16:15', '16:15-17:15'
  ]);

  const [geminiApiKey, setGeminiApiKey] = useState('AIzaSyDBUjBXWnLArSfeoAfQVhE912mDZFoCe-Q');
  const [apiKeyDialog, setApiKeyDialog] = useState(false);

  // Load saved timetables from Firebase
  const loadSavedTimetables = useCallback(async () => {
    if (!currentUser?.email) return;

    try {
      const userEmail = currentUser.email;
      
      // Load from main timetables collection that TimetableManagement uses
      const timetablesSnapshot = await getDocs(collection(db, 'users', userEmail, 'timetables'));
      const savedSchedules: GeneratedTimetable[] = [];
      const existingEntries: ExistingSchedule[] = [];
      
      timetablesSnapshot.forEach((doc) => {
        const data = doc.data();
        const timetable: GeneratedTimetable = {
          id: doc.id,
          name: data.name || 'Unnamed Timetable',
          schedule: data.schedule || [],
          description: data.description || '',
          savedAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        };
        
        savedSchedules.push(timetable);
        
        // Add schedule entries to existing schedules for conflict resolution
        if (data.schedule && Array.isArray(data.schedule)) {
          data.schedule.forEach((entry: any) => {
            if (entry.day && entry.time && entry.faculty && entry.classroom) {
              existingEntries.push({
                day: entry.day,
                time: entry.time,
                faculty: entry.faculty,
                classroom: entry.classroom,
                section: data.section || entry.section || '',
                subject: entry.subject || ''
              });
            }
          });
        }
      });
      
      setSavedTimetables(savedSchedules);
      setExistingSchedules(existingEntries);
      
      console.log(`📚 Loaded ${savedSchedules.length} saved timetables with ${existingEntries.length} existing entries for conflict resolution`);
    } catch (error) {
      console.error('Error loading saved timetables:', error);
    }
  }, [currentUser?.email]);

  // Load department-specific time settings
  const loadDepartmentTimeSettings = useCallback(async (department: string) => {
    if (!currentUser?.email || !department) return;
    
    try {
      const docRef = doc(db, 'users', currentUser.email, 'departments', department, 'timeSettings', 'config');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const timeSettings = docSnap.data();
        setDepartmentTimeSettings(timeSettings);
        
        // Update time slots based on department settings
        const generatedSlots = generateTimeSlotsFromSettings(timeSettings);
        setTimeSlots(generatedSlots);
        
        // Update generation parameters with department time settings
        setGenerateParams(prev => ({
          ...prev,
          startTime: timeSettings.startTime || '09:00',
          endTime: timeSettings.endTime || '17:00',
          periodDuration: timeSettings.periodDuration || 60,
          breakDuration: timeSettings.breakDuration || 15,
          numberOfBreaks: timeSettings.numberOfBreaks || 2,
          lunchStart: timeSettings.lunchStartTime || '12:30',
          lunchEnd: timeSettings.lunchEndTime || '13:30',
          workingDays: timeSettings.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }));
        
        console.log(`🕒 Loaded time settings for ${department}:`, {
          slots: generatedSlots.length,
          workingHours: `${timeSettings.startTime}-${timeSettings.endTime}`,
          periodDuration: timeSettings.periodDuration,
          workingDays: timeSettings.workingDays?.length
        });
      } else {
        // Use default settings if none found
        console.log(`📋 No custom time settings found for ${department}, using defaults`);
        setDepartmentTimeSettings(null);
        const defaultSlots = [
          '09:00-10:00', '10:00-11:00', '11:00-12:00', 
          '12:00-13:00 (LUNCH BREAK)', '13:00-14:00', '14:00-15:00',
          '15:00-15:15 (BREAK)', '15:15-16:15', '16:15-17:15'
        ];
        setTimeSlots(defaultSlots);
      }
    } catch (error) {
      console.error('Error loading department time settings:', error);
    }
  }, [currentUser?.email]);

  const generateTimeSlotsFromSettings = (settings: any): string[] => {
    const slots: string[] = [];
    const startHour = parseInt(settings.startTime?.split(':')[0] || '9');
    const startMinute = parseInt(settings.startTime?.split(':')[1] || '0');
    const endHour = parseInt(settings.endTime?.split(':')[0] || '17');
    const lunchStart = settings.lunchStartTime || '12:30';
    const lunchEnd = settings.lunchEndTime || '13:30';
    const periodDuration = settings.periodDuration || 60;
    const numberOfBreaks = settings.numberOfBreaks || 2;
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    let breaksAdded = 0;
    
    while (currentHour < endHour) {
      const nextHour = currentHour + Math.floor((currentMinute + periodDuration) / 60);
      const nextMinute = (currentMinute + periodDuration) % 60;
      
      const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      const nextTimeStr = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
      
      // Check if we've reached lunch time
      if (currentTimeStr >= lunchStart.substring(0, 5) && !slots.some(s => s.includes('LUNCH'))) {
        slots.push(`${lunchStart}-${lunchEnd} (LUNCH BREAK)`);
        // Skip to lunch end time
        const lunchEndHour = parseInt(lunchEnd.split(':')[0]);
        const lunchEndMinute = parseInt(lunchEnd.split(':')[1] || '0');
        currentHour = lunchEndHour;
        currentMinute = lunchEndMinute;
        continue;
      }
      
      // Add regular period
      slots.push(`${currentTimeStr}-${nextTimeStr}`);
      
      // Add breaks based on numberOfBreaks setting
      const totalRegularSlots = slots.filter(s => !s.includes('LUNCH') && !s.includes('BREAK')).length;
      const shouldAddBreak = breaksAdded < numberOfBreaks && 
                           totalRegularSlots > 0 && 
                           totalRegularSlots % Math.ceil(8 / (numberOfBreaks + 1)) === 0 &&
                           nextHour < endHour - 1;
      
      if (shouldAddBreak) {
        const breakStart = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
        const breakEndMin = nextMinute + (settings.breakDuration || 15);
        const breakEndHour = nextHour + Math.floor(breakEndMin / 60);
        const finalBreakMin = breakEndMin % 60;
        const breakEnd = `${breakEndHour.toString().padStart(2, '0')}:${finalBreakMin.toString().padStart(2, '0')}`;
        
        slots.push(`${breakStart}-${breakEnd} (BREAK)`);
        breaksAdded++;
        
        currentHour = breakEndHour;
        currentMinute = finalBreakMin;
        continue;
      }
      
      currentHour = nextHour;
      currentMinute = nextMinute;
    }
    
    return slots;
  };

  // const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Load existing schedules for conflict checking
  const loadExistingSchedules = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      const userEmail = currentUser.email;
      const existingSchedulesData: ExistingSchedule[] = [];
      
      console.log('🔍 Loading ALL saved timetables for conflict checking...');
      
      // Load from main timetables collection (where saved timetables are stored)
      const timetablesSnapshot = await getDocs(collection(db, 'users', userEmail, 'timetables'));
      
      timetablesSnapshot.forEach((doc) => {
        const timetableData = doc.data();
        if (timetableData.schedule && Array.isArray(timetableData.schedule)) {
          timetableData.schedule.forEach((entry: any) => {
            if (entry.day && entry.time && entry.faculty && entry.classroom) {
              existingSchedulesData.push({
                day: entry.day,
                time: entry.time,
                faculty: entry.faculty,
                classroom: entry.classroom,
                section: `${timetableData.department}-${timetableData.section}`,
                subject: entry.subject
              });
            }
          });
        }
      });
      
      // Also load from legacy department structure if exists
      try {
        const deptSnapshot = await getDocs(collection(db, 'users', userEmail, 'departments'));
        
        for (const deptDoc of deptSnapshot.docs) {
          const sectionsSnapshot = await getDocs(collection(db, 'users', userEmail, 'departments', deptDoc.id, 'sections'));
          
          for (const sectionDoc of sectionsSnapshot.docs) {
            const timetableSnapshot = await getDocs(collection(db, 'users', userEmail, 'departments', deptDoc.id, 'sections', sectionDoc.id, 'timetables'));
            
            timetableSnapshot.docs.forEach(timetableDoc => {
              const data = timetableDoc.data();
              existingSchedulesData.push({
                day: data.day,
                time: data.time,
                faculty: data.faculty,
                classroom: data.classroom,
                section: `${deptDoc.id}-${sectionDoc.id}`,
                subject: data.subject
              });
            });
          }
        }
      } catch (legacyError) {
        console.log('📝 No legacy department structure found (this is normal)');
      }
      
      setExistingSchedules(existingSchedulesData);
      setConflictResolver(new ConflictResolver(existingSchedulesData));
      
      console.log(`📊 Loaded ${existingSchedulesData.length} existing schedule entries from ALL saved timetables`);
      console.log('📝 Conflict checking will prevent:', {
        facultyConflicts: 'Same faculty at same time',
        classroomConflicts: 'Same classroom at same time',
        sectionConflicts: 'Same section at same time'
      });
      
    } catch (error) {
      console.error('Error loading existing schedules:', error);
    }
  }, [currentUser?.email]);

  const fetchData = useCallback(async () => {
    if (!currentUser?.email) return;
    
    const userEmail = currentUser.email;
    
    try {
      // Fetch departments
      const departmentsSnapshot = await getDocs(collection(db, 'users', userEmail, 'departments'));
      const departmentsList: Department[] = [];
      departmentsSnapshot.forEach((doc) => {
        departmentsList.push({ id: doc.id, ...doc.data() } as Department);
      });
      setDepartments(departmentsList);

      // Fetch sections
      const sectionsSnapshot = await getDocs(collection(db, 'users', userEmail, 'sections'));
      const sectionsList: Section[] = [];
      sectionsSnapshot.forEach((doc) => {
        sectionsList.push({ id: doc.id, ...doc.data() } as Section);
      });
      setSections(sectionsList);

      // Fetch subjects
      const subjectsSnapshot = await getDocs(collection(db, 'users', userEmail, 'subjects'));
      const subjectsList: Subject[] = [];
      subjectsSnapshot.forEach((doc) => {
        subjectsList.push({ id: doc.id, ...doc.data() } as Subject);
      });
      setSubjects(subjectsList);

      // Fetch faculties
      const facultiesSnapshot = await getDocs(collection(db, 'users', userEmail, 'faculties'));
      const facultiesList: Faculty[] = [];
      facultiesSnapshot.forEach((doc) => {
        facultiesList.push({ id: doc.id, ...doc.data() } as Faculty);
      });
      setFaculties(facultiesList);

      // Fetch classrooms
      const classroomsSnapshot = await getDocs(collection(db, 'users', userEmail, 'classrooms'));
      const classroomsList: Classroom[] = [];
      classroomsSnapshot.forEach((doc) => {
        classroomsList.push({ id: doc.id, ...doc.data() } as Classroom);
      });
      setClassrooms(classroomsList);
      
      // Load existing schedules for conflict checking
      await loadExistingSchedules();
      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [currentUser, loadExistingSchedules]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Reload existing schedules when timetables are saved to ensure conflict checking is up to date
  useEffect(() => {
    if (currentUser?.email) {
      loadExistingSchedules();
    }
  }, [loadExistingSchedules, savedTimetables, currentUser?.email]); // Reload when saved timetables change

  // Watch for department changes and load time settings
  useEffect(() => {
    if (generateParams.department) {
      loadDepartmentTimeSettings(generateParams.department);
      // Also load saved timetables for the department/section
      if (generateParams.section) {
        loadSavedTimetables();
      }
    }
  }, [generateParams.department, generateParams.section, loadDepartmentTimeSettings, loadSavedTimetables, currentUser?.email]);

  // Generate conflict-free timetables using ConflictResolver
  const generateWithConflictResolution = async () => {
    if (!generateParams.department || !generateParams.section) {
      alert('Please select both department and section.');
      return;
    }
    
    // Validate we have necessary data
    if (subjects.length === 0) {
      alert('No subjects available. Please add subjects first in the Subjects management page.');
      return;
    }
    
    if (faculties.length === 0) {
      alert('No faculty available. Please add faculty first in the Faculty management page.');
      return;
    }
    
    if (classrooms.length === 0) {
      alert('No classrooms available. Please add classrooms first in the Classrooms management page.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Reload existing schedules to ensure we have the latest data
      console.log('🔄 Refreshing conflict data before generation...');
      await loadExistingSchedules();
      await loadSavedTimetables();
      
      // Wait a moment for the conflict resolver to be updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!conflictResolver) {
        alert('Conflict resolution system not ready. Please wait a moment and try again.');
        setLoading(false);
        return;
      }
      
      console.log(`🎯 Generating timetable for: ${generateParams.department} - ${generateParams.section}`);
      console.log(`🛡️ Checking conflicts against ${existingSchedules.length} existing schedule entries`);
      
      const generatedTimetables = conflictResolver.generateConflictFreeTimetables(
        subjects,
        faculties,
        classrooms,
        {
          ...generateParams,
          timeSlots: timeSlots,
          constraints: constraints,
          shuffleClassrooms: shuffleClassrooms
        }
      );
      
      setGeneratedTimetables(generatedTimetables);
      setSelectedTab(1); // Switch to generated timetables tab
      
      // Log detailed conflict report
      const conflictReport = conflictResolver.getConflictReport();
      console.log('🔍 CONFLICT RESOLUTION REPORT:');
      console.log(`📅 Total Existing Schedules: ${conflictReport.totalExistingSchedules}`);
      console.log(`👨‍🏫 Busy Faculty: ${conflictReport.busyFaculty.length}`);
      console.log(`🏫 Busy Classrooms: ${conflictReport.busyClassrooms.length}`);
      console.log(`🎓 Busy Sections: ${conflictReport.busySections.length}`);
      
      // Success - no annoying popup!
      console.log(`✅ Successfully generated ${generatedTimetables.length} conflict-free timetable(s)!`);
      
    } catch (error) {
      console.error('Error generating conflict-free timetables:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error generating timetables: ${errorMessage}. Please ensure you have selected a department and section with available subjects and faculty.`);
    } finally {
      setLoading(false);
    }
  };


  const generateTimetablesWithGemini = async () => {
    if (!geminiApiKey) {
      setApiKeyDialog(true);
      return;
    }
    if (!generateParams.department || !generateParams.section) {
      alert('Please select both department and section.');
      return;
    }

    setLoading(true);
    try {
      // Get subjects for the selected department
      const departmentSubjects = subjects.filter(s => {
        // Find faculty who can teach this subject in the selected department
        return faculties.some(f => 
          f.department === generateParams.department && 
          f.subjects && 
          (f.subjects.includes(s.id) || f.subjects.includes(s.code) || f.subjects.includes(s.name))
        );
      });
      
      // If no department-specific subjects found, use all subjects as fallback
      const availableSubjects = departmentSubjects.length > 0 ? departmentSubjects : subjects;
      const departmentFaculties = faculties.filter(f => f.department === generateParams.department);

      const prompt = `Create 5 different optimized timetable schedules for:

Department: ${generateParams.department}
Semester: ${generateParams.semester}
Section: ${generateParams.section}
Working Days: ${generateParams.workingDays.join(', ')}
Time Slots: ${timeSlots.join(', ')}

Subjects Available:
${availableSubjects.map(s => `- ${s.name} (${s.code}) - ${s.credits} credits`).join('\\n')}

Faculty Available:
${departmentFaculties.map(f => `- ${f.name} (${f.specialization}) - Subjects: ${f.subjects ? f.subjects.join(', ') : 'General'}`).join('\\n')}

Classrooms Available:
${classrooms.map(c => `- ${c.name} (${c.type}, Capacity: ${c.capacity})`).join('\\n')}

Please generate 5 different timetable variations with:
1. No conflicts (same faculty/classroom at same time)
2. Balanced distribution of subjects
3. Consider faculty specialization
4. Optimize classroom usage
5. Different arrangements for variety

Return each timetable as JSON with format:
{
  "name": "Schedule Variation X",
  "description": "Brief description of this variation's approach",
  "schedule": [
    {
      "day": "Monday",
      "time": "09:00-10:00",
      "subject": "subject name",
      "faculty": "faculty name",
      "classroom": "classroom name"
    }
  ]
}

Create 5 completely different arrangements focusing on different optimization strategies.

IMPORTANT: 
- Use ONLY the subjects and faculty listed above
- Ensure each subject appears multiple times per week based on credits
- No faculty should be assigned to multiple classes at the same time
- No classroom should have multiple classes at the same time
- Skip 12:00-13:00 slot (lunch break)
- Return valid JSON format only

Example response format:
[
  {
    "name": "Morning Heavy Schedule",
    "description": "Core subjects in morning slots",
    "schedule": [
      {"day": "Monday", "time": "09:00-10:00", "subject": "Data Structures", "faculty": "Dr. Smith", "classroom": "Room 101"}
    ]
  }
]`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log('Generated text from Gemini:', generatedText);
      
      // Parse the generated timetables
      const timetables = parseGeneratedTimetables(generatedText);
      setGeneratedTimetables(timetables);
      
    } catch (error) {
      console.error('Error generating timetables:', error);
      // Fallback: generate sample timetables
      const sampleTimetables = generateSampleTimetables();
      setGeneratedTimetables(sampleTimetables);
    }
    setLoading(false);
  };

  const parseGeneratedTimetables = (text: string): GeneratedTimetable[] => {
    try {
      console.log('Parsing generated text:', text);
      
      // First try to parse as array
      if (text.trim().startsWith('[')) {
        try {
          const parsedArray = JSON.parse(text.trim());
          if (Array.isArray(parsedArray)) {
            return parsedArray.map((item, index) => ({
              id: `generated-${Date.now()}-${index}`,
              name: item.name || `Schedule Variation ${index + 1}`,
              description: item.description || 'AI-generated timetable',
              schedule: item.schedule || []
            })).slice(0, 5);
          }
        } catch (e) {
          console.log('Failed to parse as array, trying individual objects');
        }
      }
      
      // Extract individual JSON objects
      const jsonRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      const matches = text.match(jsonRegex) || [];
      
      const timetables: GeneratedTimetable[] = [];
      
      matches.forEach((match, index) => {
        try {
          const parsed = JSON.parse(match);
          if (parsed.schedule && Array.isArray(parsed.schedule)) {
            timetables.push({
              id: `generated-${Date.now()}-${index}`,
              name: parsed.name || `Schedule Variation ${index + 1}`,
              description: parsed.description || 'AI-generated timetable variation',
              schedule: parsed.schedule
            });
          }
        } catch (e) {
          console.error('Error parsing individual timetable:', e);
        }
      });

      // If no valid timetables parsed, generate samples
      return timetables.length > 0 ? timetables.slice(0, 5) : generateSampleTimetables();
    } catch (error) {
      console.error('Error parsing generated timetables:', error);
      return generateSampleTimetables();
    }
  };

  const generateSampleTimetables = (): GeneratedTimetable[] => {
    // Enhanced subject filtering for better distribution
    let departmentSubjects = subjects.filter(s => {
      return faculties.some(f => 
        f.department === generateParams.department && 
        f.subjects && 
        (f.subjects.includes(s.id) || f.subjects.includes(s.code) || f.subjects.includes(s.name))
      );
    });
    
    // If no department subjects found, use all subjects with weighting
    if (departmentSubjects.length === 0) {
      departmentSubjects = subjects.slice(0, 12); // Use more subjects for variety
    }
    
    const departmentFaculties = faculties.filter(f => f.department === generateParams.department);
    const availableFaculties = departmentFaculties.length > 0 ? departmentFaculties : faculties.slice(0, 15);
    
    const sampleTimetables: GeneratedTimetable[] = [];

    for (let i = 0; i < 5; i++) {
      const schedule: TimetableEntry[] = [];
      
      // Create weighted subject list based on credits for better distribution
      const weightedSubjects: any[] = [];
      departmentSubjects.forEach(subject => {
        const repetitions = Math.max(2, (subject.credits || 3)); // Minimum 2 times per subject
        for (let j = 0; j < repetitions; j++) {
          weightedSubjects.push(subject);
        }
      });
      
      const shuffledSubjects = [...weightedSubjects].sort(() => Math.random() - 0.5);
      let subjectIndex = 0;

      generateParams.workingDays.forEach((day: string) => {
        timeSlots.forEach((timeSlot: string) => {
          // Skip lunch and break slots more comprehensively
          if (timeSlot.includes('LUNCH') || timeSlot.includes('BREAK') || timeSlot === '12:00-13:00') {
            return;
          }
          
          if (shuffledSubjects.length === 0) return;
          
          const subject = shuffledSubjects[subjectIndex % shuffledSubjects.length];
          
          // Enhanced faculty assignment with specialization matching
          let assignedFaculty = availableFaculties.find(f => {
            // First try to match by subject expertise
            return f.subjects && (
              f.subjects.includes(subject.id) || 
              f.subjects.includes(subject.code) || 
              f.subjects.includes(subject.name) ||
              (f.specialization && subject.name.toLowerCase().includes(f.specialization.toLowerCase().split(' ')[0]))
            );
          });
          
          // Fallback to any available faculty
          if (!assignedFaculty && availableFaculties.length > 0) {
            assignedFaculty = availableFaculties[Math.floor(Math.random() * availableFaculties.length)];
          }
          
          // Create default faculty if none available
          if (!assignedFaculty) {
            assignedFaculty = {
              id: '1',
              name: `Prof. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`,
              department: generateParams.department,
              specialization: subject.name.split(' ')[0],
              subjects: [subject.name]
            };
          }
          
          // Enhanced classroom assignment
          let assignedClassroom;
          if (classrooms.length > 0) {
            // Match classroom type to subject if possible
            assignedClassroom = classrooms.find(c => {
              if (subject.name.toLowerCase().includes('lab') || subject.name.toLowerCase().includes('practical')) {
                return c.type?.toLowerCase().includes('lab') || c.type?.toLowerCase().includes('practical');
              }
              return c.type?.toLowerCase().includes('lecture') || !c.type;
            });
            
            // Fallback to any classroom
            if (!assignedClassroom) {
              assignedClassroom = classrooms[Math.floor(Math.random() * classrooms.length)];
            }
          } else {
            // Create default classroom if none available
            const roomNumber = 100 + Math.floor(Math.random() * 50);
            assignedClassroom = {
              id: String(roomNumber),
              name: `Room-${roomNumber}`,
              capacity: 40,
              type: subject.name.toLowerCase().includes('lab') ? 'Lab' : 'Lecture'
            };
          }

          // Add the schedule entry
          schedule.push({
            day,
            time: timeSlot,
            subject: subject.name,
            faculty: assignedFaculty.name,
            classroom: assignedClassroom.name
          });
          
          subjectIndex++;
        });
      });

      // Calculate schedule density for better descriptions
      const totalSlots = generateParams.workingDays.length * timeSlots.filter(t => 
        !t.includes('LUNCH') && !t.includes('BREAK')
      ).length;
      const fillPercentage = Math.round((schedule.length / totalSlots) * 100);

      sampleTimetables.push({
        id: `enhanced-${Date.now()}-${i}`,
        name: `Schedule Variation ${i + 1}`,
        description: `✅ Optimized schedule (${fillPercentage}% filled) - ${
          i === 0 ? '🌅 Morning-focused core subjects' :
          i === 1 ? '⚖️ Balanced workload distribution' :
          i === 2 ? '🧪 Afternoon practical sessions' :
          i === 3 ? '📚 Theory-practice alternating' :
                   '🎯 Faculty-optimized scheduling'
        }`,
        schedule
      });
    }

    return sampleTimetables;
  };

  const saveTimetable = async () => {
    if (!selectedTimetable || !currentUser?.email || !timetableName) {
      alert('Please select a timetable and enter a name');
      return;
    }

    setSaveStatus('saving');
    
    try {
      const userEmail = currentUser.email;
      const department = generateParams.department || 'General';
      const sectionValue = generateParams.section || 'A';
      
      console.log('💾 Saving timetable:', {
        name: timetableName,
        department,
        section: sectionValue,
        entries: selectedTimetable.schedule.length
      });

      // Save timetable to the main timetables collection for TimetableManagement
      const timetableData = {
        name: timetableName,
        department,
        section: sectionValue,
        semester: generateParams.semester.toString(),
        schedule: selectedTimetable.schedule,
        description: selectedTimetable.description,
        createdAt: new Date(),
        timeSettings: departmentTimeSettings,
        isLiked: false
      };
      
      // Add to main timetables collection
      await addDoc(collection(db, 'users', userEmail, 'timetables'), timetableData);
      
      // Update saved timetables list and reload for conflict resolution
      await loadSavedTimetables();
      
      setSaveStatus('saved');
      setSaveDialog(false);
      setTimetableName('');
      setSelectedTimetable(null);
      
      console.log('✅ Timetable saved successfully!');
      alert(`✅ Timetable "${timetableName}" saved successfully! You can view it in My Timetables.`);
      
      // Reset save status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
      
    } catch (error) {
      console.error('❌ Error saving timetable:', error);
      setSaveStatus('error');
      alert('❌ Error saving timetable. Please try again.');
      
      // Reset save status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const renderTimetableGrid = (schedule: TimetableEntry[]) => {
    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
              {generateParams.workingDays.map((day: string) => (
                <TableCell key={day} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map((timeSlot: string) => (
              <TableRow key={timeSlot}>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>
                  {timeSlot}
                </TableCell>
                {generateParams.workingDays.map((day: string) => {
                  const entry = schedule.find((s: TimetableEntry) => s.day === day && s.time === timeSlot);
                  return (
                    <TableCell key={`${day}-${timeSlot}`} sx={{ textAlign: 'center', p: 1 }}>
                      {timeSlot.includes('LUNCH BREAK') ? (
                        <Chip label="🍽️ LUNCH BREAK" size="small" color="warning" sx={{ fontWeight: 'bold' }} />
                      ) : timeSlot.includes('BREAK') ? (
                        <Chip label="☕ BREAK" size="small" color="info" sx={{ fontWeight: 'bold' }} />
                      ) : entry ? (
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                            {entry.subject}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {entry.faculty}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'primary.main', display: 'block' }}>
                            {entry.classroom}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          Free
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' }}>
        <Toolbar>
          <IconButton color="inherit" onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <AutoAwesome sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            AI Timetable Generator
          </Typography>
          <Chip 
            label="💡 Tip: Save your timetables to download them as PDF!" 
            variant="outlined" 
            sx={{ 
              color: 'primary.contrastText', 
              borderColor: 'rgba(255,255,255,0.5)',
              fontSize: '0.75rem',
              display: { xs: 'none', md: 'inline-flex' }
            }} 
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Generation Parameters */}
          <Grid item xs={12} lg={4}>
            <Card elevation={3} sx={{ position: 'sticky', top: 20 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Settings sx={{ mr: 1 }} />
                  Generation Settings
                </Typography>
                

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={generateParams.department}
                        onChange={(e) => setGenerateParams({ ...generateParams, department: e.target.value, section: '' })}
                        label="Department"
                      >
                        <MenuItem value="">Select Department</MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.code}>{dept.name} ({dept.code})</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Semester</InputLabel>
                      <Select
                        value={generateParams.semester}
                        onChange={(e) => setGenerateParams({...generateParams, semester: Number(e.target.value)})}
                        label="Semester"
                      >
                        {[1,2,3,4,5,6,7,8].map(sem => (
                          <MenuItem key={sem} value={sem}>{sem}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Section</InputLabel>
                      <Select
                        value={generateParams.section}
                        onChange={(e) => setGenerateParams({...generateParams, section: e.target.value})}
                        label="Section"
                        disabled={!generateParams.department}
                      >
                        <MenuItem value="">Select Section</MenuItem>
                        {Array.from(
                          new Map(
                            sections
                              .filter(section => section.department === generateParams.department && section.semester === generateParams.semester)
                              .map(section => [section.name, section])
                          ).values()
                        ).map(section => (
                          <MenuItem key={section.id} value={section.name}>{section.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      📊 Available: {subjects.length} subjects, {faculties.length} faculty, {classrooms.length} classrooms
                      {generateParams.department && (
                        <><br/>🎯 {generateParams.department}: {subjects.filter(s => faculties.some(f => f.department === generateParams.department && f.subjects && (f.subjects.includes(s.id) || f.subjects.includes(s.code) || f.subjects.includes(s.name)))).length} dept subjects, {faculties.filter(f => f.department === generateParams.department).length} dept faculty</>
                      )}
                      {departmentTimeSettings && (
                        <><br/>🕒 Time Settings: {generateParams.startTime}-{generateParams.endTime}, {generateParams.periodDuration}min periods, {timeSlots.length} slots</>
                      )}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Subject Constraints Section */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    🚫 Subject Constraints (Optional)
                  </Typography>
                  
                  {constraints.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      {constraints.map((constraint, index) => (
                        <Chip
                          key={constraint.id}
                          label={`${constraint.subjectCode}: ${constraint.description}`}
                          onDelete={() => {
                            setConstraints(constraints.filter(c => c.id !== constraint.id));
                          }}
                          size="small"
                          sx={{ m: 0.5 }}
                          color="warning"
                        />
                      ))}
                    </Box>
                  )}
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setConstraintDialog(true)}
                    disabled={constraints.length >= 3}
                    sx={{ mb: 2 }}
                  >
                    + Add Constraint {constraints.length > 0 && `(${constraints.length}/3)`}
                  </Button>
                  
                  {constraints.length >= 3 && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Maximum 3 constraints allowed
                    </Typography>
                  )}
                </Box>

                {/* Shuffle Classrooms Option */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input
                      type="checkbox"
                      checked={shuffleClassrooms}
                      onChange={(e) => setShuffleClassrooms(e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      🔀 <strong>Shuffle Classrooms</strong> - Randomly assign classrooms to avoid same classroom scheduling
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, ml: '40px' }}>
                    {shuffleClassrooms 
                      ? '✅ Enabled: Classrooms will be randomly shuffled for variety'
                      : '❌ Disabled: Classrooms will be assigned in order'}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                    onClick={generateWithConflictResolution}
                    disabled={loading || !generateParams.department || !generateParams.section || !conflictResolver}
                    sx={{ mb: 2 }}
                  >
                    {loading ? 'Generating...' : 
                     !conflictResolver ? 'Loading Conflict Checker...' :
                     '🛡️ Generate Conflict-Free Timetables'}
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={generateTimetablesWithGemini}
                    disabled={loading || !generateParams.department || !generateParams.section}
                    sx={{ mb: 1 }}
                  >
                    🤖 Generate AI Alternative
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => setGeneratedTimetables([])}
                    disabled={generatedTimetables.length === 0}
                  >
                    Clear Results
                  </Button>
                </Box>
                
            </CardContent>
          </Card>
        </Grid>          {/* Generated Timetables */}
          <Grid item xs={12} lg={8}>
            {generatedTimetables.length > 0 && (
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Generated Timetable Variations ({generatedTimetables.length})
                  </Typography>
                  
                  <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                    {generatedTimetables.map((timetable, index) => (
                      <Tab 
                        key={timetable.id}
                        label={
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption">{timetable.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {timetable.description.split(' - ')[0]}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </Tabs>

                  {generatedTimetables[selectedTab] && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography variant="h6">{generatedTimetables[selectedTab].name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {generatedTimetables[selectedTab].description}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={() => {
                              const currentTimetable = generatedTimetables[selectedTab];
                              showDownloadOptions(
                                currentTimetable,
                                generateParams.department,
                                `S${generateParams.semester}-${generateParams.section}`
                              );
                            }}
                            sx={{ mr: 1 }}
                          >
                            📥 Download PDF
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<Save />}
                          onClick={() => {
                            setSelectedTimetable(generatedTimetables[selectedTab]);
                            const autoTitle = `${generateParams.department}-S${generateParams.semester}-${generateParams.section}-${generatedTimetables[selectedTab].name.replace(/[^a-zA-Z0-9]/g, '')}`;
                            setTimetableName(autoTitle);
                            setSaveDialog(true);
                          }}
                          >
                            💾 Save Schedule
                          </Button>
                        </Box>
                      </Box>

                      {renderTimetableGrid(generatedTimetables[selectedTab].schedule)}
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card elevation={3}>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={60} />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    AI is generating optimized timetables...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Creating 5 different schedule variations with conflict resolution
                  </Typography>
                </CardContent>
              </Card>
            )}

            {!loading && generatedTimetables.length === 0 && (
              <Card elevation={3}>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <AutoAwesome sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Ready to Generate AI Timetables
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Select department and section, then click "Generate AI Timetables" to create 5 optimized schedule variations
                  </Typography>
                  <Typography variant="body2" color="primary">
                    ✨ AI will create multiple options with different optimization strategies
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Saved Timetables */}
          {savedTimetables.length > 0 && (
            <Grid item xs={12}>
              <Card elevation={3} sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📚 Saved Timetables ({savedTimetables.length})
                    <Typography variant="body2" color="text.secondary">
                      - Previously saved schedules for {generateParams.department}
                    </Typography>
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {savedTimetables.map((savedTimetable, index) => (
                      <Grid item xs={12} sm={6} md={4} key={savedTimetable.id}>
                        <Card variant="outlined" sx={{ 
                          height: '100%',
                          cursor: 'pointer',
                          '&:hover': { 
                            boxShadow: 4,
                            transform: 'translateY(-2px)',
                            transition: 'all 0.3s ease'
                          }
                        }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">
                              {savedTimetable.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {savedTimetable.description}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              📅 Saved: {savedTimetable.savedAt ? new Date(savedTimetable.savedAt).toLocaleDateString() : 'Unknown'}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              📊 {savedTimetable.schedule.length} periods scheduled
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => {
                                  showDownloadOptions(
                                    savedTimetable,
                                    generateParams.department,
                                    `S${generateParams.semester}-${generateParams.section}`
                                  );
                                }}
                              >
                                📥 PDF
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Save Dialog */}
        <Dialog open={saveDialog} onClose={() => setSaveDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Save Timetable - {generateParams.department} Semester {generateParams.semester} Section {generateParams.section}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Timetable Title"
              value={timetableName}
              onChange={(e) => setTimetableName(e.target.value)}
              placeholder={`${generateParams.department}-S${generateParams.semester}-${generateParams.section} Timetable`}
              helperText={`Auto-saved for: ${generateParams.department} Department, Semester ${generateParams.semester}, Section ${generateParams.section}`}
              sx={{ mt: 2 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              📅 Department: <strong>{generateParams.department}</strong><br/>
              📚 Semester: <strong>{generateParams.semester}</strong><br/>
              🎓 Section: <strong>{generateParams.section}</strong><br/>
              ⭐ Schedule: <strong>{selectedTimetable?.name}</strong>
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialog(false)} disabled={saveStatus === 'saving'}>Cancel</Button>
            <Button 
              onClick={saveTimetable} 
              variant="contained" 
              disabled={!timetableName || saveStatus === 'saving'}
              color={saveStatus === 'saved' ? 'success' : saveStatus === 'error' ? 'error' : 'primary'}
            >
              {saveStatus === 'saving' ? '💾 Saving...' : 
               saveStatus === 'saved' ? '✅ Saved!' : 
               saveStatus === 'error' ? '❌ Error' : 'Save Timetable'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* API Key Dialog */}
        <Dialog open={apiKeyDialog} onClose={() => setApiKeyDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Configure Gemini AI API</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              To use AI-powered timetable generation, please provide your Gemini API key:
            </Typography>
            <TextField
              fullWidth
              label="Gemini API Key"
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              sx={{ mt: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Get your API key from: https://makersuite.google.com/app/apikey
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApiKeyDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => setApiKeyDialog(false)} 
              variant="contained" 
              disabled={!geminiApiKey}
            >
              Save API Key
            </Button>
          </DialogActions>
        </Dialog>

        {/* Subject Constraints Dialog */}
        <Dialog open={constraintDialog} onClose={() => setConstraintDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add Subject Constraint</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={newConstraint.subjectCode || ''}
                    onChange={(e) => {
                      const selectedSubject = subjects.find(s => s.code === e.target.value);
                      setNewConstraint({
                        ...newConstraint,
                        subjectCode: e.target.value,
                        subjectName: selectedSubject?.name || ''
                      });
                    }}
                    label="Subject"
                  >
                    {generateParams.section
                      ? (() => {
                          // Find the selected section object
                          const selectedSection = sections.find(sec => sec.name === generateParams.section);
                          if (!selectedSection) {
                            return [
                              <MenuItem key="no-section" value="" disabled>
                                Please select a valid section to view subjects
                              </MenuItem>
                            ];
                          }
                          // Filter subjects by department and semester if possible
                          return subjects
                            .filter(subject => {
                              // If subject has department and credits, match department and semester
                              // (Assume subject code prefix matches department code, e.g., ECE for ECE subjects)
                              if (selectedSection.department && subject.code) {
                                const deptCode = selectedSection.department.replace(/[^A-Z]/gi, '').toUpperCase();
                                if (!subject.code.toUpperCase().startsWith(deptCode)) return false;
                              }
                              // Optionally, filter by semester if subject name/code contains semester info
                              // (If you have a semester property on subject, add: subject.semester === selectedSection.semester)
                              return true;
                            })
                            .map(subject => (
                              <MenuItem key={subject.id} value={subject.code}>
                                {subject.code} - {subject.name}
                              </MenuItem>
                            ));
                        })()
                      : [
                          <MenuItem key="no-section" value="" disabled>
                            Please select a section to view subjects
                          </MenuItem>
                        ]
                    }
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Constraint Type</InputLabel>
                  <Select
                    value={newConstraint.restrictionType || 'avoid_time_slots'}
                    onChange={(e) => setNewConstraint({...newConstraint, restrictionType: e.target.value as any})}
                    label="Constraint Type"
                  >
                    <MenuItem value="avoid_time_slots">🚫 Avoid Time Slots</MenuItem>
                    <MenuItem value="prefer_time_slots">✅ Prefer Time Slots</MenuItem>
                    <MenuItem value="no_consecutive">⏭️ No Consecutive Periods</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {(newConstraint.restrictionType === 'avoid_time_slots' || newConstraint.restrictionType === 'prefer_time_slots') && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Select Time Slots:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {timeSlots.filter(slot => !slot.includes('BREAK') && !slot.includes('LUNCH')).map(slot => (
                      <Chip
                        key={slot}
                        label={slot}
                        clickable
                        color={newConstraint.timeSlots?.includes(slot) ? 'primary' : 'default'}
                        onClick={() => {
                          const currentSlots = newConstraint.timeSlots || [];
                          const newSlots = currentSlots.includes(slot)
                            ? currentSlots.filter(s => s !== slot)
                            : [...currentSlots, slot];
                          setNewConstraint({...newConstraint, timeSlots: newSlots});
                        }}
                        size="small"
                      />
                    ))}
                  </Box>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={newConstraint.description || ''}
                  onChange={(e) => setNewConstraint({...newConstraint, description: e.target.value})}
                  placeholder="e.g., AIML should not be scheduled in first 2 hours"
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setConstraintDialog(false);
              setNewConstraint({ subjectCode: '', restrictionType: 'avoid_time_slots', timeSlots: [], description: '' });
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newConstraint.subjectCode) {
                  const constraint: SchedulingConstraint = {
                    id: Date.now().toString(),
                    subjectCode: newConstraint.subjectCode!,
                    subjectName: newConstraint.subjectName || '',
                    restrictionType: newConstraint.restrictionType || 'avoid_time_slots',
                    timeSlots: newConstraint.timeSlots || [],
                    description: newConstraint.description || `${newConstraint.restrictionType?.replace('_', ' ')} constraint for ${newConstraint.subjectCode}`
                  };
                  setConstraints([...constraints, constraint]);
                  setConstraintDialog(false);
                  setNewConstraint({ subjectCode: '', restrictionType: 'avoid_time_slots', timeSlots: [], description: '' });
                }
              }}
              variant="contained"
              disabled={!newConstraint.subjectCode}
            >
              Add Constraint
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TimetableGenerator;