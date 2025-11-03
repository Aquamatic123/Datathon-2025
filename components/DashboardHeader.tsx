import { Plus, Upload } from 'lucide-react';

interface DashboardHeaderProps {
  onAddLaw: () => void;
  onUploadDocument: () => void;
}

export default function DashboardHeader({ onAddLaw, onUploadDocument }: DashboardHeaderProps) {
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
          <div className="flex gap-2">
            <button
              onClick={onUploadDocument}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </button>
            <button
              onClick={onAddLaw}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Manually
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

