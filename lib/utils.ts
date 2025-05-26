import { Timestamp } from 'firebase/firestore';
import { UserData, DailyRecord } from './firebaseService'; // Assuming UserData and DailyRecord are exported from firebaseService

// Helper function to format dates
export const formatDate = (date: Date | Timestamp) => {
  if (date instanceof Timestamp) {
    date = date.toDate();
  }
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Helper function to format currency (using Kuwait Dinar)
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KW', {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount);
};

// Type definition for DoctorStats
export interface DoctorStats {
  doctor: UserData;
  totalRecords: number;
  totalOldPatients: number;
  totalNewPatients: number;
  totalPatients: number;
  totalOldPatientAmount: number;
  totalNewPatientAmount: number;
  totalAmount: number;
  totalExpenses?: number; // Added for profit calculation
  projectedMonthlyProfit?: number;
  profitChangePercentage?: number; // Used in FinancialsPage for displaying profit change
  profitChangePercentageVsProjection?: number;
  recentRecords: Record<string, unknown>[]; // Define more specific type if possible, e.g., DailyRecord[]
  dailyTrends: {
    dates: string[];
    oldPatients: number[];
    newPatients: number[];
    oldRevenue: number[];
    newRevenue: number[];
    totalRevenue: number[];
  };
  averages: {
    oldPatientsPerDay: number;
    newPatientsPerDay: number;
    totalPatientsPerDay: number;
    oldRevenuePerDay: number;
    newRevenuePerDay: number;
    totalRevenuePerDay: number;
  };
  // Additional properties used in admin page
  filteredRecords?: DailyRecord[];
  filteredExpenses?: Record<string, unknown>[];
  allRecords?: DailyRecord[];
  // Any other custom properties
  [key: string]: unknown;
}
