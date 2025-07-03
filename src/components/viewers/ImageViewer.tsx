import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from 'lucide-react';

interface ImageViewerProps {
  blob: Blob;
  fileName: string;
}

export default function ImageViewer({ blob, fileName }: ImageViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [fitToWindow, setFitToWindow] = useState<boolean>(true);

  useEffect(() => {
    // Create object URL for the blob
    const url = URL.createObjectURL(blob);
    setImageUrl(url);

    return () => {
      // Cleanup
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [blob]);

  const changeScale = (delta: number) => {
    const newScale = Math.max(0.1, Math.min(5.0, scale + delta));
    setScale(newScale);
    setFitToWindow(false);
  };

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleFitToWindow = () => {
    setFitToWindow(!fitToWindow);
    if (!fitToWindow) {
      setScale(1.0);
    }
  };

  const resetView = () => {
    setScale(1.0);
    setRotation(0);
    setFitToWindow(true);
  };

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading image...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Image Viewer
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => changeScale(-0.25)}
              disabled={scale <= 0.1}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border-x border-gray-300 dark:border-gray-600 min-w-[70px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={() => changeScale(0.25)}
              disabled={scale >= 5.0}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          
          {/* Rotate */}
          <button
            onClick={rotate}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          {/* Fit to window */}
          <button
            onClick={toggleFitToWindow}
            className={`p-2 rounded-lg border border-gray-300 dark:border-gray-600 ${
              fitToWindow
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {fitToWindow ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          {/* Reset */}
          <button
            onClick={resetView}
            className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
        <div className="flex items-center justify-center min-h-full">
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-none shadow-lg"
            style={{
              transform: `scale(${fitToWindow ? 'var(--scale-fit)' : scale}) rotate(${rotation}deg)`,
              '--scale-fit': fitToWindow ? '1' : scale,
              maxWidth: fitToWindow ? '100%' : 'none',
              maxHeight: fitToWindow ? '100%' : 'none',
              width: fitToWindow ? 'auto' : `${scale * 100}%`,
              height: fitToWindow ? 'auto' : 'auto',
              objectFit: 'contain'
            } as React.CSSProperties}
            onLoad={(e) => {
              const img = e.currentTarget;
              const container = img.parentElement;
              if (fitToWindow && container) {
                const containerRect = container.getBoundingClientRect();
                const imgRect = img.getBoundingClientRect();
                const scaleX = containerRect.width / img.naturalWidth;
                const scaleY = containerRect.height / img.naturalHeight;
                const fitScale = Math.min(scaleX, scaleY, 1);
                img.style.setProperty('--scale-fit', fitScale.toString());
              }
            }}
          />
        </div>
      </div>
      
      {/* Image info */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{fileName}</span>
          <span>
            Scale: {Math.round(scale * 100)}% | Rotation: {rotation}°
            {fitToWindow && ' | Fit to window'}
          </span>
        </div>
      </div>
    </div>
  );
}