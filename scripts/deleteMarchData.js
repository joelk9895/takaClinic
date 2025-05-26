// Script to delete all data from March 2025
'use strict';

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  deleteDoc,
  doc
} = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteMarchData(clinicId = null) {
  console.log('Starting deletion of March 2025 data...');
  console.log(clinicId ? `Filtering for clinic ID: ${clinicId}` : 'No clinic filter applied, deleting ALL March 2025 data');

  try {
    // Define March 2025 start and end dates
    const marchStart = new Date(2025, 2, 1, 0, 0, 0, 0); // Month is 0-indexed, so 2 = March
    const marchEnd = new Date(2025, 2, 31, 23, 59, 59, 999); // Last day of March with end of day time

    // Convert to Firebase Timestamp
    const startTimestamp = Timestamp.fromDate(marchStart);
    const endTimestamp = Timestamp.fromDate(marchEnd);

    console.log(`Deleting records between ${marchStart.toISOString()} and ${marchEnd.toISOString()}`);

    // Get daily records collection
    const dailyRecordsRef = collection(db, 'dailyRecords');
    
    // Create query for records in March 2025
    // Build query conditions starting with date range
    let queryConditions = [
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp)
    ];
    
    // Add clinicId filter if provided
    if (clinicId) {
      queryConditions.push(where('clinicId', '==', clinicId));
    }
    
    // Create the query with all conditions
    const q = query(dailyRecordsRef, ...queryConditions);

    // Get all matching records
    const querySnapshot = await getDocs(q);
    
    // Count of records to delete
    const recordsCount = querySnapshot.size;
    console.log(`Found ${recordsCount} records to delete.`);

    // Delete each record
    let deletedCount = 0;
    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, 'dailyRecords', docSnapshot.id));
      deletedCount++;
      
      // Log progress
      if (deletedCount % 10 === 0 || deletedCount === recordsCount) {
        console.log(`Deleted ${deletedCount} of ${recordsCount} records...`);
      }
    }

    console.log(`Successfully deleted ${deletedCount} records from March 2025.`);

    // Also delete any related expenses from March 2025
    const expensesRef = collection(db, 'expenses');
    
    // Build expenses query conditions starting with date range
    let expensesQueryConditions = [
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp)
    ];
    
    // Add clinicId filter for expenses if provided
    if (clinicId) {
      expensesQueryConditions.push(where('clinicId', '==', clinicId));
    }
    
    // Create the expenses query with all conditions
    const expensesQuery = query(expensesRef, ...expensesQueryConditions);

    const expensesSnapshot = await getDocs(expensesQuery);
    const expensesCount = expensesSnapshot.size;
    
    console.log(`Found ${expensesCount} expenses to delete.`);
    
    let deletedExpensesCount = 0;
    for (const expenseDoc of expensesSnapshot.docs) {
      await deleteDoc(doc(db, 'expenses', expenseDoc.id));
      deletedExpensesCount++;
      
      if (deletedExpensesCount % 10 === 0 || deletedExpensesCount === expensesCount) {
        console.log(`Deleted ${deletedExpensesCount} of ${expensesCount} expenses...`);
      }
    }

    console.log(`Successfully deleted ${deletedExpensesCount} expenses from March 2025.`);
    console.log('Data deletion completed successfully!');

  } catch (error) {
    console.error('Error deleting March 2025 data:', error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let clinicId = null;

// Check if clinicId is provided as a command line argument
if (args.length > 0) {
  const clinicIdArg = args.find(arg => arg.startsWith('--clinicId='));
  if (clinicIdArg) {
    clinicId = clinicIdArg.split('=')[1];
  }
}

// Run the deletion function
console.log('\n=== MARCH 2025 DATA DELETION SCRIPT ===');
console.log('WARNING: This script will permanently delete data. Make sure you have a backup.');
console.log('Press Ctrl+C within 5 seconds to cancel...\n');

// Add a 5-second delay before starting to allow for cancellation
setTimeout(() => {
  console.log('Starting deletion process...');
  deleteMarchData(clinicId).then(() => {
    console.log('Script execution complete.');
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}, 5000);
