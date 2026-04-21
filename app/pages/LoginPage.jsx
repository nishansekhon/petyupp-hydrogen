import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
function LoginPage() {
  useEffect(() => {
    document.title = 'Sign In | PetYupp';
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth() || {};
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { if (login) await login(email, password); navigate('/account'); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-3xl font-black text-[#06B6D4]">PetYupp</span>
          <h2 className="text-xl font-black text-gray-900 mt-2">Welcome back</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#06B6D4] outline-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          New? <Link to="/shop" className="text-[#06B6D4] font-semibold">Shop PetYupp</Link>
        </p>
      </div>
    </div>
  );
}
export default LoginPage;
