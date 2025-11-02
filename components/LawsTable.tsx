import { Database } from '@/types';
import { ExternalLink, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/router';

interface LawsTableProps {
  database: Database;
  onUpdate: () => void;
}

export default function LawsTable({ database, onUpdate }: LawsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const handleDelete = async (lawId: string) => {
    if (!confirm('Are you sure you want to delete this law?')) {
      return;
    }

    setDeletingId(lawId);
    try {
      const encodedLawId = encodeURIComponent(lawId);
      const response = await fetch(`/api/laws/${encodedLawId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to delete law');
      }
    } catch (error) {
      console.error('Error deleting law:', error);
      alert('Error deleting law');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    const lawCount = Object.keys(database.DATA).length;
    if (lawCount === 0) {
      alert('No laws to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${lawCount} laws? This cannot be undone.`)) {
      return;
    }

    setClearingAll(true);
    try {
      const lawIds = Object.keys(database.DATA);
      const deletePromises = lawIds.map(lawId => 
        fetch(`/api/laws/${encodeURIComponent(lawId)}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      onUpdate();
    } catch (error) {
      console.error('Error clearing all laws:', error);
      alert('Error clearing all laws');
    } finally {
      setClearingAll(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const laws = Object.entries(database.DATA);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Laws & Regulations</h2>
        {laws.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearingAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" />
            {clearingAll ? 'Clearing...' : 'Clear All'}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Law ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jurisdiction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sector
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stocks Affected
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {laws.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No laws found. Click "Add New Law" to get started.
                </td>
              </tr>
            ) : (
              laws.map(([lawId, law]) => (
                <tr
                  key={lawId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/laws/${lawId}`);
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {lawId}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {law.jurisdiction}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {law.sector}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        law.status
                      )}`}
                    >
                      {law.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="font-medium">{law.impact}/10</span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(law.impact / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getConfidenceColor(
                        law.confidence
                      )}`}
                    >
                      {law.confidence}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {law.affected}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/laws/${lawId}`);
                        }}
                        className="text-blue-600 hover:text-blue-900 cursor-pointer"
                        title="View law details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(lawId);
                        }}
                        disabled={deletingId === lawId}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

