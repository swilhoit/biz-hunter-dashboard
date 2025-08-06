// Alternative PDF to image converter using canvas
export class PDFImageConverter {
  static async convertToImages(file: File, progressCallback?: (stage: string) => void): Promise<string[]> {
    try {
      // Try to use PDF.js first
      const images = await this.convertWithPDFJS(file, progressCallback);
      if (images.length > 0) {
        return images;
      }
    } catch (error) {
      console.warn('PDF.js conversion failed, trying alternative approach:', error);
    }

    // If PDF.js fails, provide user guidance
    throw new Error(
      'PDF processing is currently unavailable. Please try one of these alternatives:\n\n' +
      '1. Take screenshots of the PDF pages and upload as images\n' +
      '2. Copy the text content and save as a .txt file\n' +
      '3. Use an online PDF to image converter\n' +
      '4. Save the PDF as images from your PDF reader'
    );
  }

  private static async convertWithPDFJS(file: File, progressCallback?: (stage: string) => void): Promise<string[]> {
    const images: string[] = [];
    
    try {
      // Try different import approaches
      let pdfjsLib: any;
      
      // Method 1: Direct import
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjsLib = pdfjs;
      } catch (e) {
        console.log('Direct import failed, trying alternative...');
      }

      // Method 2: Try window global
      if (!pdfjsLib && typeof window !== 'undefined') {
        pdfjsLib = (window as any).pdfjsLib;
      }

      // Method 3: Try require (for older builds)
      if (!pdfjsLib && typeof require !== 'undefined') {
        try {
          pdfjsLib = require('pdfjs-dist');
        } catch (e) {
          console.log('Require failed');
        }
      }

      if (!pdfjsLib || !pdfjsLib.getDocument) {
        throw new Error('PDF.js not available');
      }

      // Disable worker completely
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      }

      progressCallback?.('Loading PDF...');
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        disableWorker: true,
        disableRange: true,
        disableStream: true,
        useSystemFonts: true,
        verbosity: 0
      });

      const pdf = await loadingTask.promise;
      const maxPages = Math.min(pdf.numPages, 10);

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        progressCallback?.(`Converting page ${pageNum}/${maxPages}...`);
        
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) continue;
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          const imageData = canvas.toDataURL('image/png');
          images.push(imageData);
          
          // Clean up
          canvas.width = 0;
          canvas.height = 0;
        } catch (pageError) {
          console.error(`Failed to render page ${pageNum}:`, pageError);
        }
      }

      return images;
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw error;
    }
  }
}