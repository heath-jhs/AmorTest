// src/App.jsx — FINAL WHITE-SCREEN-PROOF
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient.js';
import OnboardingFlow from './components/OnboardingFlow.jsx';
import DailyCheckIn from './components/DailyCheckIn.jsx';
import SyncResult from './components/SyncResult.jsx';
import PrivateChannel from './components/PrivateChannel.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const { data: { session } } = supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, partner:partner_id(display_name)')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setPartner(data.partner);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    fetchProfile();
  };

  // ——— LOADING ———
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">Loading AMORTEST...</p>
        </div>
      </div>
    );
  }

  // ——— ERROR ———
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // ——— NO USER ———
  if (!user) {
    return <Auth />;
  }

  // ——— ONBOARDING ———
  if (!profile?.onboarding_completed) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // ——— MAIN APP ———
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-4">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-blue-600">
          AMORTEST
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          You & {partner?.display_name || 'Your Partner'}
        </p>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        <DailyCheckIn userId={user.id} />
        <SyncResult userId={user.id} />
        <PrivateChannel userId={user.id} />
      </div>

      <footer className="text-center text-xs text-gray-500 mt-10">
        Private • Adaptive • Secure
      </footer>
    </div>
  );
}

// ——— AUTH COMPONENT (unchanged) ———
function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleAuth}
          className="w-full bg-gradient-to-r from-pink-600 to-blue-600 text-white p-3 rounded font-medium hover:opacity-90 transition"
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>

        <p className="text-center text-sm mt-4">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-pink-600 font-medium underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
