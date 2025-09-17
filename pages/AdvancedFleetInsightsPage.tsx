

import React, { useState, useEffect, useMemo } from 'react';
import { Vehicle, Chauffeur, MaintenanceTask, FuelLogEntry, CostEntry, VehicleStatus, MaintenanceTaskStatus } from '../types';

// Placeholder icons (replace with actual Heroicons or custom SVGs if needed)
const CarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 0h5.25m-5.25 0V3.375M5.25 7.5h9" />
  </svg>
); 
const VanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <CarIcon {...props} />; 
const TruckHeavyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <CarIcon {...props} />; 
const TruckMediumIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <CarIcon {...props} />; 
const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.947 1.527l-.145.541a2.25 2.25 0 001.339 2.768l.484.204a2.251 2.251 0 002.406-.606l.33-.398a2.25 2.25 0 00-.307-3.268l-.444-.287A2.25 2.25 0 0011.078 2.25zM12.922 2.25c.917 0 1.699.663 1.947 1.527l.145.541a2.25 2.25 0 01-1.339 2.768l-.484.204a2.251 2.251 0 01-2.406-.606l-.33-.398a2.25 2.25 0 01.307-3.268l.444-.287A2.25 2.25 0 0112.922 2.25zM11.078 21.75c-.917 0-1.699-.663-1.947-1.527l-.145-.541a2.25 2.25 0 011.339-2.768l.484-.204a2.251 2.251 0 012.406.606l.33.398a2.25 2.25 0 01-.307 3.268l-.444.287A2.25 2.25 0 0111.078 21.75zM12.922 21.75c.917 0 1.699-.663 1.947-1.527l.145-.541a2.25 2.25 0 00-1.339-2.768l-.484-.204a2.251 2.251 0 00-2.406-.606l-.33.398a2.25 2.25 0 00.307 3.268l.444.287A2.25 2.25 0 0012.922 21.75zM2.25 11.078c0-.917.663-1.699 1.527-1.947l.541-.145a2.25 2.25 0 002.768 1.339l.204.484a2.251 2.251 0 00-.606 2.406l-.398.33a2.25 2.25 0 00-3.268-.307l-.287-.444A2.25 2.25 0 002.25 11.078zM2.25 12.922c0 .917.663 1.699 1.527 1.947l.541.145a2.25 2.25 0 012.768-1.339l.204-.484a2.251 2.251 0 01-.606-2.406l-.398-.33a2.25 2.25 0 01-3.268.307l-.287.444A2.25 2.25 0 012.25 12.922zM21.75 11.078c0-.917-.663-1.699-1.527-1.947l-.541-.145a2.25 2.25 0 01-2.768 1.339l-.204.484a2.251 2.251 0 01.606 2.406l.398.33a2.25 2.25 0 013.268-.307l.287-.444A2.25 2.25 0 0121.75 11.078zM21.75 12.922c0 .917-.663-1.699-1.527-1.947l-.541.145a2.25 2.25 0 00-2.768-1.339l-.204-.484a2.251 2.251 0 00.606-2.406l.398-.33a2.25 2.25 0 003.268.307l.287.444A2.25 2.25 0 0021.75 12.922zM12 7.75A4.25 4.25 0 1012 16.25 4.25 4.25 0 0012 7.75z" clipRule="evenodd" /></svg>
);

interface ChartDataPoint { month: string; [key: string]: number | string; }

interface CostBarChartProps {
  data: ChartDataPoint[];
  keys: string[];
  colors: { [key: string]: string };
}

