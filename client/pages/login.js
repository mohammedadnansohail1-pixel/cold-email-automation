import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { auth } from '@/lib/api';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await auth.login({
          email: formData.email,
          password: formData.password,
        });

        localStorage.setItem('auth_token', response.data.token);
        router.push('/');
      } else {
        const response = await auth.register(formData);

        localStorage.setItem('auth_token', response.data.token);
        router.push('/');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick login for demo
  const handleDemoLogin = async () => {
    setFormData({
      email: 'admin@example.com',
      password: 'admin123',
      first_name: '',
      last_name: '',
    });

    setLoading(true);
    setError('');

    try {
      const response = await auth.login({
        email: 'admin@example.com',
        password: 'admin123',
      });

      localStorage.setItem('auth_token', response.data.token);
      router.push('/');
    } catch (error) {
      setError('Demo login failed. Please check if the server is running and database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isLogin ? 'Login' : 'Register'} - AI Cold Email Automation</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
              <FiMail className="text-primary-600 text-4xl" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">AI Cold Email Automation</h1>
            <p className="text-white/80">Automate your outreach with AI-powered personalization</p>
          </div>

          {/* Login/Register Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 rounded-md font-medium transition-all ${
                  isLogin
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 rounded-md font-medium transition-all ${
                  !isLogin
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Demo Login (admin@example.com)
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Use this to quickly test the application
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center text-white">
            <div>
              <div className="text-2xl font-bold mb-1">AI-Powered</div>
              <div className="text-sm text-white/80">Personalization</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">Multi-Channel</div>
              <div className="text-sm text-white/80">Outreach</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">Real-time</div>
              <div className="text-sm text-white/80">Analytics</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
