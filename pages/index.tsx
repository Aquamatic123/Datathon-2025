import { useState, useEffect } from 'react';
import { Database, Analytics } from '@/types';
import DashboardHeader from '@/components/DashboardHeader';
import AnalyticsCards from '@/components/AnalyticsCards';
import LawsTable from '@/components/LawsTable';
import AddLawModal from '@/components/AddLawModal';

export default function Dashboard() {
  const [database, setDatabase] = useState<Database | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [lawsRes, analyticsRes] = await Promise.all([
        fetch('/api/laws'),
        fetch('/api/laws?analytics=true')
      ]);
      
      const lawsData = await lawsRes.json();
      const analyticsData = await analyticsRes.json();
      
      setDatabase(lawsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddLaw = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onAddLaw={handleAddLaw} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analytics && <AnalyticsCards analytics={analytics} />}
        
        <div className="mt-8">
          {database && (
            <LawsTable
              database={database}
              onUpdate={fetchData}
            />
          )}
        </div>
      </main>

      {showAddModal && (
        <AddLawModal
          onClose={handleCloseAddModal}
          onSave={handleCloseAddModal}
        />
      )}
    </div>
  );
}

