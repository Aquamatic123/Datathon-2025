import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  onAddLaw: () => void;
}

export default function DashboardHeader({ onAddLaw }: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Regulatory Impact CRM
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track and analyze laws and regulations impact on financial markets
            </p>
          </div>
          <button
            onClick={onAddLaw}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Law
          </button>
        </div>
      </div>
    </header>
  );
}

