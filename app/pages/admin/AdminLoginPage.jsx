import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAdmin } from '@/contexts/AdminAuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { LOGO } from '@/constants/brand';

function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAdmin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (isAdmin) {
      navigate('/admin/marketing');
    }
  }, [isAdmin, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const success = await login(password);
    
    if (success) {
      console.log('✅ Redirecting to Marketing Hub');
      navigate('/admin/marketing');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <motion.div 
        className="bg-slate-800 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div 
            className="mx-auto mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <img 
              src={LOGO.white} 
              alt={LOGO.alt}
              className="h-12 md:h-16 object-contain mx-auto"
            />
          </motion.div>
          <h1 className="text-2xl font-black text-slate-100 mb-2">Admin Login</h1>
          <p className="text-slate-400 text-sm">PetYupp Dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter admin password"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && (
              <motion.p 
                className="text-red-400 text-sm mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}
          </div>

          <motion.button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Login to Dashboard
          </motion.button>
        </form>

        {/* Back to Site */}
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-slate-400 hover:text-teal-500 transition-colors">
            ← Back to Website
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default AdminLoginPage;
