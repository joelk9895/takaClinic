'use client';

import React, { useState, useEffect } from 'react';
import { UserData, DailyRecord, Expense, getDoctorDailyRecords, getDoctorExpenses } from '../lib/firebaseService';
import { Timestamp } from 'firebase/firestore';
import ExpenseForm from './ExpenseForm';

type DoctorFinancialsProps = {
  doctor: UserData;
  dateRange: { start: Date; end: Date };
  onRefresh?: () => void;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KW', {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount);
};

const formatDate = (date: Date | Timestamp) => {
  if (date instanceof Timestamp) {
    date = date.toDate();
  }
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const DoctorFinancials: React.FC<DoctorFinancialsProps> = ({ doctor, dateRange, onRefresh }) => {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [prevMonthRecords, setPrevMonthRecords] = useState<DailyRecord[]>([]);
  const [prevMonthExpenses, setPrevMonthExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [error, setError] = useState('');

  // Calculate totals and averages for current period
  const totalOldPatients = records.reduce((sum, record) => sum + (Number(record.oldPatientCount) || 0), 0);
  const totalNewPatients = records.reduce((sum, record) => sum + (Number(record.newPatientCount) || 0), 0);
  const totalPatients = totalOldPatients + totalNewPatients;

  const totalOldPatientRevenue = records.reduce((sum, record) => sum + (Number(record.oldPatientAmount) || 0), 0);
  const totalNewPatientRevenue = records.reduce((sum, record) => sum + (Number(record.newPatientAmount) || 0), 0);
  const totalRevenue = totalOldPatientRevenue + totalNewPatientRevenue;
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const profit = totalRevenue - totalExpenses;

  // Calculate totals for previous month
  const prevTotalOldPatients = prevMonthRecords.reduce((sum, record) => sum + (Number(record.oldPatientCount) || 0), 0);
  const prevTotalNewPatients = prevMonthRecords.reduce((sum, record) => sum + (Number(record.newPatientCount) || 0), 0);
  const prevTotalPatients = prevTotalOldPatients + prevTotalNewPatients;

  const prevTotalOldPatientRevenue = prevMonthRecords.reduce((sum, record) => sum + (Number(record.oldPatientAmount) || 0), 0);
  const prevTotalNewPatientRevenue = prevMonthRecords.reduce((sum, record) => sum + (Number(record.newPatientAmount) || 0), 0);
  const prevTotalRevenue = prevTotalOldPatientRevenue + prevTotalNewPatientRevenue;
  
  const prevTotalExpenses = prevMonthExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const prevProfit = prevTotalRevenue - prevTotalExpenses;

  // Calculate month-over-month changes (percentages)
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0; // If previous is 0, show 100% increase if current has value
    return ((current - previous) / previous) * 100;
  };
  
  const revenueChange = calculateChange(totalRevenue, prevTotalRevenue);
  const profitChange = calculateChange(profit, prevProfit);
  const patientCountChange = calculateChange(totalPatients, prevTotalPatients);
  const expenseChange = calculateChange(totalExpenses, prevTotalExpenses);

  // Calculate rates
  const avgOldPatientRate = totalOldPatients > 0 ? totalOldPatientRevenue / totalOldPatients : 0;
  const avgNewPatientRate = totalNewPatients > 0 ? totalNewPatientRevenue / totalNewPatients : 0;
  const overallRate = totalPatients > 0 ? totalRevenue / totalPatients : 0;
  
  // Calculate daily averages for projection
  // Add 1 to include both the start and end dates in the count
  const daysInRange = Math.max(1, Math.floor((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  // For month view, use the exact number of days in the month instead of calculation
  const isMonthView = dateRange.start.getDate() === 1 && dateRange.end.getDate() >= 28;
  const daysInMonth = isMonthView ? new Date(dateRange.start.getFullYear(), dateRange.start.getMonth() + 1, 0).getDate() : daysInRange;
  
  const avgDailyPatients = totalPatients / daysInMonth;
  const avgDailyRevenue = totalRevenue / daysInMonth;
  
  // Project remainder of month - only for current month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Check if we're viewing the current month
  const isCurrentMonth = dateRange.start.getMonth() === currentMonth && 
                        dateRange.start.getFullYear() === currentYear && 
                        dateRange.start.getDate() === 1;
  
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const remainingDays = isCurrentMonth ? Math.max(0, lastDayOfMonth.getDate() - today.getDate()) : 0;
  const projectedAdditionalPatients = Math.round(avgDailyPatients * remainingDays);
  const projectedAdditionalRevenue = avgDailyRevenue * remainingDays;
  const projectedMonthlyRevenue = totalRevenue + projectedAdditionalRevenue;
  const projectedMonthlyProfit = projectedMonthlyRevenue - totalExpenses;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');

      try {
        console.log(`Fetching financial data for Dr. ${doctor.name} (${doctor.uid})`);
        console.log(`Date range: ${dateRange.start.toISOString()} to ${dateRange.end.toISOString()}`);
        
        // Calculate previous month date range for comparison
        const prevMonthStart = new Date(dateRange.start);
        prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
        const prevMonthEnd = new Date(dateRange.end);
        prevMonthEnd.setMonth(prevMonthEnd.getMonth() - 1);
        // If we're looking at a full month, adjust the end date to be the last day of the previous month
        if (dateRange.start.getDate() === 1 && dateRange.end.getDate() >= 28) {
          prevMonthEnd.setDate(0); // Set to the last day of the previous month
        }
        
        console.log(`Previous month range: ${prevMonthStart.toISOString()} to ${prevMonthEnd.toISOString()}`);
        
        // Fetch current period records and expenses in parallel
        const [fetchedRecords, fetchedExpenses] = await Promise.all([
          getDoctorDailyRecords(doctor.uid),
          getDoctorExpenses(doctor.uid)
        ]);

        console.log(`Retrieved ${fetchedRecords.length} total records and ${fetchedExpenses.length} expenses`);
        
        // Improved date handling for records
        const filteredRecords = fetchedRecords.filter(record => {
          if (!record.date) {
            console.log('Record found with no date:', record.id);
            return false;
          }
          
          let recordDate;
          if (record.date instanceof Timestamp) {
            recordDate = record.date.toDate();
          } else if (record.date instanceof Date) {
            recordDate = record.date;
          } else if (typeof record.date === 'object' && record.date !== null && 'seconds' in record.date && 'nanoseconds' in record.date) {
            // Handle Firestore timestamp-like objects that might be deserialized
            recordDate = new Timestamp((record.date as Timestamp).seconds, (record.date as Timestamp).nanoseconds).toDate();
          } else {
            // Try to parse string dates
            recordDate = new Date(record.date);
          }
          
          if (isNaN(recordDate.getTime())) {
            console.log(`Invalid date for record ${record.id}:`, record.date);
            return false;
          }
          
          // Use same timezone cutoff for consistent filtering with the main view
          const recordDateStr = recordDate.toISOString().split('T')[0];
          const startDateStr = dateRange.start.toISOString().split('T')[0];
          const endDateStr = dateRange.end.toISOString().split('T')[0];
          
          // Compare just the date part, ignoring time for more consistent filtering
          const isInRange = recordDateStr >= startDateStr && recordDateStr <= endDateStr;
          return isInRange;
        });

        // Improved date handling for expenses
        const filteredExpenses = fetchedExpenses.filter(expense => {
          if (!expense.date) {
            console.log('Expense found with no date:', expense.id);
            return false;
          }
          
          let expenseDate;
          if (expense.date instanceof Timestamp) {
            expenseDate = expense.date.toDate();
          } else if (expense.date instanceof Date) {
            expenseDate = expense.date;
          } else if (typeof expense.date === 'object' && expense.date !== null && 'seconds' in expense.date && 'nanoseconds' in expense.date) {
            expenseDate = new Timestamp((expense.date as Timestamp).seconds, (expense.date as Timestamp).nanoseconds).toDate();
          } else {
            expenseDate = new Date(expense.date);
          }
          
          if (isNaN(expenseDate.getTime())) {
            console.log(`Invalid date for expense ${expense.id}:`, expense.date);
            return false;
          }
          
          // Use same timezone cutoff for consistent filtering with the main view
          const expenseDateStr = expenseDate.toISOString().split('T')[0];
          const startDateStr = dateRange.start.toISOString().split('T')[0];
          const endDateStr = dateRange.end.toISOString().split('T')[0];
          
          // Compare just the date part, ignoring time for more consistent filtering
          const isInRange = expenseDateStr >= startDateStr && expenseDateStr <= endDateStr;
          return isInRange;
        });

        console.log(`After date filtering: ${filteredRecords.length} records and ${filteredExpenses.length} expenses`);
        
      
        // Filter records for previous month comparison
        const prevMonthFilteredRecords = fetchedRecords.filter(record => {
          if (!record.date) return false;
          
          let recordDate;
          if (record.date instanceof Timestamp) {
            recordDate = record.date.toDate();
          } else if (record.date instanceof Date) {
            recordDate = record.date;
          } else if (typeof record.date === 'object' && record.date !== null && 'seconds' in record.date && 'nanoseconds' in record.date) {
            recordDate = new Timestamp((record.date as Timestamp).seconds, (record.date as Timestamp).nanoseconds).toDate();
          } else {
            recordDate = new Date(record.date);
          }
          
          if (isNaN(recordDate.getTime())) return false;
          
          const recordDateStr = recordDate.toISOString().split('T')[0];
          const startDateStr = prevMonthStart.toISOString().split('T')[0];
          const endDateStr = prevMonthEnd.toISOString().split('T')[0];
          
          return recordDateStr >= startDateStr && recordDateStr <= endDateStr;
        });

        // Filter expenses for previous month comparison
        const prevMonthFilteredExpenses = fetchedExpenses.filter(expense => {
          if (!expense.date) return false;
          
          let expenseDate;
          if (expense.date instanceof Timestamp) {
            expenseDate = expense.date.toDate();
          } else if (expense.date instanceof Date) {
            expenseDate = expense.date;
          } else if (typeof expense.date === 'object' && expense.date !== null && 'seconds' in expense.date && 'nanoseconds' in expense.date) {
            expenseDate = new Timestamp((expense.date as Timestamp).seconds, (expense.date as Timestamp).nanoseconds).toDate();
          } else {
            expenseDate = new Date(expense.date);
          }
          
          if (isNaN(expenseDate.getTime())) return false;
          
          const expenseDateStr = expenseDate.toISOString().split('T')[0];
          const startDateStr = prevMonthStart.toISOString().split('T')[0];
          const endDateStr = prevMonthEnd.toISOString().split('T')[0];
          
          return expenseDateStr >= startDateStr && expenseDateStr <= endDateStr;
        });

        // Sort by date in descending order (newest first)
        const sortedRecords = filteredRecords.sort((a, b) => {
          const dateA = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
          const dateB = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        const sortedExpenses = filteredExpenses.sort((a, b) => {
          const dateA = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
          const dateB = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        // Sort previous month data
        const sortedPrevMonthRecords = prevMonthFilteredRecords.sort((a, b) => {
          const dateA = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
          const dateB = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        const sortedPrevMonthExpenses = prevMonthFilteredExpenses.sort((a, b) => {
          const dateA = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
          const dateB = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        console.log(`Filtered to ${sortedRecords.length} records and ${sortedExpenses.length} expenses in current range`);
        console.log(`Filtered to ${sortedPrevMonthRecords.length} records and ${sortedPrevMonthExpenses.length} expenses in previous month range`);
        
        setRecords(sortedRecords);
        setExpenses(sortedExpenses);
        setPrevMonthRecords(sortedPrevMonthRecords);
        setPrevMonthExpenses(sortedPrevMonthExpenses);
        setIsLoading(false);
        setError('');
      } catch (err) {
        console.error('Error fetching doctor financial data:', err);
        setError('Failed to load financial data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [doctor.uid, doctor.name, dateRange]);


  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowExpenseForm(true);
  };

  const handleExpenseFormSuccess = () => {
    setShowExpenseForm(false);
    setSelectedExpense(null);
    
    // Refresh expenses
    getDoctorExpenses(doctor.uid).then(fetchedExpenses => {
      const filteredExpenses = fetchedExpenses.filter(expense => {
        const expenseDate = expense.date instanceof Date 
          ? expense.date 
          : expense.date.toDate();
        
        return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
      });
      
      setExpenses(filteredExpenses);
    });
    
    if (onRefresh) onRefresh();
  };

  if (isLoading) {
    return (
      <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-sm border border-neutral-200 mb-6">
        <div className="flex justify-center items-center py-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-neutral-500 font-medium">Loading financial data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      
      {error && (
        <div className="mb-6 p-4 bg-error/10 text-error rounded-lg border border-error/20 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {showExpenseForm ? (
        <ExpenseForm 
          doctorId={doctor.uid} 
          doctorName={doctor.name} 
          existingExpense={selectedExpense || undefined}
          onSuccess={handleExpenseFormSuccess}
          onCancel={() => setShowExpenseForm(false)}
        />
      ) : (
        <div>
         
          
          {/* Financial metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Revenue</h3>
                <span className="p-1.5 rounded-full bg-primary-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-bold text-neutral-800 mb-4">{formatCurrency(totalRevenue)}</p>
              <div className="space-y-2 pt-3 border-t border-neutral-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider text-neutral-500">Old Patients</span>
                  <span className="font-medium text-primary-600">{formatCurrency(totalOldPatientRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider text-neutral-500">New Patients</span>
                  <span className="font-medium text-primary-600">{formatCurrency(totalNewPatientRevenue)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Expenses</h3>
                <span className="p-1.5 rounded-full bg-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-bold text-neutral-800 mb-4">{formatCurrency(totalExpenses)}</p>
              <div className="space-y-2 pt-3 border-t border-neutral-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider text-neutral-500">Total Items</span>
                  <span className="font-medium text-neutral-700">{expenses.length} expenses</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Profit</h3>
                <span className={`p-1.5 rounded-full ${profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={profit >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"} />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-bold flex items-center mb-4">
                <span className={`mr-2 ${profit >= 0 ? 'text-success' : 'text-error'}`}>{profit >= 0 ? '↑' : '↓'}</span>
                <span className="text-neutral-800">{formatCurrency(Math.abs(profit))}</span>
              </p>
              <div className="space-y-2 pt-3 border-t border-neutral-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider text-neutral-500">Profit Margin</span>
                  <span className={`font-medium flex items-center ${profit >= 0 ? 'text-success' : 'text-error'}`}>
                    {totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Patient rates */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block w-1.5 h-6 bg-blue-500 rounded-full"></span>
              <h3 className="text-lg font-semibold text-neutral-800 font-plus-jakarta">Patient Rates</h3>
            </div>
            <div className="bg-white backdrop-blur-sm rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead>
                    <tr className="bg-neutral-50">
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Patient Type</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Count</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Revenue</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Avg. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr className="hover:bg-neutral-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-800">Old Patients</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{totalOldPatients}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatCurrency(totalOldPatientRevenue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatCurrency(avgOldPatientRate)}</td>
                    </tr>
                    <tr className="hover:bg-neutral-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-800">New Patients</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{totalNewPatients}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatCurrency(totalNewPatientRevenue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatCurrency(avgNewPatientRate)}</td>
                    </tr>
                    <tr className="bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-800">Total / Average</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">{totalPatients}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">{formatCurrency(totalRevenue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">{formatCurrency(overallRate)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Performance Comparison - Month over Month */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              <h3 className="text-lg font-semibold text-neutral-800 font-plus-jakarta">Performance Comparison</h3>
              <span className="text-sm text-neutral-500">vs. Previous Month</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Revenue Comparison */}
              <div className="bg-white backdrop-blur-sm p-5 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-500">Revenue</h3>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${revenueChange >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-800">{formatCurrency(totalRevenue)}</span>
                  <span className="text-sm text-neutral-500">from {formatCurrency(prevTotalRevenue)}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${revenueChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(revenueChange))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Profit Comparison */}
              <div className="bg-white backdrop-blur-sm p-5 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-500">Profit</h3>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${profitChange >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {profitChange >= 0 ? '↑' : '↓'} {Math.abs(profitChange).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-800">{formatCurrency(profit)}</span>
                  <span className="text-sm text-neutral-500">from {formatCurrency(prevProfit)}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${profitChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(profitChange))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Patient Count Comparison */}
              <div className="bg-white backdrop-blur-sm p-5 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-500">Patients</h3>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${patientCountChange >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {patientCountChange >= 0 ? '↑' : '↓'} {Math.abs(patientCountChange).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-800">{totalPatients}</span>
                  <span className="text-sm text-neutral-500">from {prevTotalPatients}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${patientCountChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(patientCountChange))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Expenses Comparison */}
              <div className="bg-white backdrop-blur-sm p-5 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-500">Expenses</h3>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${expenseChange <= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {expenseChange >= 0 ? '↑' : '↓'} {Math.abs(expenseChange).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-800">{formatCurrency(totalExpenses)}</span>
                  <span className="text-sm text-neutral-500">from {formatCurrency(prevTotalExpenses)}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${expenseChange <= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(expenseChange))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Projections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Daily Averages</h3>
                <span className="p-1.5 rounded-full bg-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-neutral-600">Days in Range</span>
                  <span className="text-lg font-semibold text-blue-700">{daysInRange}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-neutral-600">Avg. Patients/Day</span>
                  <span className="text-lg font-semibold text-blue-700">{avgDailyPatients.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-neutral-600">Avg. Revenue/Day</span>
                  <span className="text-lg font-semibold text-blue-700">{formatCurrency(avgDailyRevenue)}</span>
                </div>
              </div>
            </div>
            
            {isCurrentMonth && (
              <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">End of Month Projection</h3>
                  <span className="p-1.5 rounded-full bg-purple-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-600">Remaining Days in Month</span>
                    <span className="text-lg font-semibold text-neutral-700">{remainingDays}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-600">Projected Additional Patients</span>
                    <span className="text-lg font-semibold text-neutral-700">{projectedAdditionalPatients}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-600">Projected Additional Revenue</span>
                    <span className="text-lg font-semibold text-neutral-700">{formatCurrency(projectedAdditionalRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-700">Projected Month Revenue</span>
                    <span className="text-lg font-semibold text-purple-700">{formatCurrency(projectedMonthlyRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-700">Projected Month Profit</span>
                    <span className="text-lg font-semibold text-purple-700">{formatCurrency(projectedMonthlyProfit)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Expenses list */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block w-1.5 h-6 bg-red-500 rounded-full"></span>
              <h3 className="text-lg font-semibold text-neutral-800 font-plus-jakarta">Expenses</h3>
            </div>
            {expenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map(expense => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(expense.date)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{expense.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleEditExpense(expense)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No expenses recorded for this date range</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorFinancials;
