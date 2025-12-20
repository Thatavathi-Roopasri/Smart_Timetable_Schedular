import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
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
  Paper,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Add,
  Save,
  Cancel,
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

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface DepartmentManagementProps {
  onBack: () => void;
}

const DepartmentManagement: React.FC<DepartmentManagementProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);

  // Unused function - commented out to remove linting warning
  /*
  const removeDuplicateDepartments = async () => {
    if (!currentUser?.email) return;
    
    try {
      const departmentMap = new Map();
      const duplicatesToDelete: string[] = [];
      
      departments.forEach(dept => {
        const key = `${dept.name.toLowerCase()}-${dept.code.toLowerCase()}`;
        if (departmentMap.has(key)) {
          duplicatesToDelete.push(dept.id);
        } else {
          departmentMap.set(key, dept.id);
        }
      });
      
      if (duplicatesToDelete.length > 0) {
        for (const deptId of duplicatesToDelete) {
          await deleteDoc(doc(db, 'users', currentUser.email, 'departments', deptId));
        }
        await fetchDepartments();
        alert(`Removed ${duplicatesToDelete.length} duplicate department(s).`);
      } else {
        alert('No duplicate departments found.');
      }
    } catch (error) {
      console.error('Error removing duplicates:', error);
      alert('Error removing duplicates. Please try again.');
    }
  };
  */

  const fetchDepartments = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      const departmentsQuery = query(
        collection(db, 'users', currentUser.email, 'departments'),
        orderBy('name')
      );
      const departmentsSnapshot = await getDocs(departmentsQuery);
      const departmentsList = departmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Department));
      setDepartments(departmentsList);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setFormData({
      name: '',
      code: '',
      description: ''
    });
    setOpenDialog(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description
    });
    setOpenDialog(true);
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!currentUser?.email) return;
    
    if (window.confirm('Are you sure you want to delete this department? This will also affect any sections associated with it.')) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.email, 'departments', departmentId));
        await fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
        alert('Error deleting department. Please try again.');
      }
    }
  };

  const handleSaveDepartment = async () => {
    if (!currentUser?.email) return;
    
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Please fill in department name and code.');
      return;
    }

    try {
      const departmentData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim()
      };

      // Check for duplicates
      const existingDepartments = departments.filter(dept => 
        dept.name.toLowerCase() === departmentData.name.toLowerCase() || 
        dept.code === departmentData.code
      );
      
      if (!editingDepartment && existingDepartments.length > 0) {
        alert(`Department with name "${departmentData.name}" or code "${departmentData.code}" already exists.`);
        return;
      }
      
      if (editingDepartment && existingDepartments.some(dept => dept.id !== editingDepartment.id)) {
        alert(`Department with name "${departmentData.name}" or code "${departmentData.code}" already exists.`);
        return;
      }

      if (editingDepartment) {
        await updateDoc(
          doc(db, 'users', currentUser.email, 'departments', editingDepartment.id),
          departmentData
        );
      } else {
        await addDoc(
          collection(db, 'users', currentUser.email, 'departments'),
          departmentData
        );
      }

      setOpenDialog(false);
      await fetchDepartments();
      
      setFormData({
        name: '',
        code: '',
        description: ''
      });
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Error saving department. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading departments...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Business color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Department Management
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddDepartment}
        >
          Add Department
        </Button>
      </Box>

      {/* Departments Table */}
      {departments.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Department Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id} hover>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {department.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={department.code}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {department.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditDepartment(department)}
                      sx={{ mr: 1, color: 'primary.main' }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteDepartment(department.id)}
                      sx={{ color: 'error.main' }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Business sx={{ fontSize: 64, color: 'text.disabled', mb: 3 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No Departments Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create departments to organize your sections and academic structure.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddDepartment}
          >
            Add Your First Department
          </Button>
        </Box>
      )}

      {/* Add/Edit Department Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          {editingDepartment ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Department Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Computer Science, Mathematics"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Department Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., CSE, MATH"
                required
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description about this department"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveDepartment}
            startIcon={<Save />}
            sx={{ ml: 2 }}
          >
            {editingDepartment ? 'Update' : 'Add'} Department
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentManagement;