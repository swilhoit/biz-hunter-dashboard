import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import supabase, { supabaseAdmin } from '../supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('deal_documents')
      .select('count')
      .limit(1);
    
    res.json({ 
      status: 'ok',
      message: 'File API is running',
      uploads_dir_exists: fsSync.existsSync(path.join(__dirname, '..', 'uploads')),
      supabase_connected: !error,
      supabase_error: error ? error.message : null,
      env_check: {
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

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

    console.log('Request body:', req.body);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body values:', Object.entries(req.body));
    
    // Extract fields from req.body, handling potential array values from FormData
    const dealId = Array.isArray(req.body.dealId) ? req.body.dealId[0] : req.body.dealId;
    const userId = Array.isArray(req.body.userId) ? req.body.userId[0] : req.body.userId;
    
    console.log('Extracted userId:', userId);
    console.log('Extracted dealId:', dealId);
    
    // Validate userId is provided and properly formatted
    if (!userId) {
      console.error('userId missing from request. Body:', req.body);
      return res.status(400).json({ error: 'userId is required for file upload' });
    }
    
    // Ensure userId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'userId must be a valid UUID' });
    }
    
    const fileInfo = {
      id: req.body.fileId || generateId(),
      deal_id: dealId,
      file_name: req.file.originalname,
      file_path: req.file.filename,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_at: new Date().toISOString(),
      uploaded_by: userId // Ensure this is the actual user's UUID
    };

    // Store file info in database
    // Use admin client if available to bypass RLS, otherwise use regular client
    const dbClient = supabaseAdmin || supabase;
    
    console.log('Using database client:', supabaseAdmin ? 'Admin (Service Role)' : 'Regular (Anon Key)');
    console.log('Attempting to insert file info:', {
      ...fileInfo,
      using_service_role: !!supabaseAdmin
    });
    
    const { data, error } = await dbClient
      .from('deal_documents')
      .insert([fileInfo])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      console.error('Failed to insert file info:', {
        error_message: error.message,
        error_code: error.code,
        error_details: error.details,
        file_info: fileInfo
      });
      
      // Clean up uploaded file on database error
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError);
      }
      
      return res.status(500).json({ 
        error: 'Failed to save file info',
        details: error.message,
        code: error.code
      });
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
      mime_type: fileInfo.mime_type
    });

    // Determine if this is a local file or Supabase Storage file
    // Files with timestamp prefix pattern are local files (e.g., "1751816295543-966020908-filename.ext")
    // Files with folder paths are Supabase Storage files
    const timestampPattern = /^\d{13}-\d+-/;
    const isLocalFile = fileInfo.file_path && (timestampPattern.test(fileInfo.file_path) || !fileInfo.file_path.includes('/'));
    
    if (isLocalFile) {
      // Try local file system
      const localFilePath = path.join(__dirname, '..', 'uploads', fileInfo.file_path);
      console.log('Looking for local file at:', localFilePath);
      
      try {
        await fs.access(localFilePath);
        console.log('Local file found, sending...');
        
        // Use absolute path for sendFile
        const absolutePath = path.resolve(localFilePath);
        
        // Set appropriate headers
        res.setHeader('Content-Type', fileInfo.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.file_name}"`);
        
        // Send file
        res.sendFile(absolutePath, (err) => {
          if (err) {
            console.error('Error sending file:', err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Error sending file' });
            }
          } else {
            console.log('File sent successfully');
          }
        });
      } catch (accessError) {
        console.error('Local file not found:', localFilePath, accessError);
        return res.status(404).json({ error: 'File not found on server' });
      }
    } else {
      // This is a Supabase Storage file
      console.log('Attempting to download from Supabase Storage...');
      
      try {
        // Use file_path since storage_path column doesn't exist
        const storagePath = fileInfo.file_path;
        
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
      .select('*')
      .eq('id', req.params.fileId)
      .single();

    if (error || !fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Add diagnostic information
    const isLocalFile = fileInfo.file_path && !fileInfo.file_path.includes('/');
    const diagnostics = {
      ...fileInfo,
      is_local_file: isLocalFile,
      storage_type: isLocalFile ? 'local' : 'supabase',
      server_has_uploads_dir: fsSync.existsSync(path.join(__dirname, '..', 'uploads')),
    };

    res.json(diagnostics);
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