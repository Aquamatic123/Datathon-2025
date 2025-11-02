import { useState } from 'react';
import { Law, StockImpacted } from '@/types';
import { X, Edit2, Plus, Trash2 } from 'lucide-react';

interface LawDetailsModalProps {
  lawId: string;
  law: Law;
  onClose: () => void;
  onUpdate: () => void;
}

export default function LawDetailsModal({ lawId, law, onClose, onUpdate }: LawDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLaw, setEditedLaw] = useState<Law>(law);
  const [showAddStock, setShowAddStock] = useState(false);
  const [newStock, setNewStock] = useState<Partial<StockImpacted>>({
    ticker: '',
    company_name: '',
    sector: law.sector,
    impact_score: 0,
    correlation_confidence: 'Medium',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/laws/${encodeURIComponent(lawId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedLaw),
      });
      if (response.ok) {
        setIsEditing(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating law:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/laws/${encodeURIComponent(lawId)}?ticker=${encodeURIComponent(newStock.ticker || '')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStock as StockImpacted),
      });
      if (response.ok) {
        setShowAddStock(false);
        setNewStock({
          ticker: '',
          company_name: '',
          sector: law.sector,
          impact_score: 0,
          correlation_confidence: 'Medium',
          notes: '',
        });
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStock = async (ticker: string) => {
    if (!confirm(`Are you sure you want to remove ${ticker}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/laws/${encodeURIComponent(lawId)}?ticker=${encodeURIComponent(ticker)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error removing stock:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{lawId}</h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <Edit2 className="h-4 w-4 inline mr-1" />
                Edit
              </button>
            )}
            <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                  <input
                    type="text"
                    value={editedLaw.jurisdiction}
                    onChange={(e) => setEditedLaw({ ...editedLaw, jurisdiction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editedLaw.status}
                    onChange={(e) => setEditedLaw({ ...editedLaw, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={loading}
                  >
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Expired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                  <input
                    type="text"
                    value={editedLaw.sector}
                    onChange={(e) => setEditedLaw({ ...editedLaw, sector: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impact (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={editedLaw.impact}
                    onChange={(e) => setEditedLaw({ ...editedLaw, impact: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
                  <select
                    value={editedLaw.confidence}
                    onChange={(e) => setEditedLaw({ ...editedLaw, confidence: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={loading}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Published Date</label>
                  <input
                    type="date"
                    value={editedLaw.published}
                    onChange={(e) => setEditedLaw({ ...editedLaw, published: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedLaw(law);
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Jurisdiction</label>
                  <p className="text-lg text-gray-900">{law.jurisdiction}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-lg text-gray-900">{law.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sector</label>
                  <p className="text-lg text-gray-900">{law.sector}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Impact</label>
                  <p className="text-lg text-gray-900">{law.impact}/10</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Confidence</label>
                  <p className="text-lg text-gray-900">{law.confidence}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Published</label>
                  <p className="text-lg text-gray-900">{new Date(law.published).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Stocks Affected</label>
                  <p className="text-lg text-gray-900">{law.affected}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Impacted Stocks</h3>
                  <button
                    onClick={() => setShowAddStock(!showAddStock)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stock
                  </button>
                </div>

                {showAddStock && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Ticker"
                        value={newStock.ticker}
                        onChange={(e) => setNewStock({ ...newStock, ticker: e.target.value.toUpperCase() })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled={loading}
                      />
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={newStock.company_name}
                        onChange={(e) => setNewStock({ ...newStock, company_name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled={loading}
                      />
                      <input
                        type="number"
                        min="0"
                        max="10"
                        placeholder="Impact Score"
                        value={newStock.impact_score}
                        onChange={(e) => setNewStock({ ...newStock, impact_score: parseInt(e.target.value) || 0 })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled={loading}
                      />
                      <select
                        value={newStock.correlation_confidence}
                        onChange={(e) => setNewStock({ ...newStock, correlation_confidence: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled={loading}
                      >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Notes"
                      value={newStock.notes}
                      onChange={(e) => setNewStock({ ...newStock, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={2}
                      disabled={loading}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddStock}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : 'Add Stock'}
                      </button>
                      <button
                        onClick={() => setShowAddStock(false)}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {law.stocks_impacted.STOCK_IMPACTED.length === 0 ? (
                    <p className="text-gray-500 text-sm">No stocks added yet.</p>
                  ) : (
                    law.stocks_impacted.STOCK_IMPACTED.map((stock, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">{stock.ticker}</span>
                            <span className="text-sm text-gray-600">{stock.company_name}</span>
                            <span className="text-sm text-gray-500">Impact: {stock.impact_score}/10</span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{stock.correlation_confidence}</span>
                          </div>
                          {stock.notes && <p className="text-sm text-gray-500 mt-1">{stock.notes}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteStock(stock.ticker)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-800 ml-4 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
