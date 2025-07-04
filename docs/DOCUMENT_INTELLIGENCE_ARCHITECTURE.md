# Document Intelligence Architecture

## Overview
A scalable system for extracting, storing, and quickly accessing AI-analyzed document content for business acquisition deals.

## Core Components

### 1. Document Processing Pipeline
```
Upload → Extract → Analyze → Store → Index → Query
```

### 2. Database Schema

#### document_extractions table
```sql
CREATE TABLE document_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES deal_documents(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  
  -- Extraction metadata
  extraction_date TIMESTAMP DEFAULT NOW(),
  extraction_version VARCHAR(20) DEFAULT '1.0',
  file_hash VARCHAR(64), -- SHA256 hash to detect changes
  
  -- Extracted content
  raw_text TEXT, -- Full extracted text
  structured_data JSONB, -- Structured extraction (financials, contacts, etc.)
  key_entities JSONB, -- Named entities (companies, people, locations)
  summary TEXT, -- AI-generated summary
  
  -- Classification
  document_type VARCHAR(50), -- financial_statement, contract, correspondence, etc.
  confidence_score FLOAT,
  language VARCHAR(10) DEFAULT 'en',
  
  -- Search optimization
  search_vector tsvector, -- PostgreSQL full-text search
  embedding vector(1536), -- OpenAI embeddings for semantic search
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_document_extractions_deal_id ON document_extractions(deal_id);
CREATE INDEX idx_document_extractions_search ON document_extractions USING GIN(search_vector);
CREATE INDEX idx_document_extractions_embedding ON document_extractions USING ivfflat(embedding vector_cosine_ops);
```

#### document_insights table
```sql
CREATE TABLE document_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  extraction_id UUID NOT NULL REFERENCES document_extractions(id) ON DELETE CASCADE,
  
  -- Categorized insights
  insight_type VARCHAR(50), -- financial_metric, risk_factor, opportunity, etc.
  insight_category VARCHAR(50), -- revenue, profit, legal, operational, etc.
  
  -- Content
  title VARCHAR(255),
  description TEXT,
  value JSONB, -- Flexible storage for different insight types
  confidence FLOAT,
  
  -- Metadata
  source_page INTEGER,
  source_section VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Service Architecture

#### DocumentIntelligenceService
```typescript
interface DocumentExtraction {
  id: string;
  documentId: string;
  dealId: string;
  rawText: string;
  structuredData: {
    financials?: FinancialData;
    contacts?: ContactData[];
    products?: ProductData[];
    legal?: LegalData;
    [key: string]: any;
  };
  keyEntities: {
    companies: string[];
    people: string[];
    locations: string[];
    dates: string[];
    amounts: number[];
  };
  summary: string;
  documentType: DocumentType;
  confidenceScore: number;
}

interface DocumentInsight {
  type: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  value: any;
  confidence: number;
}
```

## Implementation Plan

### Phase 1: Core Extraction & Storage
1. Create database migrations for new tables
2. Build DocumentIntelligenceService
3. Implement extraction pipeline with caching
4. Add background processing for large documents

### Phase 2: Intelligent Querying
1. Implement semantic search using embeddings
2. Build cross-document insight aggregation
3. Create document relationship mapping
4. Add change detection and re-processing

### Phase 3: Advanced Features
1. Document versioning and diff tracking
2. Multi-language support
3. Custom extraction templates by document type
4. Automated insight generation and alerts

## Key Benefits

1. **Performance**: Documents processed once, insights cached
2. **Scalability**: Async processing, efficient storage
3. **Intelligence**: Cross-document analysis, trend detection
4. **Searchability**: Full-text and semantic search
5. **Consistency**: Standardized extraction across all documents

## Technical Considerations

### Storage Optimization
- Store embeddings for semantic search
- Use JSONB for flexible structured data
- Implement compression for large text content

### Processing Optimization
- Queue-based async processing
- Incremental updates for changed documents
- Batch processing for bulk uploads

### Query Optimization
- Materialized views for common aggregations
- Caching layer for frequent queries
- Pagination for large result sets

## API Design

```typescript
// Process new document
POST /api/documents/{documentId}/extract
Response: { extractionId, status: 'processing' }

// Get extraction status
GET /api/extractions/{extractionId}/status
Response: { status: 'completed', progress: 100 }

// Query insights across documents
POST /api/deals/{dealId}/insights/search
Body: { 
  query: "revenue trends",
  documentTypes: ["financial_statement"],
  dateRange: { from: "2023-01-01", to: "2023-12-31" }
}
Response: { insights: [...], totalCount: 45 }

// Get document summary
GET /api/deals/{dealId}/documents/summary
Response: {
  totalDocuments: 25,
  byType: { financial: 10, legal: 5, ... },
  keyFindings: [...],
  riskFactors: [...],
  opportunities: [...]
}
```

## Integration Points

1. **File Upload**: Trigger extraction on new uploads
2. **Deal Analysis**: Use cached extractions for instant analysis
3. **Search**: Enable cross-deal document search
4. **Reporting**: Generate insights from document repository
5. **Alerts**: Notify on important findings in new documents