import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Users,
  Search,
  Database,
  BarChart3
} from 'lucide-react';
import { ShareOfVoiceService, StoredShareOfVoiceReport } from '../../services/ShareOfVoiceService';

interface ShareOfVoiceReportWithStorageProps {
  dealId?: string;
  brandName?: string;
  storeUrl?: string;
  category?: string;
  onComplete?: (report: StoredShareOfVoiceReport | null) => void;
  onCancel?: () => void;
}

interface ProgressUpdate {
  stage: string;
  current: number;
  total: number;
  message: string;
  timestamp: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  icon?: React.ReactNode;
}

export default function ShareOfVoiceReportWithStorage({ 
  dealId,
  brandName, 
  storeUrl, 
  category, 
  onComplete,
  onCancel
}: ShareOfVoiceReportWithStorageProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [report, setReport] = useState<StoredShareOfVoiceReport | null>(null);

  // Auto-start generation when component mounts
  useEffect(() => {
    if ((brandName || storeUrl) && dealId) {
      handleStartGeneration();
    }
  }, [brandName, storeUrl, dealId]);

  const addLog = (level: LogEntry['level'], message: string, icon?: React.ReactNode) => {
    const log: LogEntry = {
      id: `${Date.now()}-${performance.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      icon
    };
    setLogs(prev => [...prev, log]);
  };

  const updateProgress = (stage: string, current: number, total: number, message: string) => {
    setProgress({
      stage,
      current,
      total,
      message,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const handleStartGeneration = async () => {
    if (!dealId || (!brandName && !storeUrl)) {
      addLog('error', 'Missing required parameters for report generation', <AlertCircle className="w-4 h-4" />);
      return;
    }

    setIsGenerating(true);
    setShowModal(true);
    setLogs([]);
    setProgress(null);
    setReport(null);

    const targetBrand = brandName || storeUrl!;
    addLog('info', `🚀 Starting comprehensive Share of Voice report generation for "${targetBrand}"`, <TrendingUp className="w-4 h-4" />);

    try {
      // Create a custom progress callback that maps to our UI
      const progressCallback = (stage: string, current: number, total: number, message: string) => {
        updateProgress(stage, current, total, message);
        
        // Add specific log entries for important milestones
        if (message.includes('Successfully submitted')) {
          addLog('success', message, <CheckCircle className="w-4 h-4" />);
        } else if (message.includes('Error') || message.includes('Failed')) {
          addLog('error', message, <AlertCircle className="w-4 h-4" />);
        } else if (message.includes('Warning')) {
          addLog('warning', message, <AlertCircle className="w-4 h-4" />);
        } else if (message.includes('Complete') || message.includes('Successfully')) {
          addLog('success', message, <CheckCircle className="w-4 h-4" />);
        } else if (message.includes('competitor') || message.includes('Competitor')) {
          addLog('info', message, <Users className="w-4 h-4" />);
        } else if (message.includes('keyword') || message.includes('Keyword')) {
          addLog('info', message, <Search className="w-4 h-4" />);
        } else if (message.includes('analysis') || message.includes('Analysis')) {
          addLog('info', message, <BarChart3 className="w-4 h-4" />);
        } else if (message.includes('database') || message.includes('Database') || message.includes('Storing')) {
          addLog('info', message, <Database className="w-4 h-4" />);
        } else {
          addLog('info', message, <Clock className="w-4 h-4" />);
        }
      };

      // Intercept console logs from ShareOfVoiceService for detailed progress
      const originalConsoleLog = console.log;
      console.log = (...args: any[]) => {
        const message = args.join(' ');
        if (message.includes('[ShareOfVoice]')) {
          const cleanMessage = message.replace('[ShareOfVoice]', '').trim();
          
          if (cleanMessage.includes('Step 1:')) {
            addLog('info', '📋 ' + cleanMessage, <Search className="w-4 h-4" />);
          } else if (cleanMessage.includes('Step 2:')) {
            addLog('info', '🔍 ' + cleanMessage, <TrendingUp className="w-4 h-4" />);
          } else if (cleanMessage.includes('Step 3:')) {
            addLog('info', '📊 ' + cleanMessage, <BarChart3 className="w-4 h-4" />);
          } else if (cleanMessage.includes('Step 4:')) {
            addLog('info', '💾 ' + cleanMessage, <Database className="w-4 h-4" />);
          } else if (cleanMessage.includes('✅')) {
            addLog('success', cleanMessage, <CheckCircle className="w-4 h-4" />);
          } else if (cleanMessage.includes('⏱️')) {
            addLog('info', cleanMessage, <Clock className="w-4 h-4" />);
          } else if (cleanMessage.includes('🎉')) {
            addLog('success', cleanMessage, <CheckCircle className="w-4 h-4" />);
          } else if (cleanMessage.includes('📊')) {
            addLog('info', cleanMessage, <BarChart3 className="w-4 h-4" />);
          } else {
            addLog('info', cleanMessage);
          }
        }
        originalConsoleLog(...args);
      };

      // Generate the comprehensive report
      updateProgress('Initializing', 0, 100, 'Starting Share of Voice report generation...');
      
      const result = await ShareOfVoiceService.generateAndStoreReport(
        dealId,
        targetBrand,
        category,
        !!storeUrl,
        progressCallback // Pass through the progress callback
      );

      // Restore console.log
      console.log = originalConsoleLog;

      if (result) {
        setReport(result);
        updateProgress('Complete', 100, 100, 'Share of Voice report generated successfully!');
        addLog('success', `🎉 Report generation complete! Generated comprehensive analysis for "${targetBrand}"`, <CheckCircle className="w-4 h-4" />);
        
        // Call completion callback
        if (onComplete) {
          onComplete(result);
        }
      } else {
        throw new Error('Failed to generate or store report');
      }

    } catch (error) {
      console.error('Error generating Share of Voice report:', error);
      addLog('error', `❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`, <AlertCircle className="w-4 h-4" />);
      updateProgress('Error', 0, 100, 'Report generation failed');
      
      if (onComplete) {
        onComplete(null);
      }
    } finally {
      setIsGenerating(false);
      
      // Auto-close modal after successful completion
      if (report) {
        setTimeout(() => {
          setShowModal(false);
        }, 3000);
      }
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setShowModal(false);
      if (onCancel) {
        onCancel();
      }
    }
  };

  const getLogIcon = (log: LogEntry) => {
    if (log.icon) return log.icon;
    
    switch (log.level) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  if (!showModal) {
    return (
      <button
        onClick={handleStartGeneration}
        disabled={isGenerating || !dealId || (!brandName && !storeUrl)}
        className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        {isGenerating ? 'Generating...' : 'Generate Report'}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Share of Voice Report Generation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Generating comprehensive competitive analysis for "{brandName || storeUrl}"
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress.stage}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {progress.current}/{progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{progress.message}</p>
          </div>
        )}

        {/* Activity Log */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Activity Log</h4>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-mono text-xs mt-0.5 min-w-[60px]">
                  {log.timestamp}
                </span>
                <div className="mt-0.5 flex-shrink-0">
                  {getLogIcon(log)}
                </div>
                <span 
                  className={`flex-1 ${
                    log.level === 'error' ? 'text-red-600 dark:text-red-400' :
                    log.level === 'success' ? 'text-green-600 dark:text-green-400' :
                    log.level === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          {!isGenerating && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Close
            </button>
          )}
          {report && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Report generated successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}