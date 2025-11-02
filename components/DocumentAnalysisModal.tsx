import { useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { X } from 'lucide-react';

interface DocumentAnalysisModalProps {
  onClose: () => void;
  onAnalysisComplete: (data: any) => void;
}

export default function DocumentAnalysisModal({ onClose, onAnalysisComplete }: DocumentAnalysisModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    // Validate file type
    const validTypes = ['text/html', 'application/pdf', 'text/plain', 
                       'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.html', '.htm', '.pdf', '.txt', '.doc', '.docx'];
    
    const isValidType = validTypes.includes(selectedFile.type) || 
                       validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      setError('Please upload a valid document file (HTML, PDF, TXT, DOC, DOCX)');
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setUploading(true);
    setAnalyzing(true);
    setError(null);

    try {
      // Read file content
      const content = await file.text();

      // Prepare data for backend
      const requestData = {
        filename: file.name,
        content: content,
        contentType: file.type || 'text/html',
        uploadedAt: new Date().toISOString(),
      };

      // Send to Python backend API for text extraction
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/analyze-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Backend processing failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Text extraction failed');
      }

      // Pass the analysis results to parent component
      // If backend returns lawData, it was parsed by SageMaker
      // Otherwise, just pass the extracted text
      onAnalysisComplete({
        success: true,
        lawData: result.lawData || null,
        extractedText: result.extractedText,
        metadata: result.metadata,
        document: result.lawData?.document || {
          filename: file.name,
          content: content,
          contentType: file.type || 'text/html',
          uploadedAt: requestData.uploadedAt,
        }
      });

    } catch (err) {
      console.error('Error processing file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process document';
      setError(errorMessage);
      setAnalyzing(false);
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Upload Law Document for Analysis</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="document-upload-analysis"
                className="hidden"
                onChange={handleChange}
                accept=".html,.htm,.pdf,.txt,.doc,.docx"
              />
              
              <label
                htmlFor="document-upload-analysis"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="bg-blue-100 p-4 rounded-full">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    Drop your document here
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    or click to browse files
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    Supported formats: HTML, PDF, TXT, DOC, DOCX (max 10MB)
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="bg-blue-100 p-2 rounded">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Size: {(file.size / 1024).toFixed(2)} KB
                      </p>
                      <p className="text-sm text-gray-500">
                        Type: {file.type || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  {!analyzing && (
                    <button
                      onClick={removeFile}
                      className="text-gray-400 hover:text-red-500"
                      title="Remove file"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {analyzing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="font-medium text-blue-900">Processing document...</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Preparing document for backend analysis
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">Ready for AI Analysis</p>
                    <p className="text-sm text-amber-700 mt-1">
                      The document will be processed through AWS SageMaker to extract law details, 
                      jurisdiction, sector, impact analysis, compliance costs, and affected stocks automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            disabled={analyzing}
          >
            Cancel
          </button>
          <button
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              !file || analyzing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing with AI...
              </span>
            ) : (
              'Upload & Analyze'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
