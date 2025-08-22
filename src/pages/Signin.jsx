import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Signin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      navigate('/deals');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-white dark:bg-gray-900">
      <div className="relative md:flex">
        
        {/* Content */}
        <div className="md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">
            
            <div className="flex-1">
              <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link className="block" to="/">
                  <svg className="w-8 h-8" viewBox="0 0 32 32">
                    <defs>
                      <linearGradient x1="28.538%" y1="20.229%" x2="100%" y2="108.156%" id="logo-a">
                        <stop stopColor="#A5B4FC" stopOpacity="0" offset="0%" />
                        <stop stopColor="#A5B4FC" offset="100%" />
                      </linearGradient>
                      <linearGradient x1="88.638%" y1="29.267%" x2="22.42%" y2="100%" id="logo-b">
                        <stop stopColor="#38BDF8" stopOpacity="0" offset="0%" />
                        <stop stopColor="#38BDF8" offset="100%" />
                      </linearGradient>
                    </defs>
                    <rect fill="#6366F1" width="32" height="32" rx="16" />
                    <path d="M18.277.16C26.035 1.267 32 7.938 32 16c0 8.837-7.163 16-16 16a15.937 15.937 0 01-10.426-3.863L18.277.161z" fill="#4F46E5" />
                    <path d="M7.404 2.503l18.339 26.19A15.93 15.93 0 0116 32C7.163 32 0 24.837 0 16 0 10.327 2.952 5.344 7.404 2.503z" fillOpacity=".32" fill="url(#logo-a)" />
                    <path d="M2.223 24.14L29.777 7.86A15.926 15.926 0 0132 16c0 8.837-7.163 16-16 16-5.864 0-10.991-3.154-13.777-7.86z" fillOpacity=".32" fill="url(#logo-b)" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="px-4 py-8">
              <div className="w-full max-w-sm mx-auto">
                
                {/* Form */}
                <form onSubmit={handleSignIn}>
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Welcome back! ✨</h1>
                    </div>
                    
                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="email">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        className="form-input w-full"
                        type="email"
                        placeholder="john@company.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="password">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="password"
                        className="form-input w-full"
                        type="password"
                        autoComplete="on"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <div className="mr-1">
                      <Link className="text-sm underline hover:no-underline" to="/reset-password">
                        Forgot Password?
                      </Link>
                    </div>
                    <button 
                      className="btn bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white ml-3 whitespace-nowrap"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </div>
                </form>
                
                {/* Footer */}
                <div className="pt-5 mt-6 border-t border-gray-100 dark:border-gray-700/60">
                  <div className="text-sm">
                    Don't have an account?{' '}
                    <Link className="font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" to="/signup">
                      Sign Up
                    </Link>
                  </div>
                </div>
                
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Image */}
        <div className="hidden md:block absolute top-0 bottom-0 right-0 md:w-1/2" aria-hidden="true">
          <img 
            className="object-cover object-center w-full h-full" 
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1567&q=80" 
            width="760" 
            height="1024" 
            alt="Authentication" 
          />
        </div>
        
      </div>
    </main>
  );
}

export default Signin;