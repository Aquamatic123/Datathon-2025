import { useState } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';

interface DocumentUploadProps {
  onDocumentUpload: (document: {
    filename: string;
    content: string;
    contentType: string;
    uploadedAt: string;
  }) => void;
  currentDocument?: {
    filename: string;
    content: string;
    contentType: string;
    uploadedAt: string;
  };
}

export default function DocumentUpload({ onDocumentUpload, currentDocument }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);

    try {
      // Read file as text
      const content = await file.text();
      
      const document = {
        filename: file.name,
        content: content,
        contentType: file.type || 'text/html',
        uploadedAt: new Date().toISOString(),
      };

      onDocumentUpload(document);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
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
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeDocument = () => {
    onDocumentUpload(undefined as any);
  };

  if (currentDocument) {
    return (
      <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentDocument.filename}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Uploaded: {new Date(currentDocument.uploadedAt).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                Type: {currentDocument.contentType}
              </p>
              <p className="text-xs text-gray-500">
                Size: {(currentDocument.content.length / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeDocument}
            className="ml-2 text-gray-400 hover:text-red-500"
            title="Remove document"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
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
        id="document-upload"
        className="hidden"
        onChange={handleChange}
        accept=".html,.htm,.pdf,.txt,.doc,.docx"
        disabled={uploading}
      />
      
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Processing document...</p>
        </div>
      ) : (
        <label
          htmlFor="document-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="h-8 w-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              Drop law document here or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports HTML, PDF, TXT, DOC (max 10MB)
            </p>
          </div>
        </label>
      )}
    </div>
  );
}
