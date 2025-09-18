import React from 'react';
import { BanknotesIcon } from '../../constants';

const CreditLinesPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-100 flex items-center">
                <BanknotesIcon className="w-8 h-8 mr-3 text-gray-500" />
                Credit Lines
            </h1>
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
                <p className="text-gray-400 mt-2">
                    The Wholesale Finance module, including Credit Lines, is not included in this application.
                </p>
            </div>
        </div>
    );
}

export default CreditLinesPage;
