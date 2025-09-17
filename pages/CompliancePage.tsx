


import React, { useMemo, useState, useCallback } from 'react';
import { Vehicle, DocumentType } from '../types';
import { ArrowDownTrayIcon } from '../constants';
import { exportToCsv } from '../services/reportService';


interface CompliancePageProps {
  vehicles: Vehicle[];
}

const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";

const CompliancePage: React.FC<CompliancePageProps> = ({ vehicles }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  const getDaysUntilExpiry = (expiryDate?: string): number | null => {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0,0,0,0); 
    const expDate = new Date(expiryDate);
     if (isNaN(expDate.getTime())) return null;
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatusClass = (days?: number | null): string => {
    if (days === null || days === undefined) return 'text-gray-500'; // Muted for N/A
    if (days < 0) return 'text-red-400 font-semibold'; // Expired
    if (days <= 30) return 'text-amber-400 font-semibold'; // Expires soon
    return 'text-green-400'; // Valid
  };
  
  // @fi-fix: Updated to read document details from the 'documents' array on the Vehicle object.
  const getDocumentDisplayInfo = useCallback((vehicle: Vehicle, docType: DocumentType) => {
    const doc = vehicle.documents?.find(d => d.type === docType);
    if (!doc) {
      return { number: 'N/A', expiryDateFormatted: 'N/A', daysUntilExpiry: null };
    }
    
    return {
      number: doc.number || 'N/A',
      expiryDateFormatted: formatDate(doc.expiryDate),
      daysUntilExpiry: getDaysUntilExpiry(doc.expiryDate),
    };
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // @fi-fix: Updated search logic to look for RC number inside the 'documents' array.
      const searchTermLower = searchTerm.toLowerCase();
      const rcDoc = vehicle.documents?.find(d => d.type === DocumentType.RC);

      return (
        vehicle.licensePlate.toLowerCase().includes(searchTermLower) ||
        vehicle.make.toLowerCase().includes(searchTermLower) ||
        vehicle.model.toLowerCase().includes(searchTermLower) ||
        (rcDoc?.number && rcDoc.number.toLowerCase().includes(searchTermLower))
      );
    });
  }, [vehicles, searchTerm]);
  
  const handleDownloadReport = useCallback(() => {
    const dataToExport = filteredVehicles.map(v => {
      const rcInfo = getDocumentDisplayInfo(v, DocumentType.RC);
      const insuranceInfo = getDocumentDisplayInfo(v, DocumentType.INSURANCE);
      const fitnessInfo = getDocumentDisplayInfo(v, DocumentType.FITNESS);
      const pucInfo = getDocumentDisplayInfo(v, DocumentType.PUC);

      return {
        makeModel: `${v.make} ${v.model}`,
        licensePlate: v.licensePlate,
        rcNumber: rcInfo.number,
        rcExpiry: rcInfo.expiryDateFormatted,
        insuranceNumber: insuranceInfo.number,
        insuranceExpiry: insuranceInfo.expiryDateFormatted,
        fitnessNumber: fitnessInfo.number,
        fitnessExpiry: fitnessInfo.expiryDateFormatted,
        pucNumber: pucInfo.number,
        pucExpiry: pucInfo.expiryDateFormatted,
      };
    });

    const headers = [
      { key: 'makeModel', label: 'Vehicle' },
      { key: 'licensePlate', label: 'License Plate' },
      { key: 'rcNumber', label: 'RC Number' },
      { key: 'rcExpiry', label: 'RC Expiry' },
      { key: 'insuranceNumber', label: 'Insurance Number' },
      { key: 'insuranceExpiry', label: 'Insurance Expiry' },
      { key: 'fitnessNumber', label: 'Fitness Number' },
      { key: 'fitnessExpiry', label: 'Fitness Expiry' },
      { key: 'pucNumber', label: 'PUC Number' },
      { key: 'pucExpiry', label: 'PUC Expiry' },
    ];

    exportToCsv(`fleetpro_compliance_report_${new Date().toISOString().split('T')[0]}.csv`, dataToExport, headers);
  }, [filteredVehicles, getDocumentDisplayInfo]);


  const handleVerifyVahan = (licensePlate: string) => {
    alert(`Mock: Initiating Vahan verification for ${licensePlate}...\nThis would typically involve an API call.`);
    setTimeout(() => {
      const success = Math.random() > 0.3; 
      alert(`Vahan Verification for ${licensePlate}: ${success ? 'Details matched successfully!' : 'Could not verify or details mismatch.'}`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-100">Compliance Management</h1>
        <button onClick={handleDownloadReport} className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2.5 px-5 rounded-lg shadow-md transition-colors duration-150 ease-in-out flex items-center">
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Download Report
        </button>
      </div>
      <p className="text-gray-400 -mt-2">Track vehicle documentation and compliance status.</p>

       <input
        type="text"
        placeholder="Search by License Plate, Make, Model, RC No..."
        className={`${inputFieldStyle} w-full p-3 text-base`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="bg-gray-800 p-6 rounded-xl shadow-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750"> {/* Slightly lighter header for dark theme */}
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vehicle</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">RC</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Insurance</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fitness</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">PUC</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredVehicles.map(vehicle => {
              const rcInfo = getDocumentDisplayInfo(vehicle, DocumentType.RC);
              const insuranceInfo = getDocumentDisplayInfo(vehicle, DocumentType.INSURANCE);
              const fitnessInfo = getDocumentDisplayInfo(vehicle, DocumentType.FITNESS);
              const pucInfo = getDocumentDisplayInfo(vehicle, DocumentType.PUC);
              
              return (
                <tr key={vehicle.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-100">{vehicle.make} {vehicle.model}</div>
                    <div className="text-xs text-gray-400">{vehicle.licensePlate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className={getExpiryStatusClass(rcInfo.daysUntilExpiry)}>{rcInfo.expiryDateFormatted}</div>
                    <div className="text-xs text-gray-500">{rcInfo.number}</div>
                    {rcInfo.daysUntilExpiry !== null && rcInfo.daysUntilExpiry < 0 && <span className="text-xs text-red-400 block">Expired!</span>}
                    {rcInfo.daysUntilExpiry !== null && rcInfo.daysUntilExpiry >= 0 && rcInfo.daysUntilExpiry <= 30 && <span className="text-xs text-amber-400 block">{rcInfo.daysUntilExpiry} days left</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className={getExpiryStatusClass(insuranceInfo.daysUntilExpiry)}>{insuranceInfo.expiryDateFormatted}</div>
                    <div className="text-xs text-gray-500">{insuranceInfo.number}</div>
                    {insuranceInfo.daysUntilExpiry !== null && insuranceInfo.daysUntilExpiry < 0 && <span className="text-xs text-red-400 block">Expired!</span>}
                    {insuranceInfo.daysUntilExpiry !== null && insuranceInfo.daysUntilExpiry >= 0 && insuranceInfo.daysUntilExpiry <= 30 && <span className="text-xs text-amber-400 block">{insuranceInfo.daysUntilExpiry} days left</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className={getExpiryStatusClass(fitnessInfo.daysUntilExpiry)}>{fitnessInfo.expiryDateFormatted}</div>
                    <div className="text-xs text-gray-500">{fitnessInfo.number}</div>
                    {fitnessInfo.daysUntilExpiry !== null && fitnessInfo.daysUntilExpiry < 0 && <span className="text-xs text-red-400 block">Expired!</span>}
                    {fitnessInfo.daysUntilExpiry !== null && fitnessInfo.daysUntilExpiry >= 0 && fitnessInfo.daysUntilExpiry <= 30 && <span className="text-xs text-amber-400 block">{fitnessInfo.daysUntilExpiry} days left</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className={getExpiryStatusClass(pucInfo.daysUntilExpiry)}>{pucInfo.expiryDateFormatted}</div>
                    <div className="text-xs text-gray-500">{pucInfo.number}</div>
                    {pucInfo.daysUntilExpiry !== null && pucInfo.daysUntilExpiry < 0 && <span className="text-xs text-red-400 block">Expired!</span>}
                    {pucInfo.daysUntilExpiry !== null && pucInfo.daysUntilExpiry >= 0 && pucInfo.daysUntilExpiry <= 30 && <span className="text-xs text-amber-400 block">{pucInfo.daysUntilExpiry} days left</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleVerifyVahan(vehicle.licensePlate)}
                      className="text-primary-400 hover:text-primary-300 transition-colors text-xs py-1 px-2 bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      Verify Vahan
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredVehicles.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-10">
                        No vehicles found matching your search criteria, or no vehicles to display.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompliancePage;