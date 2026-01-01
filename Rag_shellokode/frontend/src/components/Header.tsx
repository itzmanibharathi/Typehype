// src/components/Header.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Upload', path: '/' },
    { label: 'Query', path: '/query' },
    { label: 'Preview', path: '/preview' },
    { label: 'Profile', path: '/profile' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-md py-4 px-6">
      <nav className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4 text-sm md:text-lg lg:text-xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">TypeHype</h1>
        <div className="flex flex-wrap gap-4 md:gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-6 py-3 font-medium rounded-full transition-all duration-300 ${
                location.pathname === item.path
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-black hover:text-white'
              }`}
            >
              {item.label}
              {location.pathname === item.path && (
                <motion.div
                  className="absolute inset-0 bg-black rounded-full -z-10"
                  layoutId="navbar-bg"
                />
              )}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="px-6 py-3 font-medium text-gray-700 hover:bg-black hover:text-white rounded-full transition-all duration-300 flex items-center gap-2"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </nav>
    </header>
  );
};

export default Header;