const CostBarChart: React.FC<CostBarChartProps> = ({ data, keys, colors }) => {
  const chartHeight = 200;
  const barGap = 8;
  const chartPadding = { top: 20, bottom: 30, left: 40, right: 20 };
  const chartWidth = data.length * (50 + barGap) + chartPadding.left + chartPadding.right; // Dynamic width

  const yMax = Math.max(...data.map(d => keys.reduce((sum, key) => sum + (d[key] as number), 0)), 0);
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => yMax > 0 ? (yMax / yTicks) * i : 0);


  return (
    <svg width="100%" height={chartHeight + chartPadding.top + chartPadding.bottom} viewBox={`0 0 ${chartWidth} ${chartHeight + chartPadding.top + chartPadding.bottom}`}>
      {/* Y-axis */}
      {yTickValues.map((tick, i) => (
        <g key={i}>
          <line
            x1={chartPadding.left}
            y1={chartPadding.top + chartHeight - (yMax > 0 ? (tick / yMax) * chartHeight : 0)}
            x2={chartWidth - chartPadding.right}
            y2={chartPadding.top + chartHeight - (yMax > 0 ? (tick / yMax) * chartHeight : 0)}
            stroke="#4b5563" 
            strokeDasharray="2,2"
          />
          <text
            x={chartPadding.left - 5}
            y={chartPadding.top + chartHeight - (yMax > 0 ? (tick / yMax) * chartHeight : 0) + 4}
            textAnchor="end"
            fontSize="10"
            fill="#9ca3af"
          >
            {tick.toLocaleString()}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        let currentStackHeight = 0;
        return (
          <g key={d.month} transform={`translate(${chartPadding.left + i * (50 + barGap) + barGap/2}, 0)`}>
            {keys.map(key => {
              const value = d[key] as number;
              const barHeight = yMax > 0 ? (value / yMax) * chartHeight : 0;
              const yPos = chartPadding.top + chartHeight - barHeight - currentStackHeight;
              currentStackHeight += barHeight;
              return (
                <rect
                  key={key}
                  x={0}
                  y={yPos}
                  width={50}
                  height={barHeight}
                  fill={colors[key]}
                  rx="2"
                />
              );
            })}
            <text
              x={25} 
              y={chartPadding.top + chartHeight + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
            >
              {d.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

interface TravelAreaChartProps {
  data: { month: string; km: number }[];
  color: string;
}

const TravelAreaChart: React.FC<TravelAreaChartProps> = ({ data, color }) => {
    const chartHeight = 200;
    const chartPadding = { top: 20, bottom: 30, left: 50, right: 20 };
    const chartWidth = data.length > 1 ? (data.length -1) * 60 + chartPadding.left + chartPadding.right : 1 * 60 + chartPadding.left + chartPadding.right;


    const yMax = Math.max(...data.map(d => d.km), 0);
    const yMin = 0; 
    const yTicks = 5;
    const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => yMin + ((yMax - yMin > 0 ? (yMax - yMin) / yTicks : 0) * i));
    
    const xPoint = (index: number) => chartPadding.left + index * ((chartWidth - chartPadding.left - chartPadding.right) / (data.length -1 < 1 ? 1 : data.length - 1));
    const yPoint = (value: number) => chartPadding.top + chartHeight - ((yMax - yMin > 0 ? (value - yMin) / (yMax - yMin) : 0) * chartHeight);

    const pathD = data.length > 0 ? "M" + xPoint(0) + "," + yPoint(data[0].km) +
        data.slice(1).map((d, i) => " L" + xPoint(i + 1) + "," + yPoint(d.km)).join("") +
        " L" + xPoint(Math.max(0, data.length - 1)) + "," + yPoint(yMin) +
        " L" + xPoint(0) + "," + yPoint(yMin) + " Z"
        : "";


    return (
        <svg width="100%" height={chartHeight + chartPadding.top + chartPadding.bottom} viewBox={`0 0 ${chartWidth} ${chartHeight + chartPadding.top + chartPadding.bottom}`}>
        {/* Y-axis */}
        {yTickValues.map((tick, i) => (
            <g key={i}>
            <line
                x1={chartPadding.left}
                y1={yPoint(tick)}
                x2={chartWidth - chartPadding.right}
                y2={yPoint(tick)}
                stroke="#4b5563"
                strokeDasharray="2,2"
            />
            <text
                x={chartPadding.left - 5}
                y={yPoint(tick) + 4}
                textAnchor="end"
                fontSize="10"
                fill="#9ca3af"
            >
                {tick.toLocaleString()}
            </text>
            </g>
        ))}

        {/* Area path */}
        {data.length > 0 && <path d={pathD} fill={color} fillOpacity="0.3" />}
        
        {/* Line path */}
        {data.length > 0 && 
            <path 
                d={"M" + data.map((d, i) => `${xPoint(i)},${yPoint(d.km)}`).join(" L")}
                stroke={color}
                strokeWidth="2"
                fill="none"
            />
        }

        {/* X-axis labels and points */}
        {data.map((d, i) => (
            <g key={d.month}>
                <circle cx={xPoint(i)} cy={yPoint(d.km)} r="3" fill={color} />
                <text
                    x={xPoint(i)}
                    y={chartPadding.top + chartHeight + 15}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#9ca3af"
                >
                    {d.month}
                </text>
            </g>
        ))}
        </svg>
    );
};


interface AdvancedFleetInsightsPageProps {
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  maintenanceTasks: MaintenanceTask[];
  fuelLogs: FuelLogEntry[];
  costEntries: CostEntry[];
}

const AdvancedFleetInsightsPage: React.FC<AdvancedFleetInsightsPageProps> = ({
  vehicles,
  chauffeurs,
  maintenanceTasks,
  fuelLogs,
  costEntries
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const vehicleTypeCounts = useMemo(() => {
    const counts = { cars: 0, vans: 0, trucks35t: 0, trucks75t: 0 };
    const available = { cars: 0, vans: 0, trucks35t: 0, trucks75t: 0 };
    const service = { cars: 0, vans: 0, trucks35t: 0, trucks75t: 0 };

    vehicles.forEach((v, index) => {
      const typeIndex = index % 4;
      let typeKey: keyof typeof counts;
      if (typeIndex === 0) typeKey = 'cars';
      else if (typeIndex === 1) typeKey = 'vans';
      else if (typeIndex === 2) typeKey = 'trucks35t';
      else typeKey = 'trucks75t';

      counts[typeKey]++;
      if (v.status === VehicleStatus.ACTIVE) available[typeKey]++;
      if (v.status === VehicleStatus.MAINTENANCE) service[typeKey]++;
    });
    return { counts, available, service };
  }, [vehicles]);

  // Mock data for charts
  const mockCostsData = [
    { month: 'Jan', fuel: 25000, service: 8000, insurance: 5000 },
    { month: 'Feb', fuel: 22000, service: 7500, insurance: 5000 },
    { month: 'Mar', fuel: 28000, service: 9000, insurance: 5000 },
    { month: 'Apr', fuel: 26000, service: 8200, insurance: 5000 },
    { month: 'May', fuel: 30000, service: 9500, insurance: 5000 },
    { month: 'Jun', fuel: 27000, service: 8800, insurance: 5000 },
  ];
  const costChartKeys = ['fuel', 'service', 'insurance'];
  const costChartColors = { fuel: '#06b6d4', service: '#3b82f6', insurance: '#8b5cf6' };


  const mockTravelsData = [
    { month: 'Jan', km: 110000 }, { month: 'Feb', km: 105000 },
    { month: 'Mar', km: 120000 }, { month: 'Apr', km: 115000 },
    { month: 'May', km: 130000 }, { month: 'Jun', km: 125000 },
  ];
  
  const totalFuelCost = useMemo(() => fuelLogs.reduce((sum, log) => sum + log.totalCost, 0), [fuelLogs]);
  const totalServiceCost = useMemo(() => 
    maintenanceTasks
      .filter(task => task.status === MaintenanceTaskStatus.COMPLETED && task.totalCost)
      .reduce((sum, task) => sum + (task.totalCost || 0), 0),
  [maintenanceTasks]);

  const recentServiceTasks = useMemo(() =>
    maintenanceTasks
      .sort((a, b) => new Date(b.scheduledDate || b.completionDate || 0).getTime() - new Date(a.scheduledDate || a.completionDate || 0).getTime())
      .slice(0, 8), 
  [maintenanceTasks]);

  const getVehicleLicensePlate = (vehicleId: string): string => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.licensePlate : 'N/A';
  };

  return (
    <div className="bg-gray-850 min-h-screen p-6 text-gray-100">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fleet Management</h1>
        <div className="text-right">
          <p className="text-2xl font-mono text-cyan-400">{timeFormatter.format(currentTime)}</p>
          <p className="text-xs text-gray-400">{dateFormatter.format(currentTime)}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: KPIs and Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Type KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { type: 'Cars', count: vehicleTypeCounts.counts.cars, available: vehicleTypeCounts.available.cars, service: vehicleTypeCounts.service.cars, Icon: CarIcon },
              { type: 'Vans', count: vehicleTypeCounts.counts.vans, available: vehicleTypeCounts.available.vans, service: vehicleTypeCounts.service.vans, Icon: VanIcon },
              { type: 'Trucks 3.5t', count: vehicleTypeCounts.counts.trucks35t, available: vehicleTypeCounts.available.trucks35t, service: vehicleTypeCounts.service.trucks35t, Icon: TruckMediumIcon },
              { type: 'Trucks 7.5t', count: vehicleTypeCounts.counts.trucks75t, available: vehicleTypeCounts.available.trucks75t, service: vehicleTypeCounts.service.trucks75t, Icon: TruckHeavyIcon },
            ].map(item => (
              <div key={item.type} className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center text-center">
                <item.Icon className="w-10 h-10 mb-2 text-cyan-400" />
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-sm text-gray-300">{item.type}</p>
                <p className="text-xs text-gray-400 mt-1">Available: {item.available} | Service: {item.service}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Costs (Monthly)</h2>
             <CostBarChart data={mockCostsData} keys={costChartKeys} colors={costChartColors} />
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Travels (Monthly km)</h2>
             <TravelAreaChart data={mockTravelsData} color="#0ea5e9" />
          </div>
        </div>

        {/* Right Column: Aggregated Totals and Service List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
            <div>
              <p className="text-sm text-gray-400">Total Fuel</p>
              <p className="text-3xl font-bold text-cyan-400">₹{totalFuelCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Service</p>
              <p className="text-3xl font-bold text-cyan-400">₹{totalServiceCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Insurance (Mock)</p>
              <p className="text-3xl font-bold text-cyan-400">₹1,50,000</p>
            </div>
             <div>
              <p className="text-sm text-gray-400">Total Travels (Mock)</p>
              <p className="text-3xl font-bold text-cyan-400">725,428 km</p>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Service & Maintenance</h2>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {recentServiceTasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-2 bg-gray-700 rounded text-sm">
                  <div className="flex items-center">
                    <CogIcon className="w-5 h-5 mr-2 text-cyan-500" />
                    <div>
                      <p className="text-gray-200">{task.title}</p>
                      <p className="text-xs text-gray-400">{new Date(task.scheduledDate || task.completionDate || 0).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <span className="text-xs text-cyan-300 bg-cyan-700 bg-opacity-50 px-2 py-0.5 rounded-full">
                    S: {getVehicleLicensePlate(task.vehicleId)}
                  </span>
                </li>
              ))}
              {recentServiceTasks.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No recent maintenance tasks.</p>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFleetInsightsPage;
