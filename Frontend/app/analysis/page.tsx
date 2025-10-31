'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { formatAnalysisText } from '@/lib/format-analysis';

interface AnalysisFile {
  key: string;
  name: string;
  lastModified: string;
  size: number;
}

export default function AnalysisPage() {
  const { theme, toggleTheme } = useTheme();
  const [files, setFiles] = useState<AnalysisFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/s3-files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (fileKey: string) => {
    try {
      setLoadingContent(true);
      setSelectedFile(fileKey);
      const response = await fetch(`/api/s3-files?key=${encodeURIComponent(fileKey)}`);
      if (response.ok) {
        const data = await response.json();
        setFileContent(data);
      }
    } catch (error) {
      console.error('Failed to fetch file content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Floating Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
            theme === 'light' 
              ? 'bg-white hover:bg-gray-100 text-gray-600' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                RiftRewind
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Match & Player Analysis
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-4 text-gray-600 dark:text-gray-400">Loading analysis files...</span>
          </div>
        )}

        {/* Files List */}
        {!loading && files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {files.map((file) => (
              <div
                key={file.key}
                onClick={() => fetchFileContent(file.key)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedFile === file.key
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm break-all">
                    {file.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                    {formatSize(file.size)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(file.lastModified)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* No Files */}
        {!loading && files.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Analysis Files</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No analysis files found in the S3 bucket.
            </p>
          </div>
        )}

        {/* File Content Display */}
        {selectedFile && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">File Content</h2>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setFileContent(null);
                }}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              {loadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-4 text-gray-600 dark:text-gray-400">Loading file content...</span>
                </div>
              ) : fileContent ? (
                <div className="space-y-4">
                  {/* Check if content has a response field */}
                  {fileContent.hasResponse && fileContent.responseText ? (
                    <>
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Analysis Response</h3>
                      </div>
                      <div className="prose dark:prose-invert max-w-none">
                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {formatAnalysisText(fileContent.responseText)}
                        </div>
                      </div>
                      <details className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                          View Full JSON
                        </summary>
                        <pre className="mt-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                          <code className="text-gray-900 dark:text-gray-100">
                            {JSON.stringify(fileContent.content, null, 2)}
                          </code>
                        </pre>
                      </details>
                    </>
                  ) : (
                    <>
                      {/* Format markdown-style text content */}
                      <div className="prose dark:prose-invert max-w-none">
                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {typeof fileContent.content === 'string' 
                            ? formatAnalysisText(fileContent.content)
                            : JSON.stringify(fileContent.content, null, 2)}
                        </div>
                      </div>
                      {typeof fileContent.content !== 'string' && (
                        <details className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                            View Raw JSON
                          </summary>
                          <pre className="mt-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                            <code className="text-gray-900 dark:text-gray-100">
                              {JSON.stringify(fileContent.content, null, 2)}
                            </code>
                          </pre>
                        </details>
                      )}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

