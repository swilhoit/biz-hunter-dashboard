import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, auth } from './firebase';

// Tasks adapter for Firebase
export const tasksAdapter = {
  async getTasksForDeal(dealId) {
    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('dealId', '==', dealId),
        orderBy('sort_order', 'asc'),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { data: tasks, error: null };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { data: null, error };
    }
  },

  async createTask(taskData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const tasksRef = collection(db, 'tasks');
      const newTask = {
        ...taskData,
        created_by: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      const docRef = await addDoc(tasksRef, newTask);
      return { data: { id: docRef.id, ...newTask }, error: null };
    } catch (error) {
      console.error('Error creating task:', error);
      return { data: null, error };
    }
  },

  async updateTask(taskId, updates) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
      return { error: null };
    } catch (error) {
      console.error('Error updating task:', error);
      return { error };
    }
  },

  async deleteTask(taskId) {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      return { error: null };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { error };
    }
  }
};

// Files adapter for Firebase Storage and Firestore
export const filesAdapter = {
  async getFilesForDeal(dealId) {
    try {
      const filesQuery = query(
        collection(db, 'deal_files'),
        where('dealId', '==', dealId),
        orderBy('uploaded_at', 'desc')
      );
      const snapshot = await getDocs(filesQuery);
      const files = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { data: files, error: null };
    } catch (error) {
      console.error('Error fetching files:', error);
      return { data: null, error };
    }
  },

  async uploadFile(dealId, file, metadata = {}) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Upload file to Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `deals/${dealId}/${fileName}`;
      const storageRef = ref(storage, filePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save file metadata to Firestore
      const fileData = {
        dealId,
        fileName: file.name,
        filePath,
        fileSize: file.size,
        mimeType: file.type,
        downloadURL,
        ...metadata,
        uploaded_by: user.uid,
        uploaded_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'deal_files'), fileData);
      
      return { 
        data: { id: docRef.id, ...fileData }, 
        error: null 
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { data: null, error };
    }
  },

  async deleteFile(fileId) {
    try {
      // Get file data first
      const fileDoc = await getDoc(doc(db, 'deal_files', fileId));
      if (!fileDoc.exists()) {
        throw new Error('File not found');
      }
      
      const fileData = fileDoc.data();
      
      // Delete from Storage
      if (fileData.filePath) {
        const storageRef = ref(storage, fileData.filePath);
        await deleteObject(storageRef);
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'deal_files', fileId));
      
      return { error: null };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { error };
    }
  },

  async getFileUrl(fileId) {
    try {
      const fileDoc = await getDoc(doc(db, 'deal_files', fileId));
      if (!fileDoc.exists()) {
        throw new Error('File not found');
      }
      
      const fileData = fileDoc.data();
      return { data: fileData.downloadURL, error: null };
    } catch (error) {
      console.error('Error getting file URL:', error);
      return { data: null, error };
    }
  }
};

// Deals adapter for Firebase
export const dealsAdapter = {
  async getDeal(dealId) {
    try {
      const dealDoc = await getDoc(doc(db, 'deals', dealId));
      if (!dealDoc.exists()) {
        throw new Error('Deal not found');
      }
      return { 
        data: { id: dealDoc.id, ...dealDoc.data() }, 
        error: null 
      };
    } catch (error) {
      console.error('Error fetching deal:', error);
      return { data: null, error };
    }
  },

  async updateDeal(dealId, updates) {
    try {
      const dealRef = doc(db, 'deals', dealId);
      await updateDoc(dealRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
      return { error: null };
    } catch (error) {
      console.error('Error updating deal:', error);
      return { error };
    }
  },

  async createDeal(dealData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Clean and validate data more thoroughly
      const cleanDealData = {};
      
      // Only allow specific fields with proper validation
      const allowedFields = [
        'business_name', 'status', 'source', 'asking_price', 'annual_revenue', 
        'annual_profit', 'monthly_revenue', 'monthly_profit', 'valuation_multiple',
        'profit_margin', 'business_age_years', 'employee_count', 'inventory_value',
        'date_listed', 'listing_url', 'website_url', 'description', 'city', 'state',
        'country', 'industry', 'sub_industry', 'amazon_store_name', 'amazon_category',
        'fba_percentage', 'sku_count', 'asin_list', 'original_listing_id', 'marketplace'
      ];

      allowedFields.forEach(field => {
        const value = dealData[field];
        if (value !== undefined && value !== null) {
          // Convert numbers properly
          if (typeof value === 'string' && !isNaN(value) && value !== '') {
            cleanDealData[field] = parseFloat(value);
          } else if (typeof value === 'number' && isFinite(value)) {
            cleanDealData[field] = value;
          } else if (typeof value === 'string' && value.trim() !== '') {
            cleanDealData[field] = value.trim();
          } else if (typeof value === 'boolean') {
            cleanDealData[field] = value;
          } else if (Array.isArray(value)) {
            cleanDealData[field] = value;
          }
        }
      });

      const dealsRef = collection(db, 'deals');
      const newDeal = {
        ...cleanDealData,
        userId: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      console.log('Creating deal with cleaned data:', JSON.stringify(newDeal, null, 2));
      
      const docRef = await addDoc(dealsRef, newDeal);
      return { 
        data: { id: docRef.id, ...newDeal }, 
        error: null 
      };
    } catch (error) {
      console.error('Error creating deal:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error);
      return { data: null, error };
    }
  },

  async getUserDeals(userId) {
    try {
      const dealsQuery = query(
        collection(db, 'deals'),
        where('userId', '==', userId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(dealsQuery);
      const deals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { data: deals, error: null };
    } catch (error) {
      console.error('Error fetching user deals:', error);
      return { data: null, error };
    }
  }
};