import React from 'react';
import { DailyTrends } from '../types/analytics';
import RevenueCharts from './RevenueCharts';
import PatientCharts from './PatientCharts';
import RevenueSummary from './RevenueSummary';

interface ClinicDashboardProps {
  clinicDailyTrends: DailyTrends;
  totalClinicOldPatients: number;
  totalClinicNewPatients: number;
  totalClinicOldRevenue: number;
  totalClinicNewRevenue: number;
  selectedDateRange: string;
}

const ClinicDashboard: React.FC<ClinicDashboardProps> = ({
  clinicDailyTrends,
  totalClinicOldPatients,
  totalClinicNewPatients,
  totalClinicOldRevenue,
  totalClinicNewRevenue,
  selectedDateRange
}) => {
  const totalPatients = totalClinicOldPatients + totalClinicNewPatients;
  const totalRevenue = totalClinicOldRevenue + totalClinicNewRevenue;
  const avgRevenuePerPatient = totalPatients > 0 ? Math.round(totalRevenue / totalPatients) : 0;
  
  return (
    <div className="space-y-6">
      {/* Revenue Summary Section */}
      <RevenueSummary
        totalClinicOldRevenue={totalClinicOldRevenue}
        totalClinicNewRevenue={totalClinicNewRevenue}
        totalClinicOldPatients={totalClinicOldPatients}
        totalClinicNewPatients={totalClinicNewPatients}
        avgRevenuePerPatient={avgRevenuePerPatient}
        dateRange={selectedDateRange}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Charts */}
        <RevenueCharts 
          clinicDailyTrends={clinicDailyTrends} 
          overallClinicRevenue={totalRevenue} 
        />
        
        {/* Patient Charts */}
        <PatientCharts 
          clinicDailyTrends={clinicDailyTrends} 
          overallClinicPatients={totalPatients} 
        />
      </div>
    </div>
  );
};

export default ClinicDashboard;
