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
  AppBar,
  Toolbar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ArrowBack,
  Room,
} from '@mui/icons-material';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, setDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface Classroom {
  id: string;
  name: string;
  type: string;
  building: string;
  isAvailable: boolean;
  department?: string;
}

interface TimetableEntry {
  id: string;
  day: string;
  timeSlot: string;
  subject: string;
  faculty: string;
  classroom: string;
  section: string;
}

interface SavedTimetable {
  id: string;
  name: string;
  schedule: TimetableEntry[];
  description: string;
  savedAt: any;
}

interface ClassroomManagementProps {
  onBack: () => void;
}

const ClassroomManagement: React.FC<ClassroomManagementProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [occupiedClassrooms, setOccupiedClassrooms] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    building: '',
    isAvailable: true,
    department: '',
  });

  const roomTypes = ['Lecture Hall', 'Laboratory', 'Seminar Room', 'Conference Room', 'Auditorium'];
  const buildings = ['Main Building', 'Science Block', 'Engineering Block', 'Arts Block', 'Admin Block'];
  const departments = ['AIDS', 'CSE', 'ECE', 'EEE', 'MECH'];

  const checkOccupiedClassrooms = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      const timetablesSnapshot = await getDocs(collection(db, 'users', currentUser.email, 'timetables'));
      const occupied = new Set<string>();
      
      timetablesSnapshot.forEach((doc) => {
        const timetable = doc.data() as SavedTimetable;
        if (timetable.schedule && Array.isArray(timetable.schedule)) {
          timetable.schedule.forEach((entry: TimetableEntry) => {
            if (entry.classroom && entry.classroom.trim() !== '') {
              occupied.add(entry.classroom);
            }
          });
        }
      });
      
      setOccupiedClassrooms(occupied);
    } catch (error) {
      console.error('Error checking occupied classrooms:', error);
    }
  }, [currentUser]);

  const fetchClassrooms = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'users', currentUser.email, 'classrooms'));
      const classroomList: Classroom[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as any;

        // Infer department from room name if missing
        let inferredDept = data.department || '';
        const upperName = (data.name || '').toUpperCase();
        if (!inferredDept) {
          if (upperName.includes('AIDS')) inferredDept = 'AIDS';
          else if (upperName.includes('CSE')) inferredDept = 'CSE';
          else if (upperName.includes('ECE')) inferredDept = 'ECE';
          else if (upperName.includes('EEE')) inferredDept = 'EEE';
          else if (upperName.includes('MECH')) inferredDept = 'MECH';
        }

        // If still missing and room is a generic lecture/tutorial space, assign a random department
        const isLectureLike = (data.type || '').toUpperCase().includes('LECTURE') ||
          (data.type || '').toUpperCase().includes('CLASSROOM') ||
          (data.type || '').toUpperCase().includes('TUTORIAL') ||
          (data.type || '').toUpperCase().includes('AUDITORIUM');

        if (!inferredDept && isLectureLike && departments.length > 0) {
          inferredDept = departments[Math.floor(Math.random() * departments.length)];
          // Persist the assigned department so it remains consistent
          updateDoc(doc(db, 'users', currentUser.email, 'classrooms', docSnapshot.id), {
            department: inferredDept,
          }).catch(() => {});
        }

        // Clean legacy fields capacity/equipment from DB
        if (data.capacity !== undefined || data.equipment !== undefined) {
          updateDoc(doc(db, 'users', currentUser.email, 'classrooms', docSnapshot.id), {
            capacity: deleteField(),
            equipment: deleteField(),
            department: inferredDept || deleteField(),
          }).catch(() => {});
        }

        classroomList.push({ id: docSnapshot.id, ...data, department: inferredDept } as Classroom);
      });
      setClassrooms(classroomList);
      // Also check occupied classrooms when fetching classrooms
      await checkOccupiedClassrooms();
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  }, [currentUser, checkOccupiedClassrooms]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingClassroom(null);
    setFormData({
      name: '',
      type: '',
      building: '',
      isAvailable: true,
      department: '',
    });
  };

  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setFormData({
      name: classroom.name,
      type: classroom.type,
      building: classroom.building,
      isAvailable: classroom.isAvailable,
      department: classroom.department || '',
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!currentUser?.email) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.email, 'classrooms', id));
      fetchClassrooms();
    } catch (error) {
      console.error('Error deleting classroom:', error);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser?.email) return;
    try {
      const resolvedDepartment = formData.department === 'RANDOM'
        ? departments[Math.floor(Math.random() * departments.length)]
        : formData.department;

      const submitData = {
        name: formData.name,
        type: formData.type,
        building: formData.building,
        isAvailable: formData.isAvailable,
        department: resolvedDepartment,
      };
      
      if (editingClassroom) {
        await setDoc(doc(db, 'users', currentUser.email, 'classrooms', editingClassroom.id), submitData, { merge: false });
      } else {
        await addDoc(collection(db, 'users', currentUser.email, 'classrooms'), submitData);
      }
      fetchClassrooms();
      handleClose();
    } catch (error) {
      console.error('Error saving classroom:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Room sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Classroom Management
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Classrooms
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpen}
            sx={{ borderRadius: 20, textTransform: 'none', fontWeight: 'bold' }}
          >
            Add New Classroom
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Room Name</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Department</strong></TableCell>
                        <TableCell><strong>Building</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classrooms.map((classroom) => (
                        <TableRow key={classroom.id} hover>
                          <TableCell sx={{ fontWeight: 'bold' }}>{classroom.name}</TableCell>
                          <TableCell>
                            <Chip label={classroom.type} size="small" />
                          </TableCell>
                          <TableCell>{classroom.department || '-'}</TableCell>
                          <TableCell>{classroom.building}</TableCell>
                          <TableCell>
                            <Chip
                              label={occupiedClassrooms.has(classroom.name) ? 'Occupied' : 'Available'}
                              sx={{
                                backgroundColor: occupiedClassrooms.has(classroom.name) ? '#f44336' : '#4caf50',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                '& .MuiChip-label': {
                                  color: '#ffffff'
                                }
                              }}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleEdit(classroom)}
                              color="primary"
                              size="small"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(classroom.id)}
                              color="error"
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
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
            {editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Room Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    label="Department"
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    <MenuItem value="RANDOM">Random (assign automatically)</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    label="Room Type"
                  >
                    {roomTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Building</InputLabel>
                  <Select
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    label="Building"
                  >
                    {buildings.map((building) => (
                      <MenuItem key={building} value={building}>
                        {building}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Availability</InputLabel>
                  <Select
                    value={formData.isAvailable ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
                    label="Availability"
                  >
                    <MenuItem value="true">Available</MenuItem>
                    <MenuItem value="false">Occupied</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingClassroom ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ClassroomManagement;