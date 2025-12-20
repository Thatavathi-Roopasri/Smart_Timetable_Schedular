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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  CircularProgress,
  Alert,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ArrowBack,
  Person,
  Search,
  FilterList,
  Menu,
  Close,
  AutoAwesome,
} from '@mui/icons-material';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { initializeUserData, checkUserHasData } from '../utils/userDataManager';
import { seedEngineeringData } from '../utils/seedEngineeringData';
import { assignSubjectsToFaculty } from '../utils/assignSubjectsToFaculty';

const DEPARTMENTS = [
  { code: 'AIDS', name: 'Artificial Intelligence and Data Science' },
  { code: 'CSE', name: 'Computer Science Engineering' }, 
  { code: 'ECE', name: 'Electronics and Communication Engineering' }
];

interface Faculty {
  id: string;
  name: string;
  department: string;
  subjects: string[];
  phone?: string;
  experience?: number;
  semester?: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: number;
  credits: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface FacultyManagementProps {
  onBack: () => void;
}

const FacultyManagement: React.FC<FacultyManagementProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const { theme } = useThemeMode();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [open, setOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [unsubscribeFaculties, setUnsubscribeFaculties] = useState<Unsubscribe | null>(null);
  const [unsubscribeDepartments, setUnsubscribeDepartments] = useState<Unsubscribe | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    subjects: [] as string[],
    semester: 1,
    experience: 0,
  });

  // Real-time listener for faculties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setupFacultiesListener = useCallback(() => {
    if (!currentUser?.email) {
      console.log('No user email available for faculties listener');
      return;
    }
    
    console.log('Setting up real-time faculties listener for:', currentUser.email);
    
    // Clear existing listener
    if (unsubscribeFaculties) {
      unsubscribeFaculties();
    }
    
    const facultiesRef = collection(db, 'users', currentUser.email, 'faculties');
    const unsubscribe = onSnapshot(facultiesRef, (querySnapshot) => {
      const facultyList: Faculty[] = [];
      
      querySnapshot.forEach((doc) => {
        const facultyData = { id: doc.id, ...doc.data() } as Faculty;
        console.log('Real-time faculty data:', facultyData);
        facultyList.push(facultyData);
      });
      
      console.log('Real-time faculties loaded:', facultyList.length);
      setFaculties(facultyList);
    }, (error) => {
      console.error('Error in faculties listener:', error);
    });
    
    setUnsubscribeFaculties(() => unsubscribe);
  }, [currentUser, unsubscribeFaculties]);

  // Real-time listener for departments
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setupDepartmentsListener = useCallback(() => {
    if (!currentUser?.email) {
      console.log('No user email for departments listener');
      return;
    }
    
    console.log('Setting up real-time departments listener for:', currentUser.email);
    
    // Clear existing listener
    if (unsubscribeDepartments) {
      unsubscribeDepartments();
    }
    
    const departmentsRef = collection(db, 'users', currentUser.email, 'departments');
    const unsubscribe = onSnapshot(departmentsRef, (querySnapshot) => {
      const departmentList: Department[] = [];
      const seenNames = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const deptData = { id: doc.id, ...doc.data() } as Department;
        console.log('Real-time department data:', deptData);
        // Remove duplicates based on name
        if (deptData.name && !seenNames.has(deptData.name)) {
          seenNames.add(deptData.name);
          departmentList.push(deptData);
        }
      });
      
      // Sort departments alphabetically
      departmentList.sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(departmentList);
      console.log('Real-time departments loaded:', departmentList);
    }, (error) => {
      console.error('Error in departments listener:', error);
    });
    
    setUnsubscribeDepartments(() => unsubscribe);
  }, [currentUser, unsubscribeDepartments]);

  // Fetch subjects data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchSubjects = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      const querySnapshot = await getDocs(collection(db, 'users', currentUser.email, 'subjects'));
      const subjectList: Subject[] = [];
      querySnapshot.forEach((doc) => {
        const subjectData = { id: doc.id, ...doc.data() } as Subject;
        subjectList.push(subjectData);
      });
      subjectList.sort((a, b) => a.name.localeCompare(b.name));
      setSubjects(subjectList);
      console.log('Subjects loaded:', subjectList.length);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, [currentUser]);

  // Legacy fetch functions (kept for manual refresh if needed)
  const fetchFaculties = useCallback(async () => {
    if (!currentUser?.email) {
      console.log('No user email available');
      return;
    }
    
    console.log('Fetching faculties for user:', currentUser.email);
    try {
      const querySnapshot = await getDocs(collection(db, 'users', currentUser.email, 'faculties'));
      const facultyList: Faculty[] = [];
      
      querySnapshot.forEach((doc) => {
        const facultyData = { id: doc.id, ...doc.data() } as Faculty;
        console.log('Faculty data:', facultyData);
        facultyList.push(facultyData);
      });
      setFaculties(facultyList);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  }, [currentUser]);

  // Fetch departments data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchDepartments = useCallback(async () => {
    if (!currentUser?.email) {
      console.log('No user email for departments');
      return;
    }
    
    console.log('Fetching departments for user:', currentUser.email);
    try {
      const querySnapshot = await getDocs(collection(db, 'users', currentUser.email, 'departments'));
      const departmentList: Department[] = [];
      const seenNames = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const deptData = { id: doc.id, ...doc.data() } as Department;
        console.log('Department data:', deptData);
        // Remove duplicates based on name
        if (deptData.name && !seenNames.has(deptData.name)) {
          seenNames.add(deptData.name);
          departmentList.push(deptData);
        }
      });
      
      // Sort departments alphabetically
      departmentList.sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(departmentList);
      console.log('Departments loaded:', departmentList);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, [currentUser]);

  // Real-time data loading with onSnapshot + auto-initialization
  useEffect(() => {
    if (!currentUser?.email) {
      console.log('❌ No user email, skipping data loading');
      setFaculties([]);
      setDepartments([]);
      return;
    }

    console.log('👤 Setting up data for user:', currentUser.email);
    
    // Auto-initialize data for new users
    const autoInitialize = async () => {
      if (!currentUser?.email) return;
      
      try {
        const hasData = await checkUserHasData(currentUser.email);
        if (!hasData) {
          console.log('🆕 New user detected, auto-initializing data...');
          const initResult = await initializeUserData(currentUser.email);
          if (initResult.success && initResult.isNewUser) {
            console.log('✅ Auto-initialization successful for new user');
          }
        }
      } catch (error) {
        console.log('⚠️ Auto-initialization skipped:', error);
        // Continue with normal data loading even if auto-init fails
      }
    };
    
    // Run auto-initialization
    autoInitialize();
    
    // Set up real-time listeners
    const facultiesRef = collection(db, 'users', currentUser.email, 'faculties');
    const unsubscribeFaculties = onSnapshot(facultiesRef, (querySnapshot) => {
      const facultyList: Faculty[] = [];
      
      console.log('📡 Real-time faculty snapshot received. Document count:', querySnapshot.size);
      
      querySnapshot.forEach((doc) => {
        const facultyData = { id: doc.id, ...doc.data() } as Faculty;
        console.log('👨‍🏫 Faculty data received:', facultyData.name, facultyData.department);
        facultyList.push(facultyData);
      });
      
      console.log('✅ Total unique faculties loaded:', facultyList.length);
      console.log('📋 Faculty distribution:');
      const deptCounts = facultyList.reduce((acc, f) => {
        acc[f.department] = (acc[f.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(deptCounts);
      
      setFaculties(facultyList);
    }, (error) => {
      console.error('Error in faculties listener:', error);
    });
    
    // Set up departments listener
    const departmentsRef = collection(db, 'users', currentUser.email, 'departments');
    const unsubscribeDepartments = onSnapshot(departmentsRef, (querySnapshot) => {
      const departmentList: Department[] = [];
      const seenNames = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const deptData = { id: doc.id, ...doc.data() } as Department;
        console.log('Real-time department:', deptData);
        // Remove duplicates based on name
        if (deptData.name && !seenNames.has(deptData.name)) {
          seenNames.add(deptData.name);
          departmentList.push(deptData);
        }
      });
      
      // Sort departments alphabetically
      departmentList.sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(departmentList);
      console.log('Real-time departments:', departmentList);
    }, (error) => {
      console.error('Error in departments listener:', error);
    });
    
    // Set up subjects listener
    const subjectsRef = collection(db, 'users', currentUser.email, 'subjects');
    const unsubscribeSubjects = onSnapshot(subjectsRef, (querySnapshot) => {
      const subjectList: Subject[] = [];
      
      querySnapshot.forEach((doc) => {
        const subjectData = { id: doc.id, ...doc.data() } as Subject;
        subjectList.push(subjectData);
      });
      
      // Sort subjects by name
      subjectList.sort((a, b) => a.name.localeCompare(b.name));
      setSubjects(subjectList);
      console.log('Real-time subjects loaded:', subjectList.length);
    }, (error) => {
      console.error('Error in subjects listener:', error);
    });
    
    // Cleanup function
    return () => {
      unsubscribeFaculties();
      unsubscribeDepartments();
      unsubscribeSubjects();
      console.log('Cleaned up real-time listeners');
    };
  }, [currentUser?.email]); // Only depend on currentUser.email

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingFaculty(null);
    setFormData({
      name: '',
      department: '',
      subjects: [],
      semester: 1,
      experience: 0,
    });
  };

  const handleEdit = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      name: faculty.name,
      department: faculty.department,
      subjects: faculty.subjects || [],
      semester: faculty.semester || 1,
      experience: faculty.experience || 0,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!currentUser?.email) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.email, 'faculties', id));
      fetchFaculties();
    } catch (error) {
      console.error('Error deleting faculty:', error);
    }
  };





  const handleSubmit = async () => {
    if (!currentUser?.email) return;
    
    // Validation
    if (!formData.name.trim() || !formData.department.trim()) {
      alert('Please fill in all required fields (Name and Department).');
      return;
    }
    
    try {
      const facultyData = {
        name: formData.name.trim(),
        department: formData.department,
        subjects: formData.subjects || [],
        semester: formData.semester || 1,
        experience: formData.experience || 0,
      };

      if (editingFaculty && editingFaculty.id) {
        // Update existing faculty
        const facultyRef = doc(db, 'users', currentUser.email, 'faculties', editingFaculty.id);
        await updateDoc(facultyRef, {
          ...facultyData,
          updatedAt: new Date()
        });
        console.log('Faculty updated:', editingFaculty.id);
      } else {
        // Add new faculty
        const docRef = await addDoc(collection(db, 'users', currentUser.email, 'faculties'), {
          ...facultyData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('Faculty added:', docRef.id);
      }
      
      handleClose();
      alert('Faculty saved successfully!');
    } catch (error) {
      console.error('Error saving faculty:', error);
      alert('Error saving faculty: ' + (error instanceof Error ? error.message : 'Please try again.'));
    }
  };

  const handleGenerateSampleFaculty = async () => {
    if (!currentUser?.email) return;
    
    try {
      // Sample faculty data with subjects
      const sampleFaculties = [
        {
          name: 'Dr. Priya Sharma',
          department: 'AIDS',
          subjects: [] // Will be filled with actual subject IDs
        },
        {
          name: 'Prof. Rajesh Kumar',
          department: 'CSE',
          subjects: []
        },
        {
          name: 'Dr. Anjali Gupta',
          department: 'IT',
          subjects: []
        },
        {
          name: 'Prof. Suresh Reddy',
          department: 'ECE',
          subjects: []
        },
        {
          name: 'Dr. Kavitha Nair',
          department: 'EEE',
          subjects: []
        },
        {
          name: 'Prof. Ramesh Babu',
          department: 'MECH',
          subjects: []
        },
        {
          name: 'Dr. Sunita Verma',
          department: 'CIVIL',
          subjects: []
        }
      ];

      // Assign random subjects from each department
      for (const faculty of sampleFaculties) {
        const deptSubjects = subjects.filter(subject => subject.department === faculty.department);
        if (deptSubjects.length > 0) {
          // Assign 2-4 random subjects per faculty
          const numSubjects = Math.min(Math.floor(Math.random() * 3) + 2, deptSubjects.length);
          const shuffled = [...deptSubjects].sort(() => 0.5 - Math.random());
          faculty.subjects = shuffled.slice(0, numSubjects).map(s => s.id);
        }
        
        await addDoc(collection(db, 'users', currentUser.email, 'faculties'), faculty);
      }
      
      alert(`✅ Successfully added ${sampleFaculties.length} sample faculty members with subject assignments!`);
      fetchFaculties();
    } catch (error) {
      console.error('Error generating sample faculty:', error);
      alert(`❌ Error adding sample faculty: ${error}`);
    }
  };

  const handleSeedFullData = async () => {
    if (!currentUser?.email) return;
    setSeeding(true);
    setSeedMessage(null);
    try {
      const result = await seedEngineeringData(currentUser.email);
      setSeedMessage('✅ Successfully loaded 110 faculty members!');
      // Faculties will auto-refresh via realtime listener
    } catch (error) {
      setSeedMessage('❌ Seeding failed: ' + error);
    } finally {
      setSeeding(false);
    }
  };

  // Auto-assign subjects and semesters to faculty without them
  const autoAssignSubjects = useCallback(async () => {
    if (!currentUser?.email || subjects.length === 0 || faculties.length === 0) return;
    
    // Update ALL faculty members who don't have at least 1 subject
    const facultiesNeedingUpdate = faculties.filter(f => 
      !f.semester || !f.subjects || f.subjects.length === 0
    );
    
    if (facultiesNeedingUpdate.length === 0) {
      console.log('✅ All faculty members already have subjects assigned');
      return;
    }
    
    console.log(`🔄 Auto-assigning subjects to ${facultiesNeedingUpdate.length} faculty members`);
    
    let updatedCount = 0;
    
    for (const faculty of facultiesNeedingUpdate) {
      if (!faculty.id) {
        console.log(`⚠️ Skipping faculty without ID: ${faculty.name}`);
        continue;
      }
      
      // Determine department code
      const deptCode = 
        faculty.department?.includes('Computer Science') || faculty.department === 'CSE' ? 'CSE' :
        faculty.department?.includes('Electronics') || faculty.department?.includes('Communication') || faculty.department === 'ECE' ? 'ECE' :
        faculty.department?.includes('Intelligence') || faculty.department?.includes('Data Science') || faculty.department === 'AIDS' ? 'AIDS' : 'CSE';
      
      // Get subjects from their department
      let deptSubjects = subjects.filter(s => s.department === deptCode);
      
      // If no subjects in their department, use any subjects
      if (deptSubjects.length === 0) {
        console.log(`⚠️ No ${deptCode} subjects found for ${faculty.name}, using any available subjects`);
        deptSubjects = subjects;
      }
      
      if (deptSubjects.length === 0) {
        console.log(`❌ No subjects available in database for ${faculty.name}`);
        continue;
      }
      
      // Assign 1-2 subjects (minimum 1, maximum 2)
      const numSubjects = Math.min(Math.floor(Math.random() * 2) + 1, deptSubjects.length);
      const assignedSubjects = deptSubjects
        .sort(() => 0.5 - Math.random())
        .slice(0, numSubjects)
        .map(s => s.id);
      
      // Assign semester 1, 2, or 3
      const semester = Math.floor(Math.random() * 3) + 1;
      
      try {
        const facultyRef = doc(db, 'users', currentUser.email, 'faculties', faculty.id);
        await updateDoc(facultyRef, {
          subjects: assignedSubjects,
          semester: semester,
          updatedAt: new Date()
        });
        updatedCount++;
        console.log(`✅ Updated ${faculty.name}: ${assignedSubjects.length} subjects (${deptCode}), Semester ${semester}`);
      } catch (error) {
        console.error(`❌ Failed to update faculty ${faculty.name}:`, error);
      }
    }
    
    if (updatedCount > 0) {
      console.log(`✅ Successfully updated ${updatedCount} out of ${facultiesNeedingUpdate.length} faculty members!`);
    }
  }, [currentUser, subjects, faculties]);

  // Run auto-assignment when subjects and faculties load
  useEffect(() => {
    if (subjects.length > 0 && faculties.length > 0) {
      const timer = setTimeout(() => {
        autoAssignSubjects();
      }, 1500); // Wait 1.5 seconds for data to stabilize
      
      return () => clearTimeout(timer);
    }
  }, [subjects.length, faculties.length, autoAssignSubjects]);

  // Filter faculties based on search query and department with enhanced search
  const filteredFaculties = faculties.filter(faculty => {
    if (!faculty) return false;
    
    const searchLower = searchQuery.toLowerCase().trim();
    const facultyName = faculty.name ? faculty.name.toLowerCase() : '';
    const facultyDept = faculty.department ? faculty.department.toLowerCase() : '';
    const facultySubjects = faculty.subjects ? faculty.subjects.map(subjectId => {
      const subject = subjects.find(s => s.id === subjectId);
      return subject ? `${subject.code} ${subject.name}` : subjectId;
    }).join(' ').toLowerCase() : '';
    
    const matchesSearch = searchLower === '' || 
                         facultyName.includes(searchLower) || 
                         facultyDept.includes(searchLower) ||
                         facultySubjects.includes(searchLower);
    
    const matchesDepartment = selectedDepartment === '' || faculty.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  return (
    <Box sx={{ 
      flexGrow: 1, 
      minHeight: '100vh', 
      backgroundColor: theme.palette.background.default,
      transition: 'background-color 0.3s ease'
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        px: 3,
        py: 2,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <IconButton color="inherit" onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Person sx={{ mr: 2, color: 'text.primary' }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'text.primary' }}>
          Faculty Management
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Faculty Members ({filteredFaculties.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpen}
            sx={{ borderRadius: 20, textTransform: 'none', fontWeight: 'bold' }}
          >
            Add New Faculty
          </Button>
        </Box>

        {/* Search and Filter Controls */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name, email, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                backgroundColor: theme.palette.background.paper, 
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ 
              backgroundColor: theme.palette.background.paper, 
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              }
            }}>
              <InputLabel>Filter by Department</InputLabel>
              <Select
                value={selectedDepartment}
                label="Filter by Department"
                onChange={(e) => setSelectedDepartment(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterList color="action" />
                  </InputAdornment>
                }
              >
                <MenuItem value="">
                  <em>All Departments</em>
                </MenuItem>
                {DEPARTMENTS.map((dept) => (
                  <MenuItem key={dept.code} value={dept.name}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={3} sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              border: theme.palette.mode === 'dark' ? '1px solid #333' : 'none'
            }}>
              <CardContent>
                <TableContainer sx={{
                  backgroundColor: theme.palette.background.paper,
                  '& .MuiTableCell-head': {
                    backgroundColor: 'action.selected',
                    color: theme.palette.text.primary,
                    fontWeight: 'bold'
                  },
                  '& .MuiTableCell-body': {
                    color: theme.palette.text.primary,
                  }
                }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Department</strong></TableCell>
                        <TableCell><strong>Semester</strong></TableCell>
                        <TableCell><strong>Subjects</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredFaculties.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                            <Typography variant="h6" color="text.secondary">
                              {searchQuery || selectedDepartment ? 'No faculty members match your search criteria' : faculties.length === 0 ? 'No faculty members found - Click "Add New Faculty" or contact admin' : 'No faculty members match your criteria'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {searchQuery || selectedDepartment ? 'Try adjusting your search or filter settings' : faculties.length === 0 ? '👋 New user? Start by adding faculty members manually, or they will be auto-created when you use other features' : 'Click "Add New Faculty" to get started'}
                            </Typography>
                            {faculties.length === 0 && !searchQuery && !selectedDepartment && (
                              <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleGenerateSampleFaculty}
                                sx={{ mt: 2, textTransform: 'none' }}
                              >
                                🚀 Quick Start: Add Sample Faculty
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFaculties.map((faculty) => (
                          <TableRow key={faculty.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  {faculty.name.charAt(0)}
                                </Avatar>
                                {faculty.name}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={faculty.department} size="small" color="primary" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={`Semester ${faculty.semester || Math.floor(Math.random() * 3) + 1}`} 
                                size="small" 
                                color="secondary" 
                                variant="filled"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 300 }}>
                                {faculty.subjects && faculty.subjects.length > 0 ? (
                                  faculty.subjects.map((subjectId, index) => {
                                    const subject = subjects.find(s => s.id === subjectId);
                                    return (
                                      <Chip 
                                        key={index}
                                        label={subject ? `${subject.code} - ${subject.name}` : subjectId} 
                                        size="small" 
                                        color="secondary" 
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem', height: '20px' }}
                                      />
                                    );
                                  })
                                ) : (
                                  <Typography variant="body2" color="text.secondary">No subjects assigned</Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() => handleEdit(faculty)}
                                color="primary"
                                size="small"
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDelete(faculty.id)}
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

        {/* Add/Edit Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    label="Department"
                  >
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </MenuItem>
                      ))
                    ) : (
                      DEPARTMENTS.map((dept) => (
                        <MenuItem key={dept.code} value={dept.name}>
                          {dept.name} ({dept.code})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value as number })}
                    label="Semester"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <MenuItem key={sem} value={sem}>
                        Semester {sem}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Experience (Years)"
                  type="number"
                  value={formData.experience || ''}
                  onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Subjects (Select Multiple)</InputLabel>
                  <Select
                    multiple
                    value={formData.subjects}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ 
                        ...formData, 
                        subjects: typeof value === 'string' ? value.split(',') : value 
                      });
                    }}
                    label="Subjects (Select Multiple)"
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 400,
                        },
                      },
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const subject = subjects.find(s => s.id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={subject ? `${subject.code}` : value}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {subjects
                      .filter(subject => {
                        if (!formData.department) return true;
                        // Map full department name to code
                        const deptCode = 
                          formData.department.includes('Computer Science') || formData.department === 'CSE' ? 'CSE' :
                          formData.department.includes('Electronics') || formData.department === 'ECE' ? 'ECE' :
                          formData.department.includes('Artificial Intelligence') || formData.department.includes('Data Science') || formData.department === 'AIDS' ? 'AIDS' :
                          formData.department;
                        return subject.department === deptCode;
                      })
                      .map((subject) => (
                        <MenuItem 
                          key={subject.id} 
                          value={subject.id}
                          sx={{ whiteSpace: 'normal', py: 1 }}
                        >
                          <Checkbox checked={formData.subjects.indexOf(subject.id) > -1} />
                          <ListItemText
                            primary={`${subject.code} - ${subject.name}`}
                            secondary={`${subject.department} | Sem ${subject.semester} | ${subject.credits} Credits`}
                          />
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingFaculty ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default FacultyManagement;