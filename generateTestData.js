// Script to upload data from a CSV file to Firebase, including Clinic ID
require('dotenv').config({ path: './.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp, doc, getDoc, setDoc } = require('firebase/firestore'); // Removed unused query, where, getDocs for this script version
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } = require('firebase/auth');
const fs = require('fs');
const csv = require('csv-parser');

// Firebase configuration (should be picked up by dotenv)
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

// --- Helper Functions ---

function generateEmailFromName(name) {
  if (!name) return `unknown.doctor@example.com`;
  const sanitizedName = name
    .toLowerCase()
    .replace(/^dr\.\s*/, 'dr') // Remove space after Dr. if present
    .replace(/\s+/g, '.')    // Replace other spaces with dots
    .replace(/[^a-z0-9.\-_]/g, ''); // Remove invalid characters
  return `${sanitizedName}@example.com`;
}

async function getOrCreateDoctor(name, email, password) {
  try {
    let user;
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      // console.log(` ✓ Signed in existing doctor: ${name} (${email})`);
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-email') {
        try {
          console.log(`Attempting to create Auth user for ${name} (${email}) as it was not found or sign-in failed.`);
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
          await updateProfile(user, { displayName: name });
          console.log(` ✓ Created Auth user for: ${name} (${email})`);
        } catch (creationError) {
          console.error(` ❗ Error creating Auth user ${name} (${email}):`, creationError.message, creationError.code);
          if (creationError.code === 'auth/email-already-in-use') {
             console.warn(` ❗ Auth user ${email} already exists but couldn't sign in. This may indicate a password mismatch or other issue.`);
             // Attempt to get the user if email is in use but sign-in failed (e.g. wrong password was tried)
             // This is tricky with client SDK without admin privileges. For this script, we'll assume failure.
             throw new Error(`Failed to create or authenticate user ${email}. Email might be in use with a different credential.`);
          }
          throw creationError;
        }
      } else {
        console.error(` ❗ Error signing in user ${name} (${email}):`, error.message, error.code);
        throw error;
      }
    }
    
    if (!user || !user.uid) {
        console.error(` ❗ Failed to obtain user UID for ${name}`);
        return null;
    }

    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    const userDocSnap = await getDoc(userDocRef);

    const userData = {
      uid: user.uid,
      email: user.email || email, // Ensure email from Auth is preferred
      name: name,
      role: 'doctor',
      // createdAt will be set only if new, otherwise merged
      updatedAt: Timestamp.now(),
    };

    if (userDocSnap.exists()) {
      const existingData = userDocSnap.data();
      userData.createdAt = existingData.createdAt || Timestamp.now(); // Preserve original creation timestamp
      await setDoc(userDocRef, userData, { merge: true });
      // console.log(` ✓ Updated Firestore data for doctor: ${name}`);
    } else {
      userData.createdAt = Timestamp.now();
      await setDoc(userDocRef, userData);
      console.log(` ✓ Stored Firestore data for new doctor: ${name}`);
    }
    return userData;
  } catch (error) {
    // Log the error with more details if it's a Firebase Auth error
    if (error.code && error.message) {
        console.error(` ❗ Error in getOrCreateDoctor for ${name} (${email}) - Code: ${error.code}, Message: ${error.message}`);
    } else {
        console.error(` ❗ Error in getOrCreateDoctor for ${name} (${email}):`, error);
    }
    return null;
  }
}

async function createDailyRecord(doctorData, date, oldPatientCount, newPatientCount, oldPatientAmount, newPatientAmount, clinicId) {
  try {
    const recordData = {
      doctorId: doctorData.uid,
      doctorName: doctorData.name,
      clinicId: clinicId || "UNKNOWN_CLINIC",
      date: Timestamp.fromDate(date),
      oldPatientCount: Number(oldPatientCount) || 0,
      newPatientCount: Number(newPatientCount) || 0,
      oldPatientAmount: Number(oldPatientAmount) || 0,
      newPatientAmount: Number(newPatientAmount) || 0,
      totalPatientCount: (Number(oldPatientCount) || 0) + (Number(newPatientCount) || 0),
      totalAmount: (Number(oldPatientAmount) || 0) + (Number(newPatientAmount) || 0),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Skip if all monetary and count values are zero (already handled in upload loop, but good to have here too)
    if (recordData.totalPatientCount === 0 && recordData.totalAmount === 0) {
        // console.log(`  Skipping zero record for ${doctorData.name} on ${date.toDateString()} at ${clinicId}`);
        return null;
    }

    const docRef = await addDoc(collection(db, DAILY_RECORDS_COLLECTION), recordData);
    console.log(`   ✓ Record Created: ${doctorData.name} @ ${clinicId}, ${date.toISOString().slice(0,10)}, OldPt: ${oldPatientCount}, NewPt: ${newPatientCount}, OldAmt: ${oldPatientAmount}, NewAmt: ${newPatientAmount}`);
    return { id: docRef.id, ...recordData };
  } catch (error) {
    console.error(`   ❗ Error creating Firestore record for ${doctorData.name} on ${date.toDateString()} at ${clinicId}:`, error.message);
    throw error; // Re-throw to be caught by the main execution
  }
}

function parseMonthYearString(monthStrRaw) {
    if (!monthStrRaw || typeof monthStrRaw !== 'string') return null;
    const monthStr = monthStrRaw.trim();

    // Skip strings that look like metric names to avoid misinterpretation
    if (monthStr.match(/^(amt|pt|amount|patient)/i) || monthStr.match(/total/i)) return null;

    const monthMap = {
        jan: 1, january: 1, 
        feb: 2, february: 2,
        mar: 3, march: 3,
        apr: 4, april: 4,
        may: 5,
        jun: 6, june: 6,
        jul: 7, july: 7,
        aug: 8, august: 8,
        sep: 9, september: 9,
        oct: 10, october: 10,
        nov: 11, november: 11,
        dec: 12, december: 12
    };
    
    const match = monthStr.match(/([a-zA-Z]+)[\s.-]*(\d{2,4})(?:\s*(tk[12]))?/i);
    if (match) {
        const monthName = match[1].toLowerCase();
        let year = parseInt(match[2], 10);
        const clinicSuffix = match[3] ? match[3].toUpperCase() : null;

        if (year < 100) { year += 2000; }

        const month = monthMap[monthName];
        if (month && year) {
            // console.log(`  🔎 Parsed month string: "${monthStrRaw}" -> Month: ${month}, Year: ${year}, Clinic Suffix: ${clinicSuffix || 'none'}`);
            return { month, year, clinicSuffix };
        }
    }
    // console.log(`  - Could not parse as month: "${monthStrRaw}"`);
    return null;
}

function normalizeMetricName(metricNameRaw) {
    if (!metricNameRaw || typeof metricNameRaw !== 'string') return null;
    const name = metricNameRaw.trim().toUpperCase();
    
    if (name === "AMT - OLD" || name === "AMT-OLD") return "AMT_OLD";
    if (name === "AMT-NEW" || name === "AMT - NEW") return "AMT_NEW";
    if (name === "PT- OLD" || name === "PT - OLD" || name === "PT-OLD") return "PT_OLD";
    if (name === "PT- NEW" || name === "PT - NEW" || name === "PT-NEW") return "PT_NEW";
    
    // Broader checks (less specific, so they come after exact matches)
    if (name.includes("AMT") && name.includes("OLD")) return "AMT_OLD";
    if (name.includes("AMT") && name.includes("NEW")) return "AMT_NEW";
    if (name.includes("PT") && name.includes("OLD")) return "PT_OLD";
    if (name.includes("PT") && name.includes("NEW")) return "PT_NEW";
    
    // If it's a metric row, log what it was and that it wasn't matched
    if (name.includes('AMT') || name.includes('PT')) {
      // console.log(`    ⚠️ Metric not normalized: "${metricNameRaw}" (Normalized to: "${name}")`);
    }
    return null;
}

function determineClinicId(year, month, explicitClinicSuffix) {
  if (explicitClinicSuffix) {
    return explicitClinicSuffix; // TK1 or TK2 from CSV header
  }
  
  if (year === 2024) {
    if (month <= 8) return "TK1";  // Jan-Aug 2024
    // For Sep/Oct 2024, if no explicit suffix, we need a default.
    // Based on your description, if it's just "sep.24", it implies the single clinic context of that time.
    // The problem arises if "sep.24" could mean TK1 for one doctor and TK2 for another without suffix.
    // Assuming "sep.24" without suffix means TK1, and "sep.24 tk2" means TK2.
    if (month === 9 || month === 10) return "TK1"; // Default for Sep/Oct if no suffix
    if (month >= 11) return "TK2"; // Nov-Dec 2024
  } else if (year > 2024) {
    return "TK2"; // 2025 onwards
  }
  
  console.warn(` ⚠️ Could not determine clinic for Year: ${year}, Month: ${month}. Defaulting to UNKNOWN_CLINIC_RULE.`);
  return "UNKNOWN_CLINIC_RULE";
}

// --- Main Processing Function ---

async function processAndUploadCsvData(csvFilePath) {
  const allData = {}; 
  let currentMonthInfo = null; // Stores { year, month, clinicId, monthKey }
  let currentDoctorName = null;
  let fileRowCount = 0;

  console.log("Starting CSV processing...");
  
  const stream = fs.createReadStream(csvFilePath)
    .pipe(csv({ headers: false, skipLines: 0 })) 
    .on('data', (dataFromEvent) => { // dataFromEvent is the raw data from csv-parser
      fileRowCount++;

      // Ensure rowArray is an array.
      // If dataFromEvent is an object like { '0': val, '1': val, ... }, Object.values makes it [val, val, ...]
      // If dataFromEvent is already an array, this keeps it as is.
      const rowArray = Array.isArray(dataFromEvent) ? dataFromEvent : Object.values(dataFromEvent);
      
      // It's good practice to check if rowArray has enough elements before accessing them
      if (rowArray.length === 0) {
          // console.log(`  Skipping empty row ${fileRowCount}`);
          return;
      }

      const col0 = rowArray[0]?.trim();
      const col1 = rowArray[1]?.trim();

      // Attempt to parse as a month header first
      let parsedMonthHeader = null;
      // Only consider it a month header if col0 is empty and col1 has some text that isn't clearly a metric
      if ((!col0 || col0 === "") && col1) {
        parsedMonthHeader = parseMonthYearString(col1);
      }

      if (parsedMonthHeader) {
          // This is a month header row
          const determinedClinicId = determineClinicId(parsedMonthHeader.year, parsedMonthHeader.month, parsedMonthHeader.clinicSuffix);
          currentMonthInfo = {
              year: parsedMonthHeader.year,
              month: parsedMonthHeader.month,
              clinicId: determinedClinicId, // Use the determined ID
              monthKey: `${parsedMonthHeader.year}-${String(parsedMonthHeader.month).padStart(2, '0')}`
          };
          
          // Initialize data structure
          if (!allData[currentMonthInfo.monthKey]) {
              allData[currentMonthInfo.monthKey] = {};
          }
          if (!allData[currentMonthInfo.monthKey][currentMonthInfo.clinicId]) {
              allData[currentMonthInfo.monthKey][currentMonthInfo.clinicId] = {};
          }
          
          currentDoctorName = null; // Reset doctor for this new month/clinic block
          console.log(`\n--- Switched Context to Month: ${currentMonthInfo.monthKey}, Clinic: ${currentMonthInfo.clinicId} (From CSV: "${col1}") ---`);
          return; // Done with this month header row
      }

      // If not a month header, it must be data within a month context
      if (!currentMonthInfo) {
          // console.log(`  Skipping row ${fileRowCount} (no current month context): ${rowArray.join(',').substring(0,70)}...`);
          return; 
      }

      // Check if col0 indicates a new doctor for the current month/clinic
      if (col0 && col0.startsWith("Dr ")) {
          currentDoctorName = col0;
          // Ensure structure for this new doctor exists
          if (!allData[currentMonthInfo.monthKey][currentMonthInfo.clinicId][currentDoctorName]) {
              allData[currentMonthInfo.monthKey][currentMonthInfo.clinicId][currentDoctorName] = {};
              // console.log(`  Doctor Context Set: ${currentDoctorName}`);
          }
          // IMPORTANT: Do not return. Proceed to check col1 for metric on this SAME ROW.
      }
      
      // Now, try to process col1 as a metric for the currentDoctorName (if set)
      if (currentDoctorName) { // A doctor context must be active
          const metricKey = normalizeMetricName(col1);
          if (metricKey) {
              // Ensure rowArray has enough elements for slicing data values
              if (rowArray.length < 3) { // Need at least col0, col1, and one data point
                  // console.log(`    ⚠️ Row ${fileRowCount} for metric ${metricKey} has too few columns: ${rowArray.join(',')}`);
                  return;
              }
              const values = rowArray.slice(2, 33).map(v => parseFloat(v) || 0); // Days 1-31
              
              if (!allData[currentMonthInfo.monthKey][currentMonthInfo.clinicId][currentDoctorName]) {
                   console.error(`  ❗ Error: Doctor object not found for ${currentDoctorName} when trying to store metric ${metricKey}. This should not happen if doctor context was set.`);
                   // Attempt to recover by initializing
                   allData[currentMonthInfo.monthKey][currentMonthInfo.clinicId][currentDoctorName] = {};
              }

              allData[currentMonthInfo.monthKey][currentMonthInfo.clinicId][currentDoctorName][metricKey] = values;
              // const previewValues = values.slice(0, 3);
              // console.log(`    ✓ Metric Stored: ${metricKey} for ${currentDoctorName} [${previewValues.join(', ')}...]`);
          } else if (col1 && col1.trim() !== "" && !(col0 && col0.startsWith("Dr "))) { 
              // Log if col1 has content but not a recognized metric, AND it's not the same line as a Doctor declaration (which is fine)
              // console.log(`    - Non-metric content in col1: "${col1}" for doctor ${currentDoctorName}, Row: ${fileRowCount}`);
          }
      } else if (col0 === "" && col1 && col1.trim() !== "") {
          // This case might be for metric rows where col0 is blank, but no doctor context is set.
          // This shouldn't happen if the CSV is structured with a Doctor name before their metrics.
          // console.log(`  - Row with blank col0, metric-like col1 ("${col1}"), but no active doctor. Row: ${fileRowCount}`);
      }
    })
    .on('end', async () => {
      console.log(`\n--- CSV file processing complete. ${fileRowCount} rows read. ---`);
      console.log(`--- Parsed data for ${Object.keys(allData).length} unique YYYY-MM keys. ---`);
      
      // Detailed summary of parsed structure
      console.log('\nSummary of Parsed Data Structure:');
      for (const monthKey in allData) {
        console.log(`  Month: ${monthKey}`);
        for (const clinicId in allData[monthKey]) {
          console.log(`    Clinic: ${clinicId}`);
          const doctorNames = Object.keys(allData[monthKey][clinicId]);
          console.log(`      Doctors: [${doctorNames.join(', ')}]`);
          doctorNames.forEach(docName => {
            const metrics = Object.keys(allData[monthKey][clinicId][docName]);
            console.log(`        ${docName} -> Metrics: [${metrics.join(', ')}]`);
          });
        }
      }

      console.log('\n--- Starting Firebase Upload Process ---');
      
      for (const monthKey in allData) {
        const clinicsInMonth = allData[monthKey];
        for (const clinicId in clinicsInMonth) {
          const doctorsInClinic = clinicsInMonth[clinicId];
          console.log(`\n Processing Upload for Month: ${monthKey}, Clinic: ${clinicId}`);
          for (const doctorName in doctorsInClinic) {
            const doctorMetrics = doctorsInClinic[doctorName];
            console.log(`  Processing Doctor: ${doctorName}`);
            
            const doctorEmail = generateEmailFromName(doctorName);
            const doctorFirebaseData = await getOrCreateDoctor(doctorName, doctorEmail, 'password123'); // Use a secure default or prompt

            if (!doctorFirebaseData) {
              console.error(`  ❗ Could not get/create Firebase data for doctor ${doctorName}. Skipping their records for ${monthKey} at ${clinicId}.`);
              continue;
            }

            const [year, monthNum] = monthKey.split('-').map(Number);

            for (let dayIndex = 0; dayIndex < 31; dayIndex++) {
              const dayOfMonth = dayIndex + 1;
              const recordDate = new Date(year, monthNum - 1, dayOfMonth);

              if (recordDate.getFullYear() !== year || recordDate.getMonth() !== monthNum - 1 || recordDate.getDate() !== dayOfMonth) {
                  continue; 
              }
              
              const oldAmt = doctorMetrics["AMT_OLD"]?.[dayIndex] || 0;
              const newAmt = doctorMetrics["AMT_NEW"]?.[dayIndex] || 0;
              const oldCount = doctorMetrics["PT_OLD"]?.[dayIndex] || 0;
              const newCount = doctorMetrics["PT_NEW"]?.[dayIndex] || 0;

              // Skip if all values for the day are zero
              if (oldAmt === 0 && newAmt === 0 && oldCount === 0 && newCount === 0) {
                // console.log(`    Skipping day ${dayOfMonth} for ${doctorName} (all zero values)`);
                continue;
              }
              
              // Log what's being passed to createDailyRecord for the first day of a doctor's record as a sample
              if (dayIndex === 0 && (oldAmt || newAmt || oldCount || newCount)) { // Log only if there's data
                  console.log(`    Sample Data for ${doctorName}, Day 1: AMT_OLD=${oldAmt}, AMT_NEW=${newAmt}, PT_OLD=${oldCount}, PT_NEW=${newCount}`);
                  if (!doctorMetrics["AMT_OLD"]) console.warn(`      Warning: AMT_OLD metric key missing for ${doctorName} in ${monthKey}-${clinicId}`);
                  if (!doctorMetrics["AMT_NEW"]) console.warn(`      Warning: AMT_NEW metric key missing for ${doctorName} in ${monthKey}-${clinicId}`);
                  if (!doctorMetrics["PT_OLD"])  console.warn(`      Warning: PT_OLD metric key missing for ${doctorName} in ${monthKey}-${clinicId}`);
                  if (!doctorMetrics["PT_NEW"])  console.warn(`      Warning: PT_NEW metric key missing for ${doctorName} in ${monthKey}-${clinicId}`);
              }


              await createDailyRecord(doctorFirebaseData, recordDate, oldCount, newCount, oldAmt, newAmt, clinicId);
            }
          }
        }
      }
      
      console.log('\n--- Firebase data upload process complete! ---');
      process.exit(0);
    })
    .on('error', (error) => {
      console.error('❗ Error reading or processing CSV file:', error);
      process.exit(1);
    });
}

// --- Script Execution ---
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Please provide the path to the CSV file.');
  console.log('Usage: node uploadCsvDataWithClinic.js <path_to_csv_file>');
  process.exit(1);
}

const csvFilePath = args[0];
if (!fs.existsSync(csvFilePath)) {
  console.error(`❗ Error: CSV file not found at ${csvFilePath}`);
  process.exit(1);
}

console.log(`--- Initializing Script: Processing CSV file for data insertion with Clinic ID: ${csvFilePath} ---`);
processAndUploadCsvData(csvFilePath)
  .catch((error) => {
    console.error('❗ Unhandled error in script execution:', error);
    process.exit(1);
  });

