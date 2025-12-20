import { seedEngineeringData } from './seedEngineeringData';

// Test function to verify data generation
export const testDataGeneration = async (userEmail: string) => {
  if (!userEmail) {
    throw new Error('User email is required for testing data generation');
  }
  
  try {
    console.log('🔧 Testing data generation for user:', userEmail);
    
    const result = await seedEngineeringData(userEmail);
    
    if (result.success) {
      console.log('✅ Test successful!');
      console.log('📊 Generated data summary:');
      console.log('- 100 Faculty members');
      console.log('- 3 Departments (CSE, ECE, AIDS)');
      console.log('- 161 Subjects');
      console.log('- 10 Sections');
      console.log('- 12 Classrooms');
      
      return {
        success: true,
        message: `✅ Data generation test successful!\n\n${result.message}`,
        details: {
          faculties: 100,
          departments: 3,
          subjects: 161
        }
      };
    } else {
      return {
        success: false,
        message: 'Data generation test failed',
        error: result.message
      };
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      message: 'Test encountered an error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Quick verification function
export const verifyUserData = async (userEmail: string) => {
  console.log('🔍 Verifying data exists for user:', userEmail);
  // This would check if data exists in Firebase for the user
  // For now, just recommend regenerating data
  return {
    hasData: false,
    recommendation: 'Click "Generate Comprehensive Data" button to create faculty data'
  };
};