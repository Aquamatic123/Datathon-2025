import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Law, StockImpacted } from '@/types';
import { ArrowLeft, Edit2, Plus, Trash2, Save, X } from 'lucide-react';

export default function LawDetailsPage() {
  const router = useRouter();
  const { lawId } = router.query;
  const [law, setLaw] = useState<Law | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLaw, setEditedLaw] = useState<Law | null>(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [newStock, setNewStock] = useState<Partial<StockImpacted>>({
    ticker: '',
    company_name: '',
    sector: '',
    impact_score: 0,
    correlation_confidence: 'Medium',
    notes: '',
  });

  useEffect(() => {
    if (lawId && typeof lawId === 'string') {
      fetchLaw(lawId);
    }
  }, [lawId]);

  const fetchLaw = async (id: string) => {
    try {
      const encodedId = encodeURIComponent(id);
      const response = await fetch(`/api/laws/${encodedId}`);
      if (response.ok) {
        const data = await response.json();
        setLaw(data);
        setEditedLaw(data);
        if (data.sector) {
          setNewStock(prev => ({ ...prev, sector: data.sector }));
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching law:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lawId || typeof lawId !== 'string' || !editedLaw) return;

    try {
      const encodedLawId = encodeURIComponent(lawId);
      const response = await fetch(`/api/laws/${encodedLawId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedLaw),
      });

      if (response.ok) {
        setIsEditing(false);
        fetchLaw(lawId);
      } else {
        alert('Failed to update law');
      }
    } catch (error) {
      console.error('Error updating law:', error);
      alert('Error updating law');
    }
  };

  const handleAddStock = async () => {
    if (!lawId || typeof lawId !== 'string' || !law) return;

    try {
      const encodedLawId = encodeURIComponent(lawId);
      const encodedTicker = encodeURIComponent(newStock.ticker || '');
      const response = await fetch(`/api/laws/${encodedLawId}?ticker=${encodedTicker}`, {
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
        fetchLaw(lawId);
      } else {
        alert('Failed to add stock');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Error adding stock');
    }
  };

  const handleDeleteStock = async (ticker: string) => {
    if (!lawId || typeof lawId !== 'string') return;
    if (!confirm(`Are you sure you want to remove ${ticker}?`)) {
      return;
    }

    try {
      const encodedLawId = encodeURIComponent(lawId);
      const encodedTicker = encodeURIComponent(ticker);
      const response = await fetch(`/api/laws/${encodedLawId}?ticker=${encodedTicker}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLaw(lawId);
      } else {
        alert('Failed to remove stock');
      }
    } catch (error) {
      console.error('Error removing stock:', error);
      alert('Error removing stock');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!law) {
    return null;
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{lawId}</h1>
                <p className="text-sm text-gray-500 mt-1">Law Details</p>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedLaw(law);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Law Information Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Law Information</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50 w-1/4">
                    Jurisdiction
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isEditing && editedLaw ? (
                      <input
                        type="text"
                        value={editedLaw.jurisdiction}
                        onChange={(e) =>
                          setEditedLaw({ ...editedLaw, jurisdiction: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      />
                    ) : (
                      law.jurisdiction
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    Status
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isEditing && editedLaw ? (
                      <select
                        value={editedLaw.status}
                        onChange={(e) =>
                          setEditedLaw({ ...editedLaw, status: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      >
                        <option>Active</option>
                        <option>Pending</option>
                        <option>Expired</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          law.status
                        )}`}
                      >
                        {law.status}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    Sector
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isEditing && editedLaw ? (
                      <input
                        type="text"
                        value={editedLaw.sector}
                        onChange={(e) =>
                          setEditedLaw({ ...editedLaw, sector: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      />
                    ) : (
                      law.sector
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    Impact
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isEditing && editedLaw ? (
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editedLaw.impact}
                        onChange={(e) =>
                          setEditedLaw({ ...editedLaw, impact: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center">
                        <span className="font-medium">{law.impact}/10</span>
                        <div className="ml-2 w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(law.impact / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    Confidence
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isEditing && editedLaw ? (
                      <select
                        value={editedLaw.confidence}
                        onChange={(e) =>
                          setEditedLaw({ ...editedLaw, confidence: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getConfidenceColor(
                          law.confidence
                        )}`}
                      >
                        {law.confidence}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    Published Date
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isEditing && editedLaw ? (
                      <input
                        type="date"
                        value={editedLaw.published}
                        onChange={(e) =>
                          setEditedLaw({ ...editedLaw, published: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      />
                    ) : (
                      new Date(law.published).toLocaleDateString()
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                    Stocks Affected
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {law.affected}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Stocks Impacted Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Stocks Impacted</h2>
            {!isEditing && (
              <button
                onClick={() => setShowAddStock(!showAddStock)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Stock
              </button>
            )}
          </div>

          {showAddStock && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ticker *
                  </label>
                  <input
                    type="text"
                    placeholder="TSLA"
                    value={newStock.ticker}
                    onChange={(e) =>
                      setNewStock({ ...newStock, ticker: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Tesla Inc."
                    value={newStock.company_name}
                    onChange={(e) =>
                      setNewStock({ ...newStock, company_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sector *
                  </label>
                  <input
                    type="text"
                    value={newStock.sector || law.sector}
                    onChange={(e) =>
                      setNewStock({ ...newStock, sector: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Impact Score (0-10) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={newStock.impact_score}
                    onChange={(e) =>
                      setNewStock({ ...newStock, impact_score: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correlation Confidence *
                  </label>
                  <select
                    value={newStock.correlation_confidence}
                    onChange={(e) =>
                      setNewStock({ ...newStock, correlation_confidence: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    placeholder="Additional notes..."
                    value={newStock.notes}
                    onChange={(e) =>
                      setNewStock({ ...newStock, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddStock}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Add Stock
                </button>
                <button
                  onClick={() => setShowAddStock(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impact Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correlation Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  {!isEditing && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {law.stocks_impacted.STOCK_IMPACTED.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isEditing ? 6 : 7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No stocks added yet.
                    </td>
                  </tr>
                ) : (
                  law.stocks_impacted.STOCK_IMPACTED.map((stock, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stock.ticker}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {stock.company_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {stock.sector}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="font-medium">{stock.impact_score}/10</span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${(stock.impact_score / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getConfidenceColor(
                            stock.correlation_confidence
                          )}`}
                        >
                          {stock.correlation_confidence}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {stock.notes || '-'}
                      </td>
                      {!isEditing && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteStock(stock.ticker)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

