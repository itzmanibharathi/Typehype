// src/pages/Home.tsx - Updated to support ALL file types from your backend

import React, { useState, useEffect } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, X, FileIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  chunks: number;
  status: 'uploading' | 'success' | 'error';
  message?: string;
  abortController?: AbortController;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const token = localStorage.getItem('token');

  // Supported extensions from your document_inject.py
  const acceptedExtensions = [
    '.pdf', '.pptx', '.docx',
    '.xlsx', '.xls',
    '.txt', '.csv',
    '.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp'
  ];

  const acceptConfig = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/bmp': ['.bmp'],
    'image/gif': ['.gif'],
    'image/tiff': ['.tiff'],
    'image/webp': ['.webp']
  };

  const onDrop = async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (!user || !token) {
      setMessage({ type: 'error', text: 'Please login first' });
      return;
    }

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file }) => {
        setMessage({ type: 'error', text: `Skipped: ${file.name} (Unsupported file type)` });
      });
    }

    if (acceptedFiles.length === 0) return;

    setIsUploading(true);

    for (const file of acceptedFiles) {
      const id = Math.random().toString(36).substr(2, 9);
      const controller = new AbortController();

      setUploadedFiles(prev => [...prev, {
        id,
        name: file.name,
        size: file.size,
        chunks: 0,
        status: 'uploading',
        abortController: controller
      }]);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://127.0.0.1:8000/embed', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
          signal: controller.signal
        });

        if (response.ok) {
          const data = await response.json();
          setUploadedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, chunks: data.chunks_stored, status: 'success' } : f
          ));
          setMessage({ type: 'success', text: `${file.name} uploaded – ${data.chunks_stored} chunks stored` });
        } else {
          const error = await response.json();
          const errorMsg = error.detail || 'Upload failed';
          setUploadedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, status: 'error', message: errorMsg } : f
          ));
          setMessage({ type: 'error', text: `${file.name}: ${errorMsg}` });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setUploadedFiles(prev => prev.filter(f => f.id !== id));
          setMessage({ type: 'success', text: `${file.name} upload cancelled` });
        } else {
          setUploadedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, status: 'error', message: 'Network or server error' } : f
          ));
          setMessage({ type: 'error', text: `${file.name}: Upload failed (network error)` });
        }
      }
    }

    setIsUploading(false);
  };

  const cancelUpload = (id: string, name: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.abortController) {
        file.abortController.abort();
      }
      return prev.filter(f => f.id !== id);
    });
    setMessage({ type: 'success', text: `${name} upload cancelled` });
  };

  const removeDocument = async (filename: string) => {
    if (!token) return;

    try {
      const res = await fetch('http://127.0.0.1:8000/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filename })
      });

      if (res.ok) {
        setUploadedFiles(prev => prev.filter(f => f.name !== filename));
        setMessage({ type: 'success', text: `${filename} removed from your documents` });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete document' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while deleting' });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptConfig,
    multiple: true,
    disabled: isUploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-gray-50 text-sm md:text-lg lg:text-xl">
      <section className="py-20 px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
        >
          Welcome to TypeHype
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto"
        >
          Upload your documents and ask questions using AI. Supports text, tables, and even scanned images!
        </motion.p>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-8 md:p-12"
          >
            <div
              {...getRootProps()}
              className={`border-4 border-dashed rounded-2xl p-20 text-center cursor-pointer transition-all duration-300 ${
                isDragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-600 hover:shadow-xl'
              } ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-20 w-20 text-gray-400 mb-8" />
              <p className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
                {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
              </p>
              <p className="text-lg md:text-xl text-gray-600 mb-6">or click to browse</p>
              
              <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-base md:text-lg font-medium text-blue-900 mb-3">
                  Supported file types:
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm md:text-base">
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full">PDF</span>
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full">PPTX</span>
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full">DOCX</span>
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full">Excel (XLSX/XLS)</span>
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full">TXT</span>
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full">CSV</span>
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full">Images (JPG, PNG, etc.)</span>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Images will be processed with OCR to extract text
                </p>
              </div>
            </div>
          </motion.div>

          {uploadedFiles.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Processed Documents</h3>
              <div className="space-y-6">
                {uploadedFiles.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-8 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between shadow-lg relative ${
                      file.status === 'success' ? 'border-green-500 bg-green-50' :
                      file.status === 'error' ? 'border-red-500 bg-red-50' :
                      'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-6 mb-4 md:mb-0">
                      {file.status === 'success' ? <CheckCircle className="h-12 w-12 text-green-600" /> :
                       file.status === 'error' ? <AlertCircle className="h-12 w-12 text-red-600" /> :
                       <FileIcon className="h-12 w-12 text-gray-600 animate-pulse" />}
                      <div>
                        <p className="text-xl md:text-2xl font-bold text-gray-900">{file.name}</p>
                        <p className="text-base md:text-lg text-gray-600 mt-1">
                          {formatFileSize(file.size)} •{' '}
                          {file.status === 'success' ? `${file.chunks} chunks stored` :
                           file.status === 'error' ? file.message || 'Upload failed' : 'Processing...'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {file.status === 'success' && (
                        <div className="text-center">
                          <p className="text-4xl font-extrabold text-green-600">{file.chunks}</p>
                          <p className="text-lg text-gray-700">chunks stored</p>
                        </div>
                      )}
                      {file.status === 'uploading' && (
                        <button
                          onClick={() => cancelUpload(file.id, file.name)}
                          className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-md"
                          title="Cancel upload"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      )}
                      {file.status === 'success' && (
                        <button
                          onClick={() => removeDocument(file.name)}
                          className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-900 transition shadow-md"
                          title="Remove document"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Toast Notification */}
      {message && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 pointer-events-none">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-xl shadow-2xl text-center pointer-events-auto max-w-md"
          >
            <p className={`text-2xl font-bold ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.type.toUpperCase()}
            </p>
            <p className="text-black text-xl mt-4">{message.text}</p>
            <button onClick={() => setMessage(null)} className="mt-8 text-gray-600 underline text-lg">
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Home;