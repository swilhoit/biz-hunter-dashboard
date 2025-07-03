import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  Loader2, 
  AlertCircle, 
  Search, 
  Download, 
  Maximize2, 
  Minimize2,
  Eye,
  Grid3X3,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface CSVExcelViewerProps {
  blob: Blob;
  fileName: string;
}

interface SheetData {
  name: string;
  data: any[][];
  headers: string[];
}

export default function CSVExcelViewer({ blob, fileName }: CSVExcelViewerProps) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredData, setFilteredData] = useState<any[][]>([]);
  const [viewMode, setViewMode] = useState<'fit' | 'scroll' | 'wrap'>('scroll');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [columnWidths, setColumnWidths] = useState<{[key: number]: number}>({});
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFile();
  }, [blob]);

  useEffect(() => {
    if (sheets.length > 0 && sheets[activeSheet]) {
      filterData();
    }
  }, [searchTerm, activeSheet, sheets]);

  const loadFile = async () => {
    setLoading(true);
    setError(null);

    try {
      const extension = fileName.split('.').pop()?.toLowerCase();
      
      if (extension === 'csv') {
        await loadCSV();
      } else if (['xls', 'xlsx'].includes(extension || '')) {
        await loadExcel();
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (err: any) {
      console.error('Error loading file:', err);
      setError(err.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const loadCSV = async () => {
    const text = await blob.text();
    
    Papa.parse(text, {
      complete: (result) => {
        if (result.errors.length > 0) {
          throw new Error('CSV parsing error');
        }
        
        const data = result.data as string[][];
        const headers = data.length > 0 ? data[0] : [];
        const rows = data.slice(1);
        
        setSheets([{
          name: 'Sheet1',
          data: rows,
          headers
        }]);
        setActiveSheet(0);
        initializeColumnWidths(headers.length);
      },
      error: (error) => {
        throw new Error(`CSV parsing error: ${error.message}`);
      }
    });
  };

  const loadExcel = async () => {
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const sheetsData: SheetData[] = [];
    
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      const headers = jsonData.length > 0 ? jsonData[0] : [];
      const data = jsonData.slice(1);
      
      sheetsData.push({
        name: sheetName,
        data,
        headers
      });
    });
    
    setSheets(sheetsData);
    setActiveSheet(0);
    if (sheetsData.length > 0) {
      initializeColumnWidths(sheetsData[0].headers.length);
    }
  };

  const initializeColumnWidths = (columnCount: number) => {
    const widths: {[key: number]: number} = {};
    for (let i = 0; i < columnCount; i++) {
      widths[i] = 150; // Default width
    }
    setColumnWidths(widths);
  };

  const filterData = () => {
    if (!sheets[activeSheet] || !searchTerm.trim()) {
      setFilteredData(sheets[activeSheet]?.data || []);
      return;
    }

    const currentSheet = sheets[activeSheet];
    const filtered = currentSheet.data.filter((row) =>
      row.some((cell) =>
        String(cell || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const exportToCSV = () => {
    if (!sheets[activeSheet]) return;
    
    const currentSheet = sheets[activeSheet];
    const csvContent = [
      currentSheet.headers,
      ...filteredData
    ].map(row => row.map(cell => `"${String(cell || '')}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentSheet.name}_filtered.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
  };

  const handleColumnResize = (colIndex: number, width: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [colIndex]: Math.max(80, width) // Minimum width of 80px
    }));
  };

  const autoFitColumns = () => {
    if (!sheets[activeSheet]) return;
    
    const currentSheet = sheets[activeSheet];
    const newWidths: {[key: number]: number} = {};
    
    // Calculate optimal width for each column
    currentSheet.headers.forEach((header, colIndex) => {
      let maxWidth = String(header || '').length * 8 + 32; // Header width
      
      // Check up to 100 rows for performance
      const sampleData = displayData.slice(0, 100);
      sampleData.forEach(row => {
        const cellContent = String(row[colIndex] || '');
        const cellWidth = cellContent.length * 8 + 32;
        maxWidth = Math.max(maxWidth, cellWidth);
      });
      
      newWidths[colIndex] = Math.min(Math.max(maxWidth, 100), 400); // Min 100px, max 400px
    });
    
    setColumnWidths(newWidths);
  };

  const resetView = () => {
    setViewMode('scroll');
    setSearchTerm('');
    setCurrentPage(1);
    setSelectedCell(null);
    if (sheets[activeSheet]) {
      initializeColumnWidths(sheets[activeSheet].headers.length);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
        <span className="text-gray-600 dark:text-gray-400">Loading spreadsheet...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <AlertCircle className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">Failed to load spreadsheet</p>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
      </div>
    );
  }

  if (sheets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <p>No data found in the file</p>
      </div>
    );
  }

  const currentSheet = sheets[activeSheet];
  const displayData = searchTerm.trim() ? filteredData : currentSheet.data;
  
  // Pagination
  const totalPages = Math.ceil(displayData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = displayData.slice(startIndex, startIndex + rowsPerPage);

  const getColumnStyle = (colIndex: number) => {
    const width = columnWidths[colIndex] || 150;
    return {
      width: viewMode === 'fit' ? 'auto' : `${width}px`,
      minWidth: viewMode === 'fit' ? 'auto' : `${width}px`,
      maxWidth: viewMode === 'wrap' ? '300px' : 'none'
    };
  };

  const getCellClassName = (rowIndex: number, colIndex: number) => {
    const baseClass = "px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700";
    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
    const hoverClass = "hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer";
    const selectedClass = isSelected ? "bg-blue-100 dark:bg-blue-800/50 ring-2 ring-blue-500" : "";
    
    switch (viewMode) {
      case 'wrap':
        return `${baseClass} ${hoverClass} ${selectedClass} break-words`;
      case 'fit':
        return `${baseClass} ${hoverClass} ${selectedClass} truncate`;
      default:
        return `${baseClass} ${hoverClass} ${selectedClass}`;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex flex-col space-y-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Sheet tabs */}
            {sheets.length > 1 && (
              <div className="flex space-x-1">
                {sheets.map((sheet, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSheet(index)}
                    className={`px-3 py-1 text-sm rounded ${
                      index === activeSheet
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {sheet.name}
                  </button>
                ))}
              </div>
            )}
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {displayData.length} rows × {currentSheet.headers.length} cols
              {searchTerm.trim() && ` (filtered from ${currentSheet.data.length})`}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode('fit')}
                className={`px-3 py-1 text-xs ${
                  viewMode === 'fit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                title="Fit to container"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode('scroll')}
                className={`px-3 py-1 text-xs ${
                  viewMode === 'scroll'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                title="Horizontal scroll"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode('wrap')}
                className={`px-3 py-1 text-xs ${
                  viewMode === 'wrap'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                title="Wrap text"
              >
                <Eye className="w-3 h-3" />
              </button>
            </div>

            {/* Auto-fit columns */}
            <button
              onClick={autoFitColumns}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              title="Auto-fit columns"
            >
              <Grid3X3 className="w-3 h-3" />
            </button>

            {/* Reset */}
            <button
              onClick={resetView}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              title="Reset view"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search in data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Rows per page */}
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value={500}>500 rows</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Export filtered data */}
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected cell info */}
      {selectedCell && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
          <div className="text-sm">
            <span className="font-medium">Cell {String.fromCharCode(65 + selectedCell.col)}{selectedCell.row + 1}:</span>
            <span className="ml-2 font-mono">
              {String(paginatedData[selectedCell.row]?.[selectedCell.col] || '')}
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <div 
        ref={tableRef}
        className={`flex-1 ${viewMode === 'scroll' ? 'overflow-auto' : 'overflow-hidden'}`}
      >
        <table className={`divide-y divide-gray-200 dark:divide-gray-700 ${viewMode === 'fit' ? 'w-full table-fixed' : 'min-w-full'}`}>
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16 border-r border-gray-200 dark:border-gray-700">
                #
              </th>
              {currentSheet.headers.map((header, index) => (
                <th
                  key={index}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 resize-x"
                  style={getColumnStyle(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate" title={String(header || `Column ${index + 1}`)}>
                      {String(header || `Column ${index + 1}`)}
                    </span>
                    <div className="w-1 h-4 bg-gray-300 dark:bg-gray-600 cursor-col-resize ml-2"
                         onMouseDown={(e) => {
                           const startX = e.clientX;
                           const startWidth = columnWidths[index] || 150;
                           
                           const handleMouseMove = (e: MouseEvent) => {
                             const diff = e.clientX - startX;
                             handleColumnResize(index, startWidth + diff);
                           };
                           
                           const handleMouseUp = () => {
                             document.removeEventListener('mousemove', handleMouseMove);
                             document.removeEventListener('mouseup', handleMouseUp);
                           };
                           
                           document.addEventListener('mousemove', handleMouseMove);
                           document.addEventListener('mouseup', handleMouseUp);
                         }}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={startIndex + rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
              >
                <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 font-mono border-r border-gray-200 dark:border-gray-700">
                  {startIndex + rowIndex + 1}
                </td>
                {currentSheet.headers.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className={getCellClassName(rowIndex, colIndex)}
                    style={getColumnStyle(colIndex)}
                    title={String(row[colIndex] || '')}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    <div className={viewMode === 'wrap' ? 'whitespace-normal' : 'whitespace-nowrap'}>
                      {String(row[colIndex] || '')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {paginatedData.length === 0 && searchTerm.trim() && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <p>No rows match your search term "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}