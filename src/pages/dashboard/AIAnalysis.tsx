import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Brain,
  FileText,
  Calendar,
  Building2,
  DollarSign,
  Star,
  Search,
  Filter,
  Eye,
  Trash2,
  Download
} from 'lucide-react';
import { AnalysisRequest, AnalysisResult } from '@/services/aiAnalysisService';

interface StoredAnalysis {
  id: string;
  request: AnalysisRequest;
  result?: AnalysisResult;
  createdAt: string;
}

const AIAnalysis = () => {
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');

  useEffect(() => {
    loadStoredAnalyses();
  }, []);

  const loadStoredAnalyses = () => {
    const storedAnalyses: StoredAnalysis[] = [];
    
    // Scan localStorage for analysis entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('analysis_') && !key.includes('analysis_result_')) {
        try {
          const analysisData = localStorage.getItem(key);
          if (analysisData) {
            const request: AnalysisRequest = JSON.parse(analysisData);
            const analysisId = key.replace('analysis_', '');
            
            // Check if result exists
            const resultData = localStorage.getItem(`analysis_result_${analysisId}`);
            let result: AnalysisResult | undefined;
            if (resultData) {
              result = JSON.parse(resultData);
            }
            
            storedAnalyses.push({
              id: analysisId,
              request,
              result,
              createdAt: request.createdAt
            });
          }
        } catch (error) {
          console.error('Error parsing stored analysis:', error);
        }
      }
    }
    
    // Sort by creation date (newest first)
    storedAnalyses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setAnalyses(storedAnalyses);
  };

  const deleteAnalysis = (analysisId: string) => {
    if (confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      localStorage.removeItem(`analysis_${analysisId}`);
      localStorage.removeItem(`analysis_result_${analysisId}`);
      loadStoredAnalyses();
    }
  };

  const exportAnalysis = (analysis: StoredAnalysis) => {
    if (!analysis.result) return;
    
    const exportData = {
      business: analysis.request.businessListing,
      analysis: analysis.result,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.request.businessListing.name}_analysis_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRecommendationColor = (recommendation?: string) => {
    switch (recommendation) {
      case 'Strong Buy': return 'bg-green-500 text-white';
      case 'Buy': return 'bg-green-400 text-white';
      case 'Hold': return 'bg-yellow-500 text-white';
      case 'Pass': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'High': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Filter analyses based on search and status
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = analysis.request.businessListing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analysis.request.businessListing.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'completed' && analysis.result) ||
                         (filterStatus === 'pending' && !analysis.result);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Analysis Reports
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage all your AI-generated business analysis reports
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText className="h-4 w-4" />
          <span>{filteredAnalyses.length} reports found</span>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by business name or industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className="flex items-center gap-1"
              >
                <Filter className="h-3 w-3" />
                All
              </Button>
              <Button
                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('completed')}
                className="flex items-center gap-1"
              >
                Completed
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
                className="flex items-center gap-1"
              >
                Pending
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis List */}
      {filteredAnalyses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Reports Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'No reports match your current search or filter criteria.'
                : 'You haven\'t generated any AI analysis reports yet.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link to="/dashboard/saved">
                <Button>
                  Go to Saved Listings to Generate Reports
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAnalyses.map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {analysis.request.businessListing.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-600 truncate">
                        {analysis.request.businessListing.industry}
                      </span>
                    </div>
                  </div>
                  {analysis.result && (
                    <Badge className={`ml-2 text-xs ${getRecommendationColor(analysis.result.conclusion.recommendation)}`}>
                      <Star className="h-3 w-3 mr-1" />
                      {analysis.result.conclusion.recommendation}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Business Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="text-gray-600">Asking:</span>
                    <span className="font-medium">
                      ${analysis.request.businessListing.asking_price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-blue-600" />
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Analysis Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    {analysis.result ? (
                      <Badge variant="secondary" className="text-green-600 bg-green-50">
                        ✓ Completed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-yellow-600 bg-yellow-50">
                        ⏳ Pending
                      </Badge>
                    )}
                  </div>
                  
                  {analysis.result && (
                    <Badge className={`text-xs ${getRiskLevelColor(analysis.result.riskAssessment.level)}`}>
                      {analysis.result.riskAssessment.level} Risk
                    </Badge>
                  )}
                </div>

                {/* Analysis Summary */}
                {analysis.result && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {analysis.result.executiveSummary}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {analysis.result ? (
                    <>
                      <Link to={`/dashboard/analysis/${analysis.id}`} className="flex-1">
                        <Button size="sm" className="w-full flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          View Report
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportAnalysis(analysis)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Export
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1" disabled>
                      Analysis in Progress...
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteAnalysis(analysis.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;