import React from 'react';
import { RetentionData } from '../types/analytics';

interface PatientRetentionAnalysisProps {
  retentionData: RetentionData;
}

const PatientRetentionAnalysis: React.FC<PatientRetentionAnalysisProps> = ({ retentionData }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700 rounded-bl">ML Powered</div>
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <span className="p-1.5 rounded-full bg-indigo-100 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </span>
        Patient Retention Analysis
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
          <span className="text-sm text-indigo-700">Current Retention Rate</span>
          <span className="text-lg font-semibold text-indigo-700">{retentionData.retentionRate}%</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">Predicted Return Probability</span>
          <div className="flex items-center">
            <span className="text-lg font-semibold text-blue-700">{retentionData.returnProbability}%</span>
            <span className="ml-2 text-xs text-blue-500">(±{100 - retentionData.confidenceScore}%)</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
          <span className="text-sm text-pink-700">Predicted Churn Rate</span>
          <span className="text-lg font-semibold text-pink-700">{retentionData.predictedChurn}%</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
          <span className="text-sm text-emerald-700">Average Days Between Visits</span>
          <span className="text-lg font-semibold text-emerald-700">{retentionData.averageVisitGap} days</span>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
          <span>Analysis Confidence: {retentionData.confidenceScore}%</span>
          <span className="italic">Based on Random Forest model</span>
        </div>
      </div>
    </div>
  );
};

export default PatientRetentionAnalysis;
