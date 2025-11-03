import { useState } from 'react';
import { X, Upload, FileText, Loader } from 'lucide-react';

interface UploadDocumentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadDocumentModal({ onClose, onSuccess }: UploadDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus('Uploading document...');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setStatus('Parsing document...');
      
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('✓ Law created successfully!');
        setResult(data.data);
        
        // Auto-close and refresh after 2 seconds
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setStatus(`✗ Error: ${data.error || 'Upload failed'}`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setStatus(`✗ Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Upload Law Document</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={uploading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Upload a legal document (PDF, HTML, XML, or TXT). Our AI will automatically extract
              law information and create a new entry in the database.
            </p>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!file ? (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-900">
                  Drop your file here or click to browse
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Supported: PDF, HTML, XML, TXT (max 10MB)
                </p>
                <input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.html,.htm,.xml,.txt,.text"
                  onChange={handleChange}
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Select File
                </label>
              </div>
            ) : (
              <div>
                <FileText className="mx-auto h-12 w-12 text-blue-500" />
                <p className="mt-2 text-sm font-medium text-gray-900">{file.name}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                {!uploading && (
                  <button
                    onClick={() => setFile(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Status Messages */}
          {status && (
            <div className={`mt-4 p-4 rounded-lg ${
              status.includes('✓') 
                ? 'bg-green-50 border border-green-200' 
                : status.includes('✗')
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-sm font-medium ${
                status.includes('✓') 
                  ? 'text-green-800' 
                  : status.includes('✗')
                  ? 'text-red-800'
                  : 'text-blue-800'
              }`}>
                {status}
              </p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Extracted Information:</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-600">Law ID:</dt>
                <dd className="font-medium text-gray-900">{result.lawId}</dd>
                
                <dt className="text-gray-600">Jurisdiction:</dt>
                <dd className="font-medium text-gray-900">{result.createdLaw.jurisdiction}</dd>
                
                <dt className="text-gray-600">Sector:</dt>
                <dd className="font-medium text-gray-900">{result.createdLaw.sector}</dd>
                
                <dt className="text-gray-600">Status:</dt>
                <dd className="font-medium text-gray-900">{result.createdLaw.status}</dd>
                
                <dt className="text-gray-600">Impact:</dt>
                <dd className="font-medium text-gray-900">{result.createdLaw.impact}/10</dd>
                
                <dt className="text-gray-600">Confidence:</dt>
                <dd className="font-medium text-gray-900">{result.createdLaw.confidence}</dd>
              </dl>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
            {!result && (
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload & Extract
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              {result ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

