import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../lib/firebase';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
    
    setLoading(false);
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
                <form onSubmit={handleResetPassword}>
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Reset your Password ✨</h1>
                    </div>
                    
                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
                        Password reset email sent! Check your inbox for instructions.
                      </div>
                    )}

                    {!success && (
                      <>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Enter your email address and we'll send you a link to reset your password.
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
                      </>
                    )}
                  </div>
                  
                  {!success && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="mr-1">
                        <Link className="text-sm underline hover:no-underline" to="/signin">
                          Back to Sign In
                        </Link>
                      </div>
                      <button 
                        className="btn bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white ml-3 whitespace-nowrap"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </div>
                  )}
                </form>

                {success && (
                  <div className="mt-6">
                    <Link className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300 w-full" to="/signin">
                      Back to Sign In
                    </Link>
                  </div>
                )}
                
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

export default ResetPassword;