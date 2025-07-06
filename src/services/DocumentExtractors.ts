import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

/**
 * Document Extractors for Various File Types
 * Converts different file formats to text for AI analysis
 */

export class DocumentExtractors {
  /**
   * Extract text from .docx files using mammoth
   */
  static async extractFromDocx(file: File): Promise<string> {
    try {
      console.log('Extracting text from .docx file:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (result.messages && result.messages.length > 0) {
        console.warn('Mammoth extraction warnings:', result.messages);
      }
      
      const text = result.value;
      console.log(`Extracted ${text.length} characters from .docx`);
      console.log('Content preview:', text.substring(0, 200));
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in the document');
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting from .docx:', error);
      throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from Excel files (.xlsx, .xls)
   */
  static async extractFromExcel(file: File): Promise<string> {
    try {
      console.log('Extracting text from Excel file:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const textParts: string[] = [];
      
      // Process each sheet
      workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`Processing sheet ${index + 1}: ${sheetName}`);
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to CSV for easier text extraction
        const csvText = XLSX.utils.sheet_to_csv(worksheet, {
          blankrows: false, // Skip blank rows
          skipHidden: true  // Skip hidden rows/cols
        });
        
        if (csvText.trim()) {
          textParts.push(`=== Sheet: ${sheetName} ===\n${csvText}`);
        }
        
        // Also extract formatted text for better readability
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const formattedRows: string[] = [];
        
        for (let row = range.s.r; row <= range.e.r; row++) {
          const rowData: string[] = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellAddress];
            if (cell && cell.v !== undefined) {
              // Handle different cell types
              let value = '';
              if (cell.t === 'n') { // Number
                value = cell.v.toString();
                // Check if it's currency
                if (cell.z && (cell.z.includes('$') || cell.z.includes('€'))) {
                  value = `$${Number(cell.v).toLocaleString()}`;
                }
              } else if (cell.t === 'd') { // Date
                value = new Date(cell.v).toLocaleDateString();
              } else {
                value = cell.v.toString();
              }
              rowData.push(value);
            } else {
              rowData.push('');
            }
          }
          if (rowData.some(cell => cell.trim() !== '')) {
            formattedRows.push(rowData.join(' | '));
          }
        }
        
        if (formattedRows.length > 0) {
          textParts.push(`\n=== Formatted View: ${sheetName} ===\n${formattedRows.join('\n')}`);
        }
      });
      
      const combinedText = textParts.join('\n\n');
      console.log(`Extracted ${combinedText.length} characters from Excel file`);
      console.log('Content preview:', combinedText.substring(0, 300));
      
      if (!combinedText || combinedText.trim().length === 0) {
        throw new Error('No data found in the spreadsheet');
      }
      
      return combinedText;
    } catch (error) {
      console.error('Error extracting from Excel:', error);
      throw new Error(`Failed to extract data from spreadsheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from CSV files
   */
  static async extractFromCSV(file: File): Promise<string> {
    try {
      console.log('Extracting text from CSV file:', file.name);
      
      const text = await file.text();
      
      // Parse CSV to detect structure
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }
      
      // Try to detect headers
      const firstLine = lines[0];
      const possibleHeaders = firstLine.split(',').map(h => h.trim());
      
      // Format as a readable text with structure
      const formattedLines: string[] = [`CSV Data from ${file.name}:`];
      
      // Add headers
      formattedLines.push(`Headers: ${possibleHeaders.join(' | ')}`);
      formattedLines.push('---');
      
      // Add data rows
      lines.slice(1).forEach((line, index) => {
        if (line.trim()) {
          const values = line.split(',').map(v => v.trim());
          const rowText = possibleHeaders.map((header, i) => 
            `${header}: ${values[i] || 'N/A'}`
          ).join(', ');
          formattedLines.push(`Row ${index + 1}: ${rowText}`);
        }
      });
      
      const formattedText = formattedLines.join('\n');
      console.log(`Extracted ${formattedText.length} characters from CSV`);
      
      return formattedText;
    } catch (error) {
      console.error('Error extracting from CSV:', error);
      throw new Error(`Failed to extract data from CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  static async extractFromText(file: File): Promise<string> {
    try {
      console.log('Extracting text from text file:', file.name);
      const text = await file.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Text file is empty');
      }
      
      console.log(`Extracted ${text.length} characters from text file`);
      return text;
    } catch (error) {
      console.error('Error extracting from text file:', error);
      throw new Error(`Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Determine file type and extract accordingly
   */
  static async extractTextFromFile(file: File): Promise<string> {
    const fileName = file.name.toLowerCase();
    
    try {
      if (fileName.endsWith('.docx')) {
        return await this.extractFromDocx(file);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        return await this.extractFromExcel(file);
      } else if (fileName.endsWith('.csv')) {
        return await this.extractFromCSV(file);
      } else if (fileName.endsWith('.txt')) {
        return await this.extractFromText(file);
      } else {
        throw new Error(`Unsupported file type: ${file.name}. Supported formats: .docx, .xlsx, .xls, .csv, .txt`);
      }
    } catch (error) {
      console.error('Document extraction error:', error);
      throw error;
    }
  }

  /**
   * Check if a file type can be extracted as text
   */
  static canExtractText(fileName: string): boolean {
    const name = fileName.toLowerCase();
    return name.endsWith('.docx') || 
           name.endsWith('.xlsx') || 
           name.endsWith('.xls') || 
           name.endsWith('.csv') || 
           name.endsWith('.txt');
  }

  /**
   * Get a human-readable description of supported formats
   */
  static getSupportedFormatsDescription(): string {
    return 'Word documents (.docx), Excel spreadsheets (.xlsx, .xls), CSV files (.csv), and text files (.txt)';
  }
}