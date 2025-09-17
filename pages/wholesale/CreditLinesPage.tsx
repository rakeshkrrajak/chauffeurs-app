
import React from 'react';
import { BanknotesIcon } from '../../constants';
import { CreditLine, Dealership } from '../../types';

interface CreditLinesPageProps {
  creditLines: CreditLine[];
  dealerships: Dealership[];
}

const CreditLinesPage: React.FC<CreditLinesPageProps> = ({ creditLines, dealerships }) => {
    
    const getDealershipName = (dealershipId: string) => {
        return dealerships.find(d => d.id === dealershipId)?.name || 'Unknown';
    };

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

    return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center">
            <BanknotesIcon className="w-8 h-8 mr-3 text-primary-400" />
            Credit Lines
        </h1>
        <p className="text-gray-400">Overview of all active credit lines with dealerships.</p>

        <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-750">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dealership</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Total Limit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Available Credit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Interest Rate (APR)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Utilization</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {creditLines.map(line => {
                        const utilization = line.totalLimit > 0 ? ((line.totalLimit - line.availableCredit) / line.totalLimit) * 100 : 0;
                        return (
                            <tr key={line.id} className="hover:bg-gray-750">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{getDealershipName(line.dealershipId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{line.status}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">{formatCurrency(line.totalLimit)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-400">{formatCurrency(line.availableCredit)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">{line.interestRate.toFixed(2)}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                                        <div className="bg-primary-500 h-2.5 rounded-full" style={{width: `${utilization}%`}} title={`${utilization.toFixed(1)}%`}></div>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                     {creditLines.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-10 text-gray-500">No credit lines have been set up.</td></tr>
                     )}
                </tbody>
            </table>
        </div>

    </div>
    );
}

export default CreditLinesPage;
