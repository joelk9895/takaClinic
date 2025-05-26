// Analytics types used by the ML-powered patient analytics components

export interface DailyTrends {
  dates: string[];
  oldPatients: number[];
  newPatients: number[];
  oldRevenue: number[];
  newRevenue: number[];
  totalRevenue: number[];
}

// Types for retention analysis
export interface RetentionData {
  retentionRate: number;
  returnProbability: number;
  averageVisitGap: number;
  predictedChurn: number;
  confidenceScore: number;
}

// Types for visit frequency analysis
export interface FrequencyData {
  peakDays: string[];
  slowestDays: string[];
  idealCapacity: number;
  visitFrequencyDistribution: number[];
  confidenceScore: number;
}

// Types for patient growth forecast
export interface GrowthForecastData {
  growthRate: number;
  estimatedMonthlyGrowth: number;
  estimatedAnnualPatients: number;
}

// Combined analytics data for the patient analytics dashboard
export interface PatientAnalyticsData {
  retentionData: RetentionData;
  frequencyData: FrequencyData;
  growthForecastData: GrowthForecastData;
}
