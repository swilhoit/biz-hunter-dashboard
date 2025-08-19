import React from 'react';
import { FileImage, FileText, Copy, Download } from 'lucide-react';

interface PDFUploadGuideProps {
  onClose: () => void;
}

export default function PDFUploadGuide({ onClose }: PDFUploadGuideProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          PDF Processing Alternative Methods
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          PDF processing is experiencing technical issues. Please use one of these alternative methods:
        </p>

        <div className="space-y-4">
          {/* Method 1: Screenshots */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileImage className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Method 1: Upload Screenshots
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Take screenshots of the PDF pages and upload them as images:
                </p>
                <ol className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-4 list-decimal">
                  <li>Open your PDF in any PDF reader</li>
                  <li>Take screenshots of important pages (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)</li>
                  <li>Upload the screenshot images (.png or .jpg)</li>
                </ol>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✓ Best for visual documents with charts and images
                </p>
              </div>
            </div>
          </div>

          {/* Method 2: Text File */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-purple-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Method 2: Copy Text to File
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Copy the text content and save as a .txt file:
                </p>
                <ol className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-4 list-decimal">
                  <li>Open your PDF and select all text (Cmd+A or Ctrl+A)</li>
                  <li>Copy the text (Cmd+C or Ctrl+C)</li>
                  <li>Paste into a text editor and save as .txt</li>
                  <li>Upload the .txt file</li>
                </ol>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✓ Best for text-heavy documents like contracts and reports
                </p>
              </div>
            </div>
          </div>

          {/* Method 3: Online Converter */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Download className="w-5 h-5 text-green-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Method 3: Convert PDF to Images
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Use your PDF reader to export pages as images:
                </p>
                <ol className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-4 list-decimal">
                  <li>Open PDF in Adobe Reader, Preview, or Chrome</li>
                  <li>File → Export or Save As → Image (PNG/JPG)</li>
                  <li>Upload the exported images</li>
                </ol>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✓ Best quality for complex layouts
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Tip:</strong> For best AI analysis results, ensure text is clear and readable in your uploads.
            The AI works best with business listings, financial statements, and broker teasers.
          </p>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Got it, I'll try these methods
          </button>
        </div>
      </div>
    </div>
  );
}