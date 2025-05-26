import React from 'react';
import { Pie } from 'react-chartjs-2';

interface Doctor {
  name: string;
}

interface DailyTrends {
  dates: string[];
  oldPatients: number[];
  newPatients: number[];
  oldRevenue: number[];
  newRevenue: number[];
}

interface DoctorStatsItem {
  doctor: Doctor;
  dailyTrends: DailyTrends;
  allRecordsTrends?: DailyTrends; // Complete historical data for predictions
  totalExpenses?: number;
  projectedMonthlyProfit?: number;
  profitChangePercentageVsProjection?: number;
}

interface DoctorStatsProps {
  doctorStats: DoctorStatsItem[];
}

const DoctorStats: React.FC<DoctorStatsProps> = ({ doctorStats }) => {
  // Return early if no data
  if (!doctorStats || doctorStats.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Doctor Performance</h3>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-slate-500">No doctor data available</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Process data for each doctor
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Doctor Performance</h3>
      
      <div className="space-y-6">
        {doctorStats.map((doctorStat, index) => {
          // Calculate total revenues and patients for this doctor
          const totalDoctorOldPatients = doctorStat.dailyTrends.oldPatients.reduce((sum, val) => sum + val, 0);
          const totalDoctorNewPatients = doctorStat.dailyTrends.newPatients.reduce((sum, val) => sum + val, 0);
          const totalDoctorOldRevenue = doctorStat.dailyTrends.oldRevenue.reduce((sum, val) => sum + val, 0);
          const totalDoctorNewRevenue = doctorStat.dailyTrends.newRevenue.reduce((sum, val) => sum + val, 0);
          
          const totalDoctorPatients = totalDoctorOldPatients + totalDoctorNewPatients;
          const totalDoctorRevenue = totalDoctorOldRevenue + totalDoctorNewRevenue;
          
          // Create data for pie chart
          const patientDistributionData = {
            labels: ['Returning Patients', 'New Patients'],
            datasets: [
              {
                data: [totalDoctorOldPatients, totalDoctorNewPatients],
                backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(79, 70, 229, 0.7)'],
                borderColor: ['rgba(59, 130, 246, 1)', 'rgba(79, 70, 229, 1)'],
                borderWidth: 1,
              },
            ],
          };
          
          return (
            <div key={index} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/3">
                  <h4 className="text-md font-semibold text-slate-800 mb-2">{doctorStat.doctor.name}</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Total Patients</span>
                      <span className="text-sm font-semibold text-slate-800">{totalDoctorPatients}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Total Revenue</span>
                      <span className="text-sm font-semibold text-slate-800">u20b9{totalDoctorRevenue.toLocaleString('en-IN')}</span>
                    </div>
                    {doctorStat.totalExpenses && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Expenses</span>
                        <span className="text-sm font-semibold text-slate-800">u20b9{doctorStat.totalExpenses.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {doctorStat.projectedMonthlyProfit && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Projected Profit</span>
                        <span className="text-sm font-semibold text-slate-800">u20b9{doctorStat.projectedMonthlyProfit.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {doctorStat.profitChangePercentageVsProjection && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">vs Projection</span>
                        <span className={`text-sm font-semibold ${doctorStat.profitChangePercentageVsProjection >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {doctorStat.profitChangePercentageVsProjection >= 0 ? '+' : ''}{doctorStat.profitChangePercentageVsProjection}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:w-2/3 h-40">
                  <Pie
                    data={patientDistributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            usePointStyle: true,
                            padding: 10,
                            font: {
                              size: 11
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DoctorStats;
