



import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
// FIX: Added missing imports for TelematicsAlert and AlertType
import { Vehicle, Chauffeur, TelematicsAlert, AlertType, DocumentType } from '../types';
import { ShieldCheckIcon, DevicePhoneMobileIcon, BellAlertIcon, ChartPieIcon, UserGroupIcon } from '../constants'; // Reusing ChartPieIcon for this dashboard

interface SafetyComplianceDashboardPageProps {
  vehicles: Vehicle[];
  chauffeurs: Chauffeur[];
  alerts: TelematicsAlert[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; accentColor?: string; subtext?: string; linkTo?: string; }> =
({ title, value, icon, accentColor = 'border-primary-500 text-primary-400', subtext, linkTo }) => {
  const content = (
    <>
      <div className={`shrink-0 p-2.5 bg-gray-700 rounded-lg ${accentColor.split(' ')[0] || 'text-primary-400'}`}>{icon}</div>
      <div>
        <p className="text-xs sm:text-sm text-gray-400">{title}</p>
        <p className="text-xl sm:text-2xl font-semibold text-gray-100">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
      </div>
    </>
  );

  const cardClasses = `bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-3 border-l-4 ${accentColor.split(' ')[1] || 'border-primary-500'}`;

  if (linkTo) {
    return (
      <Link to={linkTo} className={`${cardClasses} hover:bg-gray-750 transition-colors`}>
        {content}
      </Link>
    );
  }
  return <div className={cardClasses}>{content}</div>;
};


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
              <span>{item.label}: {item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const getDaysUntilExpiry = (expiryDate?: string): number | null => {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0,0,0,0); 
  const expDate = new Date(expiryDate);
  if (isNaN(expDate.getTime())) return null;
  return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};


const SafetyComplianceDashboardPage: React.FC<SafetyComplianceDashboardPageProps> = ({
  vehicles,
  chauffeurs,
  alerts,
}) => {
  
  const activeCriticalAlertsCount = useMemo(() => 
    alerts.filter(a => !a.isAcknowledged && 
      [AlertType.SPEEDING, AlertType.UNAUTHORIZED_USE, AlertType.DEVICE_OFFLINE, AlertType.MAINTENANCE_OVERDUE, AlertType.COST_EXCEEDED_LIMIT, AlertType.HARSH_BRAKING].includes(a.type)
    ).length, 
  [alerts]);

  const ais140CompliantCount = useMemo(() => 
    vehicles.filter(v => v.isAIS140Compliant).length, 
  [vehicles]);

  const documentsExpiringSoonCount = useMemo(() => {
    // @fi-fix: Refactored to read from the 'documents' array instead of deprecated direct properties.
    const uniqueDocs = new Set<string>();

    vehicles.forEach(vehicle => {
        (vehicle.documents || []).forEach(doc => {
            if (!doc.expiryDate) return;
            const days = getDaysUntilExpiry(doc.expiryDate);
            if (days !== null && days >= 0 && days <= 30) {
                uniqueDocs.add(`${vehicle.id}-${doc.type}`);
            }
        });
    });
    return uniqueDocs.size;
  }, [vehicles]);


  const aisComplianceChartData = useMemo(() => {
    const totalVehicles = vehicles.length;
    if (totalVehicles === 0) return [];
    const nonCompliantCount = totalVehicles - ais140CompliantCount;
    return [
      { label: 'Compliant', value: ais140CompliantCount, color: '#4CAF50' }, // Green
      { label: 'Non-Compliant', value: nonCompliantCount, color: '#F44336' }, // Red
    ].filter(d => d.value > 0);
  }, [vehicles, ais140CompliantCount]);
  
  const aisComplianceRate = vehicles.length > 0 ? ((ais140CompliantCount / vehicles.length) * 100).toFixed(0) + "%" : "N/A";


  const documentExpiryBreakdownData = useMemo(() => {
    // @fi-fix: Refactored to read from the 'documents' array instead of deprecated direct properties.
    const breakdown = { expired: 0, '0-30d': 0, '31-60d': 0, '61-90d': 0, '90d+': 0, na: 0 };
    vehicles.forEach(v => {
      (v.documents || []).forEach(doc => {
        const dateStr = doc.expiryDate;
        const days = getDaysUntilExpiry(dateStr);
        if (days === null) {
          breakdown.na++;
        } else if (days < 0) {
          breakdown.expired++;
        } else if (days <= 30) {
          breakdown['0-30d']++;
        } else if (days <= 60) {
          breakdown['31-60d']++;
        } else if (days <= 90) {
          breakdown['61-90d']++;
        } else {
          breakdown['90d+']++;
        }
      });
    });
    return [
      { label: 'Expired', value: breakdown.expired, color: '#b91c1c' }, // dark red
      { label: '0-30 Days', value: breakdown['0-30d'], color: '#fb923c' }, // orange
      { label: '31-60 Days', value: breakdown['31-60d'], color: '#facc15' }, // yellow
      { label: '61-90 Days', value: breakdown['61-90d'], color: '#a3e635' }, // lime
      { label: '90+ Days', value: breakdown['90d+'], color: '#22c55e' }, // green
    ].filter(d => d.value > 0);
  }, [vehicles]);


  // Mock Safety Score for now
  const averageSafetyScore = "82/100"; 
  const mockIncidentsLast30d = alerts.filter(a => [AlertType.HARSH_BRAKING, AlertType.SPEEDING].includes(a.type) && !a.isAcknowledged).length; // Example, could be more specific

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Safety & Compliance Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Critical Alerts" 
          value={activeCriticalAlertsCount} 
          icon={<BellAlertIcon className="w-6 h-6" />} 
          accentColor="border-red-500 text-red-400"
          linkTo="/alerts"
        />
        <StatCard 
          title="AIS 140 Compliant Vehicles" 
          value={`${ais140CompliantCount} / ${vehicles.length}`}
          icon={<DevicePhoneMobileIcon className="w-6 h-6" />} 
          accentColor="border-green-500 text-green-400"
        />
        <StatCard 
          title="Docs Expiring Soon" 
          value={documentsExpiringSoonCount} 
          icon={<ShieldCheckIcon className="w-6 h-6" />} 
          accentColor="border-amber-500 text-amber-400"
          subtext="Next 30 days"
          linkTo="/safety/documents"
        />
        <StatCard 
          title="Avg. Chauffeur Safety Score" 
          value={averageSafetyScore} 
          icon={<UserGroupIcon className="w-6 h-6" />} 
          accentColor="border-blue-500 text-blue-400"
          subtext="Mock Data"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart data={aisComplianceChartData} title="AIS 140 Compliance Rate" centerText={aisComplianceRate} />
        <div className="bg-gray-800 p-5 rounded-xl shadow-xl h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Document Expiry Breakdown</h3>
            {documentExpiryBreakdownData.length > 0 ? (
                <ul className="space-y-2 text-sm">
                    {documentExpiryBreakdownData.map(item => (
                        <li key={item.label} className="flex justify-between items-center p-2 bg-gray-750 rounded-md">
                            <span className="flex items-center">
                                <span className="inline-block w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }}></span>
                                {item.label}
                            </span>
                            <span className="font-semibold text-gray-100">{item.value} documents</span>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-gray-500 text-center py-8">No document expiry data available.</p>}
             <Link to="/safety/documents" className="block mt-auto pt-3 text-right text-xs text-primary-400 hover:text-primary-300 hover:underline">View Detailed Compliance &rarr;</Link>
        </div>
      </div>
      
      <div className="bg-gray-800 p-5 rounded-xl shadow-xl">
        <h3 className="text-lg font-semibold text-gray-100 mb-3">Recent Safety Incidents (Mock)</h3>
        {mockIncidentsLast30d > 0 ? (
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="p-2 bg-gray-750 rounded-md">Vehicle KA01XY1234: Harsh Braking event on 25 Jul 2024, 10:15 AM</li>
            <li className="p-2 bg-gray-750 rounded-md">Vehicle MH04AB5678: Speeding (85km/h in 60km/h zone) on 24 Jul 2024, 03:30 PM</li>
            { mockIncidentsLast30d > 2 && <li className="p-2 bg-gray-750 rounded-md">... and {mockIncidentsLast30d - 2} more incidents</li>}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm py-4">No significant safety incidents recorded recently (mock).</p>
        )}
        <Link to="/alerts" className="block mt-3 text-right text-xs text-primary-400 hover:text-primary-300 hover:underline">Review All Alerts &rarr;</Link>
      </div>

    </div>
  );
};

export default SafetyComplianceDashboardPage;