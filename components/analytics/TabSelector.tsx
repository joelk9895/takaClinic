import React from 'react';

type TabType = 'overview' | 'patients' | 'revenue' | 'projections' | 'annual';

interface TabSelectorProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="mb-6">
      <div className="bg-slate-100 p-1 rounded-lg inline-flex space-x-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'patients' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Patients
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'revenue' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Revenue
        </button>
        <button
          onClick={() => setActiveTab('projections')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'projections' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Projections
        </button>
        <button
          onClick={() => setActiveTab('annual')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'annual' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Annual Trends
        </button>
      </div>
    </div>
  );
};

export default TabSelector;
