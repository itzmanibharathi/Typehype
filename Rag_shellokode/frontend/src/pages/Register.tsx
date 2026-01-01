// src/pages/Register.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [suggestedUsername, setSuggestedUsername] = useState('');
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const firstName = watch('firstName') || '';
  const lastName = watch('lastName') || '';

  useEffect(() => {
    const base = `${firstName}${lastName}`.toLowerCase().replace(/\s/g, '');
    setSuggestedUsername(base || 'yourusername');
  }, [firstName, lastName]);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    const result = await registerUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      password: data.password,
    });
    setIsLoading(false);

    if (result.success) {
      setMessage({ type: 'success', text: `Success! Username: ${result.username}` });
      setTimeout(() => navigate('/'), 2000);
    } else {
      setMessage({ type: 'error', text: result.message || 'Registration failed' });
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12 text-sm md:text-lg lg:text-xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 md:p-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Create Account</h2>
          {suggestedUsername && suggestedUsername !== 'yourusername' && (
            <p className="mt-4 text-lg font-medium text-gray-800">
              Suggested username: <span className="font-bold">{suggestedUsername}</span>
            </p>
          )}
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <input {...register('firstName')} type="text" placeholder="First Name" className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-300" />
              {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <input {...register('lastName')} type="text" placeholder="Last Name" className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-300" />
              {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>}
            </div>
          </div>

          <input {...register('email')} type="email" placeholder="Email Address" className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-300" />
          {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}

          <input {...register('phoneNumber')} type="tel" placeholder="Phone Number" className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-300" />
          {errors.phoneNumber && <p className="mt-2 text-sm text-red-600">{errors.phoneNumber.message}</p>}

          <input {...register('password')} type="password" placeholder="Password" className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-300" />
          {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}

          <input {...register('confirmPassword')} type="password" placeholder="Confirm Password" className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-300" />
          {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>}

          <button type="submit" disabled={isLoading} className="w-full py-5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-70 transition shadow-lg">
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign in</Link>
        </p>
      </motion.div>

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

export default Register;