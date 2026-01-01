// src/pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 text-sm md:text-lg lg:text-xl">
      <div className="max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-center mb-12"
        >
          My Profile
        </motion.h1>

        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <div className="space-y-6">
            <div>
              <p className="text-gray-600">Full Name</p>
              <p className="text-2xl font-semibold">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <p className="text-gray-600">Username</p>
              <p className="text-2xl font-semibold">@{user?.username}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="text-2xl font-semibold">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone</p>
              <p className="text-2xl font-semibold">{user?.phoneNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
            <p className="text-black text-xl font-medium">
              {message.type.toUpperCase()}: {message.text}
            </p>
            <button onClick={() => setMessage(null)} className="mt-6 text-gray-600 underline text-lg">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;