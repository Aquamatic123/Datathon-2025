import { useState, useEffect } from 'react';
import { Database, Analytics } from '@/types';
import DashboardHeader from '@/components/DashboardHeader';
import AnalyticsCards from '@/components/AnalyticsCards';
import LawsTable from '@/components/LawsTable';
import DocumentAnalysisModal from '@/components/DocumentAnalysisModal';

export default function Dashboard() {
  const [database, setDatabase] = useState<Database | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showQuickUpload, setShowQuickUpload] = useState(false);
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

  const handleQuickUpload = () => {
    setShowQuickUpload(true);
  };

  const handleAnalysisComplete = async (data: any) => {
    setShowQuickUpload(false);
    
    if (!data.success) {
      alert('Analysis failed. Please try again.');
      return;
    }

    // Check if we got parsed law data from SageMaker
    if (data.lawData) {
      // Create the law with the parsed data
      try {
        const lawData = data.lawData;
        const response = await fetch(`/api/laws/${encodeURIComponent(lawData.lawId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lawData),
        });

        if (response.ok) {
          alert(`✅ Law "${lawData.title}" created successfully!\n\nImpact Score: ${lawData.impactScore}/10\nSector: ${lawData.sector}\nCompliance Cost: ${lawData.complianceCost}`);
          fetchData(); // Refresh the dashboard
        } else {
          const error = await response.json();
          alert(`Analysis succeeded but law creation failed: ${error.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error creating law:', error);
        alert('Failed to create law from analyzed data.');
      }
    } else {
      // Fallback: Just show extracted text
      const extractedText = data.extractedText;
      const metadata = data.metadata;
      
      console.log('Extracted Text:', extractedText);
      console.log('Metadata:', metadata);
      
      alert(
        `✅ Text extracted successfully!\n\n` +
        `File: ${metadata.filename}\n` +
        `Words: ${metadata.wordCount}\n` +
        `Characters: ${metadata.characterCount}\n\n` +
        `Check the console to see the extracted text.`
      );
    }
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
      <DashboardHeader 
        onQuickUpload={handleQuickUpload}
      />
      
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

      {showQuickUpload && (
        <DocumentAnalysisModal
          onClose={() => setShowQuickUpload(false)}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
    </div>
  );
}

