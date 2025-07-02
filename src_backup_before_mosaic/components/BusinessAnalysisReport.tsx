import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  PieChart,
  FileText,
  Download,
  Printer,
  Share2,
  Calendar,
  Building2,
  MapPin,
  Target,
  Shield,
  Lightbulb,
  Users,
  Star,
  ArrowRight,
  Info
} from 'lucide-react';
import { AnalysisRequest, AnalysisResult, aiAnalysisService } from '@/services/aiAnalysisService';

interface BusinessAnalysisReportProps {
  analysisId: string;
}

export const BusinessAnalysisReport: React.FC<BusinessAnalysisReportProps> = ({ analysisId }) => {
  const [analysisRequest, setAnalysisRequest] = useState<AnalysisRequest | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [analysisId]);

  const loadAnalysis = async () => {
    try {
      setIsLoading(true);
      
      // Load analysis request from localStorage
      const storedRequest = localStorage.getItem(`analysis_${analysisId}`);
      if (!storedRequest) {
        throw new Error('Analysis request not found');
      }
      
      const request: AnalysisRequest = JSON.parse(storedRequest);
      setAnalysisRequest(request);
      
      // Check if we already have results
      const storedResult = localStorage.getItem(`analysis_result_${analysisId}`);
      if (storedResult) {
        setAnalysisResult(JSON.parse(storedResult));
      } else {
        // Generate new analysis
        const result = await aiAnalysisService.generateAnalysis(request);
        setAnalysisResult(result);
        
        // Store result
        localStorage.setItem(`analysis_result_${analysisId}`, JSON.stringify(result));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!analysisResult || !analysisRequest) return;
    
    const exportData = {
      business: analysisRequest.businessListing,
      analysis: analysisResult,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysisRequest.businessListing.name}_analysis_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Strong Buy': return 'bg-green-500';
      case 'Buy': return 'bg-green-400';
      case 'Hold': return 'bg-yellow-500';
      case 'Pass': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'High': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-semibold mb-2">Generating AI Analysis...</h2>
          <p className="text-gray-600">Please wait while we analyze the business opportunity.</p>
          <div className="mt-6 max-w-md mx-auto">
            <Progress value={75} className="h-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysisRequest || !analysisResult) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Analysis Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Failed to load analysis'}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const { businessListing } = analysisRequest;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Analysis Report</h1>
          <p className="text-gray-600">Generated on {new Date(analysisResult.generatedAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Business Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">{businessListing.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span>{businessListing.industry}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{businessListing.location}</span>
                </div>
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                ${businessListing.asking_price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Asking Price</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                ${businessListing.annual_revenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Annual Revenue</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {(businessListing.asking_price / businessListing.annual_revenue).toFixed(1)}x
              </p>
              <p className="text-sm text-gray-600">Revenue Multiple</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary & Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{analysisResult.executiveSummary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-white font-semibold mb-4 ${getRecommendationColor(analysisResult.conclusion.recommendation)}`}>
              <Star className="h-4 w-4 mr-2" />
              {analysisResult.conclusion.recommendation}
            </div>
            <div className="mb-4">
              <Badge className={getRiskLevelColor(analysisResult.riskAssessment.level)}>
                <Shield className="h-3 w-3 mr-1" />
                {analysisResult.riskAssessment.level} Risk
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{analysisResult.conclusion.reasoning}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Revenue Analysis</h4>
                  <p className="text-sm text-gray-600">{analysisResult.financialAnalysis.revenue}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Profitability</h4>
                  <p className="text-sm text-gray-600">{analysisResult.financialAnalysis.profitability}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Growth Potential</h4>
                  <p className="text-sm text-gray-600">{analysisResult.financialAnalysis.growth}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Risks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.financialAnalysis.risks.map((risk, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Industry Analysis</h4>
                  <p className="text-sm text-gray-600">{analysisResult.marketAnalysis.industryOverview}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Competition</h4>
                  <p className="text-sm text-gray-600">{analysisResult.marketAnalysis.competition}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Market Size</h4>
                  <p className="text-sm text-gray-600">{analysisResult.marketAnalysis.marketSize}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.marketAnalysis.trends.map((trend, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{trend}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Model</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{analysisResult.operationalAnalysis.businessModel}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">Strengths & Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {analysisResult.operationalAnalysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Opportunities</h4>
                    <ul className="space-y-1">
                      {analysisResult.operationalAnalysis.opportunities.map((opportunity, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Weaknesses & Threats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Weaknesses</h4>
                    <ul className="space-y-1">
                      {analysisResult.operationalAnalysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Threats</h4>
                    <ul className="space-y-1">
                      {analysisResult.operationalAnalysis.threats.map((threat, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{threat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="valuation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Valuation Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Asking Price</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    ${businessListing.asking_price.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Estimated Value Range</h4>
                  <p className="text-sm text-gray-600">{analysisResult.valuation.estimatedValue}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Multiple Analysis</h4>
                  <p className="text-sm text-gray-600">{analysisResult.valuation.multipleAnalysis}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Valuation Recommendation</h4>
                  <p className="text-sm text-gray-600">{analysisResult.valuation.recommendation}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge className={`text-lg px-4 py-2 ${getRiskLevelColor(analysisResult.riskAssessment.level)}`}>
                    <Shield className="h-4 w-4 mr-2" />
                    {analysisResult.riskAssessment.level} Risk Level
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Risk Factors</h4>
                  <ul className="space-y-1">
                    {analysisResult.riskAssessment.factors.map((factor, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Mitigation Strategies</h4>
                  <ul className="space-y-1">
                    {analysisResult.riskAssessment.mitigationStrategies.map((strategy, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysisResult.conclusion.nextSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Analysis */}
      {analysisResult.fileAnalysis && Object.keys(analysisResult.fileAnalysis).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Supporting Document Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analysisResult.fileAnalysis).map(([fileName, content]) => (
                <div key={fileName} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{fileName}</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};