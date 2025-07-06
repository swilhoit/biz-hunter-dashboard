import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import supabase from '../supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Upload file endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { dealId } = req.body;
    const fileInfo = {
      id: req.body.fileId || generateId(),
      deal_id: dealId,
      file_name: req.file.originalname,
      file_path: req.file.filename,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_at: new Date().toISOString()
    };

    // Store file info in database
    const { data, error } = await supabase
      .from('deal_documents')
      .insert([fileInfo])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      // Clean up uploaded file on database error
      await fs.unlink(req.file.path);
      return res.status(500).json({ error: 'Failed to save file info' });
    }

    res.json({ 
      success: true, 
      fileId: data.id,
      fileName: data.file_name
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download file endpoint
router.get('/download/:fileId', async (req, res) => {
  try {
    console.log('Downloading file:', req.params.fileId);
    
    // Get file info from database
    const { data: fileInfo, error } = await supabase
      .from('deal_documents')
      .select('*')
      .eq('id', req.params.fileId)
      .single();

    if (error || !fileInfo) {
      console.error('File not found in database:', error);
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log('File info from database:', {
      id: fileInfo.id,
      file_name: fileInfo.file_name,
      file_path: fileInfo.file_path,
      storage_path: fileInfo.storage_path,
      mime_type: fileInfo.mime_type
    });

    // Determine if this is a local file or Supabase Storage file
    // New files have just a filename, old files have a full path
    const isLocalFile = fileInfo.file_path && !fileInfo.file_path.includes('/');
    
    if (isLocalFile) {
      // Try local file system
      const localFilePath = path.join(__dirname, '..', 'uploads', fileInfo.file_path);
      
      try {
        await fs.access(localFilePath);
        // Set appropriate headers
        res.setHeader('Content-Type', fileInfo.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.file_name}"`);
        
        // Send file
        res.sendFile(localFilePath);
      } catch {
        console.error('Local file not found:', localFilePath);
        return res.status(404).json({ error: 'File not found on server' });
      }
    } else {
      // This is a Supabase Storage file
      console.log('Attempting to download from Supabase Storage...');
      
      try {
        // Use storage_path if available, otherwise use file_path
        const storagePath = fileInfo.storage_path || fileInfo.file_path;
        
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('deal-documents')
          .download(storagePath);
        
        if (downloadError || !fileData) {
          console.error('Supabase Storage download error:', downloadError);
          // Try with encoded path
          const encodedPath = encodeURIComponent(storagePath);
          const { data: fileDataEncoded, error: downloadErrorEncoded } = await supabase.storage
            .from('deal-documents')
            .download(encodedPath);
            
          if (downloadErrorEncoded || !fileDataEncoded) {
            console.error('Encoded path also failed:', downloadErrorEncoded);
            return res.status(404).json({ error: 'File not found in storage' });
          }
          
          // Use encoded result
          const buffer = Buffer.from(await fileDataEncoded.arrayBuffer());
          res.setHeader('Content-Type', fileInfo.mime_type || 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.file_name}"`);
          res.setHeader('Content-Length', buffer.length);
          res.send(buffer);
        } else {
          // Convert blob to buffer and send
          const buffer = Buffer.from(await fileData.arrayBuffer());
          
          res.setHeader('Content-Type', fileInfo.mime_type || 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.file_name}"`);
          res.setHeader('Content-Length', buffer.length);
          
          res.send(buffer);
        }
      } catch (storageError) {
        console.error('Storage download error:', storageError);
        return res.status(404).json({ error: 'File download failed' });
      }
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get file info endpoint
router.get('/info/:fileId', async (req, res) => {
  try {
    const { data: fileInfo, error } = await supabase
      .from('deal_documents')
      .select('id, file_name, mime_type, file_size, uploaded_at')
      .eq('id', req.params.fileId)
      .single();

    if (error || !fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(fileInfo);
  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete file endpoint
router.delete('/:fileId', async (req, res) => {
  try {
    // Get file info first
    const { data: fileInfo, error: fetchError } = await supabase
      .from('deal_documents')
      .select('*')
      .eq('id', req.params.fileId)
      .single();

    if (fetchError || !fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('deal_documents')
      .delete()
      .eq('id', req.params.fileId);

    if (deleteError) {
      return res.status(500).json({ error: 'Failed to delete file record' });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '..', 'uploads', fileInfo.file_path);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Could not delete physical file:', error);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate unique ID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default router;