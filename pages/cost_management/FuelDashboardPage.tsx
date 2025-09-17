import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FuelLogEntry, Vehicle, FuelType } from '../../types';
import { FireIcon, ChartPieIcon, DocumentChartBarIcon } from '../../constants'; // Using existing icons

interface FuelDashboardPageProps {
  fuelLogs: FuelLogEntry[];
  vehicles: Vehicle[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; accentColor?: string; subtext?: string; }> =
({ title, value, icon, accentColor = 'border-primary-500 text-primary-400', subtext }) => (
  <div className={`bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-3 border-l-4 ${accentColor.split(' ')[1] || 'border-primary-500'}`}>
    <div className={`shrink-0 p-2.5 bg-gray-700 rounded-lg ${accentColor.split(' ')[0] || 'text-primary-400'}`}>{icon}</div>
    <div>
      <p className="text-xs sm:text-sm text-gray-400">{title}</p>
      <p className="text-xl sm:text-2xl font-semibold text-gray-100">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
    </div>
  </div>
);

interface ChartDataItem {
  label: string;
  value: number;
  color: string;
}

const DonutChart: React.FC<{ data: ChartDataItem[]; title: string; centerText?: string }> = ({ data, title, centerText }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0 && !centerText) return <div className="text-center text-gray-500 py-8 h-full flex items-center justify-center">No data for {title}.</div>;

  let cumulativePercent = 0;
  const radius = 0.9;
  const innerRadius = 0.6;
  const getCoordinates = (percent: number, r: number) => [r * Math.cos(2 * Math.PI * percent), r * Math.sin(2 * Math.PI * percent)];

