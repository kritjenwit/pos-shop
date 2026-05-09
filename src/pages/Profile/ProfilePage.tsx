import { useState, useEffect } from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateUserPhone } from '../../lib/auth';
import { supabase, type User as UserType } from '../../lib/supabase';
import { COLORS } from '../../constants';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
        setPhone(data.phone || '');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [authUser]);

  const validatePhone = (value: string): boolean => {
    if (!value) return true;
    return /^[0-9+\-\s()]+$/.test(value);
  };

  const handleSavePhone = async () => {
    if (!authUser) return;

    if (!validatePhone(phone)) {
      setMessage({ type: 'error', text: 'Invalid phone number format' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const { error } = await updateUserPhone(authUser.id, phone || null);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Phone number updated' });
      setProfile((prev) => (prev ? { ...prev, phone } : null));
    }

    setSaving(false);
  };

  useEffect(() => {
    if (!authUser) {
      navigate('/');
    }
  }, [authUser, navigate]);

  if (!authUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="skeleton h-6 w-32"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 font-heading" style={{ color: COLORS.text }}>Profile</h1>

      <div className="rounded-lg shadow-card p-6" style={{ backgroundColor: COLORS.cardBackground }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
            <User size={24} color="#ffffff" />
          </div>
          <div>
            <p className="font-semibold font-heading" style={{ color: COLORS.text }}>{profile?.full_name || 'User'}</p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>{profile?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className="label-base flex items-center gap-2" style={{ color: COLORS.textSecondary }}>
              <User size={14} />
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={profile?.full_name || ''}
              disabled
              className="input-base bg-slate-50"
              style={{ color: COLORS.textSecondary }}
            />
          </div>

          <div>
            <label htmlFor="email" className="label-base flex items-center gap-2" style={{ color: COLORS.textSecondary }}>
              <Mail size={14} />
              Email
            </label>
            <input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="input-base bg-slate-50"
              style={{ color: COLORS.textSecondary }}
            />
          </div>

          <div>
            <label htmlFor="phone" className="label-base flex items-center gap-2" style={{ color: COLORS.textSecondary }}>
              <Phone size={14} />
              Phone Number
            </label>
            <div className="flex gap-2">
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812345678"
                className="input-base flex-1 font-mono"
              />
              <button
                onClick={handleSavePhone}
                disabled={saving || phone === profile?.phone}
                className="btn-primary px-4 whitespace-nowrap"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div
            className="mt-4 p-3 rounded text-sm animate-scale-in"
            style={{
              backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: message.type === 'success' ? '#065F46' : '#DC2626',
              border: `1px solid ${message.type === 'success' ? COLORS.border : '#FECACA'}`,
            }}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
