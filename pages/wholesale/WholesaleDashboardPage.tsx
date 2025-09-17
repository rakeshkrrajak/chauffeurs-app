
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BanknotesIcon, BuildingStorefrontIcon, RectangleStackIcon, ClipboardDocumentCheckIcon } from '../../constants';
import { Dealership, CreditLine, InventoryUnit, Audit, AuditStatus, InventoryUnitStatus, CreditLineStatus } from '../../types';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    linkTo?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, linkTo }) => {
  const content = (
    <div className={`bg-gray-800 p-6 rounded-xl shadow-xl flex items-center space-x-4 border-l-4 ${color}`}>
      <div className="shrink-0 p-3 bg-gray-700 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-3xl font-semibold text-gray-100">{value}</p>
      </div>
    </div>
  );
  
  if(linkTo) {
      return <Link to={linkTo} className="hover:opacity-90 transition-opacity">{content}</Link>
  }
  return content;
};


interface WholesaleDashboardPageProps {
    dealerships: Dealership[];
    creditLines: CreditLine[];
    inventory: InventoryUnit[];
    audits: Audit[];
}

const WholesaleDashboardPage: React.FC<WholesaleDashboardPageProps> = ({ dealerships, creditLines, inventory, audits }) => {
    
    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(2)} Cr`;
        }
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)} L`;
        }
        return `₹${amount.toLocaleString()}`;
    };

    const dashboardStats = useMemo(() => {
        const totalDisbursed = inventory.reduce((sum, unit) => sum + unit.financedAmount, 0);
        const totalLimit = creditLines.reduce((sum, line) => sum + line.totalLimit, 0);
        const totalAvailable = creditLines.reduce((sum, line) => sum + line.availableCredit, 0);
        const activeDealerships = dealerships.filter(d => d.status === 'Active').length;
        const inventoryInStockCount = inventory.filter(u => u.status === InventoryUnitStatus.IN_STOCK).length;
        const overdueAccounts = creditLines.filter(cl => cl.status === CreditLineStatus.SUSPENDED).length; // Example logic
        const pendingRepayments = inventory
            .filter(u => u.status === InventoryUnitStatus.IN_STOCK)
            .reduce((sum, unit) => sum + unit.financedAmount, 0);
        
        return {
            totalDisbursed: formatCurrency(totalDisbursed),
            activeDealerships: activeDealerships.toString(),
            inventoryInStockCount: `${inventoryInStockCount} Units`,
            totalAvailable: formatCurrency(totalAvailable),
            pendingRepayments: formatCurrency(pendingRepayments),
            overdueAccounts: overdueAccounts.toString(),
            utilization: totalLimit > 0 ? ((totalLimit - totalAvailable) / totalLimit) * 100 : 0
        };
    }, [dealerships, creditLines, inventory]);

    const upcomingAudits = useMemo(() => 
        audits
            .filter(a => a.status === AuditStatus.SCHEDULED)
            .sort((a,b) => new Date(a.auditDate).getTime() - new Date(b.auditDate).getTime())
            .slice(0, 4)
    , [audits]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-bold text-gray-100">Wholesale Finance Dashboard</h1>
        <p className="text-gray-400 mt-2 text-lg">High-level overview of dealership financing operations.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Credit Disbursed" value={dashboardStats.totalDisbursed} icon={<BanknotesIcon className="w-8 h-8 text-green-400" />} color="border-green-500" />
        <StatCard title="Active Dealerships" value={dashboardStats.activeDealerships} icon={<BuildingStorefrontIcon className="w-8 h-8 text-blue-400" />} color="border-blue-500" linkTo="/wholesale/dealerships" />
        <StatCard title="Inventory In Stock" value={dashboardStats.inventoryInStockCount} icon={<RectangleStackIcon className="w-8 h-8 text-purple-400" />} color="border-purple-500" linkTo="/wholesale/inventory" />
        <StatCard title="Total Available Credit" value={dashboardStats.totalAvailable} icon={<BanknotesIcon className="w-8 h-8 text-sky-400" />} color="border-sky-500" linkTo="/wholesale/credit-lines" />
        <StatCard title="Pending Repayments" value={dashboardStats.pendingRepayments} icon={<BanknotesIcon className="w-8 h-8 text-amber-400" />} color="border-amber-500" />
        <StatCard title="Overdue Accounts" value={dashboardStats.overdueAccounts} icon={<BuildingStorefrontIcon className="w-8 h-8 text-red-400" />} color="border-red-500" />
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-xl">
                <h2 className="text-2xl font-semibold text-gray-100 mb-6">Overall Credit Utilization</h2>
                <div className="w-full bg-gray-700 rounded-full h-8 relative">
                    <div className="bg-primary-600 h-8 rounded-full" style={{width: `${dashboardStats.utilization.toFixed(1)}%`}}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                        {dashboardStats.utilization.toFixed(1)}% Utilized
                    </span>
                </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl shadow-xl flex flex-col justify-center">
                 <h2 className="text-2xl font-semibold text-gray-100 mb-4">Quick Actions</h2>
                 <div className="flex flex-wrap gap-2">
                     <Link to="/wholesale/inventory" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm text-center">Fund New Inventory</Link>
                     <Link to="/wholesale/dealerships" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm text-center">Add New Dealership</Link>
                 </div>
            </div>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-100 mb-6">Upcoming Audits</h2>
          {upcomingAudits.length > 0 ? (
            <ul className="space-y-3">
              {upcomingAudits.map(audit => (
                <li key={audit.id} className="text-sm text-gray-300 p-2 bg-gray-700 rounded-md flex justify-between items-center">
                    <div>
                        <span className="font-semibold text-primary-300">{dealerships.find(d => d.id === audit.dealershipId)?.name || "Unknown Dealer"}</span>
                        <span className="text-gray-400 text-xs block">Auditor: {audit.auditorName}</span>
                    </div>
                    <span className="text-gray-400 font-medium">{new Date(audit.auditDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">No upcoming audits scheduled.</p>
          )}
           <Link to="/wholesale/audits" className="text-primary-400 hover:underline text-xs mt-4 block text-right">View All Audits &rarr;</Link>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-100 mb-6">Recent Transactions (Mock)</h2>
          <ul className="space-y-3">
            <li className="text-sm text-gray-300">Funding of ₹12,00,000 to "Prestige Motors" for 5 units.</li>
            <li className="text-sm text-gray-300">Repayment of ₹8,50,000 from "Capital Auto".</li>
            <li className="text-sm text-gray-300">Credit line increase for "Sunrise Cars" to ₹1 Cr.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WholesaleDashboardPage;
