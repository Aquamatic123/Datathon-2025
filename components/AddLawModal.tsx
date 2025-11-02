import { useState } from 'react';
import { Law, StockImpacted } from '@/types';
import { X, Sparkles } from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import DocumentAnalysisModal from './DocumentAnalysisModal';

interface AddLawModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function AddLawModal({ onClose, onSave }: AddLawModalProps) {
  const [lawId, setLawId] = useState('');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [law, setLaw] = useState<Law>({
    jurisdiction: '',
    status: 'Pending',
    sector: '',
    impact: 0,
    confidence: 'Medium',
    published: new Date().toISOString().split('T')[0],
    affected: 0,
    stocks_impacted: {
      STOCK_IMPACTED: [],
    },
  });

  const handleAnalysisComplete = (data: any) => {
    // Set document from analysis
    if (data.document) {
      setLaw({ ...law, document: data.document });
    }
    
    // When backend is ready, it will populate these fields:
    // setLaw({ ...law, ...data.extractedData });
    
    setShowAnalysisModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lawId.trim()) {
      alert('Please enter a Law ID');
      return;
    }

    try {
      const encodedLawId = encodeURIComponent(lawId);
      const response = await fetch(`/api/laws/${encodedLawId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(law),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        alert(`Failed to create law: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating law:', error);
      alert('Error creating law');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add New Law</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            {/* Quick Upload Option */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Auto-fill from Document</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload a law document and let the backend automatically extract all details
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAnalysisModal(true)}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Upload Document for Analysis
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or enter manually</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Law ID *
              </label>
              <input
                type="text"
                value={lawId}
                onChange={(e) => setLawId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Law Document (Optional)
              </label>
              <DocumentUpload
                onDocumentUpload={(document) => setLaw({ ...law, document })}
                currentDocument={law.document}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jurisdiction *
                </label>
                <input
                  type="text"
                  value={law.jurisdiction}
                  onChange={(e) =>
                    setLaw({ ...law, jurisdiction: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={law.status}
                  onChange={(e) => setLaw({ ...law, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                >
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector *
                </label>
                <input
                  type="text"
                  value={law.sector}
                  onChange={(e) => setLaw({ ...law, sector: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Impact (0-10) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={law.impact}
                  onChange={(e) =>
                    setLaw({ ...law, impact: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confidence *
                </label>
                <select
                  value={law.confidence}
                  onChange={(e) => setLaw({ ...law, confidence: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Published Date *
                </label>
                <input
                  type="date"
                  value={law.published}
                  onChange={(e) => setLaw({ ...law, published: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                You can add stocks after creating the law.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Law
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      {showAnalysisModal && (
        <DocumentAnalysisModal
          onClose={() => setShowAnalysisModal(false)}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
    </div>
  );
}
