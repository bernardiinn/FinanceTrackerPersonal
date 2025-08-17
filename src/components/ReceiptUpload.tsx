import React, { useState, useRef } from 'react';
import { MdCloudUpload, MdImage, MdClose } from 'react-icons/md';
import { useLocalization } from '../hooks/useLocalization';

interface ReceiptUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  error?: string | null;
  onCancel?: () => void;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
  onFileSelect,
  isProcessing,
  error,
  onCancel
}) => {
  const { t } = useLocalization();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      // TODO: Show error message
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      // TODO: Show error message
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    handleClear();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('receipts.uploadReceipt')}
        </h2>
        {onCancel && (
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            disabled={isProcessing}
          >
            <MdClose size={24} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <MdCloudUpload size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('receipts.dropOrSelect')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('receipts.supportedFormats')}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
            disabled={isProcessing}
          >
            <MdImage className="mr-2" />
            {t('receipts.selectFile')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Preview */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start space-x-4">
              {preview && (
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedFile.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFile.type}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={isProcessing}
              className="btn-primary flex-1"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('receipts.processing')}
                </>
              ) : (
                <>
                  <MdCloudUpload className="mr-2" />
                  {t('receipts.parseReceipt')}
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              disabled={isProcessing}
              className="btn-secondary"
            >
              {t('common.clear')}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>{t('receipts.tips.header')}:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>{t('receipts.tips.clear')}</li>
          <li>{t('receipts.tips.straight')}</li>
          <li>{t('receipts.tips.lighting')}</li>
        </ul>
      </div>
    </div>
  );
};

export default ReceiptUpload;