  return (
    <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-100 mb-3">{title}</h3>
      <div className="flex-grow flex flex-col sm:flex-row items-center justify-around space-y-3 sm:space-y-0 sm:space-x-3 relative">
        <svg width="150" height="150" viewBox="-1 -1 2 2" style={{ transform: 'rotate(-0.25turn)' }} aria-label={`Donut chart: ${title}`}>
          {data.map((item, index) => {
            if (item.value === 0) return null;
            const percent = item.value / total;
            const [startX, startY] = getCoordinates(cumulativePercent, radius);
            const [startXInner, startYInner] = getCoordinates(cumulativePercent, innerRadius);
            cumulativePercent += percent;
            const [endX, endY] = getCoordinates(cumulativePercent, radius);
            const [endXInner, endYInner] = getCoordinates(cumulativePercent, innerRadius);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} L ${endXInner} ${endYInner} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startXInner} ${startYInner} Z`;
            return <path key={index} d={pathData} fill={item.color} aria-label={`${item.label}: ${item.value}`} />;
          })}
          {centerText && (
            <text x="0" y="0.05" textAnchor="middle" dominantBaseline="middle" fontSize="0.25" fill="#e5e7eb" fontWeight="bold">
              {centerText}
            </text>
          )}
        </svg>
        <div className="text-xs space-y-1 text-gray-300">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: item.color }} aria-hidden="true"></span>
              <span>{item.label}: {item.value.toFixed(1)} ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const FuelDashboardPage: React.FC<FuelDashboardPageProps> = ({ fuelLogs, vehicles }) => {
  const totalFuelCost = useMemo(() =>
    fuelLogs.reduce((sum, log) => sum + log.totalCost, 0),
  [fuelLogs]);

  const totalFuelVolume = useMemo(() =>
    fuelLogs.reduce((sum, log) => sum + log.quantity, 0),
  [fuelLogs]);

  const averageFuelPrice = useMemo(() =>
    totalFuelVolume > 0 ? (totalFuelCost / totalFuelVolume) : 0,
  [totalFuelCost, totalFuelVolume]);

  const fleetAverageEfficiency = useMemo(() => {
    let totalKm = 0;
    let totalLitersOrKWh = 0; // Combined for simplicity, specific units for labels
    const vehicleJourneys = new Map<string, { odoReadings: number[], fuelConsumed: number, isElectric: boolean }>();

    fuelLogs.forEach(log => {
        if (!vehicleJourneys.has(log.vehicleId)) {
            vehicleJourneys.set(log.vehicleId, { odoReadings: [], fuelConsumed: 0, isElectric: log.fuelType === FuelType.ELECTRIC });
        }
        const journey = vehicleJourneys.get(log.vehicleId)!;
        journey.odoReadings.push(log.odometerReading);
        journey.fuelConsumed += log.quantity;
    });

    vehicleJourneys.forEach(journey => {
        if (journey.odoReadings.length > 1) {
            journey.odoReadings.sort((a,b) => a-b);
            totalKm += journey.odoReadings[journey.odoReadings.length -1] - journey.odoReadings[0];
            totalLitersOrKWh += journey.fuelConsumed;
        }
    });

    if (totalLitersOrKWh === 0 || totalKm === 0) return "N/A";
    // For simplicity, not distinguishing units in calculation here, but label should indicate.
    return `${(totalKm / totalLitersOrKWh).toFixed(1)}`;
  }, [fuelLogs]);


  const fuelConsumptionByTypeData = useMemo(() => {
    const consumption: { [key in FuelType]: number } = {
      [FuelType.PETROL]: 0,
      [FuelType.DIESEL]: 0,
      [FuelType.CNG]: 0,
      [FuelType.ELECTRIC]: 0,
      [FuelType.OTHER]: 0,
    };
    fuelLogs.forEach(log => {
      consumption[log.fuelType] = (consumption[log.fuelType] || 0) + log.quantity;
    });
    return [
      { label: 'Petrol (L)', value: consumption[FuelType.PETROL], color: '#EF5350' }, // Light Red
      { label: 'Diesel (L)', value: consumption[FuelType.DIESEL], color: '#FFCA28' }, // Light Amber
      { label: 'CNG (kg)', value: consumption[FuelType.CNG], color: '#66BB6A' }, // Light Green
      { label: 'Electric (kWh)', value: consumption[FuelType.ELECTRIC], color: '#42A5F5' }, // Light Blue
      { label: 'Other', value: consumption[FuelType.OTHER], color: '#BDBDBD' }, // Light Grey
    ].filter(d => d.value > 0);
  }, [fuelLogs]);

  const mockMonthlyCostData: ChartDataItem[] = [
    { label: 'Jan', value: 45000, color: '#3b82f6'},
    { label: 'Feb', value: 42000, color: '#3b82f6'},
    { label: 'Mar', value: 48000, color: '#3b82f6'},
    { label: 'Apr', value: 46000, color: '#3b82f6'},
    { label: 'May', value: 50000, color: '#3b82f6'},
    { label: 'Jun', value: 47000, color: '#3b82f6'},
  ];
  
  const fuelCostByVehicle = useMemo(() => {
    const costs: { [key: string]: number } = {};
    fuelLogs.forEach(log => {
        const vehicleName = vehicles.find(v => v.id === log.vehicleId)?.licensePlate || log.vehicleId;
        costs[vehicleName] = (costs[vehicleName] || 0) + log.totalCost;
    });
    return Object.entries(costs)
        .sort(([,a],[,b]) => b-a)
        .slice(0,5)
        .map(([label, value], index) => ({label, value, color: ['#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e'][index % 5]}));
  }, [fuelLogs, vehicles]);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Fuel Management Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            title="Total Fuel Cost" 
            value={`₹${totalFuelCost.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} 
            icon={<DocumentChartBarIcon className="w-6 h-6" />} 
            accentColor="border-red-500 text-red-400" 
        />
        <StatCard 
            title="Total Fuel Consumed" 
            value={`${totalFuelVolume.toFixed(1)} L/kWh`} 
            icon={<FireIcon className="w-6 h-6" />} 
            accentColor="border-orange-500 text-orange-400" 
        />
        <StatCard 
            title="Avg. Fuel Price" 
            value={`₹${averageFuelPrice.toFixed(2)} /unit`} 
            icon={<FireIcon className="w-6 h-6" />} 
            accentColor="border-amber-500 text-amber-400" 
        />
        <StatCard 
            title="Fleet Avg. Efficiency" 
            value={`${fleetAverageEfficiency} km/unit`} 
            icon={<FireIcon className="w-6 h-6" />} 
            accentColor="border-lime-500 text-lime-400" 
            subtext="km/L or km/kWh"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart data={fuelConsumptionByTypeData} title="Fuel Consumption by Type" />
        <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Monthly Fuel Cost Trend (Mock)</h3>
            <div className="flex-grow flex items-end space-x-2 px-2 border-b border-l border-gray-700 relative" style={{ height: `200px` }}>
                 <div className="absolute -left-7 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500" style={{height: `170px`}}>
                    <span>{Math.max(...mockMonthlyCostData.map(d=>d.value), 0).toLocaleString()}</span>
                    <span>0</span>
                </div>
                {mockMonthlyCostData.map((item) => (
                    <div key={item.label} className="flex-1 flex flex-col items-center group h-full justify-end">
                        <div
                        className="group-hover:opacity-80 transition-opacity"
                        style={{ width: `50%`, height: `${(item.value / Math.max(...mockMonthlyCostData.map(d=>d.value))) * 170}px`, backgroundColor: item.color }}
                        title={`${item.label}: ${item.value.toLocaleString()}`}
                        />
                        <span className="text-[10px] text-gray-400 mt-1">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Top 5 Vehicles by Fuel Cost</h3>
             {fuelCostByVehicle.length > 0 ? (
                <div className="flex-grow flex items-end space-x-2 px-2 border-b border-l border-gray-700 relative" style={{ height: `200px` }}>
                    <div className="absolute -left-7 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500" style={{height: `170px`}}>
                        <span>{Math.max(...fuelCostByVehicle.map(d=>d.value), 0).toLocaleString()}</span>
                        <span>0</span>
                    </div>
                    {fuelCostByVehicle.map((item) => (
                        <div key={item.label} className="flex-1 flex flex-col items-center group h-full justify-end">
                            <div
                                className="group-hover:opacity-80 transition-opacity"
                                style={{ width: `50%`, height: `${(item.value / Math.max(...fuelCostByVehicle.map(d=>d.value))) * 170}px`, backgroundColor: item.color }}
                                title={`${item.label}: ${item.value.toLocaleString()}`}
                            />
                            <span className="text-[10px] text-gray-400 mt-1 truncate max-w-[50px]">{item.label}</span>
                        </div>
                    ))}
                </div>
            ) : <p className="text-gray-500 text-center py-8">No fuel cost data by vehicle.</p>}
        </div>
         <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Top 5 Fuel Efficient Vehicles (Mock)</h3>
            <p className="text-gray-500 text-center py-8">Fuel efficiency per vehicle chart coming soon.</p>
            {/* Placeholder for efficiency chart */}
        </div>
      </div>


      <div className="flex justify-end mt-6">
        <Link to="/costs/fuel-log" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
          View Detailed Fuel Log
        </Link>
      </div>
    </div>
  );
};

export default FuelDashboardPage;