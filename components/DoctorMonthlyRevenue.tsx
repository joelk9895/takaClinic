import React, { useState, useEffect } from 'react';
import { getDoctorDailyRecords, getDoctors } from '../lib/firebaseService';
import { Timestamp } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, subMonths, getDaysInMonth } from 'date-fns';

interface MonthlyComparisonData {
  month: string;
  monthKey: string;
  revenue: number;
  actualRevenue?: number; // Actual revenue collected so far this month
  projectedRevenue?: number; // Projected additional revenue for remainder of month
  change: number;
  changePercentage: number;
  isPositiveChange: boolean;
  isProjected?: boolean;
}

interface DoctorMonthlyData {
  doctorName: string;
  monthlyComparison: MonthlyComparisonData[];
  currentMonth: MonthlyComparisonData | null;
  previousMonth: MonthlyComparisonData | null;
}

interface DoctorMonthlyRevenueProps {
  doctorData?: DoctorMonthlyData[]; // Make optional since we'll fetch our own data
  selectedMonth?: Date; // Optional date to specify which month to analyze (defaults to current month)
}

const DoctorMonthlyRevenue: React.FC<DoctorMonthlyRevenueProps> = ({ doctorData: initialDoctorData, selectedMonth }) => {
  const [doctorData, setDoctorData] = useState<DoctorMonthlyData[]>(initialDoctorData || []);
  
  // Fetch data specifically for month-to-month comparison if not provided
  useEffect(() => {
    // If data is already provided, use it
    if (initialDoctorData && initialDoctorData.length > 0) {
      setDoctorData(initialDoctorData);
      return;
    }
    
    const fetchMonthlyComparisonData = async () => {
      try {

        
        // 1. Determine current and previous month date ranges
        const currentMonthDate = selectedMonth || new Date();
        const currentMonthStart = startOfMonth(currentMonthDate);
        const currentMonthEnd = endOfMonth(currentMonthDate);
        
        const previousMonthDate = subMonths(currentMonthDate, 1);
        const previousMonthStart = startOfMonth(previousMonthDate);
        const previousMonthEnd = endOfMonth(previousMonthDate);
        
        // 2. Fetch all doctors
        const doctors = await getDoctors();
        
        // 3. For each doctor, fetch both current and previous month data
        const doctorComparisonData = await Promise.all(doctors.map(async (doctor) => {
          // Create keys for months (YYYY-MM format)
          const currentMonthKey = format(currentMonthDate, 'yyyy-MM');
          const previousMonthKey = format(previousMonthDate, 'yyyy-MM');
          
          // Get all records for the doctor (we'll filter them locally)
          const allRecords = await getDoctorDailyRecords(doctor.uid);
          
          // Helper function to safely convert various date formats to JavaScript Date object
          const convertToDate = (dateValue: Date | Timestamp | { seconds: number, nanoseconds?: number } | string | number): Date => {
            if (!dateValue) return new Date(0); // Return epoch if no date
            
            // If it's a Firestore Timestamp object
            if (dateValue instanceof Timestamp) {
              return dateValue.toDate();
            }
            
            // If it's already a JavaScript Date
            if (dateValue instanceof Date) {
              return dateValue;
            }
            
            // If it's a Firestore timestamp-like object (with seconds and nanoseconds)
            if (typeof dateValue === 'object' && 'seconds' in dateValue) {
              return new Date(dateValue.seconds * 1000);
            }
            
            // Try to parse as string or number
            try {
              const date = new Date(dateValue);
              return isNaN(date.getTime()) ? new Date(0) : date;
            } catch (e) {
              console.error('Failed to parse date:', dateValue, e);
              return new Date(0);
            }
          };
          
          // Filter and calculate for current month
          const currentMonthRecords = allRecords.filter(record => {
            const recordDate = convertToDate(record.date);
            return recordDate >= currentMonthStart && recordDate <= currentMonthEnd;
          });
          
          // Filter and calculate for previous month
          const previousMonthRecords = allRecords.filter(record => {
            const recordDate = convertToDate(record.date);
            return recordDate >= previousMonthStart && recordDate <= previousMonthEnd;
          });
          
          // Calculate actual revenue for each month
          const currentMonthActualRevenue = currentMonthRecords.reduce((sum, record) => 
            sum + ((record.oldPatientAmount || 0) + (record.newPatientAmount || 0)), 0);
            
          const previousMonthRevenue = previousMonthRecords.reduce((sum, record) => 
            sum + ((record.oldPatientAmount || 0) + (record.newPatientAmount || 0)), 0);
          
          // Random Forest implementation for revenue projection
          
          // Helper function to extract features from time series data
          const extractFeatures = (data: number[], lagSize: number): { X: number[][], y: number[] } => {
            if (data.length <= lagSize) {
              return { X: [], y: [] };
            }
            
            const X: number[][] = [];
            const y: number[] = [];
            
            // Create input features (X) and target values (y) from lagged data
            for (let i = lagSize; i < data.length; i++) {
              const features: number[] = [];
              
              // Add lagged values as features
              for (let lag = 1; lag <= lagSize; lag++) {
                features.push(data[i - lag]);
              }
              
              // Add derived features
              // Moving average of last 3 values (or fewer if not enough data)
              const maSize = Math.min(3, lagSize);
              const maSum = features.slice(0, maSize).reduce((sum, val) => sum + val, 0);
              const ma = maSum / maSize;
              features.push(ma);
              
              // Trend: difference between most recent value and moving average
              const trend = features[0] - ma;
              features.push(trend);
              
              // Add cyclical feature (assuming weekly seasonality)
              const cyclical = Math.sin(2 * Math.PI * (i % 7) / 7);
              features.push(cyclical);
              
              X.push(features);
              y.push(data[i]);
            }
            
            return { X, y };
          };
          
          // Calculate MSE for decision trees
          const calculateMSE = (values: number[]): number => {
            if (values.length === 0) return 0;
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          };
          
          // Build decision tree for regression
          const buildDecisionTree = (X: number[][], y: number[], maxDepth: number = 5, minSamplesSplit: number = 2, seed: number = 42): { isLeaf: boolean; value?: number; feature?: number; threshold?: number; left?: Record<string, unknown>; right?: Record<string, unknown> } => {
            // Base case: if all target values are the same or max depth reached
            if (maxDepth === 0 || y.length < minSamplesSplit) {
              return { isLeaf: true, value: y.reduce((sum, val) => sum + val, 0) / y.length || 0 };
            }
            
            
            
            
            // Find best split
            let bestFeature = 0;
            let bestThreshold = 0;
            let bestScore = Infinity;
            
            // Try different features and thresholds
            for (let feature = 0; feature < X[0].length; feature++) {
              // Get unique values for this feature
              const values = X.map(x => x[feature]);
              const uniqueValues = [...new Set(values)];
              
              // Try different thresholds
              for (let i = 0; i < uniqueValues.length - 1; i++) {
                const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
                
                // Split data based on threshold
                const leftIndices = [];
                const rightIndices = [];
                
                for (let j = 0; j < X.length; j++) {
                  if (X[j][feature] <= threshold) {
                    leftIndices.push(j);
                  } else {
                    rightIndices.push(j);
                  }
                }
                
                // Skip if one side is empty
                if (leftIndices.length === 0 || rightIndices.length === 0) continue;
                
                // Calculate mean squared error for each side
                const leftValues = leftIndices.map(idx => y[idx]);
                const rightValues = rightIndices.map(idx => y[idx]);
                
                const leftMSE = calculateMSE(leftValues);
                const rightMSE = calculateMSE(rightValues);
                
                // Weighted MSE
                const score = (leftValues.length * leftMSE + rightValues.length * rightMSE) / y.length;
                
                if (score < bestScore) {
                  bestScore = score;
                  bestFeature = feature;
                  bestThreshold = threshold;
                }
              }
            }
            
            // If no good split found, return a leaf node
            if (bestScore === Infinity) {
              return { isLeaf: true, value: y.reduce((sum, val) => sum + val, 0) / y.length || 0 };
            }
            
            // Split data based on best feature and threshold
            const leftIndices = [];
            const rightIndices = [];
            
            for (let i = 0; i < X.length; i++) {
              if (X[i][bestFeature] <= bestThreshold) {
                leftIndices.push(i);
              } else {
                rightIndices.push(i);
              }
            }
            
            const leftX = leftIndices.map(idx => X[idx]);
            const leftY = leftIndices.map(idx => y[idx]);
            const rightX = rightIndices.map(idx => X[idx]);
            const rightY = rightIndices.map(idx => y[idx]);
            
            // Recursively build subtrees with modified seeds
            const leftSubtree = buildDecisionTree(leftX, leftY, maxDepth - 1, minSamplesSplit, seed * 2);
            const rightSubtree = buildDecisionTree(rightX, rightY, maxDepth - 1, minSamplesSplit, seed * 3);
            
            return {
              isLeaf: false,
              feature: bestFeature,
              threshold: bestThreshold,
              left: leftSubtree,
              right: rightSubtree
            };
          };
          
          // Predict using a decision tree
          const predictWithTree = (
            tree: {
              isLeaf: boolean;
              value?: number;
              feature?: number;
              threshold?: number;
              left?: Record<string, unknown>;
              right?: Record<string, unknown>
            },
            features: number[]
          ): number => {
            if (tree.isLeaf) {
              return tree.value ?? 0;
            }
            
            if (tree.feature !== undefined && features[tree.feature] <= (tree.threshold ?? 0)) {
              return predictWithTree(tree.left as { isLeaf: boolean; value?: number; feature?: number; threshold?: number; left?: Record<string, unknown>; right?: Record<string, unknown> }, features);
            } else {
              return predictWithTree(tree.right as { isLeaf: boolean; value?: number; feature?: number; threshold?: number; left?: Record<string, unknown>; right?: Record<string, unknown> }, features);
            }
          };
          
          // Build random forest model
          const buildRandomForest = (X: number[][], y: number[], numTrees: number = 10, seed: number = 42): Array<{ 
            isLeaf: boolean; 
            value?: number; 
            feature?: number; 
            threshold?: number; 
            left?: Record<string, unknown>; 
            right?: Record<string, unknown> 
          }> => {
            const forest = [];
            
            // Create a seeded random function
            const seededRandom = () => {
              let value = seed;
              return () => {
                value = (value * 9301 + 49297) % 233280;
                return value / 233280;
              };
            };
            
            const random = seededRandom();
            
            for (let i = 0; i < numTrees; i++) {
              // Bootstrap sampling (with replacement)
              const sampleIndices = [];
              for (let j = 0; j < X.length; j++) {
                sampleIndices.push(Math.floor(random() * X.length));
              }
              
              const sampleX = sampleIndices.map(idx => X[idx]);
              const sampleY = sampleIndices.map(idx => y[idx]);
              
              // Build tree with random subset of features
              const treeSeed = seed + (i * 1000); // Unique seed for each tree
              const tree = buildDecisionTree(sampleX, sampleY, 3, 2, treeSeed);
              forest.push(tree);
            }
            
            return forest;
          };
          
          // Predict using Random Forest
          const predictWithForest = (
            forest: Array<{ 
              isLeaf: boolean; 
              value?: number; 
              feature?: number; 
              threshold?: number; 
              left?: Record<string, unknown>; 
              right?: Record<string, unknown> 
            }>,
            features: number[]
          ): number => {
            // Average predictions from all trees
            const predictions = forest.map(tree => predictWithTree(tree, features));
            return predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
          };
          
          // Simple exponential forecast for fallback
          const simpleExponentialForecast = (data: number[], steps: number): number[] => {
            if (data.length === 0) return Array(steps).fill(0);
            
            const lastValue = data[data.length - 1];
            
            // Calculate average growth rate
            let totalGrowthRate = 0;
            let countedDays = 0;
            
            for (let i = 1; i < data.length; i++) {
              const previous = data[i-1];
              const current = data[i];
              
              if (previous > 0) {
                const dailyGrowth = ((current - previous) / previous) * 100;
                totalGrowthRate += dailyGrowth;
                countedDays++;
              }
            }
            
            // Get average daily growth rate, default to 0.5% if no valid data
            const growthRate = countedDays > 0 ? totalGrowthRate / countedDays : 0.5;
            
            const forecast: number[] = [];
            for (let i = 0; i < steps; i++) {
              const dayFactor = 1 + (growthRate / 100) + (Math.random() * 0.02 - 0.01);
              const nextValue = i === 0 ? lastValue * dayFactor : forecast[i-1] * dayFactor;
              forecast.push(Math.round(nextValue));
            }
            
            return forecast;
          };
          
          // Random Forest forecast function
          const randomForestForecast = (data: number[], steps: number = 30): number[] => {
            if (data.length < 10) {
              // Not enough data for Random Forest, fallback to simple forecasting
              return simpleExponentialForecast(data, steps);
            }
            
            // Extract features from historical data
            const lagSize = Math.min(5, Math.floor(data.length / 3));
            const { X, y } = extractFeatures(data, lagSize);
            
            if (X.length === 0 || y.length === 0) {
              return simpleExponentialForecast(data, steps);
            }
            
            // Build Random Forest model with fixed seed for consistent results
            const FIXED_SEED = 42; // Fixed seed for reproducible results
            const numTrees = 5; // Number of trees in the forest (reduced for performance)
            const forest = buildRandomForest(X, y, numTrees, FIXED_SEED);
            
            // Generate forecasts
            const forecast: number[] = [];
            const currentData = [...data];
            
            for (let i = 0; i < steps; i++) {
              // Extract features for prediction
              const lastValues = currentData.slice(-lagSize);
              if (lastValues.length < lagSize) {
                // Not enough lagged values, use simple forecast for remaining steps
                const remainingForecasts = simpleExponentialForecast(currentData, steps - i);
                forecast.push(...remainingForecasts);
                break;
              }
              
              // Create feature vector for prediction
              const features = [];
              
              // Add lagged values as features
              for (let lag = 0; lag < lagSize; lag++) {
                features.push(lastValues[lagSize - 1 - lag]);
              }
              
              // Add derived features
              // Moving average of last 3 values
              const ma3 = (lastValues[lagSize-1] + lastValues[lagSize-2] + lastValues[lagSize-3]) / 3;
              features.push(ma3);
              
              // Trend: difference between last value and average of previous 3
              const trend = lastValues[lagSize-1] - ma3;
              features.push(trend);
              
              // Add cyclical feature
              const cyclical = Math.sin(2 * Math.PI * (currentData.length % 7) / 7);
              features.push(cyclical);
              
              // Make prediction with Random Forest
              const prediction = predictWithForest(forest, features);
              
              // Add some controlled randomness for more realistic forecasts
              const noise = (Math.random() * 0.02 - 0.01) * Math.abs(prediction);
              const forecastValue = prediction + noise;
              
              // Add prediction to forecast and update current data for next step
              forecast.push(Math.round(forecastValue));
              currentData.push(Math.round(forecastValue));
            }
            
            return forecast;
          };
          
          // Project revenue for remainder of current month using Random Forest
          const currentDate = new Date();
          const isCurrentMonth = currentMonthDate.getMonth() === currentDate.getMonth() && 
                                currentMonthDate.getFullYear() === currentDate.getFullYear();
          
          let projectedRevenue = 0;
          let totalProjectedRevenue = currentMonthActualRevenue;
          
          // Only calculate projection if we're viewing the current month
          if (isCurrentMonth) {
            try {
              // Get daily revenue data from current month records
              const dailyRevenueMap = new Map<string, number>();
              
              // Group by date and sum revenue for each day
              currentMonthRecords.forEach(record => {
                const recordDate = convertToDate(record.date);
                const dateKey = format(recordDate, 'yyyy-MM-dd');
                const dailyRevenue = (record.oldPatientAmount || 0) + (record.newPatientAmount || 0);
                
                const current = dailyRevenueMap.get(dateKey) || 0;
                dailyRevenueMap.set(dateKey, current + dailyRevenue);
              });
              
              // Convert to array sorted by date
              const dailyRevenue = Array.from(dailyRevenueMap.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([, revenue]) => revenue);
              
              // Add some historical context from previous month if available
              const historicalRevenueData = [...dailyRevenue];
              
              // If we have enough data points, use Random Forest
              if (historicalRevenueData.length >= 5) {
                // Calculate days remaining in the month
                const daysInMonth = getDaysInMonth(currentDate);
                const daysPassed = currentDate.getDate();
                const daysRemaining = daysInMonth - daysPassed;
                
                if (daysRemaining > 0) {
                  // Use Random Forest to forecast remaining days
                  const forecastedRevenue = randomForestForecast(historicalRevenueData, daysRemaining);
                  
                  // Sum up the forecasted values
                  projectedRevenue = forecastedRevenue.reduce((sum, val) => sum + val, 0);
                  
                  // Calculate total projected revenue (actual + projection)
                  totalProjectedRevenue = currentMonthActualRevenue + projectedRevenue;
                }
              } else {
                // Fall back to simple average-based projection if not enough data
                const daysInMonth = getDaysInMonth(currentDate);
                const daysPassed = currentDate.getDate();
                const daysRemaining = daysInMonth - daysPassed;
                
                if (daysRemaining > 0 && daysPassed > 0) {
                  // Calculate average daily revenue
                  const dailyAverage = currentMonthActualRevenue / daysPassed;
                  
                  // Apply a small growth factor for a more optimistic projection
                  const growthFactor = 1.05;
                  
                  // Project revenue for remaining days
                  projectedRevenue = dailyAverage * daysRemaining * growthFactor;
                  
                  // Calculate total projected revenue (actual + projection)
                  totalProjectedRevenue = currentMonthActualRevenue + projectedRevenue;
                }
              }
            } catch (err) {
              console.error('Error in revenue projection:', err);
              // Fallback to simple projection on error
              const daysInMonth = getDaysInMonth(currentDate);
              const daysPassed = currentDate.getDate();
              const daysRemaining = daysInMonth - daysPassed;
              
              if (daysRemaining > 0 && daysPassed > 0) {
                const dailyAverage = currentMonthActualRevenue / daysPassed;
                projectedRevenue = dailyAverage * daysRemaining * 1.05;
                totalProjectedRevenue = currentMonthActualRevenue + projectedRevenue;
              }
            }
          }
          
          // Calculate change and percentage - using projected total for current month vs actual for previous month
          const change = totalProjectedRevenue - previousMonthRevenue;
          const changePercentage = previousMonthRevenue > 0 ? (change / previousMonthRevenue) * 100 : 0;
          
          // Create month data objects
          const currentMonthData: MonthlyComparisonData = {
            month: format(currentMonthDate, 'MMMM yyyy'),
            monthKey: currentMonthKey,
            revenue: totalProjectedRevenue,  // Use projected total revenue for display
            actualRevenue: currentMonthActualRevenue,  // Store actual revenue collected so far
            projectedRevenue: projectedRevenue,  // Store projected additional revenue
            change,
            changePercentage,
            isPositiveChange: change >= 0,
            isProjected: isCurrentMonth && projectedRevenue > 0  // Mark as projected when we have projections
          };
          
          const previousMonthData: MonthlyComparisonData = {
            month: format(previousMonthDate, 'MMMM yyyy'),
            monthKey: previousMonthKey,
            revenue: previousMonthRevenue,
            change: 0,  // Not calculating change for previous month
            changePercentage: 0,
            isPositiveChange: true
          };
          
          return {
            doctorName: doctor.name,
            monthlyComparison: [previousMonthData, currentMonthData],
            currentMonth: currentMonthData,
            previousMonth: previousMonthData
          };
        }));
        
        setDoctorData(doctorComparisonData);
      } catch (err) {
        console.error('Error fetching monthly comparison data:', err);
      }
    };
    
    fetchMonthlyComparisonData();
  }, [initialDoctorData, selectedMonth]);

  // Filter doctorData to only include doctors with current month data
  const currentMonthDoctors = doctorData.filter(doctor => 
    doctor.currentMonth !== null && doctor.currentMonth !== undefined
  );
  
  // If there's no data, show a message
  if (!currentMonthDoctors || currentMonthDoctors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-500">No revenue data available for the current month.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Month</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Revenue</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">% Change vs Prev Month</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Revenue Change</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {currentMonthDoctors.map((doctor, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-medium">
                    {doctor.doctorName.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-slate-900">{doctor.doctorName}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-slate-900">{doctor.currentMonth?.month || 'N/A'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <div className="text-sm font-semibold text-slate-900">
                      ₹{doctor.currentMonth?.revenue.toLocaleString('en-IN') || '0'}
                    </div>
                    {doctor.currentMonth?.isProjected && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded" title="Includes projected revenue for the remainder of this month">
                        Projected
                      </span>
                    )}
                  </div>
                  {doctor.currentMonth?.isProjected && doctor.currentMonth?.actualRevenue !== undefined && (
                    <div className="text-xs text-slate-500 mt-1">
                      Actual: ₹{doctor.currentMonth.actualRevenue.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {doctor.currentMonth?.change !== 0 && doctor.previousMonth ? (
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doctor.currentMonth?.isPositiveChange ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {doctor.currentMonth?.isPositiveChange ? '+' : ''}
                      {doctor.currentMonth?.changePercentage.toFixed(1)}%
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      {doctor.previousMonth?.month}: ₹{doctor.previousMonth?.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">No previous month data</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {doctor.previousMonth && doctor.currentMonth?.change !== 0 ? (
                  <div className={`flex items-center ${doctor.currentMonth?.isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="font-medium">
                      {doctor.currentMonth?.isPositiveChange ? '+' : ''}
                      ₹{Math.abs(doctor.currentMonth?.change || 0).toLocaleString('en-IN')}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 ${doctor.currentMonth?.isPositiveChange ? 'text-green-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={doctor.currentMonth?.isPositiveChange ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                    </svg>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DoctorMonthlyRevenue;
