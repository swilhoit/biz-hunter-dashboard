// Centralized PDF components with proper initialization
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  const workerUrl = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  
  try {
    if (!pdfjs.GlobalWorkerOptions) {
      // Create the GlobalWorkerOptions object if it doesn't exist
      Object.defineProperty(pdfjs, 'GlobalWorkerOptions', {
        value: { workerSrc: workerUrl },
        writable: true,
        configurable: true
      });
    } else {
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    }
  } catch (error) {
    console.warn('PDF.js worker initialization failed:', error);
  }
}

export { Document, Page, pdfjs };