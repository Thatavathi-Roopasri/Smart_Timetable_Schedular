import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  School,
  Person,
  Room,
  Class,
  Business,
  Schedule
} from '@mui/icons-material';
import { seedEngineeringData } from '../utils/seedEngineeringData';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { useTheme } from '@mui/material/styles';
import { db } from '../firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

// Comprehensive data seeding function
const seedComprehensiveData = async (userEmail: string) => {
  try {
    console.log('🚀 Starting comprehensive engineering data seeding...');

    // Engineering Subjects (168 total)
    const engineeringSubjects = [
      // CSE - 24 subjects
      { name: 'Data Structures and Algorithms', code: 'CSE101', department: 'CSE', semester: 1, credits: 4 },
      { name: 'Programming in C', code: 'CSE102', department: 'CSE', semester: 1, credits: 3 },
      { name: 'Digital Logic Design', code: 'CSE103', department: 'CSE', semester: 1, credits: 3 },
      { name: 'Computer Organization', code: 'CSE104', department: 'CSE', semester: 1, credits: 4 },
      { name: 'Mathematics for Computer Science', code: 'CSE105', department: 'CSE', semester: 1, credits: 4 },
      { name: 'Technical Communication', code: 'CSE106', department: 'CSE', semester: 1, credits: 2 },
      { name: 'Object Oriented Programming', code: 'CSE201', department: 'CSE', semester: 2, credits: 4 },
      { name: 'Database Management Systems', code: 'CSE202', department: 'CSE', semester: 2, credits: 4 },
      { name: 'Computer Networks', code: 'CSE203', department: 'CSE', semester: 2, credits: 4 },
      { name: 'Operating Systems', code: 'CSE204', department: 'CSE', semester: 2, credits: 4 },
      { name: 'Software Engineering', code: 'CSE205', department: 'CSE', semester: 2, credits: 3 },
      { name: 'Discrete Mathematics', code: 'CSE206', department: 'CSE', semester: 2, credits: 3 },
      { name: 'Machine Learning', code: 'CSE301', department: 'CSE', semester: 3, credits: 4 },
      { name: 'Artificial Intelligence', code: 'CSE302', department: 'CSE', semester: 3, credits: 4 },
      { name: 'Web Development', code: 'CSE303', department: 'CSE', semester: 3, credits: 3 },
      { name: 'Mobile Application Development', code: 'CSE304', department: 'CSE', semester: 3, credits: 3 },
      { name: 'Compiler Design', code: 'CSE305', department: 'CSE', semester: 3, credits: 4 },
      { name: 'Theory of Computation', code: 'CSE306', department: 'CSE', semester: 3, credits: 3 },
      { name: 'Cloud Computing', code: 'CSE401', department: 'CSE', semester: 4, credits: 4 },
      { name: 'Cyber Security', code: 'CSE402', department: 'CSE', semester: 4, credits: 4 },
      { name: 'Big Data Analytics', code: 'CSE403', department: 'CSE', semester: 4, credits: 3 },
      { name: 'Blockchain Technology', code: 'CSE404', department: 'CSE', semester: 4, credits: 3 },
      { name: 'Project Work', code: 'CSE405', department: 'CSE', semester: 4, credits: 6 },
      { name: 'Industrial Training', code: 'CSE406', department: 'CSE', semester: 4, credits: 2 },

      // IT - 24 subjects  
      { name: 'Programming Fundamentals', code: 'IT101', department: 'IT', semester: 1, credits: 4 },
      { name: 'Computer Systems Architecture', code: 'IT102', department: 'IT', semester: 1, credits: 3 },
      { name: 'Digital Electronics', code: 'IT103', department: 'IT', semester: 1, credits: 3 },
      { name: 'Mathematics for IT', code: 'IT104', department: 'IT', semester: 1, credits: 4 },
      { name: 'Communication Skills', code: 'IT105', department: 'IT', semester: 1, credits: 2 },
      { name: 'IT Fundamentals', code: 'IT106', department: 'IT', semester: 1, credits: 3 },
      { name: 'Java Programming', code: 'IT201', department: 'IT', semester: 2, credits: 4 },
      { name: 'Database Systems', code: 'IT202', department: 'IT', semester: 2, credits: 4 },
      { name: 'Network Administration', code: 'IT203', department: 'IT', semester: 2, credits: 4 },
      { name: 'System Analysis and Design', code: 'IT204', department: 'IT', semester: 2, credits: 3 },
      { name: 'Statistics for IT', code: 'IT205', department: 'IT', semester: 2, credits: 3 },
      { name: 'Human Computer Interaction', code: 'IT206', department: 'IT', semester: 2, credits: 3 },
      { name: 'Enterprise Application Development', code: 'IT301', department: 'IT', semester: 3, credits: 4 },
      { name: 'Information Security', code: 'IT302', department: 'IT', semester: 3, credits: 4 },
      { name: 'Data Mining', code: 'IT303', department: 'IT', semester: 3, credits: 3 },
      { name: 'IT Project Management', code: 'IT304', department: 'IT', semester: 3, credits: 3 },
      { name: 'Network Security', code: 'IT305', department: 'IT', semester: 3, credits: 4 },
      { name: 'Quality Assurance', code: 'IT306', department: 'IT', semester: 3, credits: 3 },
      { name: 'Cloud Infrastructure', code: 'IT401', department: 'IT', semester: 4, credits: 4 },
      { name: 'DevOps Practices', code: 'IT402', department: 'IT', semester: 4, credits: 4 },
      { name: 'Enterprise Security', code: 'IT403', department: 'IT', semester: 4, credits: 3 },
      { name: 'Business Intelligence', code: 'IT404', department: 'IT', semester: 4, credits: 3 },
      { name: 'Capstone Project', code: 'IT405', department: 'IT', semester: 4, credits: 6 },
      { name: 'Professional Training', code: 'IT406', department: 'IT', semester: 4, credits: 2 },

      // AIDS - 24 subjects
      { name: 'Python Programming', code: 'AIDS101', department: 'AIDS', semester: 1, credits: 4 },
      { name: 'Linear Algebra', code: 'AIDS102', department: 'AIDS', semester: 1, credits: 4 },
      { name: 'Statistics and Probability', code: 'AIDS103', department: 'AIDS', semester: 1, credits: 4 },
      { name: 'Computer Programming Basics', code: 'AIDS104', department: 'AIDS', semester: 1, credits: 3 },
      { name: 'Mathematical Foundations', code: 'AIDS105', department: 'AIDS', semester: 1, credits: 4 },
      { name: 'Technical Writing', code: 'AIDS106', department: 'AIDS', semester: 1, credits: 2 },
      { name: 'Data Structures with Python', code: 'AIDS201', department: 'AIDS', semester: 2, credits: 4 },
      { name: 'Machine Learning Fundamentals', code: 'AIDS202', department: 'AIDS', semester: 2, credits: 4 },
      { name: 'Database for Data Science', code: 'AIDS203', department: 'AIDS', semester: 2, credits: 4 },
      { name: 'Data Visualization', code: 'AIDS204', department: 'AIDS', semester: 2, credits: 3 },
      { name: 'Calculus for Data Science', code: 'AIDS205', department: 'AIDS', semester: 2, credits: 4 },
      { name: 'Research Methodology', code: 'AIDS206', department: 'AIDS', semester: 2, credits: 2 },
      { name: 'Deep Learning', code: 'AIDS301', department: 'AIDS', semester: 3, credits: 4 },
      { name: 'Natural Language Processing', code: 'AIDS302', department: 'AIDS', semester: 3, credits: 4 },
      { name: 'Computer Vision', code: 'AIDS303', department: 'AIDS', semester: 3, credits: 4 },
      { name: 'Big Data Technologies', code: 'AIDS304', department: 'AIDS', semester: 3, credits: 3 },
      { name: 'AI Ethics', code: 'AIDS305', department: 'AIDS', semester: 3, credits: 2 },
      { name: 'Advanced Statistics', code: 'AIDS306', department: 'AIDS', semester: 3, credits: 3 },
      { name: 'Advanced Machine Learning', code: 'AIDS401', department: 'AIDS', semester: 4, credits: 4 },
      { name: 'AI in Industry', code: 'AIDS402', department: 'AIDS', semester: 4, credits: 3 },
      { name: 'Data Science Capstone', code: 'AIDS403', department: 'AIDS', semester: 4, credits: 6 },
      { name: 'Reinforcement Learning', code: 'AIDS404', department: 'AIDS', semester: 4, credits: 4 },
      { name: 'MLOps and Deployment', code: 'AIDS405', department: 'AIDS', semester: 4, credits: 3 },
      { name: 'Industry Internship', code: 'AIDS406', department: 'AIDS', semester: 4, credits: 2 },

      // ECE - 24 subjects
      { name: 'Circuit Analysis', code: 'ECE101', department: 'ECE', semester: 1, credits: 4 },
      { name: 'Electronic Devices', code: 'ECE102', department: 'ECE', semester: 1, credits: 4 },
      { name: 'Engineering Mathematics', code: 'ECE103', department: 'ECE', semester: 1, credits: 4 },
      { name: 'Basic Electronics Lab', code: 'ECE104', department: 'ECE', semester: 1, credits: 2 },
      { name: 'Technical Communication', code: 'ECE105', department: 'ECE', semester: 1, credits: 2 },
      { name: 'Environmental Science', code: 'ECE106', department: 'ECE', semester: 1, credits: 2 },
      { name: 'Analog Electronics', code: 'ECE201', department: 'ECE', semester: 2, credits: 4 },
      { name: 'Digital Electronics', code: 'ECE202', department: 'ECE', semester: 2, credits: 4 },
      { name: 'Signals and Systems', code: 'ECE203', department: 'ECE', semester: 2, credits: 4 },
      { name: 'Network Theory', code: 'ECE204', department: 'ECE', semester: 2, credits: 4 },
      { name: 'Electronic Circuits Lab', code: 'ECE205', department: 'ECE', semester: 2, credits: 2 },
      { name: 'Programming in C', code: 'ECE206', department: 'ECE', semester: 2, credits: 3 },
      { name: 'Communication Systems', code: 'ECE301', department: 'ECE', semester: 3, credits: 4 },
      { name: 'Microprocessors', code: 'ECE302', department: 'ECE', semester: 3, credits: 4 },
      { name: 'Control Systems', code: 'ECE303', department: 'ECE', semester: 3, credits: 4 },
      { name: 'Electromagnetic Fields', code: 'ECE304', department: 'ECE', semester: 3, credits: 3 },
      { name: 'VLSI Design', code: 'ECE305', department: 'ECE', semester: 3, credits: 4 },
      { name: 'Digital Signal Processing', code: 'ECE306', department: 'ECE', semester: 3, credits: 4 },
      { name: 'Wireless Communication', code: 'ECE401', department: 'ECE', semester: 4, credits: 4 },
      { name: 'Embedded Systems', code: 'ECE402', department: 'ECE', semester: 4, credits: 4 },
      { name: 'Optical Communication', code: 'ECE403', department: 'ECE', semester: 4, credits: 3 },
      { name: 'Satellite Communication', code: 'ECE404', department: 'ECE', semester: 4, credits: 3 },
      { name: 'Project Work', code: 'ECE405', department: 'ECE', semester: 4, credits: 6 },
      { name: 'Industrial Training', code: 'ECE406', department: 'ECE', semester: 4, credits: 2 },

      // EEE - 24 subjects
      { name: 'Electrical Circuits', code: 'EEE101', department: 'EEE', semester: 1, credits: 4 },
      { name: 'Engineering Mathematics', code: 'EEE102', department: 'EEE', semester: 1, credits: 4 },
      { name: 'Basic Electronics', code: 'EEE103', department: 'EEE', semester: 1, credits: 3 },
      { name: 'Engineering Drawing', code: 'EEE104', department: 'EEE', semester: 1, credits: 2 },
      { name: 'Chemistry for Engineers', code: 'EEE105', department: 'EEE', semester: 1, credits: 3 },
      { name: 'Environmental Studies', code: 'EEE106', department: 'EEE', semester: 1, credits: 2 },
      { name: 'DC Machines', code: 'EEE201', department: 'EEE', semester: 2, credits: 4 },
      { name: 'AC Machines', code: 'EEE202', department: 'EEE', semester: 2, credits: 4 },
      { name: 'Power Electronics', code: 'EEE203', department: 'EEE', semester: 2, credits: 4 },
      { name: 'Circuit Analysis', code: 'EEE204', department: 'EEE', semester: 2, credits: 4 },
      { name: 'Electrical Measurements', code: 'EEE205', department: 'EEE', semester: 2, credits: 3 },
      { name: 'Digital Electronics', code: 'EEE206', department: 'EEE', semester: 2, credits: 3 },
      { name: 'Power Systems', code: 'EEE301', department: 'EEE', semester: 3, credits: 4 },
      { name: 'Control Systems', code: 'EEE302', department: 'EEE', semester: 3, credits: 4 },
      { name: 'Electrical Drives', code: 'EEE303', department: 'EEE', semester: 3, credits: 4 },
      { name: 'Power Generation', code: 'EEE304', department: 'EEE', semester: 3, credits: 3 },
      { name: 'Microprocessors', code: 'EEE305', department: 'EEE', semester: 3, credits: 4 },
      { name: 'Instrumentation', code: 'EEE306', department: 'EEE', semester: 3, credits: 3 },
      { name: 'Power System Protection', code: 'EEE401', department: 'EEE', semester: 4, credits: 4 },
      { name: 'Renewable Energy Systems', code: 'EEE402', department: 'EEE', semester: 4, credits: 4 },
      { name: 'Smart Grid Technology', code: 'EEE403', department: 'EEE', semester: 4, credits: 3 },
      { name: 'Industrial Automation', code: 'EEE404', department: 'EEE', semester: 4, credits: 3 },
      { name: 'Final Year Project', code: 'EEE405', department: 'EEE', semester: 4, credits: 6 },
      { name: 'Industrial Training', code: 'EEE406', department: 'EEE', semester: 4, credits: 2 },

      // MECH - 24 subjects
      { name: 'Engineering Mechanics', code: 'MECH101', department: 'MECH', semester: 1, credits: 4 },
      { name: 'Engineering Mathematics', code: 'MECH102', department: 'MECH', semester: 1, credits: 4 },
      { name: 'Engineering Drawing', code: 'MECH103', department: 'MECH', semester: 1, credits: 3 },
      { name: 'Materials Science', code: 'MECH104', department: 'MECH', semester: 1, credits: 3 },
      { name: 'Workshop Technology', code: 'MECH105', department: 'MECH', semester: 1, credits: 2 },
      { name: 'Physics for Engineers', code: 'MECH106', department: 'MECH', semester: 1, credits: 3 },
      { name: 'Thermodynamics', code: 'MECH201', department: 'MECH', semester: 2, credits: 4 },
      { name: 'Fluid Mechanics', code: 'MECH202', department: 'MECH', semester: 2, credits: 4 },
      { name: 'Strength of Materials', code: 'MECH203', department: 'MECH', semester: 2, credits: 4 },
      { name: 'Manufacturing Processes', code: 'MECH204', department: 'MECH', semester: 2, credits: 4 },
      { name: 'Machine Drawing', code: 'MECH205', department: 'MECH', semester: 2, credits: 3 },
      { name: 'Computer Programming', code: 'MECH206', department: 'MECH', semester: 2, credits: 3 },
      { name: 'Machine Design', code: 'MECH301', department: 'MECH', semester: 3, credits: 4 },
      { name: 'Heat Transfer', code: 'MECH302', department: 'MECH', semester: 3, credits: 4 },
      { name: 'Internal Combustion Engines', code: 'MECH303', department: 'MECH', semester: 3, credits: 4 },
      { name: 'Control Engineering', code: 'MECH304', department: 'MECH', semester: 3, credits: 3 },
      { name: 'Metrology', code: 'MECH305', department: 'MECH', semester: 3, credits: 3 },
      { name: 'Kinematics of Machines', code: 'MECH306', department: 'MECH', semester: 3, credits: 4 },
      { name: 'Automobile Engineering', code: 'MECH401', department: 'MECH', semester: 4, credits: 4 },
      { name: 'Robotics and Automation', code: 'MECH402', department: 'MECH', semester: 4, credits: 4 },
      { name: 'Renewable Energy', code: 'MECH403', department: 'MECH', semester: 4, credits: 3 },
      { name: 'CAD/CAM', code: 'MECH404', department: 'MECH', semester: 4, credits: 3 },
      { name: 'Major Project', code: 'MECH405', department: 'MECH', semester: 4, credits: 6 },
      { name: 'Industrial Training', code: 'MECH406', department: 'MECH', semester: 4, credits: 2 },

      // CIVIL - 24 subjects
      { name: 'Engineering Mechanics', code: 'CIVIL101', department: 'CIVIL', semester: 1, credits: 4 },
      { name: 'Engineering Mathematics', code: 'CIVIL102', department: 'CIVIL', semester: 1, credits: 4 },
      { name: 'Building Materials', code: 'CIVIL103', department: 'CIVIL', semester: 1, credits: 3 },
      { name: 'Engineering Drawing', code: 'CIVIL104', department: 'CIVIL', semester: 1, credits: 3 },
      { name: 'Surveying', code: 'CIVIL105', department: 'CIVIL', semester: 1, credits: 4 },
      { name: 'Environmental Science', code: 'CIVIL106', department: 'CIVIL', semester: 1, credits: 2 },
      { name: 'Structural Analysis', code: 'CIVIL201', department: 'CIVIL', semester: 2, credits: 4 },
      { name: 'Concrete Technology', code: 'CIVIL202', department: 'CIVIL', semester: 2, credits: 4 },
      { name: 'Soil Mechanics', code: 'CIVIL203', department: 'CIVIL', semester: 2, credits: 4 },
      { name: 'Hydraulics', code: 'CIVIL204', department: 'CIVIL', semester: 2, credits: 4 },
      { name: 'Transportation Engineering', code: 'CIVIL205', department: 'CIVIL', semester: 2, credits: 3 },
      { name: 'Computer Applications', code: 'CIVIL206', department: 'CIVIL', semester: 2, credits: 3 },
      { name: 'RCC Design', code: 'CIVIL301', department: 'CIVIL', semester: 3, credits: 4 },
      { name: 'Foundation Engineering', code: 'CIVIL302', department: 'CIVIL', semester: 3, credits: 4 },
      { name: 'Water Resources Engineering', code: 'CIVIL303', department: 'CIVIL', semester: 3, credits: 4 },
      { name: 'Highway Engineering', code: 'CIVIL304', department: 'CIVIL', semester: 3, credits: 3 },
      { name: 'Construction Management', code: 'CIVIL305', department: 'CIVIL', semester: 3, credits: 3 },
      { name: 'Estimation and Costing', code: 'CIVIL306', department: 'CIVIL', semester: 3, credits: 3 },
      { name: 'Steel Design', code: 'CIVIL401', department: 'CIVIL', semester: 4, credits: 4 },
      { name: 'Earthquake Engineering', code: 'CIVIL402', department: 'CIVIL', semester: 4, credits: 4 },
      { name: 'Environmental Engineering', code: 'CIVIL403', department: 'CIVIL', semester: 4, credits: 3 },
      { name: 'Project Planning', code: 'CIVIL404', department: 'CIVIL', semester: 4, credits: 3 },
      { name: 'Capstone Project', code: 'CIVIL405', department: 'CIVIL', semester: 4, credits: 6 },
      { name: 'Field Training', code: 'CIVIL406', department: 'CIVIL', semester: 4, credits: 2 }
    ];

    // Faculty Data with One Subject Assignment Each
    const facultyData = [
      // Computer Science Engineering Faculty
      { name: 'Dr. Rajesh Kumar', department: 'Computer Science Engineering', subjects: ['Data Structures and Algorithms'] },
      { name: 'Prof. Sunita Sharma', department: 'Computer Science Engineering', subjects: ['Database Management Systems'] },
      { name: 'Dr. Amit Singh', department: 'Computer Science Engineering', subjects: ['Machine Learning'] },
      { name: 'Prof. Priya Patel', department: 'Computer Science Engineering', subjects: ['Computer Networks'] },
      { name: 'Dr. Vikram Gupta', department: 'Computer Science Engineering', subjects: ['Cloud Computing'] },
      { name: 'Prof. Anjali Mehta', department: 'Computer Science Engineering', subjects: ['Digital Logic Design'] },
      { name: 'Dr. Kavita Joshi', department: 'Computer Science Engineering', subjects: ['Software Engineering'] },
      { name: 'Prof. Ravi Sharma', department: 'Computer Science Engineering', subjects: ['Operating Systems'] },
      
      // Artificial Intelligence and Data Science Faculty
      { name: 'Dr. Arjun Malhotra', department: 'Artificial Intelligence and Data Science', subjects: ['Python Programming'] },
      { name: 'Prof. Nisha Jain', department: 'Artificial Intelligence and Data Science', subjects: ['Linear Algebra'] },
      { name: 'Dr. Kiran Kumar', department: 'Artificial Intelligence and Data Science', subjects: ['Natural Language Processing'] },
      { name: 'Prof. Shreya Bansal', department: 'Artificial Intelligence and Data Science', subjects: ['Data Visualization'] },
      { name: 'Dr. Rohit Sharma', department: 'Artificial Intelligence and Data Science', subjects: ['Machine Learning Fundamentals'] },
      { name: 'Dr. Pooja Gupta', department: 'Artificial Intelligence and Data Science', subjects: ['Statistics for Data Science'] },
      { name: 'Prof. Divya Sree', department: 'Artificial Intelligence and Data Science', subjects: ['Deep Learning'] },
      { name: 'Dr. Vikash Singh', department: 'Artificial Intelligence and Data Science', subjects: ['Computer Vision'] },
      
      // Electronics and Communication Engineering Faculty
      { name: 'Dr. Sanjay Verma', department: 'Electronics and Communication Engineering', subjects: ['Circuit Analysis'] },
      { name: 'Prof. Meera Nair', department: 'Electronics and Communication Engineering', subjects: ['Digital Electronics'] },
      { name: 'Dr. Ashok Yadav', department: 'Electronics and Communication Engineering', subjects: ['Communication Systems'] },
      { name: 'Prof. Rekha Singh', department: 'Electronics and Communication Engineering', subjects: ['Signals and Systems'] },
      { name: 'Dr. Pramod Kumar', department: 'Electronics and Communication Engineering', subjects: ['Microprocessors'] },
      { name: 'Prof. Sunita Agarwal', department: 'Electronics and Communication Engineering', subjects: ['VLSI Design'] },
      { name: 'Dr. Ramesh Iyer', department: 'Electronics and Communication Engineering', subjects: ['Embedded Systems'] },
      { name: 'Prof. Kavita Shah', department: 'Electronics and Communication Engineering', subjects: ['Analog Electronics'] }
    ];

    // Step 1: Add Departments  
    console.log('📚 Adding departments...');
    const departments = [
      { name: 'Artificial Intelligence & Data Science', code: 'AIDS' },
      { name: 'Computer Science Engineering', code: 'CSE' },
      { name: 'Electronics & Communication Engineering', code: 'ECE' }
    ];

    for (const dept of departments) {
      await setDoc(doc(db, 'users', userEmail, 'departments', dept.code), dept);
    }

    // Step 2: Add all subjects
    console.log(`📖 Adding ${engineeringSubjects.length} subjects...`);
    for (const subject of engineeringSubjects) {
      await addDoc(collection(db, 'users', userEmail, 'subjects'), subject);
    }

    // Step 3: Add faculty with subject assignments
    console.log(`👨‍🏫 Adding ${facultyData.length} faculty members...`);
    for (const faculty of facultyData) {
      await addDoc(collection(db, 'users', userEmail, 'faculties'), faculty);
    }

    // Step 4: Add classrooms
    console.log('🏫 Adding classrooms...');
    const classrooms = [
      { name: 'Room A101', department: 'CSE', type: 'Lecture', building: 'Block A', isAvailable: true },
      { name: 'Room A102', department: 'CSE', type: 'Lab', building: 'Block A', isAvailable: true },
      { name: 'Room A201', department: 'IT', type: 'Lecture', building: 'Block A', isAvailable: true },
      { name: 'Room A202', department: 'IT', type: 'Lab', building: 'Block A', isAvailable: true },
      { name: 'Room B101', department: 'AIDS', type: 'Lecture', building: 'Block B', isAvailable: true },
      { name: 'Room B102', department: 'AIDS', type: 'Lab', building: 'Block B', isAvailable: true },
      { name: 'Room C101', department: 'ECE', type: 'Lecture', building: 'Block C', isAvailable: true },
      { name: 'Room C102', department: 'ECE', type: 'Lab', building: 'Block C', isAvailable: true },
      { name: 'Room D101', department: 'EEE', type: 'Lecture', building: 'Block D', isAvailable: true },
      { name: 'Room D102', department: 'EEE', type: 'Lab', building: 'Block D', isAvailable: true },
      { name: 'Room E101', department: 'MECH', type: 'Lecture', building: 'Block E', isAvailable: true },
      { name: 'Room E102', department: 'MECH', type: 'Lab', building: 'Block E', isAvailable: true },
      { name: 'Room F101', department: 'CIVIL', type: 'Lecture', building: 'Block F', isAvailable: true },
      { name: 'Room F102', department: 'CIVIL', type: 'Lab', building: 'Block F', isAvailable: true }
    ];

    for (const classroom of classrooms) {
      await addDoc(collection(db, 'users', userEmail, 'classrooms'), classroom);
    }

    // Step 5: Add sections
    console.log('🎓 Adding student sections...');
    for (const dept of departments) {
      for (let sem = 1; sem <= 4; sem++) {
        const section = {
          name: `${dept.code}-SEM${sem}-A`,
          department: dept.code,
          semester: sem,
          strength: 60
        };
        await addDoc(collection(db, 'users', userEmail, 'sections'), section);
      }
    }

    return {
      success: true,
      message: `🎉 Successfully seeded comprehensive data!\n\n📊 Summary:\n• ${departments.length} Departments\n• ${engineeringSubjects.length} Subjects (24 per department)\n• ${facultyData.length} Faculty members with subject assignments\n• ${classrooms.length} Classrooms\n• ${departments.length * 4} Student sections\n\nYour Smart Timetable Scheduler is now ready with complete engineering curriculum!`,
      stats: {
        departments: departments.length,
        subjects: engineeringSubjects.length,
        faculty: facultyData.length,
        classrooms: classrooms.length,
        sections: departments.length * 4
      }
    };

  } catch (error) {
    console.error('❌ Error in comprehensive data seeding:', error);
    throw new Error(`Data seeding failed: ${error}`);
  }
};

