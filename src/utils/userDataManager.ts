import { seedEngineeringData } from './seedEngineeringData';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// User onboarding - automatically setup data for new users
export const initializeUserData = async (userEmail: string) => {
  if (!userEmail) {
    throw new Error('User email is required for initialization');
  }

  try {
    console.log('🚀 Initializing data for new user:', userEmail);
    
    // Check if user already has data
    const hasExistingData = await checkUserHasData(userEmail);
    
    if (hasExistingData) {
      console.log('✅ User already has data, skipping initialization');
      return {
        success: true,
        message: 'User data already exists',
        isNewUser: false
      };
    }
    
    console.log('🆕 New user detected, generating initial data...');
    
    // Generate comprehensive data for new user
    const result = await seedEngineeringData(userEmail);
    
    if (result.success) {
      console.log('✅ New user initialization successful');
      return {
        success: true,
        message: `🎉 Welcome! Your personalized timetable data has been created.
        
📊 **Your Account Includes:**
• 100 Faculty Members across 3 departments
• 161 Engineering subjects with proper coverage
• Professional timetable management system
• Real-time data synchronization

🚀 You're ready to create efficient timetables!`,
        isNewUser: true,
        stats: {
          faculties: 100,
          departments: 3,
          subjects: 161,
          userEmail: userEmail
        }
      };
    } else {
      throw new Error('Failed to generate initial user data');
    }
  } catch (error) {
    console.error('❌ User initialization failed for:', userEmail, error);
    return {
      success: false,
      message: 'Failed to initialize user data',
      error: error instanceof Error ? error.message : 'Unknown error',
      isNewUser: true
    };
  }
};

// Check if user has existing data
export const checkUserHasData = async (userEmail: string): Promise<boolean> => {
  try {
    // Check if user has any faculty data
    const facultiesSnapshot = await getDocs(collection(db, 'users', userEmail, 'faculties'));
    const departmentsSnapshot = await getDocs(collection(db, 'users', userEmail, 'departments'));
    
    const hasFaculties = facultiesSnapshot.size > 0;
    const hasDepartments = departmentsSnapshot.size > 0;
    
    console.log(`🔍 Data check for ${userEmail}: Faculties=${facultiesSnapshot.size}, Departments=${departmentsSnapshot.size}`);
    
    return hasFaculties && hasDepartments;
  } catch (error) {
    console.error('Error checking user data:', error);
    return false; // Assume no data on error, will trigger generation
  }
};

// Get user statistics
export const getUserDataStats = async (userEmail: string) => {
  try {
    const [facultiesSnapshot, departmentsSnapshot, subjectsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users', userEmail, 'faculties')),
      getDocs(collection(db, 'users', userEmail, 'departments')),
      getDocs(collection(db, 'users', userEmail, 'subjects'))
    ]);
    
    return {
      faculties: facultiesSnapshot.size,
      departments: departmentsSnapshot.size,
      subjects: subjectsSnapshot.size,
      userEmail: userEmail,
      hasData: facultiesSnapshot.size > 0
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      faculties: 0,
      departments: 0,
      subjects: 0,
      userEmail: userEmail,
      hasData: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Universal data generation for any user
export const generateDataForUser = async (userEmail: string, force = false) => {
  if (!userEmail) {
    throw new Error('User email is required');
  }
  
  try {
    // Check if data exists and force is not set
    if (!force) {
      const hasData = await checkUserHasData(userEmail);
      if (hasData) {
        return {
          success: true,
          message: 'User already has data. Use force=true to regenerate.',
          skipped: true
        };
      }
    }
    
    console.log(`🏗️ Generating data for user: ${userEmail} (force=${force})`);
    
    const result = await seedEngineeringData(userEmail);
    
    if (result.success) {
      const stats = await getUserDataStats(userEmail);
      
      return {
        success: true,
        message: `✅ Data generated successfully for ${userEmail}`,
        stats: stats,
        regenerated: force
      };
    } else {
      throw new Error('Data generation failed');
    }
  } catch (error) {
    console.error(`❌ Failed to generate data for ${userEmail}:`, error);
    throw error;
  }
};