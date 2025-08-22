# Firebase Schema Documentation

## Overview
This document outlines the complete Firebase schema for the Biz Hunter Dashboard application, including Firestore collections, data structures, security rules, and required indexes.

## Firestore Collections

### 1. `users` Collection
Stores user profile and authentication information.

```typescript
interface User {
  // Document ID: Firebase Auth UID
  email: string;
  displayName?: string;
  company?: string;
  photoURL?: string;
  phoneNumber?: string;
  role?: 'admin' | 'user' | 'viewer';
  teamId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    emailAlerts?: boolean;
  };
}
```

### 2. `deals` Collection
Main collection for business acquisition deals.

```typescript
interface Deal {
  // Document ID: Auto-generated
  userId: string; // Owner of the deal
  teamId?: string; // For team collaboration
  
  // Basic Information
  business_name: string;
  status: 'prospecting' | 'initial_contact' | 'analysis' | 'loi_submitted' | 
          'due_diligence' | 'negotiation' | 'under_contract' | 'closing' | 
          'closed_won' | 'closed_lost' | 'on_hold';
  source?: 'marketplace' | 'broker' | 'direct_outreach' | 'referral' | 'other';
  priority?: number; // 1-5
  
  // Financial Information
  asking_price?: number;
  annual_revenue?: number;
  annual_profit?: number;
  monthly_revenue?: number;
  monthly_profit?: number;
  ebitda?: number;
  sde?: number; // Seller's Discretionary Earnings
  multiple?: number;
  profit_margin?: number;
  
  // Business Details
  business_age_years?: number;
  employee_count?: number;
  inventory_value?: number;
  date_listed?: string;
  date_established?: string;
  listing_url?: string;
  website_url?: string;
  description?: string;
  hours_per_week?: number;
  owner_involvement?: string;
  
  // Location
  city?: string;
  state?: string;
  country?: string;
  
  // Industry
  industry?: string;
  sub_industry?: string;
  niche_keywords?: string[];
  
  // Amazon/E-commerce Specific
  amazon_store_name?: string;
  amazon_store_url?: string;
  amazon_category?: string;
  seller_account_health?: string;
  fba_percentage?: number;
  sku_count?: number;
  brand_registry?: boolean;
  acos?: number; // Advertising Cost of Sale
  
  // Contact Information
  seller_name?: string;
  seller_email?: string;
  seller_phone?: string;
  broker_name?: string;
  broker_email?: string;
  broker_phone?: string;
  broker_company?: string;
  
  // Important Dates
  first_contact_date?: string;
  loi_submitted_date?: string;
  due_diligence_start_date?: string;
  expected_close_date?: string;
  actual_close_date?: string;
  
  // Pipeline Management
  stage?: string;
  assigned_to?: string;
  score?: number; // 0-100 automated scoring
  next_action?: string;
  next_action_date?: string;
  
  // Metadata
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. `tasks` Collection
Tasks and action items for deals.

```typescript
interface Task {
  // Document ID: Auto-generated
  dealId: string; // Reference to deal
  created_by: string; // User ID who created the task
  assigned_to?: string; // User ID assigned to
  
  // Task Information
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Dates
  due_date?: string;
  completed_at?: Timestamp;
  
  // Ordering
  sort_order: number;
  
  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 4. `deal_files` Collection
Document and file management for deals.

```typescript
interface DealFile {
  // Document ID: Auto-generated
  dealId: string; // Reference to deal
  uploaded_by: string; // User ID who uploaded
  
  // File Information
  fileName: string;
  filePath: string; // Path in Firebase Storage
  fileSize: number; // Bytes
  mimeType: string;
  downloadURL: string;
  
  // Metadata
  document_type?: 'p&l' | 'tax_return' | 'bank_statement' | 
                  'contract' | 'listing' | 'correspondence' | 'other';
  description?: string;
  tags?: string[];
  
  // Timestamps
  uploaded_at: Timestamp;
}
```

### 5. `ai_analyses` Collection
AI-generated analysis and insights.

```typescript
interface AIAnalysis {
  // Document ID: Auto-generated
  dealId?: string; // Reference to deal if applicable
  listingId?: string; // Reference to listing if applicable
  created_by?: string; // User who requested analysis
  
  // Analysis Information
  analysis_type: 'deal_evaluation' | 'market_analysis' | 
                 'competitive_analysis' | 'risk_assessment' | 'other';
  analysis_data: Record<string, any>; // JSON structure varies by type
  model_used?: string; // e.g., 'gpt-4', 'claude-3'
  
  // Results
  score?: number;
  recommendations?: string[];
  risks?: string[];
  opportunities?: string[];
  
  // Timestamps
  created_at: Timestamp;
}
```

### 6. `team_members` Collection
Team collaboration and permissions.

```typescript
interface TeamMember {
  // Document ID: Auto-generated
  teamId: string;
  userId: string;
  
  // Permissions
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: {
    canCreateDeals: boolean;
    canEditDeals: boolean;
    canDeleteDeals: boolean;
    canViewFinancials: boolean;
    canManageTeam: boolean;
  };
  
  // Timestamps
  joined_at: Timestamp;
  invited_by: string;
}
```

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function belongsToTeam(teamId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/team_members/$(request.auth.uid + '_' + teamId));
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false; // Never allow deletion
    }
    
    // Deals collection
    match /deals/{dealId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        (resource.data.teamId != null && belongsToTeam(resource.data.teamId))
      );
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        (resource.data.teamId != null && belongsToTeam(resource.data.teamId))
      );
      allow delete: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
        request.resource.data.created_by == request.auth.uid;
      allow update: if isAuthenticated() && (
        resource.data.created_by == request.auth.uid ||
        resource.data.assigned_to == request.auth.uid
      );
      allow delete: if isAuthenticated() && 
        resource.data.created_by == request.auth.uid;
    }
    
    // Deal files collection
    match /deal_files/{fileId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
        request.resource.data.uploaded_by == request.auth.uid;
      allow update: if false; // Files should not be updated
      allow delete: if isAuthenticated() && 
        resource.data.uploaded_by == request.auth.uid;
    }
    
    // AI analyses collection
    match /ai_analyses/{analysisId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if false; // Analyses should not be updated
      allow delete: if isAuthenticated() && 
        resource.data.created_by == request.auth.uid;
    }
    
    // Team members collection
    match /team_members/{memberId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
        get(/databases/$(database)/documents/team_members/$(request.auth.uid + '_' + request.resource.data.teamId)).data.role in ['owner', 'admin'];
      allow update: if isAuthenticated() && 
        get(/databases/$(database)/documents/team_members/$(request.auth.uid + '_' + resource.data.teamId)).data.role in ['owner', 'admin'];
      allow delete: if isAuthenticated() && 
        get(/databases/$(database)/documents/team_members/$(request.auth.uid + '_' + resource.data.teamId)).data.role == 'owner';
    }
  }
}
```

## Required Firestore Indexes

Create these composite indexes for optimal query performance:

### 1. Deals Indexes
```
Collection: deals
Fields: userId (Ascending), createdAt (Descending)
Query scope: Collection

Collection: deals
Fields: teamId (Ascending), createdAt (Descending)
Query scope: Collection

Collection: deals
Fields: status (Ascending), createdAt (Descending)
Query scope: Collection

Collection: deals
Fields: userId (Ascending), status (Ascending), createdAt (Descending)
Query scope: Collection
```

### 2. Tasks Indexes
```
Collection: tasks
Fields: dealId (Ascending), sort_order (Ascending), created_at (Descending)
Query scope: Collection

Collection: tasks
Fields: assigned_to (Ascending), status (Ascending), due_date (Ascending)
Query scope: Collection

Collection: tasks
Fields: dealId (Ascending), status (Ascending)
Query scope: Collection
```

### 3. Deal Files Indexes
```
Collection: deal_files
Fields: dealId (Ascending), uploaded_at (Descending)
Query scope: Collection

Collection: deal_files
Fields: dealId (Ascending), document_type (Ascending)
Query scope: Collection
```

### 4. AI Analyses Indexes
```
Collection: ai_analyses
Fields: dealId (Ascending), created_at (Descending)
Query scope: Collection

Collection: ai_analyses
Fields: analysis_type (Ascending), created_at (Descending)
Query scope: Collection
```

## Firebase Storage Structure

```
/deals
  /{dealId}
    /documents
      /{timestamp}_{filename}
    /images
      /{timestamp}_{filename}
    /analyses
      /{timestamp}_{filename}

/users
  /{userId}
    /profile
      /avatar.{ext}
    /exports
      /{timestamp}_{filename}
```

## Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Deal files
    match /deals/{dealId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // User files
    match /users/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }
  }
}
```

## Implementation Notes

1. **Timestamps**: All `Timestamp` fields should use Firebase's `serverTimestamp()` for consistency
2. **IDs**: Document IDs are auto-generated except for the `users` collection which uses Firebase Auth UID
3. **References**: Foreign keys (like `userId`, `dealId`) are stored as strings containing the document ID
4. **Soft Deletes**: Consider implementing soft deletes by adding a `deletedAt` field instead of hard deletes
5. **Pagination**: Implement cursor-based pagination using `startAfter()` and `limit()` for large collections
6. **Real-time Updates**: Use Firestore listeners for real-time updates on critical collections like `deals` and `tasks`

## Migration Checklist

- [ ] Create all collections in Firebase Console
- [ ] Apply security rules
- [ ] Create composite indexes
- [ ] Set up Storage bucket and rules
- [ ] Test authentication flow
- [ ] Verify CRUD operations for each collection
- [ ] Test team collaboration features
- [ ] Validate file upload/download functionality