import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Layers, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post<{ user: any; token: string }>('/auth/login', {
        email,
        password,
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string, pass: string) => {
    setEmail(roleEmail);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Layers className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          FlowPilot <span className="text-cyan-400">AI</span>
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          Autonomous Business Operations Agent Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Sign in to Operations Console</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Work Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@flowpilot.ai"
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>

          {/* Development Quick-Fill Accounts */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center space-x-1 text-xs font-medium text-slate-500 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hackathon Demo Accounts:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('operator@flowpilot.ai', 'OperatorPassword123!')}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 text-center transition-colors"
              >
                Operator
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('manager@flowpilot.ai', 'ManagerPassword123!')}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-medium text-blue-700 text-center transition-colors"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin@flowpilot.ai', 'AdminPassword123!')}
                className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded text-xs font-medium text-purple-700 text-center transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-slate-500">Need an account? </span>
            <Link to="/register" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

