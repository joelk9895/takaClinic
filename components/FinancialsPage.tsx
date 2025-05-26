import React from 'react';
import { DoctorStats } from '../lib/utils';
import { UserData } from '../lib/firebaseService';
import AddExpenseForm from './AddExpenseForm';
import DoctorFinancials from './DoctorFinancials';

interface FinancialsPageProps {
  doctorStats: DoctorStats[];
  selectedDoctor: UserData | null;
  handleSelectDoctor: (doctor: UserData | null) => void;
  showAddExpense: boolean;
  setShowAddExpense: (show: boolean) => void;
  fetchDoctorsAndStats: () => Promise<void>;
  selectedDateRange: string;
  formatCurrency: (amount: number) => string;
}

const FinancialsPage: React.FC<FinancialsPageProps> = ({
  doctorStats,
  selectedDoctor,
  handleSelectDoctor,
  showAddExpense,
  setShowAddExpense,
  fetchDoctorsAndStats,
  selectedDateRange,
  formatCurrency,
}) => {
  // Debug log to check expense values
  console.log('Doctor stats with expenses:', doctorStats.map(stat => ({
    doctor: stat.doctor.name,
    totalAmount: stat.totalAmount,
    totalExpenses: stat.totalExpenses,
    profit: stat.totalAmount - (stat.totalExpenses || 0)
  })));
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-700 tracking-tight font-plus-jakarta">
            Financial Dashboard
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            Track, analyze and optimize your clinic&apos;s performance
          </p>
        </div>
        
        {!selectedDoctor && (
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {selectedDateRange.startsWith('month:') ? selectedDateRange.substring(6) : `${selectedDateRange} days data`}
            </span>
          </div>
        )}
      </div>
      
      {!selectedDoctor ? (
        <div>
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-primary-50 rounded-xl p-6 mb-8 border border-blue-100 shadow-sm backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white bg-opacity-80 rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-neutral-800">Financial Overview</h3>
                <p className="text-sm text-neutral-600 mt-2">
                  Select any doctor card below to view their detailed financial breakdown, manage expenses, and analyze month-over-month performance.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {doctorStats.map((stat) => {
              // Calculate financial metrics
              const profit = stat.totalAmount - (stat.totalExpenses || 0);
              const profitPercentage = stat.totalAmount > 0 ? (profit / stat.totalAmount) * 100 : 0;
              const isPositiveProfit = profit >= 0;              // Use the pre-calculated totalPatients property from DoctorStats
              const avgRevenuePerPatient = stat.totalPatients > 0 ? stat.totalAmount / stat.totalPatients : 0;
              
              // Calculate comparison flags
              const isPositiveChangeVsPrev = (stat.profitChangePercentage || 0) >= 0;
              const isPositiveChangeVsProj = (stat.profitChangePercentageVsProjection || 0) >= 0;
              
              return (
                <div 
                  key={stat.doctor.uid} 
                  className="group bg-white backdrop-blur-sm rounded-xl shadow-sm border border-neutral-200 hover:shadow-lg hover:border-primary-200 transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => handleSelectDoctor(stat.doctor)}
                >
                  <div className="relative p-6">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 bg-primary-50 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l5-5m-5 5V3" />
                      </svg>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex-shrink-0 h-14 w-14 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-sm">
                        <span className="text-primary-700 font-semibold text-lg">{stat.doctor.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-neutral-800 truncate">Dr. {stat.doctor.name}</h4>
                        <p className="text-xs text-neutral-500 mt-1">
                          {stat.totalPatients} patients ({stat.totalNewPatients} new) • 
                          {(() => {
                            const days = parseInt(selectedDateRange, 10) || 30;
                            const endDate = new Date();
                            const startDate = new Date();
                            startDate.setDate(startDate.getDate() - days);
                            return ` ${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()} - ${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}`;
                          })()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 mb-3">
                      {/* Revenue */}
                      <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Revenue</p>
                        </div>
                        <p className="text-xl font-bold text-neutral-800">{formatCurrency(stat.totalAmount)}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
                          <span>Avg: {formatCurrency(avgRevenuePerPatient)}/patient</span>
                          {stat.profitChangePercentage !== undefined && (
                            <span className="flex items-center">
                              <span className={`${isPositiveChangeVsPrev ? 'text-green-600' : 'text-red-500'} font-medium mr-1`}>
                                {isPositiveChangeVsPrev ? '↑' : '↓'} {Math.abs(stat.profitChangePercentage).toFixed(1)}%
                              </span>
                              <span>vs prev</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Expenses */}
                      <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Expenses</p>
                        </div>
                        <p className="text-xl font-bold text-neutral-800">{formatCurrency(stat.totalExpenses || 0)}</p>
                      </div>
                      
                      {/* Profit */}
                      <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                          </svg>
                          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Profit</p>
                        </div>
                        <p className={`text-xl font-bold ${isPositiveProfit ? 'text-neutral-800' : 'text-red-600'}`}>
                          {formatCurrency(profit)}
                        </p>
                        <div className="mt-2">
                          <span className="text-xs text-neutral-500">
                            Margin: {profitPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Indicators */}
                    <div className="flex items-center justify-between mt-4 px-1">
                      {stat.profitChangePercentageVsProjection !== undefined && (
                        <div className="flex items-center text-xs">
                          <span className="text-neutral-500 mr-1">vs Projection:</span>
                          <span className={`font-medium ${isPositiveChangeVsProj ? 'text-green-600' : 'text-red-500'}`}>
                            {isPositiveChangeVsProj ? '+' : ''}{Math.abs(stat.profitChangePercentageVsProjection).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-xs">
                        <span className="text-neutral-500 mr-1">Patients:</span>
                        <span className="font-medium text-neutral-800">{stat.totalPatients}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar at the bottom of the card */}
                  <div className="h-1.5 w-full bg-gray-100">
                    <div 
                      className={`h-full ${isPositiveProfit ? 'bg-green-500' : 'bg-amber-500'}`} 
                      style={{ width: `${Math.min(Math.max(profitPercentage, 0), 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-sm border border-neutral-200 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="inline-block w-1.5 h-6 bg-primary-500 rounded-full"></span>
              <h3 className="text-xl font-semibold text-neutral-800 font-plus-jakarta">Dr. {selectedDoctor.name}&apos;s Financials</h3>
            </div>
            <div className="flex space-x-3">
              {!showAddExpense && (
                <button 
                  onClick={() => setShowAddExpense(true)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add Expense
                </button>
              )}
              <button
                onClick={() => handleSelectDoctor(null)} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Financials Overview
              </button>
            </div>
          </div>
          
          {showAddExpense && (
            <div className="mb-6 p-4 border border-gray-200 rounded-md">
              <AddExpenseForm
                doctorId={selectedDoctor.uid}
                doctorName={selectedDoctor.name}
                onSuccess={() => {
                  setShowAddExpense(false);
                  fetchDoctorsAndStats(); 
                }}
                onCancel={() => setShowAddExpense(false)}
              />
            </div>
          )}

          <DoctorFinancials
            doctor={selectedDoctor}
            dateRange={{
              start: (() => {
                const date = new Date();
                // Handle different date range formats
                if (selectedDateRange.startsWith('month:')) {
                  // For month format like 'month:2023-05'
                  const [year, month] = selectedDateRange.substring(6).split('-').map(Number);
                  return new Date(year, month - 1, 1); // First day of the selected month
                } else {
                  // For days format like '30', '90', etc.
                  const days = parseInt(selectedDateRange, 10) || 30; // Default to 30 days if parsing fails
                  date.setDate(date.getDate() - days);
                  return date;
                }
              })(),
              end: (() => {
                // Create proper end date based on the date range type
                if (selectedDateRange.startsWith('month:')) {
                  // For month-specific format, set end date to last day of the selected month
                  const [year, month] = selectedDateRange.substring(6).split('-').map(Number);
                  // Create date for first day of next month, then subtract 1 millisecond
                  const lastDay = new Date(year, month, 0); // Month is 1-indexed here for last day calculation
                  return lastDay;
                } else {
                  // For day ranges, end date is today
                  return new Date();
                }
              })()
            }}
            onRefresh={fetchDoctorsAndStats}
          />
        </div>
      )}
    </div>
  );
};

export default FinancialsPage;