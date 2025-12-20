import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Chip,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  School,
  ArrowBack,
} from '@mui/icons-material';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  credits: number;
  color: string;
  department: string;
  semester: number;
}

interface SubjectManagementProps {
  onBack: () => void;
}

// Department options
const DEPARTMENTS = [
  { code: 'AIDS', name: 'Artificial Intelligence and Data Science' },
  { code: 'CSE', name: 'Computer Science Engineering' },
  { code: 'ECE', name: 'Electronics and Communication Engineering' }
];

const SubjectManagement: React.FC<SubjectManagementProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    color: '#2196F3',
    department: 'AIDS',
    semester: 1
  });

  const predefinedColors = [
    '#2196F3', '#4CAF50', '#FF9800', '#9C27B0',
    '#F44336', '#00BCD4', '#FFEB3B', '#795548',
    '#607D8B', '#E91E63', '#3F51B5', '#FFC107',
  ];

  const fetchSubjects = useCallback(async () => {
    if (!currentUser?.email) {
      console.log('No user email found:', currentUser);
      return;
    }
    console.log('Fetching subjects for user:', currentUser.email);
    try {
      const querySnapshot = await getDocs(collection(db, 'users', currentUser.email, 'subjects'));
      const subjectList: Subject[] = [];
      querySnapshot.forEach((doc) => {
        subjectList.push({ id: doc.id, ...doc.data() } as Subject);
      });
      console.log('Fetched subjects:', subjectList);
      setSubjects(subjectList);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Filter subjects based on selected department
  useEffect(() => {
    if (selectedDepartment === 'ALL') {
      setFilteredSubjects(subjects);
    } else {
      setFilteredSubjects(subjects.filter(subject => subject.department === selectedDepartment));
    }
  }, [subjects, selectedDepartment]);

  // Handle department filter change
  const handleDepartmentFilterChange = (event: any) => {
    setSelectedDepartment(event.target.value);
  };

  // Function to add comprehensive subjects for all departments
  const addSampleSubjects = async () => {
    if (!currentUser?.email) return;
    
    const allSubjects = [
      // AIDS Department - Complete 8 Semester Curriculum
      // Semester 1
      { code: 'AIDS101', name: 'Engineering Mathematics I', department: 'AIDS', semester: 1, credits: 4 },
      { code: 'AIDS102', name: 'Engineering Physics', department: 'AIDS', semester: 1, credits: 3 },
      { code: 'AIDS103', name: 'Programming in C', department: 'AIDS', semester: 1, credits: 4 },
      { code: 'AIDS104', name: 'Engineering Chemistry', department: 'AIDS', semester: 1, credits: 3 },
      { code: 'AIDS105', name: 'Technical Communication', department: 'AIDS', semester: 1, credits: 2 },
      { code: 'AIDS106', name: 'Engineering Graphics', department: 'AIDS', semester: 1, credits: 3 },
      
      // Semester 2
      { code: 'AIDS201', name: 'Engineering Mathematics II', department: 'AIDS', semester: 2, credits: 4 },
      { code: 'AIDS202', name: 'Data Structures', department: 'AIDS', semester: 2, credits: 4 },
      { code: 'AIDS203', name: 'Digital Logic Design', department: 'AIDS', semester: 2, credits: 3 },
      { code: 'AIDS204', name: 'Engineering Graphics II', department: 'AIDS', semester: 2, credits: 2 },
      { code: 'AIDS205', name: 'Environmental Science', department: 'AIDS', semester: 2, credits: 2 },
      { code: 'AIDS206', name: 'Object Oriented Programming', department: 'AIDS', semester: 2, credits: 4 },
      
      // Semester 3
      { code: 'AIDS301', name: 'Database Management Systems', department: 'AIDS', semester: 3, credits: 4 },
      { code: 'AIDS302', name: 'Machine Learning', department: 'AIDS', semester: 3, credits: 4 },
      { code: 'AIDS303', name: 'Python Programming', department: 'AIDS', semester: 3, credits: 3 },
      { code: 'AIDS304', name: 'Statistics and Probability', department: 'AIDS', semester: 3, credits: 3 },
      { code: 'AIDS305', name: 'Computer Organization', department: 'AIDS', semester: 3, credits: 3 },
      { code: 'AIDS306', name: 'Web Technologies', department: 'AIDS', semester: 3, credits: 3 },
      
      // Semester 4
      { code: 'AIDS401', name: 'Deep Learning', department: 'AIDS', semester: 4, credits: 4 },
      { code: 'AIDS402', name: 'Data Mining', department: 'AIDS', semester: 4, credits: 3 },
      { code: 'AIDS403', name: 'Computer Networks', department: 'AIDS', semester: 4, credits: 3 },
      { code: 'AIDS404', name: 'Operating Systems', department: 'AIDS', semester: 4, credits: 3 },
      { code: 'AIDS405', name: 'Software Engineering', department: 'AIDS', semester: 4, credits: 3 },
      { code: 'AIDS406', name: 'Natural Language Processing', department: 'AIDS', semester: 4, credits: 3 },
      
      // CSE Department - Complete Curriculum
      // Semester 1
      { code: 'CSE101', name: 'Engineering Mathematics I', department: 'CSE', semester: 1, credits: 4 },
      { code: 'CSE102', name: 'Engineering Physics', department: 'CSE', semester: 1, credits: 3 },
      { code: 'CSE103', name: 'Programming in C', department: 'CSE', semester: 1, credits: 4 },
      { code: 'CSE104', name: 'Engineering Chemistry', department: 'CSE', semester: 1, credits: 3 },
      { code: 'CSE105', name: 'English Communication', department: 'CSE', semester: 1, credits: 2 },
      { code: 'CSE106', name: 'Problem Solving Techniques', department: 'CSE', semester: 1, credits: 3 },
      
      // Semester 2
      { code: 'CSE201', name: 'Engineering Mathematics II', department: 'CSE', semester: 2, credits: 4 },
      { code: 'CSE202', name: 'Data Structures and Algorithms', department: 'CSE', semester: 2, credits: 4 },
      { code: 'CSE203', name: 'Digital Electronics', department: 'CSE', semester: 2, credits: 3 },
      { code: 'CSE204', name: 'Object Oriented Programming', department: 'CSE', semester: 2, credits: 4 },
      { code: 'CSE205', name: 'Discrete Mathematics', department: 'CSE', semester: 2, credits: 3 },
      { code: 'CSE206', name: 'Computer Graphics', department: 'CSE', semester: 2, credits: 3 },
      
      // Semester 3
      { code: 'CSE301', name: 'Database Management Systems', department: 'CSE', semester: 3, credits: 4 },
      { code: 'CSE302', name: 'Computer Organization', department: 'CSE', semester: 3, credits: 3 },
      { code: 'CSE303', name: 'Operating Systems', department: 'CSE', semester: 3, credits: 4 },
      { code: 'CSE304', name: 'Software Engineering', department: 'CSE', semester: 3, credits: 3 },
      { code: 'CSE305', name: 'Computer Networks', department: 'CSE', semester: 3, credits: 3 },
      { code: 'CSE306', name: 'Web Programming', department: 'CSE', semester: 3, credits: 3 },
      
      // Semester 4
      { code: 'CSE401', name: 'Theory of Computation', department: 'CSE', semester: 4, credits: 3 },
      { code: 'CSE402', name: 'Compiler Design', department: 'CSE', semester: 4, credits: 4 },
      { code: 'CSE403', name: 'Computer Graphics Advanced', department: 'CSE', semester: 4, credits: 3 },
      { code: 'CSE404', name: 'Web Technologies', department: 'CSE', semester: 4, credits: 3 },
      { code: 'CSE405', name: 'Algorithm Analysis', department: 'CSE', semester: 4, credits: 4 },
      { code: 'CSE406', name: 'Mobile Application Development', department: 'CSE', semester: 4, credits: 3 },
      
      // IT Department - Complete Curriculum
      // Semester 1
      { code: 'IT101', name: 'Engineering Mathematics I', department: 'IT', semester: 1, credits: 4 },
      { code: 'IT102', name: 'Engineering Physics', department: 'IT', semester: 1, credits: 3 },
      { code: 'IT103', name: 'Programming Fundamentals', department: 'IT', semester: 1, credits: 4 },
      { code: 'IT104', name: 'Digital Electronics', department: 'IT', semester: 1, credits: 3 },
      { code: 'IT105', name: 'Communication Skills', department: 'IT', semester: 1, credits: 2 },
      { code: 'IT106', name: 'Information Technology Fundamentals', department: 'IT', semester: 1, credits: 3 },
      
      // Semester 2
      { code: 'IT201', name: 'Engineering Mathematics II', department: 'IT', semester: 2, credits: 4 },
      { code: 'IT202', name: 'Data Structures', department: 'IT', semester: 2, credits: 4 },
      { code: 'IT203', name: 'Computer Organization', department: 'IT', semester: 2, credits: 3 },
      { code: 'IT204', name: 'Object Oriented Programming', department: 'IT', semester: 2, credits: 4 },
      { code: 'IT205', name: 'Discrete Mathematics', department: 'IT', semester: 2, credits: 3 },
      { code: 'IT206', name: 'System Analysis and Design', department: 'IT', semester: 2, credits: 3 },
      
      // Semester 3
      { code: 'IT301', name: 'Database Systems', department: 'IT', semester: 3, credits: 4 },
      { code: 'IT302', name: 'Computer Networks', department: 'IT', semester: 3, credits: 4 },
      { code: 'IT303', name: 'Operating Systems', department: 'IT', semester: 3, credits: 3 },
      { code: 'IT304', name: 'Web Technologies', department: 'IT', semester: 3, credits: 3 },
      { code: 'IT305', name: 'Software Engineering', department: 'IT', semester: 3, credits: 3 },
      { code: 'IT306', name: 'Information Security', department: 'IT', semester: 3, credits: 3 },
      
      // Semester 4
      { code: 'IT401', name: 'Network Security', department: 'IT', semester: 4, credits: 3 },
      { code: 'IT402', name: 'Cloud Computing', department: 'IT', semester: 4, credits: 4 },
      { code: 'IT403', name: 'Mobile Computing', department: 'IT', semester: 4, credits: 3 },
      { code: 'IT404', name: 'E-Commerce Technologies', department: 'IT', semester: 4, credits: 3 },
      { code: 'IT405', name: 'Data Analytics', department: 'IT', semester: 4, credits: 4 },
      { code: 'IT406', name: 'Internet of Things', department: 'IT', semester: 4, credits: 3 },
      
      // ECE Department - Complete Curriculum
      // Semester 1
      { code: 'ECE101', name: 'Engineering Mathematics I', department: 'ECE', semester: 1, credits: 4 },
      { code: 'ECE102', name: 'Engineering Physics', department: 'ECE', semester: 1, credits: 3 },
      { code: 'ECE103', name: 'Engineering Chemistry', department: 'ECE', semester: 1, credits: 3 },
      { code: 'ECE104', name: 'Programming in C', department: 'ECE', semester: 1, credits: 3 },
      { code: 'ECE105', name: 'Engineering Graphics', department: 'ECE', semester: 1, credits: 2 },
      { code: 'ECE106', name: 'Basic Electrical Engineering', department: 'ECE', semester: 1, credits: 3 },
      
      // Semester 2
      { code: 'ECE201', name: 'Engineering Mathematics II', department: 'ECE', semester: 2, credits: 4 },
      { code: 'ECE202', name: 'Circuit Analysis', department: 'ECE', semester: 2, credits: 4 },
      { code: 'ECE203', name: 'Electronic Devices', department: 'ECE', semester: 2, credits: 3 },
      { code: 'ECE204', name: 'Digital Logic Design', department: 'ECE', semester: 2, credits: 3 },
      { code: 'ECE205', name: 'Signals and Systems', department: 'ECE', semester: 2, credits: 3 },
      { code: 'ECE206', name: 'Network Theory', department: 'ECE', semester: 2, credits: 3 },
      
      // Semester 3
      { code: 'ECE301', name: 'Electronic Circuits', department: 'ECE', semester: 3, credits: 4 },
      { code: 'ECE302', name: 'Digital Signal Processing', department: 'ECE', semester: 3, credits: 4 },
      { code: 'ECE303', name: 'Microprocessors', department: 'ECE', semester: 3, credits: 3 },
      { code: 'ECE304', name: 'Communication Systems', department: 'ECE', semester: 3, credits: 3 },
      { code: 'ECE305', name: 'Control Systems', department: 'ECE', semester: 3, credits: 3 },
      { code: 'ECE306', name: 'Electromagnetic Fields', department: 'ECE', semester: 3, credits: 3 },
      
      // Semester 4
      { code: 'ECE401', name: 'VLSI Design', department: 'ECE', semester: 4, credits: 4 },
      { code: 'ECE402', name: 'Embedded Systems', department: 'ECE', semester: 4, credits: 3 },
      { code: 'ECE403', name: 'Digital Communication', department: 'ECE', semester: 4, credits: 3 },
      { code: 'ECE404', name: 'Antenna Theory', department: 'ECE', semester: 4, credits: 3 },
      { code: 'ECE405', name: 'Optical Communication', department: 'ECE', semester: 4, credits: 3 },
      { code: 'ECE406', name: 'Power Electronics', department: 'ECE', semester: 4, credits: 4 },
      
      // EEE Department - Complete Curriculum
      // Semester 1
      { code: 'EEE101', name: 'Engineering Mathematics I', department: 'EEE', semester: 1, credits: 4 },
      { code: 'EEE102', name: 'Engineering Physics', department: 'EEE', semester: 1, credits: 3 },
      { code: 'EEE103', name: 'Engineering Chemistry', department: 'EEE', semester: 1, credits: 3 },
      { code: 'EEE104', name: 'Basic Electrical Engineering', department: 'EEE', semester: 1, credits: 4 },
      { code: 'EEE105', name: 'Programming Fundamentals', department: 'EEE', semester: 1, credits: 3 },
      { code: 'EEE106', name: 'Engineering Graphics', department: 'EEE', semester: 1, credits: 2 },
      
      // Semester 2
      { code: 'EEE201', name: 'Engineering Mathematics II', department: 'EEE', semester: 2, credits: 4 },
      { code: 'EEE202', name: 'Circuit Analysis', department: 'EEE', semester: 2, credits: 4 },
      { code: 'EEE203', name: 'Electronic Devices and Circuits', department: 'EEE', semester: 2, credits: 4 },
      { code: 'EEE204', name: 'Digital Electronics', department: 'EEE', semester: 2, credits: 3 },
      { code: 'EEE205', name: 'Electrical Measurements', department: 'EEE', semester: 2, credits: 3 },
      { code: 'EEE206', name: 'Materials Science', department: 'EEE', semester: 2, credits: 3 },
      
      // Semester 3
      { code: 'EEE301', name: 'Power Systems I', department: 'EEE', semester: 3, credits: 4 },
      { code: 'EEE302', name: 'Electrical Machines I', department: 'EEE', semester: 3, credits: 4 },
      { code: 'EEE303', name: 'Control Systems', department: 'EEE', semester: 3, credits: 3 },
      { code: 'EEE304', name: 'Signals and Systems', department: 'EEE', semester: 3, credits: 3 },
      { code: 'EEE305', name: 'Power Electronics', department: 'EEE', semester: 3, credits: 3 },
      { code: 'EEE306', name: 'Microprocessors', department: 'EEE', semester: 3, credits: 3 },
      
      // Semester 4
      { code: 'EEE401', name: 'Power Systems II', department: 'EEE', semester: 4, credits: 4 },
      { code: 'EEE402', name: 'Electrical Machines II', department: 'EEE', semester: 4, credits: 4 },
      { code: 'EEE403', name: 'Industrial Automation', department: 'EEE', semester: 4, credits: 3 },
      { code: 'EEE404', name: 'High Voltage Engineering', department: 'EEE', semester: 4, credits: 3 },
      { code: 'EEE405', name: 'Renewable Energy Systems', department: 'EEE', semester: 4, credits: 3 },
      { code: 'EEE406', name: 'Electrical Drives', department: 'EEE', semester: 4, credits: 3 },
      
      // MECH Department - Complete Curriculum
      // Semester 1
      { code: 'MECH101', name: 'Engineering Mathematics I', department: 'MECH', semester: 1, credits: 4 },
      { code: 'MECH102', name: 'Engineering Physics', department: 'MECH', semester: 1, credits: 3 },
      { code: 'MECH103', name: 'Engineering Chemistry', department: 'MECH', semester: 1, credits: 3 },
      { code: 'MECH104', name: 'Engineering Graphics', department: 'MECH', semester: 1, credits: 3 },
      { code: 'MECH105', name: 'Workshop Technology', department: 'MECH', semester: 1, credits: 3 },
      { code: 'MECH106', name: 'Basic Electrical Engineering', department: 'MECH', semester: 1, credits: 3 },
      
      // Semester 2
      { code: 'MECH201', name: 'Engineering Mathematics II', department: 'MECH', semester: 2, credits: 4 },
      { code: 'MECH202', name: 'Engineering Mechanics', department: 'MECH', semester: 2, credits: 4 },
      { code: 'MECH203', name: 'Strength of Materials', department: 'MECH', semester: 2, credits: 4 },
      { code: 'MECH204', name: 'Thermodynamics', department: 'MECH', semester: 2, credits: 3 },
      { code: 'MECH205', name: 'Manufacturing Processes', department: 'MECH', semester: 2, credits: 3 },
      { code: 'MECH206', name: 'Computer Programming', department: 'MECH', semester: 2, credits: 3 },
      
      // Semester 3
      { code: 'MECH301', name: 'Machine Design', department: 'MECH', semester: 3, credits: 4 },
      { code: 'MECH302', name: 'Fluid Mechanics', department: 'MECH', semester: 3, credits: 4 },
      { code: 'MECH303', name: 'Heat Transfer', department: 'MECH', semester: 3, credits: 3 },
      { code: 'MECH304', name: 'Kinematics of Machines', department: 'MECH', semester: 3, credits: 3 },
      { code: 'MECH305', name: 'Material Science', department: 'MECH', semester: 3, credits: 3 },
      { code: 'MECH306', name: 'Metrology and Instrumentation', department: 'MECH', semester: 3, credits: 3 },
      
      // Semester 4
      { code: 'MECH401', name: 'Internal Combustion Engines', department: 'MECH', semester: 4, credits: 4 },
      { code: 'MECH402', name: 'Dynamics of Machines', department: 'MECH', semester: 4, credits: 4 },
      { code: 'MECH403', name: 'Automobile Engineering', department: 'MECH', semester: 4, credits: 3 },
      { code: 'MECH404', name: 'Production Technology', department: 'MECH', semester: 4, credits: 3 },
      { code: 'MECH405', name: 'Refrigeration and Air Conditioning', department: 'MECH', semester: 4, credits: 3 },
      { code: 'MECH406', name: 'Industrial Engineering', department: 'MECH', semester: 4, credits: 3 },
      
      // CIVIL Department - Complete Curriculum
      // Semester 1
      { code: 'CIVIL101', name: 'Engineering Mathematics I', department: 'CIVIL', semester: 1, credits: 4 },
      { code: 'CIVIL102', name: 'Engineering Physics', department: 'CIVIL', semester: 1, credits: 3 },
      { code: 'CIVIL103', name: 'Engineering Chemistry', department: 'CIVIL', semester: 1, credits: 3 },
      { code: 'CIVIL104', name: 'Engineering Graphics', department: 'CIVIL', semester: 1, credits: 3 },
      { code: 'CIVIL105', name: 'Surveying', department: 'CIVIL', semester: 1, credits: 3 },
      { code: 'CIVIL106', name: 'Building Materials', department: 'CIVIL', semester: 1, credits: 3 },
      
      // Semester 2
      { code: 'CIVIL201', name: 'Engineering Mathematics II', department: 'CIVIL', semester: 2, credits: 4 },
      { code: 'CIVIL202', name: 'Engineering Mechanics', department: 'CIVIL', semester: 2, credits: 4 },
      { code: 'CIVIL203', name: 'Strength of Materials', department: 'CIVIL', semester: 2, credits: 4 },
      { code: 'CIVIL204', name: 'Fluid Mechanics', department: 'CIVIL', semester: 2, credits: 3 },
      { code: 'CIVIL205', name: 'Surveying II', department: 'CIVIL', semester: 2, credits: 3 },
      { code: 'CIVIL206', name: 'Computer Programming', department: 'CIVIL', semester: 2, credits: 3 },
      
      // Semester 3
      { code: 'CIVIL301', name: 'Structural Analysis I', department: 'CIVIL', semester: 3, credits: 4 },
      { code: 'CIVIL302', name: 'Concrete Technology', department: 'CIVIL', semester: 3, credits: 4 },
      { code: 'CIVIL303', name: 'Geotechnical Engineering I', department: 'CIVIL', semester: 3, credits: 3 },
      { code: 'CIVIL304', name: 'Transportation Engineering I', department: 'CIVIL', semester: 3, credits: 3 },
      { code: 'CIVIL305', name: 'Hydrology', department: 'CIVIL', semester: 3, credits: 3 },
      { code: 'CIVIL306', name: 'Construction Management', department: 'CIVIL', semester: 3, credits: 3 },
      
      // Semester 4
      { code: 'CIVIL401', name: 'Structural Analysis II', department: 'CIVIL', semester: 4, credits: 4 },
      { code: 'CIVIL402', name: 'Steel Structures', department: 'CIVIL', semester: 4, credits: 4 },
      { code: 'CIVIL403', name: 'Geotechnical Engineering II', department: 'CIVIL', semester: 4, credits: 3 },
      { code: 'CIVIL404', name: 'Environmental Engineering', department: 'CIVIL', semester: 4, credits: 3 },
      { code: 'CIVIL405', name: 'Water Resources Engineering', department: 'CIVIL', semester: 4, credits: 3 },
      { code: 'CIVIL406', name: 'Earthquake Engineering', department: 'CIVIL', semester: 4, credits: 3 }
    ];

    try {
      for (const subject of allSubjects) {
        await addDoc(collection(db, 'users', currentUser.email, 'subjects'), {
          ...subject,
          color: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'][Math.floor(Math.random() * 6)]
        });
      }
      console.log('Comprehensive subjects added for all departments');
      fetchSubjects();
    } catch (error) {
      console.error('Error adding subjects:', error);
    }
  };

  const handleOpen = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        code: subject.code,
        description: subject.description || '',
        credits: subject.credits,
        color: subject.color,
        department: subject.department || 'AIDS',
        semester: subject.semester || 1
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        credits: 3,
        color: '#2196F3',
        department: 'AIDS',
        semester: 1
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSubject(null);
  };

  const handleSave = async () => {
    if (!currentUser?.email) {
      console.log('No user email for saving:', currentUser);
      return;
    }
    console.log('Saving subject for user:', currentUser.email, 'Data:', formData);
    try {
      if (editingSubject) {
        await updateDoc(doc(db, 'users', currentUser.email, 'subjects', editingSubject.id), formData);
        console.log('Subject updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'users', currentUser.email, 'subjects'), formData);
        console.log('Subject added successfully with ID:', docRef.id);
      }
      fetchSubjects();
      handleClose();
    } catch (error) {
      console.error('Error saving subject:', error);
    }
  };

  const handleDelete = async (subjectId: string) => {
    if (!currentUser?.email) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.email, 'subjects', subjectId));
      fetchSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Subject Management
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary', flexGrow: 1 }}>
            Academic Subjects
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addSampleSubjects}
              sx={{ 
                borderRadius: 20, 
                textTransform: 'none', 
                fontWeight: 'bold',
                color: 'primary.contrastText',
                borderColor: 'primary.contrastText',
                '&:hover': { 
                  borderColor: 'primary.contrastText', 
                  backgroundColor: 'rgba(255,255,255,0.1)' 
                }
              }}
            >
              Add All Subjects
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpen()}
              sx={{ 
                borderRadius: 20, 
                textTransform: 'none', 
                fontWeight: 'bold',
                backgroundColor: 'background.paper',
                color: 'primary.main',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              Add New Subject
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                {/* Department Filter */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControl size="medium" sx={{ minWidth: 300 }}>
                    <InputLabel>Filter by Department</InputLabel>
                    <Select
                      value={selectedDepartment}
                      label="Filter by Department"
                      onChange={handleDepartmentFilterChange}
                      sx={{ 
                        '& .MuiSelect-select': {
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }
                      }}
                    >
                      <MenuItem value="ALL">All Departments</MenuItem>
                      {DEPARTMENTS.map((dept) => (
                        <MenuItem key={dept.code} value={dept.code}>
                          {dept.name} ({dept.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                    Showing {filteredSubjects.length} of {subjects.length} subjects
                  </Typography>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Subject Code</strong></TableCell>
                        <TableCell><strong>Subject Name</strong></TableCell>
                        <TableCell><strong>Department</strong></TableCell>
                        <TableCell><strong>Semester</strong></TableCell>
                        <TableCell><strong>Credits</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredSubjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography variant="h6" color="text.secondary">
                              {selectedDepartment === 'ALL' ? 
                                'No subjects found. Click "Add New Subject" to get started!' :
                                `No subjects found for ${selectedDepartment} department.`
                              }
                            </Typography>
                            {selectedDepartment !== 'ALL' && (
                              <Button 
                                onClick={() => setSelectedDepartment('ALL')} 
                                variant="outlined" 
                                size="small" 
                                sx={{ mt: 1 }}
                              >
                                Show All Subjects
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubjects.map((subject) => (
                        <TableRow key={subject.id} hover>
                          <TableCell>
                            <Chip
                              label={subject.code}
                              sx={{
                                backgroundColor: subject.color,
                                color: '#ffffff',
                                fontWeight: 'bold',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {subject.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={subject.department || 'AIDS'}
                              variant="outlined"
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`Sem ${subject.semester || 1}`}
                              variant="outlined"
                              color="secondary"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${subject.credits} Credits`}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              onClick={() => handleOpen(subject)}
                              color="primary"
                              size="small"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(subject.id)}
                              color="error"
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Add/Edit Subject Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Subject Code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="e.g., CS201"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Credits</InputLabel>
                  <Select
                    value={formData.credits}
                    label="Credits"
                    onChange={(e) => handleInputChange('credits', e.target.value)}
                  >
                    {[1, 2, 3, 4, 5, 6].map(credit => (
                      <MenuItem key={credit} value={credit}>{credit}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    label="Department"
                    onChange={(e) => handleInputChange('department', e.target.value)}
                  >
                    {DEPARTMENTS.map(dept => (
                      <MenuItem key={dept.code} value={dept.code}>
                        {dept.code} - {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={formData.semester}
                    label="Semester"
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Data Structures and Algorithms"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                  placeholder="Brief description of the subject"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Color
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {predefinedColors.map((color) => (
                    <Box
                      key={color}
                      onClick={() => handleInputChange('color', color)}
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: color,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: formData.color === color ? '3px solid #000' : '2px solid #ddd',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} startIcon={<Cancel />}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={<Save />}
              disabled={!formData.name || !formData.code}
            >
              {editingSubject ? 'Update' : 'Add'} Subject
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default SubjectManagement;