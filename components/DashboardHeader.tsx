import { Upload } from 'lucide-react';

interface DashboardHeaderProps {
  onQuickUpload: () => void;
}

export default function DashboardHeader({ onQuickUpload }: DashboardHeaderProps) {
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
            onClick={onQuickUpload}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload & Analyze Document
          </button>
        </div>
      </div>
    </header>
  );
}

