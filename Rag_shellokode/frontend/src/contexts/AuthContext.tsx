import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';




interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      password: string;
      profilePicture?: string;
    }
  ) => Promise<{ success: boolean; username?: string; message?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate token on app load
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('https://typehype.onrender.com/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser({
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            username: userData.username,
            profilePicture: userData.profilePicture,
          });
          toast.success(`Welcome back, ${userData.firstName}!`);
        } else {
          localStorage.removeItem('token');
          toast.error('Session expired. Please login again.');
        }
      } catch (err) {
        console.error('Token validation failed:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('https://typehype.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.detail || 'Invalid email or password');
        return false;
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);

      // Fetch user profile
      const meRes = await fetch('https://typehype.onrender.com/me', {
        headers: { Authorization: `Bearer ${data.token}` },
      });

      if (meRes.ok) {
        const userData = await meRes.json();
        setUser({
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          username: userData.username,
          profilePicture: userData.profilePicture,
        });
        toast.success('Login successful!');
        return true;
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      return false;
    }
    return false;
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    profilePicture?: string;
  }): Promise<{ success: boolean; username?: string; message?: string }> => {
    try {
      const res = await fetch('https://typehype.onrender.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        // Auto-login after successful registration
        localStorage.setItem('token', result.user_id);

        setUser({
          id: result.user_id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          username: result.username,
          profilePicture: data.profilePicture,
        });

        toast.success(`Welcome ${data.firstName}! Account created successfully.`);
        return { success: true, username: result.username };
      } else {
        toast.error(result.detail || 'Registration failed');
        return { success: false, message: result.detail || 'Registration failed' };
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      return { success: false, message: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Use regular toast with custom style instead of toast.info()
    toast('Logged out successfully', {
      icon: '👋',
      style: {
        background: '#333',
        color: '#fff',
      },
    });
  };

  const updateProfile = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  profilePicture?: string;
}

