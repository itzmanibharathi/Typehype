// src/api.ts
import { User } from '../contexts/AuthContext';  // Import User type if needed
import { AuthProvider } from './contexts/AuthContext'; 

const BACKEND_URL = "https://typehype.onrender.com/";  // Replace with your production URL

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Check if username is available and suggest alternative
export const checkUsername = async (name: string): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/suggest-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error("Failed to suggest username");
    const data = await response.json();
    return data.username;
  } catch (e) {
    throw new Error("Username check failed");
  }
};

// Register user (backend generates unique user ID)
export const registerUser = async (userData: Omit<User, 'id'> & { password: string }) => {
  try {
    const response = await fetch(`${BACKEND_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error("Registration failed");
    return await response.json(); // Returns {user_id, message}
  } catch (e) {
    throw new Error("Registration failed");
  }
};

// Login
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error("Login failed");
    const data = await response.json();
    localStorage.setItem("token", data.token);
    return true;
  } catch (e) {
    throw new Error("Login failed");
  }
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem("token");
};

// Upload file
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch(`${BACKEND_URL}/embed`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    if (!response.ok) throw new Error("Upload failed");
    return await response.json();
  } catch (e) {
    throw new Error("Upload failed");
  }
};

// Query
export const sendQuery = async (question: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ question })
    });
    if (!response.ok) throw new Error("Query failed");
    return await response.json();
  } catch (e) {
    throw new Error("Query failed");
  }
};

// Get user's documents
export const getMyDocuments = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/my-docs`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error("Failed to get documents");
    return await response.json();
  } catch (e) {
    throw new Error("Failed to get documents");
  }
};

// Delete document
export const deleteDocument = async (filename: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ filename })
    });
    if (!response.ok) throw new Error("Delete failed");
    return await response.json();
  } catch (e) {
    throw new Error("Delete failed");
  }
};

// Update profile (if needed later)
export const updateProfile = async (updates: Partial<User>) => {
  try {
    const response = await fetch(`${BACKEND_URL}/update-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error("Update failed");
    return await response.json();
  } catch (e) {
    throw new Error("Update failed");
  }
};



