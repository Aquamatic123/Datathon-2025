import { X, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface DocumentViewerProps {
  document: {
    filename: string;
    content: string;
    contentType: string;
    uploadedAt: string;
  };
  onClose: () => void;
}

export default function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  const isHtml = document.contentType === 'text/html' || 
                 document.filename.endsWith('.html') || 
                 document.filename.endsWith('.htm');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{document.filename}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Uploaded: {new Date(document.uploadedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isHtml && (
              <div className="flex gap-1 mr-4">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1.5 text-sm font-medium rounded ${
                    viewMode === 'preview'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-3 py-1.5 text-sm font-medium rounded ${
                    viewMode === 'raw'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Source
                </button>
              </div>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isHtml && viewMode === 'preview' ? (
            <div className="border border-gray-300 rounded-lg bg-white">
              <iframe
                srcDoc={document.content}
                className="w-full h-full min-h-[600px]"
                sandbox="allow-same-origin"
                title="Document preview"
              />
            </div>
          ) : (
            <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-auto whitespace-pre-wrap break-words">
              {document.content}
            </pre>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Size: {(document.content.length / 1024).toFixed(2)} KB</span>
            <span>Type: {document.contentType}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
