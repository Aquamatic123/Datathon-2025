import { useState } from 'react';
import { Law } from '@/types';
import { X } from 'lucide-react';

interface AddLawModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function AddLawModal({ onClose, onSave }: AddLawModalProps) {
  const [lawId, setLawId] = useState('');
  const [law, setLaw] = useState<Law>({
    jurisdiction: '',
    status: 'Pending',
    sector: '',
    impact: 0,
    confidence: 'Medium',
    published: new Date().toISOString().split('T')[0],
    affected: 0,
    stocks_impacted: { STOCK_IMPACTED: [] },
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/laws/${encodeURIComponent(lawId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(law),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Error creating law:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add New Law</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={loading}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Law ID *</label>
              <input
                type="text"
                value={lawId}
                onChange={(e) => setLawId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction *</label>
                <input
                  type="text"
                  value={law.jurisdiction}
                  onChange={(e) => setLaw({ ...law, jurisdiction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={law.status}
                  onChange={(e) => setLaw({ ...law, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                  disabled={loading}
                >
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sector *</label>
                <input
                  type="text"
                  value={law.sector}
                  onChange={(e) => setLaw({ ...law, sector: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Impact (0-10) *</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={law.impact}
                  onChange={(e) => setLaw({ ...law, impact: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confidence *</label>
                <select
                  value={law.confidence}
                  onChange={(e) => setLaw({ ...law, confidence: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                  disabled={loading}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Published Date *</label>
                <input
                  type="date"
                  value={law.published}
                  onChange={(e) => setLaw({ ...law, published: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Law'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
