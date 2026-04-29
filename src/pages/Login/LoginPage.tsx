import { useState } from 'react';
import { Eye, EyeOff, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP, COLORS } from '../../constants';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.background }}>
      <div className="w-full max-w-md animate-scale-in">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
            <ShoppingCart size={32} color="#ffffff" />
          </div>
        </div>

        <div className="rounded-lg shadow-card p-8" style={{ backgroundColor: COLORS.cardBackground }}>
          <h1 className="text-2xl font-bold text-center mb-6 font-heading" style={{ color: COLORS.text }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="label-base" style={{ color: COLORS.textSecondary }}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-base"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="label-base" style={{ color: COLORS.textSecondary }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label-base" style={{ color: COLORS.textSecondary }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pr-10"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer focus-visible:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} style={{ color: COLORS.textSecondary }} /> : <Eye size={16} style={{ color: COLORS.textSecondary }} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 font-heading"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          {APP.environment !== 'production' && (
            <p className="text-center mt-4 text-sm" style={{ color: COLORS.textSecondary }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className="font-semibold cursor-pointer hover:underline focus-visible:outline-none"
                style={{ color: COLORS.primary }}
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
