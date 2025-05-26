import React from 'react';

interface RevenueSummaryProps {
  totalClinicOldRevenue: number;
  totalClinicNewRevenue: number;
  totalClinicOldPatients: number;
  totalClinicNewPatients: number;
  avgRevenuePerPatient: number;
  dateRange: string;
}

const RevenueSummary: React.FC<RevenueSummaryProps> = ({
  totalClinicOldRevenue,
  totalClinicNewRevenue,
  totalClinicOldPatients,
  totalClinicNewPatients,
  avgRevenuePerPatient,
  dateRange
}) => {
  const totalRevenue = totalClinicOldRevenue + totalClinicNewRevenue;
  const totalPatients = totalClinicOldPatients + totalClinicNewPatients;
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <span className="p-1.5 rounded-full bg-emerald-100 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </span>
        Revenue Summary
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-lg text-white">
          <div className="text-xs font-medium opacity-80 mb-1">Total Revenue</div>
          <div className="text-xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <div className="text-xs mt-1 opacity-80">{dateRange} days</div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-lg text-white">
          <div className="text-xs font-medium opacity-80 mb-1">Total Patients</div>
          <div className="text-xl font-bold">{totalPatients}</div>
          <div className="text-xs mt-1 opacity-80">{dateRange} days</div>
        </div>
        
        <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-4 rounded-lg text-white">
          <div className="text-xs font-medium opacity-80 mb-1">New Patient Revenue</div>
          <div className="text-xl font-bold">₹{totalClinicNewRevenue.toLocaleString('en-IN')}</div>
          <div className="text-xs mt-1 opacity-80">{totalClinicNewPatients} patients</div>
        </div>
        
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 rounded-lg text-white">
          <div className="text-xs font-medium opacity-80 mb-1">Revenue/Patient</div>
          <div className="text-xl font-bold">₹{avgRevenuePerPatient.toLocaleString('en-IN')}</div>
          <div className="text-xs mt-1 opacity-80">Average</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium text-slate-700">Returning Patients</div>
            <div className="text-sm font-bold text-slate-900">{totalClinicOldPatients}</div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${totalPatients > 0 ? (totalClinicOldPatients / totalPatients) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-slate-500">Revenue</div>
            <div className="text-xs font-medium text-slate-700">₹{totalClinicOldRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium text-slate-700">New Patients</div>
            <div className="text-sm font-bold text-slate-900">{totalClinicNewPatients}</div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-indigo-500 h-2 rounded-full" 
              style={{ width: `${totalPatients > 0 ? (totalClinicNewPatients / totalPatients) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-slate-500">Revenue</div>
            <div className="text-xs font-medium text-slate-700">₹{totalClinicNewRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueSummary;
