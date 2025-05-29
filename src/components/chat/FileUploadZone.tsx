import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, Image, Video, Music, FileText } from 'lucide-react';

interface Props {
  onFilesSelected: (files: File[]) => void;
  onClose: () => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

export const FileUploadZone: React.FC<Props> = ({
  onFilesSelected,
  onClose,
  maxFiles = 10,
  maxFileSize = 50,
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Video;
    if (file.type.startsWith('audio/')) return Music;
    if (file.type.includes('pdf') || file.type.startsWith('text/')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        return false;
      }
      
      // Check file type
      if (acceptedTypes.length > 0) {
        return acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -1));
          }
          return file.type === type;
        });
      }
      
      return true;
    });

    const newFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles);
    setSelectedFiles(newFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-foreground rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-text">Upload Files</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Upload Zone */}
        <div className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 ${
              isDragOver ? 'text-primary' : 'text-text-muted'
            }`} />
            
            <p className="text-text mb-2">
              Drag and drop files here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:underline"
              >
                browse
              </button>
            </p>
            
            <p className="text-sm text-text-muted">
              Max {maxFiles} files, {maxFileSize}MB each
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-text mb-3">
                Selected Files ({selectedFiles.length})
              </h4>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <AnimatePresence>
                  {selectedFiles.map((file, index) => {
                    const IconComponent = getFileIcon(file);
                    return (
                      <motion.div
                        key={`${file.name}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center space-x-3 p-3 bg-card-highlight rounded-lg"
                      >
                        <IconComponent className="w-5 h-5 text-primary flex-shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-foreground rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-text-muted" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-muted hover:text-text transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
            className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
