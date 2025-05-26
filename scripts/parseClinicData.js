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

// Data structure constants
const DATA_ROWS = {
  DOCTOR_NAME: 0,
  AMT_OLD: 1,
  AMT_NEW: 3,
  PT_OLD: 5,
  PT_NEW: 7,
  AMT_TOT: 9,
  PT_TOT: 11
};

const DAYS_IN_MONTH = 31;
const ROW_HEIGHT = 12; // Number of rows for each doctor's data block

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
async function addDailyRecord(doctorId, doctorName, date, oldPatientCount, newPatientCount, oldPatientAmount, newPatientAmount, clinic) {
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
      clinic,
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
    console.log(`Daily record added for ${doctorName} on ${date} at ${clinic}`);
    
    return recordData;
  } catch (error) {
    console.error(`Error adding daily record for ${doctorName}:`, error);
    throw error;
  }
}

// Function to determine clinic based on date and sheet name
function determineClinic(date, sheetName) {
  const recordDate = new Date(date);
  const year = recordDate.getFullYear();
  const month = recordDate.getMonth() + 1; // 0-indexed
  
  if (year === 2024) {
    if (month >= 1 && month <= 8) {
      return 'TK1';
    } else if (month >= 9 && month <= 10) {
      // For Sept-Oct, check the sheet name to determine the clinic
      if (sheetName && sheetName.includes('TK1')) {
        return 'TK1';
      } else if (sheetName && sheetName.includes('TK2')) {
        return 'TK2';
      } else {
        // Default if can't determine
        return 'TK1';
      }
    } else if (month >= 11) {
      return 'TK2';
    }
  } else if (year > 2024) {
    return 'TK2';
  }
  
  return 'TK1'; // Default fallback
}

// Function to parse the month and year from a string like "Jan--2024"
function parseMonthYear(monthYearStr) {
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const parts = monthYearStr.split('--');
  if (parts.length !== 2) {
    throw new Error(`Invalid month-year format: ${monthYearStr}`);
  }
  
  const month = months[parts[0]];
  const year = parseInt(parts[1]);
  
  if (month === undefined || isNaN(year)) {
    throw new Error(`Invalid month-year format: ${monthYearStr}`);
  }
  
  return { month, year };
}

// Function to process a doctor's data block
async function processDoctorData(sheet, startRow, monthYearStr, sheetName) {
  try {
    // Get the doctor name from the first cell of the doctor block
    const doctorName = sheet[`A${startRow + DATA_ROWS.DOCTOR_NAME + 1}`]?.v;
    if (!doctorName) {
      console.log(`No doctor name found at row ${startRow}, skipping block`);
      return false;
    }
    
    console.log(`Processing data for ${doctorName} from ${monthYearStr}`);
    
    // Parse the month and year
    const { month, year } = parseMonthYear(monthYearStr);
    
    // Create or get doctor
    const doctorEmail = `${doctorName.toLowerCase().replace(/\s+/g, '')}@example.com`;
    let clinic = 'TK1'; // Default clinic
    let doctorData;
    
    try {
      doctorData = await createDoctor(doctorEmail, doctorName, '12345678', clinic);
    } catch (error) {
      console.error(`Error creating doctor ${doctorName}:`, error);
      return false;
    }
    
    // Process each day of the month
    for (let day = 1; day <= DAYS_IN_MONTH; day++) {
      // Column index for the day (add 1 because XLSX columns are 1-indexed)
      const colIndex = day + 1; // First day is in column B
      const colLetter = XLSX.utils.encode_col(colIndex - 1);
      
      // Get the values for this day
      const oldPatientAmount = sheet[`${colLetter}${startRow + DATA_ROWS.AMT_OLD + 1}`]?.v || 0;
      const newPatientAmount = sheet[`${colLetter}${startRow + DATA_ROWS.AMT_NEW + 1}`]?.v || 0;
      const oldPatientCount = sheet[`${colLetter}${startRow + DATA_ROWS.PT_OLD + 1}`]?.v || 0;
      const newPatientCount = sheet[`${colLetter}${startRow + DATA_ROWS.PT_NEW + 1}`]?.v || 0;
      
      // Skip days with no data
      if (oldPatientAmount === 0 && newPatientAmount === 0 && oldPatientCount === 0 && newPatientCount === 0) {
        continue;
      }
      
      // Create date for this record
      const recordDate = new Date(year, month, day);
      
      // Determine clinic based on date
      clinic = determineClinic(recordDate, sheetName);
      
      // Add daily record
      try {
        await addDailyRecord(
          doctorData.uid,
          doctorName,
          recordDate,
          oldPatientCount,
          newPatientCount,
          oldPatientAmount,
          newPatientAmount,
          clinic
        );
      } catch (error) {
        console.error(`Error adding record for ${doctorName} on ${recordDate.toISOString()}:`, error);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing doctor data starting at row ${startRow}:`, error);
    return false;
  }
}

// Main function to process Excel file
async function processExcelFile() {
  try {
    const workbook = XLSX.readFile(path.resolve(__dirname, 'data.xlsx'));
    const sheets = workbook.SheetNames;
    
    console.log(`Found ${sheets.length} sheets:`, sheets);
    
    for (const sheetName of sheets) {
      console.log(`Processing sheet: ${sheetName}`);
      const sheet = workbook.Sheets[sheetName];
      
      // Find all month rows in the sheet
      let rowIndex = 1;
      const monthRows = [];
      
      while (true) {
        const cellRef = `A${rowIndex}`;
        const cell = sheet[cellRef];
        
        if (!cell) {
          break;
        }
        
        const cellValue = cell.v.toString();
        if (cellValue.includes('--') && cellValue.includes('2024')) {
          monthRows.push({ row: rowIndex, monthYear: cellValue });
        }
        
        rowIndex++;
      }
      
      console.log(`Found ${monthRows.length} month sections in sheet ${sheetName}`);
      
      // Process each month section
      for (const { row, monthYear } of monthRows) {
        console.log(`Processing month section: ${monthYear} starting at row ${row}`);
        
        // For each month section, find and process doctor blocks
        let currentRow = row + 1; // Start from the row after the month header
        
        while (true) {
          // Check if we've reached the end of the sheet or another month section
          const cellRef = `A${currentRow}`;
          const cell = sheet[cellRef];
          
          if (!cell || (cell.v.toString().includes('--') && cell.v.toString().includes('2024'))) {
            break;
          }
          
          // Process a doctor block starting at the current row
          const success = await processDoctorData(sheet, currentRow, monthYear, sheetName);
          
          // Move to the next block
          currentRow += ROW_HEIGHT;
          
          // If we've processed 3 doctors in this month section, move to the next section
          if (currentRow > row + ROW_HEIGHT * 3) {
            break;
          }
        }
      }
    }
    
    console.log('Finished processing all sheets');
  } catch (error) {
    console.error('Error processing Excel file:', error);
  }
}

// Run the main function
processExcelFile().then(() => {
  console.log('Script execution completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});
