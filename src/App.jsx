// src/App.jsx — FINAL WITH AUTO-PROFILE
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient.js';
import OnboardingFlow from './components/OnboardingFlow.jsx.jsx';
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchOrCreateProfile();
    }
  }, [user?.id]);

  const fetchOrCreateProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, partner:partner_id(display_name)')
        .eq('id', user.id)
        .maybeSingle(); // ← KEY: doesn't error if no row

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no row

      if (!data) {
        // Auto-create minimal profile
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ id: user.id, display_name: 'You' })
          .select()
          .single();
        setProfile(newProfile);
      } else {
        setProfile(data);
        setPartner(data.partner);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    fetchOrCreateProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-pink-600 text-white px-6 py-3 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;
  if (!profile?.onboarding_completed) return <OnboardingFlow onComplete={handleOnboardingComplete} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-6">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
          AMORTEST
        </h1>
        <p className="text-lg mt-2">
          You & <span className="font-semibold">{partner?.display_name || 'Your Partner'}</span>
        </p>
      </header>

      <div className="max-w-2xl mx-auto space-y-8">
        <DailyCheckIn userId={user.id} />
        <SyncResult userId={user.id} />
        <PrivateChannel userId={user.id} />
      </div>
    </div>
  );
}

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useSelect('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check email for confirmation!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
          {isSignUp ? 'Join AMORTEST' : 'Welcome Back'}
        </h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-4 border rounded-lg mb-4 focus:ring-2 focus:ring-pink-500 focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-4 border rounded-lg mb-6 focus:ring-2 focus:ring-pink-500 focus:outline-none"
        />
        <button
          onClick={handleAuth}
          className="w-full bg-gradient-to-r from-pink-600 to-blue-600 text-white p-4 rounded-lg font-bold text-lg hover:opacity-90 transition"
        >
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>
        <p className="text-center mt-6 text-sm">
          {isSignUp ? 'Have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-pink-600 font-bold">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
