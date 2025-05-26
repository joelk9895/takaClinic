import React from 'react';
import { FrequencyData } from '../types/analytics';

interface VisitFrequencyAnalysisProps {
  frequencyData: FrequencyData;
}

const VisitFrequencyAnalysis: React.FC<VisitFrequencyAnalysisProps> = ({ frequencyData }) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700 rounded-bl">ML Powered</div>
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <span className="p-1.5 rounded-full bg-violet-100 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </span>
        Visit Frequency Patterns
      </h3>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {frequencyData.peakDays.map((day, idx) => (
            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              {day}
            </span>
          ))}
          <span className="text-xs text-slate-500 self-center">Peak Days</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {frequencyData.slowestDays.map((day, idx) => (
            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {day}
            </span>
          ))}
          <span className="text-xs text-slate-500 self-center">Slowest Days</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <span className="text-sm text-purple-700">Ideal Daily Capacity</span>
          <span className="text-lg font-semibold text-purple-700">{frequencyData.idealCapacity} patients</span>
        </div>
        
        <div className="pt-2">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Visit Distribution by Day</h4>
          <div className="flex items-center space-x-1">
            {frequencyData.visitFrequencyDistribution.map((percentage, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div 
                  className={`w-8 ${percentage > 15 ? 'bg-blue-500' : 'bg-blue-300'} rounded-t-sm`} 
                  style={{ height: `${Math.max(percentage, 5)}px` }}
                ></div>
                <span className="text-xs text-slate-500">{dayNames[idx].substring(0, 1)}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
          <span>Analysis Confidence: {frequencyData.confidenceScore}%</span>
          <span className="italic">Based on historical patterns</span>
        </div>
      </div>
    </div>
  );
};

export default VisitFrequencyAnalysis;