const EngineeringDataSeeder: React.FC = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useThemeMode();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSeedData = async () => {
    if (!currentUser?.email) {
      setResult({
        success: false,
        message: 'Authentication required. Please log in first.'
      });
      return;
    }

    setLoading(true);
    try {
      // Use the shared comprehensive seeder (110 faculty, full dataset)
      const seedResult = await seedEngineeringData(currentUser.email);
      setResult(seedResult);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to seed engineering data: ' + error
      });
    } finally {
      setLoading(false);
    }
  };

  const dataOverview = [
    { icon: <Business />, text: '3 Engineering Departments (CSE, ECE, AIDS)', color: theme.palette.primary.main },
    { icon: <School />, text: '160+ Subjects with coverage across semesters', color: theme.palette.success?.main || '#4caf50' },
    { icon: <Person />, text: '110 Specialized Faculty Members', color: theme.palette.warning?.main || '#ff9800' },
    { icon: <Room />, text: '12 Classrooms, Labs & Lecture Halls', color: theme.palette.secondary.main },
    { icon: <Class />, text: '10 Student Sections (Semesters 3-5)', color: theme.palette.error?.main || '#f44336' },
    { icon: <Schedule />, text: 'Engineering Time Schedule', color: theme.palette.info?.main || '#2196f3' }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: 'primary.main', mb: 4 }}>
        🎓 Engineering Data Seeder
      </Typography>

      <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
            Ready to populate {currentUser?.email || 'your account'} with engineering data! 🚀
          </Typography>
          <Typography variant="body2">
            This will add comprehensive data for CSE, ECE, and AIDS departments with realistic faculty assignments.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>📊 What will be added:</Typography>
          <List>
            {dataOverview.map((item, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ color: item.color }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {!result && (
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              onClick={handleSeedData}
              disabled={loading}
              sx={{ py: 2, px: 4, fontSize: '1.2rem' }}
            >
              {loading ? 'Populating Comprehensive Database...' : 'Populate Complete Engineering Data (168 Subjects + Faculty)'}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent>
            <Alert 
              severity={result.success ? 'success' : 'error'}
              icon={result.success ? <CheckCircle /> : undefined}
            >
              <Typography variant="h6">
                {result.success ? '🎉 Data Added Successfully!' : '❌ Error'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                {result.message}
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EngineeringDataSeeder;