import React, { useCallback } from 'react';
import { Upload, FileText, Calendar, BarChart3 } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  fileInfo?: {
    name: string;
    size: number;
    lastModified: number;
    recordCount: number;
  };
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading, fileInfo }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/csv') {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Upload className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Data Upload</h3>
      </div>

      {!fileInfo ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
        >
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Drop your CSV file here</p>
          <p className="text-sm text-gray-500 mb-4">or click to browse</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Select CSV File'}
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">{fileInfo.name}</p>
              <p className="text-sm text-gray-600">{formatFileSize(fileInfo.size)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
            <Calendar className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="font-medium text-gray-900">Last Modified</p>
              <p className="text-sm text-gray-600">
                {new Date(fileInfo.lastModified).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <div>
              <p className="font-medium text-gray-900">Records</p>
              <p className="text-sm text-gray-600">{fileInfo.recordCount.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <label
              htmlFor="file-upload-replace"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Replace File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload-replace"
              disabled={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};