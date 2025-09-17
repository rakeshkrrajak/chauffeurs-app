
import React from 'react';
import { ClipboardDocumentCheckIcon } from '../../constants';
import { Audit, AuditStatus, Dealership } from '../../types';

interface AuditsPageProps {
  audits: Audit[];
  dealerships: Dealership[];
}

const AuditsPage: React.FC<AuditsPageProps> = ({ audits, dealerships }) => {
    
    const getDealershipName = (id: string) => dealerships.find(d => d.id === id)?.name || "Unknown Dealer";

    const getStatusPill = (status: AuditStatus) => {
        switch(status) {
            case AuditStatus.SCHEDULED: return 'bg-blue-700 text-blue-200';
            case AuditStatus.IN_PROGRESS: return 'bg-yellow-700 text-yellow-200';
            case AuditStatus.COMPLETED: return 'bg-green-700 text-green-200';
            case AuditStatus.CANCELLED: return 'bg-red-700 text-red-200';
            default: return 'bg-gray-600 text-gray-300';
        }
    };
    
    const getVerifiedCount = (audit: Audit) => {
        return audit.auditedVehicles.filter(v => v.verificationStatus === 'Verified').length;
    };

    const getMissingCount = (audit: Audit) => {
        return audit.auditedVehicles.filter(v => v.verificationStatus === 'Missing').length;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-100 flex items-center">
                <ClipboardDocumentCheckIcon className="w-8 h-8 mr-3 text-primary-400" />
                Dealership Audits
            </h1>
            <p className="text-gray-400">Schedule, track, and review physical inventory audits.</p>
            
            <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-750">
                        <tr>
                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Audit Date</th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Dealership</th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Auditor</th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                           <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Vehicles Audited</th>
                           <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Discrepancies</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {audits.map(audit => (
                            <tr key={audit.id} className="hover:bg-gray-750">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{new Date(audit.auditDate).toLocaleDateString('en-IN')}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-200">{getDealershipName(audit.dealershipId)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{audit.auditorName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusPill(audit.status)}`}>{audit.status}</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">{getVerifiedCount(audit)} / {audit.auditedVehicles.length}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-bold ${getMissingCount(audit) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {getMissingCount(audit)}
                                </td>
                            </tr>
                        ))}
                        {audits.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-10 text-gray-500">No audits have been scheduled.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditsPage;
