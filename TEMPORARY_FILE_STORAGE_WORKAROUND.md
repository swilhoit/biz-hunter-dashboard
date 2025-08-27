# Temporary File Storage Workaround

Since Firebase Storage requires billing to be enabled, here are temporary alternatives:

## Option 1: Use Firebase Firestore for Small Files
For small files (< 1MB), you can store them as base64 strings in Firestore:

```javascript
// In src/lib/database-adapter.js
// Temporary workaround for file storage
async uploadFileToFirestore(dealId, file, metadata = {}) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const base64 = reader.result;
        const fileDoc = {
          dealId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          data: base64, // Store as base64
          ...metadata,
          uploaded_by: auth.currentUser.uid,
          uploaded_at: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'deal_files'), fileDoc);
        resolve({ data: { id: docRef.id, ...fileDoc }, error: null });
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsDataURL(file);
  });
}
```

## Option 2: Use External Storage Service
Consider using a free tier external storage service:
- Cloudinary (free tier: 25GB storage, 25GB bandwidth/month)
- Uploadcare (free tier: 3GB storage, 30GB bandwidth/month)
- ImageKit (free tier: 20GB bandwidth/month)

## Option 3: Local Development Only
For development purposes, you can use IndexedDB to store files locally:

```javascript
// Store files in browser's IndexedDB for development
const dbName = 'LocalFileStorage';
const storeName = 'files';

async function saveFileLocally(file, metadata) {
  const db = await openDB(dbName, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    }
  });
  
  const fileData = await file.arrayBuffer();
  const record = {
    ...metadata,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
    data: fileData,
    uploadedAt: new Date()
  };
  
  const tx = db.transaction(storeName, 'readwrite');
  const id = await tx.objectStore(storeName).add(record);
  await tx.complete;
  
  return { id, ...record };
}
```

## Recommended Solution
Enable billing on the Firebase project to use Firebase Storage properly. This provides:
- Unlimited file size support
- Proper CDN and caching
- Security rules enforcement
- Better performance
- Production-ready solution