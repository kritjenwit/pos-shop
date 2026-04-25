import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { APP } from '../../constants';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp && APP.environment !== 'production') {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
      <div
        className="rounded-lg shadow-sm p-8 w-full max-w-md"
        style={{ backgroundColor: '#ffffff' }}
      >
        <h1 className="text-2xl font-bold text-center mb-6" style={{ color: '#1e293b' }}>
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h1>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm focus:outline-none"
                style={{ borderColor: '#e2e8f0' }}
                required
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none"
              style={{ borderColor: '#e2e8f0' }}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none"
              style={{ borderColor: '#e2e8f0' }}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm" style={{ color: '#64748b' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          {APP.environment !== 'production' && (
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              style={{ color: '#2563eb' }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}