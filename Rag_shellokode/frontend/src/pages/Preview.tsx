// src/pages/Preview.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FileText, Database, Loader2, Trash2, Calendar, X } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Document {
  filename: string;
  chunks_stored: number;
  uploaded_at: string;
}

interface CollectionStats {
  total_chunks: number;
  used_mb: number;
  available_mb: number;
  limit_mb: number;
}

const Preview: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // filename to confirm
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [docsRes, statsRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/my-docs', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://127.0.0.1:8000/collection-stats', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (docsRes.ok) {
          const data = await docsRes.json();
          setDocuments(data.documents || []);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load documents or stats' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const totalDocs = documents.length;
  const totalChunks = stats?.total_chunks || 0;
  const progress = stats ? (stats.used_mb / stats.limit_mb) * 100 : 0;

  const weeklyData = documents.reduce((acc, doc) => {
    const date = new Date(doc.uploaded_at);
    const weekKey = format(startOfWeek(date), 'MMM dd');
    acc[weekKey] = acc[weekKey] || { docs: 0, chunks: 0 };
    acc[weekKey].docs += 1;
    acc[weekKey].chunks += doc.chunks_stored;
    return acc;
  }, {} as Record<string, { docs: number; chunks: number }>);

  const labels = Object.keys(weeklyData).slice(-4);
  const chartData = {
    labels,
    datasets: [
      { label: 'Documents', data: labels.map(l => weeklyData[l]?.docs || 0), backgroundColor: '#3b82f6' },
      { label: 'Chunks', data: labels.map(l => weeklyData[l]?.chunks || 0), backgroundColor: '#10b981' },
    ],
  };

  const handleDelete = async (filename: string) => {
    setDeleting(filename);
    try {
      const res = await fetch('http://127.0.0.1:8000/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token!}`
        },
        body: JSON.stringify({ filename })
      });

      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.filename !== filename));
        setMessage({ type: 'success', text: `"${filename}" deleted successfully` });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.detail || 'Delete failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error during delete' });
    } finally {
      setDeleting(null);
      setConfirmDelete(null); // Close modal
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-16 w-16 text-gray-600" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-2xl font-bold text-red-600">
        Please login first
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 text-sm md:text-lg lg:text-xl">
      <div className="max-w-7xl mx-auto">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl md:text-5xl font-bold text-center mb-12">
          My Documents ({totalDocs})
        </motion.h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-3xl shadow-2xl p-10 text-center">
            <FileText className="mx-auto h-16 w-16 text-blue-600 mb-4" />
            <p className="text-5xl font-bold text-gray-900">{totalDocs}</p>
            <p className="text-xl text-gray-600">Total Documents</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-3xl shadow-2xl p-10 text-center">
            <Database className="mx-auto h-16 w-16 text-green-600 mb-4" />
            <p className="text-5xl font-bold text-gray-900">{totalChunks}</p>
            <p className="text-xl text-gray-600">Total Chunks Stored</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-3xl shadow-2xl p-10">
            <p className="text-2xl font-bold mb-4 text-gray-900">Storage Usage</p>
            <div className="w-full bg-gray-200 rounded-full h-12 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="bg-gradient-to-r from-green-500 to-blue-500 h-full"
              />
            </div>
            <p className="text-center mt-4 text-gray-700 font-medium">
              {stats?.used_mb.toFixed(1)} MB used • {stats?.available_mb.toFixed(1)} MB free
            </p>
          </motion.div>
        </div>

        {/* Weekly Trends Chart */}
        {labels.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl p-10 mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Weekly Upload Trends</h2>
            <div className="h-96">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: { duration: 1500 },
                  plugins: { legend: { position: 'top' as const } }
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="text-center py-32">
            <FileText className="mx-auto h-32 w-32 text-gray-300 mb-8" />
            <p className="text-3xl text-gray-600">No documents uploaded yet</p>
            <p className="text-xl text-gray-500 mt-4">Go to Home and upload your first PDF!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {documents.map((doc) => (
              <motion.div
                key={doc.filename}
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white rounded-3xl shadow-xl p-10 border border-gray-200 hover:shadow-2xl relative"
              >
                <div className="flex justify-between items-start mb-6">
                  <FileText className="h-20 w-20 text-gray-700" />
                  <button
                    onClick={() => setConfirmDelete(doc.filename)}
                    disabled={!!deleting}
                    className="p-4 bg-red-100 text-red-600 rounded-2xl hover:bg-red-200 disabled:opacity-50 transition"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-6 truncate pr-12">{doc.filename}</h3>

                <div className="space-y-4 text-gray-700">
                  <div className="flex items-center">
                    <Database className="w-6 h-6 mr-3 text-blue-600" />
                    <span className="text-xl font-semibold">{doc.chunks_stored} chunks</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-green-600" />
                    <span className="text-lg">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <span className="inline-block px-6 py-3 bg-green-100 text-green-800 rounded-full text-lg font-medium">
                    Ready for queries
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center"
          >
            <div className="mb-8">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Delete Document?</h3>
            <p className="text-lg text-gray-600 mb-8">
              Are you sure you want to delete <span className="font-semibold">"{confirmDelete}"</span>?
              <br />
              <span className="text-red-600 font-medium">This action cannot be undone.</span>
            </p>
            <div className="flex gap-6 justify-center">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-8 py-4 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition text-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={!!deleting}
                className="px-8 py-4 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-70 transition text-lg font-medium flex items-center gap-3"
              >
                {deleting === confirmDelete ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" /> Deleting...
                  </>
                ) : (
                  'Delete Permanently'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className={`px-8 py-5 rounded-2xl shadow-2xl text-white text-xl font-medium flex items-center gap-4 ${
            message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {message.type === 'success' ? '✓' : '✗'} {message.text}
            <button onClick={() => setMessage(null)} className="ml-4">
              <X className="h-6 w-6" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Preview;