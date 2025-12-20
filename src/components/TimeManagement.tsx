import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Fab
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Add,
  Save,
  Cancel,
  AccessTime,
  Schedule,
  Business
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';

interface TimeManagementProps {
  onBack: () => void;
}

interface DepartmentTiming {
  id: string;
  department: string;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  lunchStart: string;
  lunchEnd: string;
  periodDuration: number; // in minutes
  workingDays: string[];
  createdAt: any;
}

const TimeManagement: React.FC<TimeManagementProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [timings, setTimings] = useState<DepartmentTiming[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTiming, setEditingTiming] = useState<DepartmentTiming | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    department: '',
    startTime: '09:00',
    endTime: '17:00',
    breakStart: '11:00',
    breakEnd: '11:15',
    lunchStart: '13:00',
    lunchEnd: '14:00',
    periodDuration: 60,
    workingDays: [] as string[]
  });

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering'
  ];

  const weekDays = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  const fetchTimings = useCallback(async () => {
    if (!currentUser?.email) return;
    
    setLoading(true);
    try {
      console.log('Fetching department timings for user:', currentUser.email);
      const q = query(
        collection(db, 'users', currentUser.email, 'departmentTimings'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const timingsList: DepartmentTiming[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        timingsList.push({ 
          id: doc.id, 
          ...data
        } as DepartmentTiming);
      });
      
      console.log('Fetched department timings:', timingsList.length);
      setTimings(timingsList);
    } catch (error) {
      console.error('Error fetching department timings:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      fetchTimings();
    }
  }, [currentUser, fetchTimings]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTiming(null);
    setFormData({
      department: '',
      startTime: '09:00',
      endTime: '17:00',
      breakStart: '11:00',
      breakEnd: '11:15',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      periodDuration: 60,
      workingDays: []
    });
  };

  const handleEdit = (timing: DepartmentTiming) => {
    setEditingTiming(timing);
    setFormData({
      department: timing.department,
      startTime: timing.startTime,
      endTime: timing.endTime,
      breakStart: timing.breakStart,
      breakEnd: timing.breakEnd,
      lunchStart: timing.lunchStart,
      lunchEnd: timing.lunchEnd,
      periodDuration: timing.periodDuration,
      workingDays: timing.workingDays || []
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!currentUser?.email) return;
    
    try {
      await deleteDoc(doc(db, 'users', currentUser.email, 'departmentTimings', id));
      await fetchTimings();
    } catch (error) {
      console.error('Error deleting department timing:', error);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser?.email) return;
    
    try {
      if (editingTiming) {
        await updateDoc(
          doc(db, 'users', currentUser.email, 'departmentTimings', editingTiming.id),
          formData
        );
      } else {
        await addDoc(
          collection(db, 'users', currentUser.email, 'departmentTimings'),
          {
            ...formData,
            createdAt: new Date()
          }
        );
      }
      await fetchTimings();
      handleClose();
    } catch (error) {
      console.error('Error saving department timing:', error);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'Computer Science': '#2196F3',
      'Information Technology': '#9C27B0', 
      'Electronics & Communication': '#FF9800',
      'Mechanical Engineering': '#4CAF50',
      'Civil Engineering': '#795548',
      'Electrical Engineering': '#F44336'
    };
    return colors[department as keyof typeof colors] || '#607D8B';
  };

  const toggleWorkingDay = (day: string) => {
    const newWorkingDays = formData.workingDays.includes(day)
      ? formData.workingDays.filter(d => d !== day)
      : [...formData.workingDays, day];
    setFormData({...formData, workingDays: newWorkingDays});
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        bgcolor: 'background.paper',
        p: 2,
        borderRadius: 2,
        boxShadow: 1
      }}>
        <IconButton 
          onClick={onBack} 
          sx={{ 
            mr: 2,
            color: '#1976d2'
          }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <AccessTime sx={{ mr: 2, color: '#1976d2', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
            Time Management
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary">
          {timings.length} department timing{timings.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Department Timings Table */}
      {timings.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1
        }}>
          <Schedule sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No Department Timings Configured
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Set up timing schedules for each department to generate accurate timetables.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpen}
            sx={{ 
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' }
            }}
          >
            Add Department Timing
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Working Hours</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Break</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Lunch</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Period Duration</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Working Days</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timings.map((timing) => (
                <TableRow key={timing.id} sx={{ '&:hover': { bgcolor: '#f9f9f9' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Business sx={{ 
                        mr: 1, 
                        color: getDepartmentColor(timing.department),
                        fontSize: 20
                      }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {timing.department}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTime(timing.startTime)} - {formatTime(timing.endTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTime(timing.breakStart)} - {formatTime(timing.breakEnd)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTime(timing.lunchStart)} - {formatTime(timing.lunchEnd)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${timing.periodDuration} min`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {timing.workingDays?.map((day) => (
                        <Chip 
                          key={day}
                          label={day.slice(0, 3)}
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEdit(timing)}
                      sx={{ color: '#1976d2' }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(timing.id)}
                      sx={{ color: '#f44336' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#1976d2',
          '&:hover': { bgcolor: '#1565c0' }
        }}
      >
        <Add />
      </Fab>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTiming ? 'Edit Department Timing' : 'Add Department Timing'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    label="Department"
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Period Duration (minutes)"
                  type="number"
                  value={formData.periodDuration}
                  onChange={(e) => setFormData({...formData, periodDuration: parseInt(e.target.value) || 60})}
                  inputProps={{ min: 30, max: 120 }}
                />
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Break Start"
                  type="time"
                  value={formData.breakStart}
                  onChange={(e) => setFormData({...formData, breakStart: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Break End"
                  type="time"
                  value={formData.breakEnd}
                  onChange={(e) => setFormData({...formData, breakEnd: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Lunch Start"
                  type="time"
                  value={formData.lunchStart}
                  onChange={(e) => setFormData({...formData, lunchStart: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Lunch End"
                  type="time"
                  value={formData.lunchEnd}
                  onChange={(e) => setFormData({...formData, lunchEnd: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Working Days
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {weekDays.map((day) => (
                    <Chip
                      key={day}
                      label={day}
                      clickable
                      color={formData.workingDays.includes(day) ? 'primary' : 'default'}
                      variant={formData.workingDays.includes(day) ? 'filled' : 'outlined'}
                      onClick={() => toggleWorkingDay(day)}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            startIcon={<Save />}
            disabled={!formData.department || formData.workingDays.length === 0}
          >
            {editingTiming ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeManagement;