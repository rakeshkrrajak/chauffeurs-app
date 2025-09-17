import React, { useMemo, useState, useCallback } from 'react';
import { CostEntry, FuelLogEntry, Vehicle, CostCategory, FuelType } from '../../types';
import { CurrencyDollarIcon, FireIcon, TagIcon, CogIcon } from '../../constants';
import { getCostForecastFromGemini } from '../../services/geminiService';

interface CostDashboardPageProps {
  costEntries: CostEntry[];
  fuelLogs: FuelLogEntry[];
  vehicles: Vehicle[];
  costCategories: CostCategory[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string; // Tailwind border color class e.g., border-emerald-500
  textColor: string; // Tailwind text color class for icon e.g., text-emerald-500
  subtext?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, textColor, subtext, isLoading = false }) => (
  <div className={`bg-gray-800 p-6 rounded-xl shadow-xl flex items-center space-x-4 border-l-4 ${color}`}>
    <div className={`shrink-0 p-2 bg-gray-700 rounded-lg ${textColor}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      {isLoading ? (
        <div className="animate-pulse h-7 w-20 bg-gray-600 rounded mt-1"></div>
      ) : (
        <p className="text-2xl font-semibold text-gray-100">{value}</p>
      )}
      {subtext && <p className="text-xs text-gray-400">{subtext}</p>} {/* Changed from text-gray-500 */}
    </div>
  </div>
);

const CostDashboardPage: React.FC<CostDashboardPageProps> = ({ costEntries, fuelLogs, vehicles, costCategories }) => {
  const [aiForecast, setAiForecast] = useState<{ forecast: string; savingsAdvice: string[] } | null>(null);
  const [isFetchingForecast, setIsFetchingForecast] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const totalFleetCost = useMemo(() => {
    return costEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [costEntries]);
  
  const totalFuelCost = useMemo(() => {
    return fuelLogs.reduce((sum, entry) => sum + entry.totalCost, 0);
  }, [fuelLogs]);

  const totalMileageDriven = useMemo(() => {
    return vehicles.reduce((sum, v) => sum + v.mileage, 0);
  }, [vehicles]);

  const costPerKm = useMemo(() => {
    if (totalMileageDriven === 0 || totalFleetCost === 0) return 0;
    let totalDistanceKmFromFuelLogs = 0;
    const vehicleOdometerMap = new Map<string, {min: number, max: number}>();
    fuelLogs.forEach(log => {
        if(!vehicleOdometerMap.has(log.vehicleId)){
            vehicleOdometerMap.set(log.vehicleId, {min: log.odometerReading, max: log.odometerReading});
        } else {
            const current = vehicleOdometerMap.get(log.vehicleId)!;
            current.min = Math.min(current.min, log.odometerReading);
            current.max = Math.max(current.max, log.odometerReading);
        }
    });
    vehicleOdometerMap.forEach(val => totalDistanceKmFromFuelLogs += (val.max - val.min));

    if (totalDistanceKmFromFuelLogs > 0) {
        return parseFloat((totalFleetCost / totalDistanceKmFromFuelLogs).toFixed(2));
    }
    return 'N/A';
  }, [totalFleetCost, fuelLogs]);


  const topSpendingCategories = useMemo(() => {
    const spending: { [key: string]: number } = {};
    costEntries.forEach(entry => {
      const categoryName = costCategories.find(c => c.id === entry.costCategoryId)?.name || 'Unknown';
      spending[categoryName] = (spending[categoryName] || 0) + entry.amount;
    });
    return Object.entries(spending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); 
  }, [costEntries, costCategories]);

  const averageFuelEfficiency = useMemo(() => {
    let totalKm = 0;
    let totalLiters = 0;
    const vehicleJourneys = new Map<string, { odoReadings: number[], fuelConsumed: number }>();

    fuelLogs.forEach(log => {
        if (!vehicleJourneys.has(log.vehicleId)) {
            vehicleJourneys.set(log.vehicleId, { odoReadings: [], fuelConsumed: 0 });
        }
        const journey = vehicleJourneys.get(log.vehicleId)!;
        journey.odoReadings.push(log.odometerReading);
        if (log.fuelType !== FuelType.ELECTRIC) { 
            journey.fuelConsumed += log.quantity;
        }
    });
    
    vehicleJourneys.forEach(journey => {
        if (journey.odoReadings.length > 1) {
            journey.odoReadings.sort((a,b) => a-b); 
            totalKm += journey.odoReadings[journey.odoReadings.length -1] - journey.odoReadings[0];
            totalLiters += journey.fuelConsumed;
        }
    });

    if (totalLiters === 0) return 'N/A';
    return `${(totalKm / totalLiters).toFixed(2)} km/L`;
  }, [fuelLogs]);
  
  const fetchAiForecast = useCallback(async () => {
    setIsFetchingForecast(true);
    setAiError(null);
    setAiForecast(null);

    const summaryData = `
        Total Fleet Cost Recorded: INR ${totalFleetCost.toLocaleString()}
        Total Fuel Cost: INR ${totalFuelCost.toLocaleString()}
        Cost Per KM (approx): ${costPerKm} INR
        Average Fuel Efficiency: ${averageFuelEfficiency}
        Top Spending Categories:
        ${topSpendingCategories.map(([name, amount]) => `- ${name}: INR ${amount.toLocaleString()}`).join('\n')}
    `.trim();
    
    const result = await getCostForecastFromGemini(summaryData);

    if (result.error) {
      setAiError(result.error);
    } else {
      setAiForecast({
        forecast: result.forecast || "",
        savingsAdvice: result.savingsAdvice || [],
      });
    }
    setIsFetchingForecast(false);
  }, [totalFleetCost, totalFuelCost, costPerKm, averageFuelEfficiency, topSpendingCategories]);


  return (
    <div className="space-y-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Cost Management Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your fleet's financial performance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Fleet Cost" 
          value={`₹${totalFleetCost.toLocaleString()}`} 
          icon={<CurrencyDollarIcon className="w-8 h-8" />}
          color="border-emerald-500"
          textColor="text-emerald-400"
          subtext="All recorded costs"
        />
        <StatCard 
          title="Total Fuel Cost" 
          value={`₹${totalFuelCost.toLocaleString()}`} 
          icon={<FireIcon className="w-8 h-8" />}
          color="border-red-500"
          textColor="text-red-400"
        />
         <StatCard 
          title="Avg. Cost / KM" 
          value={typeof costPerKm === 'number' ? `₹${costPerKm}` : costPerKm}
          icon={<CurrencyDollarIcon className="w-8 h-8" />}
          color="border-amber-500"
          textColor="text-amber-400"
          subtext="Based on fuel logs"
        />
        <StatCard 
          title="Avg. Fuel Efficiency" 
          value={averageFuelEfficiency} 
          icon={<FireIcon className="w-8 h-8" />}
          color="border-sky-500"
          textColor="text-sky-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
            <TagIcon className="w-6 h-6 mr-2 text-indigo-400"/>Top Spending Categories
          </h2>
          {topSpendingCategories.length > 0 ? (
            <ul className="space-y-2">
              {topSpendingCategories.map(([name, amount]) => (
                <li key={name} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-700 last:border-0">
                  <span className="text-gray-300">{name}</span>
                  <span className="font-semibold text-gray-100">₹{amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-gray-500">No cost entries to analyze categories.</p>}
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
            <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
                <CogIcon className="w-6 h-6 mr-2 text-teal-400" />
                AI Cost Forecasting & Budgeting
            </h2>
            <p className="text-sm text-gray-400 mb-3">
                Get AI-powered insights into potential future costs and budgeting advice.
            </p>
            <button
                onClick={fetchAiForecast}
                disabled={isFetchingForecast}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150 ease-in-out disabled:opacity-50 flex items-center justify-center"
            >
                {isFetchingForecast ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Analyzing Costs...
                    </>
                ) : 'Get AI Cost Forecast'}
            </button>
            {aiError && (
                <div className="mt-3 p-3 bg-red-900 bg-opacity-30 text-red-300 border border-red-700 rounded-md text-sm">
                    <strong>Error:</strong> {aiError}
                </div>
            )}
            {aiForecast && (
              <div className="mt-3 space-y-3">
                  <div className="p-3 bg-teal-900 bg-opacity-40 border border-teal-700 rounded-md">
                      <h4 className="font-semibold text-teal-300">Gemini's Forecast:</h4>
                      <p className="text-gray-300 whitespace-pre-wrap text-sm">{aiForecast.forecast}</p>
                  </div>
                  {aiForecast.savingsAdvice && aiForecast.savingsAdvice.length > 0 && (
                      <div className="p-3 bg-indigo-900 bg-opacity-40 border border-indigo-700 rounded-md">
                          <h5 className="font-semibold text-indigo-300">Actionable Savings Advice:</h5>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300 mt-1">
                              {aiForecast.savingsAdvice.map((advice, index) => (
                                  <li key={index}>{advice}</li>
                              ))}
                          </ul>
                      </div>
                  )}
              </div>
            )}
        </div>
      </div>
      
       <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Cost Alerts (Mock)</h2>
           <ul className="space-y-2 text-sm">
                <li className="p-3 bg-red-900 bg-opacity-40 border-l-4 border-red-500 rounded text-red-200">
                    <span className="font-semibold text-red-100">[High Cost]</span> Vehicle MH01AB1234 Maintenance cost (₹15,000) exceeded budget by 20%.
                </li>
                <li className="p-3 bg-amber-900 bg-opacity-40 border-l-4 border-amber-500 rounded text-amber-200">
                    <span className="font-semibold text-amber-100">[Renewal Due]</span> Insurance for KA03CD5678 expiring in 15 days.
                </li>
                 <li className="p-3 bg-yellow-900 bg-opacity-40 border-l-4 border-yellow-500 rounded text-yellow-200">
                    <span className="font-semibold text-yellow-100">[Unusual Fuel]</span> Fuel log for DL05EF7890 shows significantly higher consumption this week.
                </li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">These are conceptual alerts. Actual system would generate these based on rules and real-time data.</p>
        </div>

    </div>
  );
};

export default CostDashboardPage;