import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company: company
          }
        }
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
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
                <form onSubmit={handleSignUp}>
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Create your Account ✨</h1>
                    </div>
                    
                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
                        Account created successfully! Check your email to confirm. Redirecting to sign in...
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="full-name">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="full-name"
                        className="form-input w-full"
                        type="text"
                        placeholder="John Doe"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="company">
                        Company Name
                      </label>
                      <input
                        id="company"
                        className="form-input w-full"
                        type="text"
                        placeholder="Acme Inc."
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
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
                    <div className="text-sm">
                      <Link className="underline hover:no-underline" to="/signin">
                        Have an account? Sign In
                      </Link>
                    </div>
                    <button 
                      className="btn bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white ml-3 whitespace-nowrap"
                      type="submit"
                      disabled={loading || success}
                    >
                      {loading ? 'Creating...' : 'Sign Up'}
                    </button>
                  </div>
                </form>
                
                {/* Footer */}
                <div className="pt-5 mt-6 border-t border-gray-100 dark:border-gray-700/60">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    By creating an account, you agree to the{' '}
                    <a className="underline hover:no-underline" href="#0">
                      terms & conditions
                    </a>, and our{' '}
                    <a className="underline hover:no-underline" href="#0">
                      privacy policy
                    </a>.
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

export default Signup;