import React from 'react';
import { DailyTrends, RetentionData, FrequencyData, GrowthForecastData } from '../types/analytics';
import PatientRetentionAnalysis from './PatientRetentionAnalysis';
import VisitFrequencyAnalysis from './VisitFrequencyAnalysis';
import PatientGrowthForecast from './PatientGrowthForecast';
import { analyzePatientRetention, analyzeVisitFrequency, generatePatientGrowthForecast } from './MLAnalyticsUtils';

interface PatientAnalyticsDashboardProps {
  clinicDailyTrends: DailyTrends;
}

const PatientAnalyticsDashboard: React.FC<PatientAnalyticsDashboardProps> = ({ clinicDailyTrends }) => {
  const retentionData: RetentionData = analyzePatientRetention(clinicDailyTrends);
  const frequencyData: FrequencyData = analyzeVisitFrequency(clinicDailyTrends);
  const growthForecastData: GrowthForecastData = generatePatientGrowthForecast(clinicDailyTrends);
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">ML-Powered Patient Analytics</h2>
        <p className="text-sm text-slate-500">Advanced insights generated using Random Forest algorithms</p>
      </div>
      
      {/* Patient Retention and Visit Frequency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PatientRetentionAnalysis retentionData={retentionData} />
        <VisitFrequencyAnalysis frequencyData={frequencyData} />
      </div>
      
      {/* Patient Growth Forecast and Daily Averages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PatientGrowthForecast
          growthRate={growthForecastData.growthRate}
          estimatedMonthlyGrowth={growthForecastData.estimatedMonthlyGrowth}
          estimatedAnnualPatients={growthForecastData.estimatedAnnualPatients}
        />
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Daily Averages</h3>
          <div className="space-y-4">
            {(() => {
              // Calculate daily averages
              const totalClinicOldPatients = clinicDailyTrends.oldPatients.reduce((sum, val) => sum + val, 0);
              const totalClinicNewPatients = clinicDailyTrends.newPatients.reduce((sum, val) => sum + val, 0);
              const totalClinicOldRevenue = clinicDailyTrends.oldRevenue.reduce((sum, val) => sum + val, 0);
              const totalClinicNewRevenue = clinicDailyTrends.newRevenue.reduce((sum, val) => sum + val, 0);
              
              const overallClinicPatients = totalClinicOldPatients + totalClinicNewPatients;
              const overallClinicRevenue = totalClinicOldRevenue + totalClinicNewRevenue;
              
              const daysCount = clinicDailyTrends.dates.length || 1; // Avoid division by zero
              
              const avgClinicTotalPatientsPerDay = (totalClinicOldPatients + totalClinicNewPatients) / daysCount;
              const avgClinicNewPatientsPerDay = totalClinicNewPatients / daysCount;
              const avgClinicTotalRevenuePerDay = (totalClinicOldRevenue + totalClinicNewRevenue) / daysCount;
              
              return (
                <>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Patients per day</span>
                    <span className="text-lg font-semibold text-slate-800">{avgClinicTotalPatientsPerDay.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-700">New patients per day</span>
                    <span className="text-lg font-semibold text-blue-700">{avgClinicNewPatientsPerDay.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-green-700">Revenue per day</span>
                    <span className="text-lg font-semibold text-green-700">₹{avgClinicTotalRevenuePerDay.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm text-emerald-700">Revenue per patient</span>
                    <span className="text-lg font-semibold text-emerald-700">₹{(overallClinicPatients > 0 ? overallClinicRevenue / overallClinicPatients : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAnalyticsDashboard;
