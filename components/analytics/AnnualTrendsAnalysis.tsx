import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DoctorData {
  name: string;
  data: number[];
  color: string;
}

interface YearlyData {
  year: number;
  months: string[];
  revenues: DoctorData[];
  patients: DoctorData[];
  totalRevenue: number[];
  totalPatients: number[];
}

interface AnnualTrendsAnalysisProps {
  doctorStats: {
    doctor: { name: string };
    dailyTrends: {
      dates: string[];
      oldPatients: number[];
      newPatients: number[];
      oldRevenue: number[];
      newRevenue: number[];
    };
    allRecordsTrends?: {
      dates: string[];
      oldPatients: number[];
      newPatients: number[];
      oldRevenue: number[];
      newRevenue: number[];
    };
  }[];
}

const AnnualTrendsAnalysis: React.FC<AnnualTrendsAnalysisProps> = () => {
  // Helper function to safely convert Firebase Timestamp to Date
  const timestampToDate = (timestamp: string | Date | Timestamp | undefined): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string') return new Date(timestamp);
    if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return new Date();
  };

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearlyDatasets, setYearlyDatasets] = useState<YearlyData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [dataType, setDataType] = useState<'revenue' | 'patients'>('revenue');
  const [historicalData, setHistoricalData] = useState<MonthlyAggregation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Colors for different doctors
  const colorPalette = React.useMemo(() => [
    'rgba(75, 192, 192, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(255, 205, 86, 0.8)',
    'rgba(201, 203, 207, 0.8)',
    'rgba(94, 234, 212, 0.8)',
  ], []);

  // Interface for monthly aggregated data
  // Interface for data structure as it's used in the component
  interface MonthlyAggregation {
    // Required fields based on actual usage
    id?: string;
    date: string; // Simplified to just string for consistency
    doctorName: string;
    year?: number;
    month?: number;
    
    // Data fields
    oldRevenue: number;
    newRevenue: number;
    oldPatients: number;
    newPatients: number;
    totalRevenue?: number;
    totalPatients?: number;
    
    // Optional fields for aggregated data
    doctors?: {
      [doctorName: string]: {
        oldPatientCount: number;
        newPatientCount: number;
        oldPatientAmount: number;
        newPatientAmount: number;
        totalRevenue: number;
        totalPatients: number;
      }
    };
    clinicTotals?: {
      oldPatientCount: number;
      newPatientCount: number;
      oldPatientAmount: number;
      newPatientAmount: number;
      totalRevenue: number;
      totalPatients: number;
    };
    lastUpdated?: Date | Timestamp;
  }
  
  // Function to check if monthly aggregation exists and is up-to-date

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching raw daily records for annual trends...');
        
        // Direct approach - just fetch all daily records
        const dailyRecordsRef = collection(db, 'dailyRecords');
        
        // Log collection reference
        console.log('Collection path:', dailyRecordsRef.path);
        
        const q = query(dailyRecordsRef, orderBy('date', 'asc'));
        console.log('Executing query...');
        
        const querySnapshot = await getDocs(q);
        console.log(`Query returned ${querySnapshot.docs.length} documents`);
        
        // Debug first document if available
        if (querySnapshot.docs.length > 0) {
          const firstDoc = querySnapshot.docs[0].data();
          console.log('First document structure:', JSON.stringify(firstDoc, null, 2));
        } else {
          console.log('No documents returned from query');
        }
        
        // Process raw records and group by month
        const rawData = querySnapshot.docs.map(doc => {
          const docData = doc.data();
          
          // Determine the date format
          let dateStr = '';
          if (docData.date instanceof Timestamp) {
            dateStr = docData.date.toDate().toISOString().split('T')[0];
            console.log('Converted Timestamp to:', dateStr);
          } else {
            dateStr = String(docData.date);
            console.log('Using string date:', dateStr);
          }
          
          // Log the field values for debugging
          console.log(`Processing record: ${doc.id}`);
          console.log(` - Date: ${dateStr}`);
          console.log(` - Doctor: ${docData.doctorName}`);
          console.log(` - oldPatientCount: ${docData.oldPatientCount}`);
          console.log(` - newPatientCount: ${docData.newPatientCount}`);
          console.log(` - oldPatientAmount: ${docData.oldPatientAmount}`);
          console.log(` - newPatientAmount: ${docData.newPatientAmount}`);
          
          return {
            id: doc.id,
            date: dateStr,
            doctorName: docData.doctorName || 'Unknown Doctor',
            oldPatients: Number(docData.oldPatientCount) || 0,
            newPatients: Number(docData.newPatientCount) || 0,
            oldRevenue: Number(docData.oldPatientAmount) || 0,
            newRevenue: Number(docData.newPatientAmount) || 0,
            // Calculate totals for convenience
            totalPatients: (Number(docData.oldPatientCount) || 0) + (Number(docData.newPatientCount) || 0),
            totalRevenue: (Number(docData.oldPatientAmount) || 0) + (Number(docData.newPatientAmount) || 0)
          };
        });
        
        console.log(`Processed ${rawData.length} records`);
        
        // Generate monthly data from raw records
        const monthlyData: {
          id: string;
          date: string;
          year?: number;
          month?: number;
          doctorName: string;
          oldPatients: number;
          newPatients: number;
          oldRevenue: number;
          newRevenue: number;
          totalPatients?: number;
          totalRevenue?: number;
        }[] = [];
        
        // Group records by year-month-doctor
        const recordsByMonth: Record<string, Record<string, {
          id: string;
          date: string;
          doctorName: string;
          oldPatients: number;
          newPatients: number;
          oldRevenue: number;
          newRevenue: number;
          totalPatients: number;
          totalRevenue: number;
        }[]>> = {};
        
        rawData.forEach(record => {
          // Extract year and month from date
          const [year, month] = record.date.split('-');
          const monthKey = `${year}-${month}`;
          
          // Initialize month and doctor entries if needed
          if (!recordsByMonth[monthKey]) {
            recordsByMonth[monthKey] = {};
          }
          
          if (!recordsByMonth[monthKey][record.doctorName]) {
            recordsByMonth[monthKey][record.doctorName] = [];
          }
          
          // Add record to appropriate group
          recordsByMonth[monthKey][record.doctorName].push(record);
        });
        
        // Process each month's data
        Object.entries(recordsByMonth).forEach(([monthKey, doctorRecords]) => {
          const [year, month] = monthKey.split('-');
          
          // For each doctor in this month
          Object.entries(doctorRecords).forEach(([doctorName, records]) => {
            // Aggregate the doctor's monthly data
            const oldPatients = records.reduce((sum, r) => sum + r.oldPatients, 0);
            const newPatients = records.reduce((sum, r) => sum + r.newPatients, 0);
            const oldRevenue = records.reduce((sum, r) => sum + r.oldRevenue, 0);
            const newRevenue = records.reduce((sum, r) => sum + r.newRevenue, 0);
            
            // Create a monthly record
            monthlyData.push({
              id: `${monthKey}-${doctorName}`,
              date: `${year}-${month}-15`, // Use middle of month for representation
              doctorName,
              oldPatients,
              newPatients,
              oldRevenue,
              newRevenue
            });
          });
        });
        
        console.log(`Generated ${monthlyData.length} monthly aggregated records`);
        
        // Update state with the monthly data
        // Process each monthly data item to ensure it has year and month properties
        const processedMonthlyData = monthlyData.map(item => {
          // Make sure year and month are properly extracted from date
          const dateParts = item.date.split('-');
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10);
          
          console.log(`Processing monthly data item: ${item.id}`, {
            date: item.date,
            extractedYear: year,
            extractedMonth: month,
            doctorName: item.doctorName,
            oldRevenue: item.oldRevenue,
            newRevenue: item.newRevenue
          });
          
          return {
            ...item,
            year: year,
            month: month,
            totalRevenue: item.oldRevenue + item.newRevenue,
            totalPatients: item.oldPatients + item.newPatients
          };
        });
        
        console.log('Processed monthly data:', processedMonthlyData.slice(0, 2));
        setHistoricalData(processedMonthlyData);
      } catch (error) {
        console.error('Error fetching historical data:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        alert(`Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setHistoricalData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, []);
  
  // Process the historical data
  useEffect(() => {
    if (!historicalData || historicalData.length === 0) {
      console.log('No historical data available for processing');
      return;
    }

    console.log('Processing historical data:', historicalData.slice(0, 3));
    
    // Extract all available years from the data using the year property we ensured exists
    const years = [...new Set(historicalData.map(item => item.year || 0).filter(year => year > 0))];
    
    if (years.length === 0) {
      // Fallback to extracting from date strings if no year properties exist
      console.log('No year properties found, extracting from dates');
      const dateYears = [...new Set(historicalData.map(item => {
        const date = typeof item.date === 'string' ? new Date(item.date) : timestampToDate(item.date);
        const year = date.getFullYear();
        console.log(`Extracted year ${year} from date ${item.date}`);
        return year;
      }))];
      years.push(...dateYears);
    }
    
    years.sort((a, b) => b - a); // Sort in descending order (most recent first)
    console.log('Available years:', years);
    setAvailableYears(years);
    
    // If no year is selected yet, select the most recent one
    if ((!selectedYear || years.indexOf(selectedYear) === -1) && years.length > 0) {
      console.log(`Setting selected year to ${years[0]}`);
      setSelectedYear(years[0]);
    }

    // Process data for each year
    const yearlyData: YearlyData[] = years.map(year => {
      // Get all data entries for this year
      const yearData = historicalData.filter(item => timestampToDate(item.date).getFullYear() === year);
      
      // Create array for all 12 months (0-indexed in JS Date)
      const monthlyData: { [month: number]: { [doctor: string]: { revenue: number, patients: number } } } = {};
      
      // Initialize all months
      for (let i = 0; i < 12; i++) {
        monthlyData[i] = {};
      }
      
      // Group data by month and doctor
      yearData.forEach(entry => {
        const month = timestampToDate(entry.date).getMonth();
        const doctor = entry.doctorName;
        
        if (!monthlyData[month][doctor]) {
          monthlyData[month][doctor] = { revenue: 0, patients: 0 };
        }
        
        // Make sure we're working with numbers when adding up revenue
        const oldRev = typeof entry.oldRevenue === 'number' ? entry.oldRevenue : parseFloat(entry.oldRevenue) || 0;
        const newRev = typeof entry.newRevenue === 'number' ? entry.newRevenue : parseFloat(entry.newRevenue) || 0;
        
        // Log revenue values for debugging
        console.log(`Adding revenue for ${doctor} on month ${month+1}: old=${oldRev}, new=${newRev}`);
        
        monthlyData[month][doctor].revenue += (oldRev + newRev);
        monthlyData[month][doctor].patients += entry.oldPatients + entry.newPatients;
      });
      
      // Get unique doctors in this year's data
      const doctors = [...new Set(yearData.map(item => item.doctorName))];
      
      // Create datasets for each doctor
      const revenueDatasets: DoctorData[] = doctors.map((doctor, index) => {
        const monthlyRevenues = Array(12).fill(0);
        
        // Fill in the data we have
        for (let month = 0; month < 12; month++) {
          if (monthlyData[month][doctor]) {
            monthlyRevenues[month] = monthlyData[month][doctor].revenue;
          }
        }
        
        return {
          name: doctor,
          data: monthlyRevenues,
          color: colorPalette[index % colorPalette.length]
        };
      });
      
      // Create datasets for each doctor's patient count
      const patientDatasets: DoctorData[] = doctors.map((doctor, index) => {
        const monthlyPatients = Array(12).fill(0);
        
        // Fill in the data we have
        for (let month = 0; month < 12; month++) {
          if (monthlyData[month][doctor]) {
            monthlyPatients[month] = monthlyData[month][doctor].patients;
          }
        }
        
        return {
          name: doctor,
          data: monthlyPatients,
          color: colorPalette[index % colorPalette.length]
        };
      });
      
      // Calculate total revenue and patients per month
      const totalRevenue = Array(12).fill(0);
      const totalPatients = Array(12).fill(0);
      
      for (let month = 0; month < 12; month++) {
        Object.values(monthlyData[month]).forEach(data => {
          totalRevenue[month] += data.revenue;
          totalPatients[month] += data.patients;
        });
      }
      
      return {
        year,
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        revenues: revenueDatasets,
        patients: patientDatasets,
        totalRevenue,
        totalPatients
      };
    });
    
    setYearlyDatasets(yearlyData);
  }, [historicalData, selectedYear, colorPalette]);

  // Get current year's data
  const currentYearData = yearlyDatasets.find(data => data.year === selectedYear);

  // Generate chart data for the selected year and data type
  const chartData = {
    labels: currentYearData?.months || [],
    datasets: [
      // Total line (always show)
      {
        type: 'line' as const,
        label: dataType === 'revenue' ? 'Total Revenue' : 'Total Patients',
        data: dataType === 'revenue' 
          ? currentYearData?.totalRevenue || []
          : currentYearData?.totalPatients || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y'
      },
      // Individual doctor bars
      ...(dataType === 'revenue' 
        ? (currentYearData?.revenues || []).map(doctor => ({
            type: 'bar' as const,
            label: doctor.name,
            data: doctor.data,
            backgroundColor: doctor.color,
            borderColor: doctor.color.replace('0.8', '1'),
            borderWidth: 1,
            barThickness: 'flex' as const,
            yAxisID: 'y'
          }))
        : (currentYearData?.patients || []).map(doctor => ({
            type: 'bar' as const,
            label: doctor.name,
            data: doctor.data,
            backgroundColor: doctor.color,
            borderColor: doctor.color.replace('0.8', '1'),
            borderWidth: 1,
            barThickness: 'flex' as const,
            yAxisID: 'y'
          }))
      )
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          boxWidth: 10,
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: `${selectedYear} Monthly ${dataType === 'revenue' ? 'Revenue' : 'Patient'} Trends`,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'line' | 'bar'>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (dataType === 'revenue') {
                label += new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0
                }).format(context.parsed.y);
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Month',
          font: {
            weight: 'bold' as const
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: dataType === 'revenue' ? 'Revenue (₹)' : 'Patient Count',
          font: {
            weight: 'bold' as const,
          }
        },
        ticks: {
          callback: function(tickValue: string | number): string {
            if (dataType === 'revenue') {
              return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                notation: 'compact',
                compactDisplay: 'short',
                maximumFractionDigits: 1
              }).format(Number(tickValue));
            }
            return String(tickValue);
          }
        }
      }
    }
  };

  // Calculate summary statistics for the current year
  const currentYearSummary = React.useMemo(() => {
    if (!currentYearData) return null;
    
    const totalRevenueForYear = currentYearData.totalRevenue.reduce((sum, val) => sum + val, 0);
    const totalPatientsForYear = currentYearData.totalPatients.reduce((sum, val) => sum + val, 0);
    
    // Average monthly revenue
    const nonZeroMonths = currentYearData.totalRevenue.filter(rev => rev > 0).length || 1;
    const avgMonthlyRevenue = totalRevenueForYear / nonZeroMonths;
    
    // Average monthly patients
    const avgMonthlyPatients = totalPatientsForYear / nonZeroMonths;
    
    // Find peak month for revenue
    const peakRevenueMonth = currentYearData.months[
      currentYearData.totalRevenue.indexOf(Math.max(...currentYearData.totalRevenue))
    ];
    
    // Find peak month for patients
    const peakPatientsMonth = currentYearData.months[
      currentYearData.totalPatients.indexOf(Math.max(...currentYearData.totalPatients))
    ];
    
    return {
      totalRevenueForYear,
      totalPatientsForYear,
      avgMonthlyRevenue,
      avgMonthlyPatients,
      peakRevenueMonth,
      peakPatientsMonth
    };
  }, [currentYearData]);

  // If loading
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-slate-200 h-12 w-12 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-32"></div>
        </div>
        <p className="text-slate-500 mt-4">Fetching historical data...</p>
      </div>
    );
  }
  
  // If no data available
  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-slate-600">No historical data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-xl font-semibold text-slate-800">Annual Trends Analysis</h2>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          {/* Year selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="form-select rounded-md border-slate-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {/* Data type selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Show:</label>
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setDataType('revenue')}
                className={`py-1.5 px-3 text-xs font-medium rounded-l-md ${dataType === 'revenue' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
              >
                Revenue
              </button>
              <button
                type="button"
                onClick={() => setDataType('patients')}
                className={`py-1.5 px-3 text-xs font-medium rounded-r-md ${dataType === 'patients' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
              >
                Patients
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Year summary stats */}
      {currentYearSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
            <div className="text-xs font-medium text-blue-700 mb-1">Total {selectedYear} Revenue</div>
            <div className="text-lg font-bold text-slate-800">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
              }).format(currentYearSummary.totalRevenueForYear)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
            <div className="text-xs font-medium text-green-700 mb-1">Total {selectedYear} Patients</div>
            <div className="text-lg font-bold text-slate-800">{currentYearSummary.totalPatientsForYear}</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-100">
            <div className="text-xs font-medium text-purple-700 mb-1">Peak Revenue Month</div>
            <div className="text-lg font-bold text-slate-800">{currentYearSummary.peakRevenueMonth}</div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-100">
            <div className="text-xs font-medium text-amber-700 mb-1">Peak Patient Month</div>
            <div className="text-lg font-bold text-slate-800">{currentYearSummary.peakPatientsMonth}</div>
          </div>
        </div>
      )}
      
      {/* Chart */}
      <div className="h-80">
        <Chart
          type='bar'
          data={chartData}
          options={chartOptions} 
        />
      </div>
    </div>
  );
};

export default AnnualTrendsAnalysis;
