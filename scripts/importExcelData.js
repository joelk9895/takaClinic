const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc, addDoc, Timestamp } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Firebase configuration
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
const auth = getAuth(app);

// Collection names
const USERS_COLLECTION = 'users';
const DAILY_RECORDS_COLLECTION = 'dailyRecords';
const EXPENSES_COLLECTION = 'expenses';

// Function to read Excel file
async function readExcelFile() {
  try {
    const workbook = XLSX.readFile(path.resolve(__dirname, 'data.xlsx'));
    const sheets = workbook.SheetNames;
    
    console.log('Found sheets:', sheets);
    
    // Process all sheets
    const allData = [];
    for (const sheetName of sheets) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Add sheet name to each row
      jsonData.forEach(row => {
        row.sheetName = sheetName;
      });
      
      allData.push(...jsonData);
    }
    
    return allData;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

// Function to create a doctor user
async function createDoctor(email, name, password = '12345678', clinic) {
  try {
    console.log(`Creating doctor: ${name}, Email: ${email}, Clinic: ${clinic}`);
    
    // Check if user already exists by email (converted to lowercase and spaces removed)
    const sanitizedEmail = email.toLowerCase().replace(/\s+/g, '');
    const userDocRef = doc(db, USERS_COLLECTION, sanitizedEmail);
    const userSnapshot = await getDoc(userDocRef);
    
    if (userSnapshot.exists()) {
      console.log(`Doctor ${name} already exists with email ${sanitizedEmail}`);
      return userSnapshot.data();
    }
    
    // Create user in authentication
    const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, { displayName: name });
    
    // Create user document in Firestore
    const userData = {
      uid: user.uid,
      email: sanitizedEmail,
      name: name,
      role: 'doctor',
      clinic: clinic,
      createdAt: Timestamp.now()
    };
    
    await setDoc(doc(db, USERS_COLLECTION, sanitizedEmail), userData);
    console.log(`Doctor ${name} created successfully`);
    
    return userData;
  } catch (error) {
    console.error(`Error creating doctor ${name}:`, error);
    throw error;
  }
}

// Function to add daily record
async function addDailyRecord(doctorId, doctorName, date, oldPatientCount, newPatientCount, oldPatientAmount, newPatientAmount) {
  try {
    // Convert amounts to numbers
    oldPatientAmount = Number(oldPatientAmount) || 0;
    newPatientAmount = Number(newPatientAmount) || 0;
    oldPatientCount = Number(oldPatientCount) || 0;
    newPatientCount = Number(newPatientCount) || 0;
    
    const totalAmount = oldPatientAmount + newPatientAmount;
    const totalPatientCount = oldPatientCount + newPatientCount;
    
    // Create record document
    const recordData = {
      doctorId,
      doctorName,
      date: new Date(date),
      oldPatientAmount,
      newPatientAmount,
      oldPatientCount,
      newPatientCount,
      totalAmount,
      totalPatientCount,
      createdAt: Timestamp.now()
    };
    
    await addDoc(collection(db, DAILY_RECORDS_COLLECTION), recordData);
    console.log(`Daily record added for ${doctorName} on ${date}`);
    
    return recordData;
  } catch (error) {
    console.error(`Error adding daily record for ${doctorName}:`, error);
    throw error;
  }
}

// Function to determine clinic based on date
function determineClinic(date) {
  const recordDate = new Date(date);
  const year = recordDate.getFullYear();
  const month = recordDate.getMonth() + 1; // 0-indexed
  
  if (year === 2024) {
    if (month >= 1 && month <= 8) {
      return 'TK1';
    } else if (month >= 9 && month <= 10) {
      // For Sept-Oct, we'll need to check the sheet name to determine the clinic
      return null; // Will be determined based on sheet name
    } else if (month >= 11) {
      return 'TK2';
    }
  } else if (year > 2024) {
    return 'TK2';
  }
  
  return 'TK1'; // Default fallback
}

// Main function to process data and populate DB
async function populateDatabase() {
  try {
    const data = await readExcelFile();
    console.log(`Read ${data.length} records from Excel`);
    
    // Create a map to store doctors by name
    const doctorsMap = {};
    
    // Process each row
    for (const row of data) {
      // Skip rows without required data
      if (!row.Date || !row.Doctor || (!row.OldPatientCount && !row.NewPatientCount)) {
        console.log('Skipping invalid row:', row);
        continue;
      }
      
      // Determine clinic based on date and sheet name
      let clinic = determineClinic(row.Date);
      if (!clinic) {
        // For Sept-Oct 2024, determine clinic based on sheet name
        if (row.sheetName && row.sheetName.includes('TK1')) {
          clinic = 'TK1';
        } else if (row.sheetName && row.sheetName.includes('TK2')) {
          clinic = 'TK2';
        } else {
          // Default to TK1 if can't determine from sheet name
          clinic = 'TK1';
        }
      }
      
      // Create or get doctor
      const doctorName = row.Doctor.trim();
      const doctorEmail = `${doctorName.toLowerCase().replace(/\s+/g, '')}@example.com`;
      
      if (!doctorsMap[doctorEmail]) {
        try {
          const doctor = await createDoctor(doctorEmail, doctorName, '12345678', clinic);
          doctorsMap[doctorEmail] = doctor;
        } catch (error) {
          console.error(`Error creating doctor ${doctorName}:`, error);
          continue;
        }
      }
      
      // Add daily record
      try {
        await addDailyRecord(
          doctorsMap[doctorEmail].uid,
          doctorName,
          row.Date,
          row.OldPatientCount || 0,
          row.NewPatientCount || 0,
          row.OldPatientAmount || 0,
          row.NewPatientAmount || 0
        );
      } catch (error) {
        console.error(`Error adding record for ${doctorName}:`, error);
      }
    }
    
    console.log('Database population completed successfully');
  } catch (error) {
    console.error('Error populating database:', error);
  }
}

// Run the main function
populateDatabase().then(() => {
  console.log('Script execution completed');
  process.exit(0);
}).catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});
