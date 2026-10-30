import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout, login } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Quick switch role helper for demonstration
  const handleQuickSwitch = (role: 'ADMIN' | 'MANAGER' | 'OPERATOR') => {
    if (!user) return;
    const names: Record<string, string> = {
      ADMIN: 'Sarah Connor (Admin)',
      MANAGER: 'Marcus Vance (Manager)',
      OPERATOR: 'Alex Rivera (Operator)',
    };
    const updatedUser = {
      ...user,
      role,
      name: names[role],
      email: `${role.toLowerCase()}@flowpilot.ai`,
    };
    login(localStorage.getItem('flowpilot_token') || 'dummy-token', updatedUser);
    setDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Supabase DB: Connected
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3 h-3 mr-1 text-indigo-600" />
            Gemini 2.5 Active
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Role Gating Indicator */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          <span className="text-slate-500">Current Role:</span>
          <span
            className={`px-2 py-0.5 rounded font-mono font-medium ${
              user?.role === 'ADMIN'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : user?.role === 'MANAGER'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}
          >
            {user?.role}
          </span>
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-slate-800 leading-none">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-500 mt-1">{user?.email}</div>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                <p className="text-sm font-medium text-slate-800 truncate">{user?.email}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase()} Authority</p>
              </div>

              {/* Demo Role Switcher */}
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Demo: Switch Role
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {(['OPERATOR', 'MANAGER', 'ADMIN'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleQuickSwitch(r)}
                      className={`text-xs py-1 px-1.5 rounded text-center transition-colors font-mono ${
                        user?.role === r
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {r.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

