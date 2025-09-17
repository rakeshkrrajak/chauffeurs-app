import React, { useState, useMemo } from 'react';
import { User, Vehicle } from '../types';
import { DocumentReportIcon } from '../constants';

interface EmployeePolicyPageProps {
  users: User[];
  vehicles: Vehicle[];
}

const POLICY_KM_LIMIT = 60000;
const POLICY_YEAR_LIMIT = 3;

const EmployeePolicyPage: React.FC<EmployeePolicyPageProps> = ({ users, vehicles }) => {
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  const employeePolicyData = useMemo(() => {
    const employeeDataMap = new Map<string, {
      user: User;
      assignments: {
        vehicle: Vehicle;
        historyEntry: Vehicle['assignmentHistory'][0];
        kmDriven: number;
      }[];
      totalKmDriven: number;
      policyStartDate: Date | null;
      monthsElapsed: number;
      status: 'Exceeded' | 'Approaching Limit' | 'Within Limit';
    }>();

    // 1. Group all employee assignments by user
    vehicles.forEach(vehicle => {
      (vehicle.assignmentHistory || []).forEach(entry => {
        if (entry.type === 'Employee') {
          if (!employeeDataMap.has(entry.assignedToId)) {
            const user = users.find(u => u.id === entry.assignedToId);
            if (user) {
              employeeDataMap.set(entry.assignedToId, {
                user,
                assignments: [],
                totalKmDriven: 0,
                policyStartDate: null,
                monthsElapsed: 0,
                status: 'Within Limit',
              });
            }
          }

          if (employeeDataMap.has(entry.assignedToId)) {
            const kmDriven = (entry.endMileage || vehicle.mileage) - (entry.startMileage || 0);
            employeeDataMap.get(entry.assignedToId)!.assignments.push({
              vehicle,
              historyEntry: entry,
              kmDriven: kmDriven > 0 ? kmDriven : 0,
            });
          }
        }
      });
    });

    // 2. Calculate cumulative data for each employee
    employeeDataMap.forEach(data => {
      if (data.assignments.length > 0) {
        data.assignments.sort((a, b) => new Date(a.historyEntry.startDate).getTime() - new Date(b.historyEntry.startDate).getTime());
        
        data.policyStartDate = new Date(data.assignments[0].historyEntry.startDate);
        data.totalKmDriven = data.assignments.reduce((sum, assign) => sum + assign.kmDriven, 0);

        const now = new Date();
        data.monthsElapsed = (now.getFullYear() - data.policyStartDate.getFullYear()) * 12 + (now.getMonth() - data.policyStartDate.getMonth());

        const kmPercentage = (data.totalKmDriven / POLICY_KM_LIMIT) * 100;
        const timePercentage = (data.monthsElapsed / (POLICY_YEAR_LIMIT * 12)) * 100;

        if (kmPercentage >= 100 || timePercentage >= 100) {
          data.status = 'Exceeded';
        } else if (kmPercentage > 85 || timePercentage > 85) {
          data.status = 'Approaching Limit';
        }
      }
    });

    return Array.from(employeeDataMap.values())
      .filter(data => data.assignments.length > 0)
      .sort((a, b) => b.totalKmDriven - a.totalKmDriven);

  }, [users, vehicles]);

  const toggleExpand = (employeeId: string) => {
    setExpandedEmployeeId(prevId => (prevId === employeeId ? null : employeeId));
  };
  
  const formatDate = (date: Date | string | null) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  const getStatusPillClass = (status: 'Exceeded' | 'Approaching Limit' | 'Within Limit') => {
      switch (status) {
          case 'Exceeded': return 'bg-red-700 bg-opacity-40 text-red-300';
          case 'Approaching Limit': return 'bg-amber-700 bg-opacity-40 text-amber-300';
          case 'Within Limit': return 'bg-green-700 bg-opacity-40 text-green-300';
          default: return 'bg-gray-700 text-gray-300';
      }
  };

  const ProgressBar: React.FC<{ value: number; limit: number; colorClass: string }> = ({ value, limit, colorClass }) => {
    const percentage = Math.min((value / limit) * 100, 100);
    return (
      <div className="w-full bg-gray-600 rounded-full h-2.5">
        <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100 flex items-center">
        <DocumentReportIcon className="w-8 h-8 mr-3 text-primary-400" />
        Employee Vehicle Policy Tracking
      </h1>
      <p className="text-gray-400">
        Monitor employee vehicle usage against the {POLICY_YEAR_LIMIT}-year / {POLICY_KM_LIMIT.toLocaleString()} km policy.
      </p>

      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 text-sm">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase w-10"></th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Employee</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">KM Progress ({POLICY_KM_LIMIT.toLocaleString()} km)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Time Progress ({POLICY_YEAR_LIMIT} Years)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Policy Start</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {employeePolicyData.map(data => {
              const kmProgress = (data.totalKmDriven / POLICY_KM_LIMIT) * 100;
              const timeProgress = (data.monthsElapsed / (POLICY_YEAR_LIMIT * 12)) * 100;
              const isExpanded = expandedEmployeeId === data.user.id;
              
              return (
                <React.Fragment key={data.user.id}>
                  <tr className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleExpand(data.user.id)} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                        <div className="font-medium text-gray-100">{data.user.name}</div>
                        <div className="text-xs text-gray-400">{data.user.department}</div>
                    </td>
                    <td className="px-4 py-3">
                        <ProgressBar value={data.totalKmDriven} limit={POLICY_KM_LIMIT} colorClass={kmProgress > 85 ? 'bg-red-500' : kmProgress > 60 ? 'bg-amber-500' : 'bg-green-500'} />
                        <div className="text-xs text-gray-300 mt-1">{data.totalKmDriven.toLocaleString()} km</div>
                    </td>
                    <td className="px-4 py-3">
                        <ProgressBar value={data.monthsElapsed} limit={POLICY_YEAR_LIMIT * 12} colorClass={timeProgress > 85 ? 'bg-red-500' : timeProgress > 60 ? 'bg-amber-500' : 'bg-green-500'} />
                        <div className="text-xs text-gray-300 mt-1">{Math.floor(data.monthsElapsed/12)}Y {data.monthsElapsed % 12}M</div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{formatDate(data.policyStartDate)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusPillClass(data.status)}`}>{data.status}</span></td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-850">
                        <td colSpan={6} className="p-4">
                            <h4 className="font-semibold text-gray-200 mb-2">Assignment Details for {data.user.name}</h4>
                            <table className="min-w-full divide-y divide-gray-700 text-xs">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-400">Vehicle</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-400">Assignment Period</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-400">KM Driven</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {data.assignments.map(a => (
                                        <tr key={a.vehicle.id + a.historyEntry.startDate}>
                                            <td className="px-3 py-2">{a.vehicle.make} {a.vehicle.model} ({a.vehicle.licensePlate})</td>
                                            <td className="px-3 py-2">{formatDate(a.historyEntry.startDate)} to {formatDate(a.historyEntry.endDate)}</td>
                                            <td className="px-3 py-2 text-right">{a.kmDriven.toLocaleString()} km</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
             {employeePolicyData.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">No employees with vehicle assignment history found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeePolicyPage;