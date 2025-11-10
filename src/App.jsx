// src/App.jsx
import { useState, useEffect } from 'react';
import { supabase, getMyProfile, getPartnerProfile } from './lib/supabaseClient.js';
import OnboardingFlow from './components/OnboardingFlow.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      getMyProfile().then(setProfile);
      getPartnerProfile().then(setPartner);
    }
  }, [user]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Auth />;

  if (!profile?.onboarding_completed) {
    return <OnboardingFlow onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold">AMORTEST</h1>
        <p className="text-sm text-gray-600">You & {partner?.display_name}</p>
      </header>
      <DailyCheckIn userId={user.id} />
      <SyncResult />
      <PrivateChannel />
    </div>
  );
}

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signUp = () => supabase.auth.signUp({ email, password });
  const signIn = () => supabase.auth.signInWithPassword({ email, password });

  return (
    <div className="p-8 max-w-sm mx-auto">
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 w-full mb-2" />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 w-full mb-4" />
      <button onClick={signUp} className="bg-green-600 text-white p-2 w-full mb-2">Sign Up</button>
      <button onClick={signIn} className="bg-blue-600 text-white p-2 w-full">Sign In</button>
    </div>
  );
}

// Placeholder components
function DailyCheckIn() { return <div className="bg-white p-4 rounded shadow mb-4">Daily Check-In (TBD)</div>; }
function SyncResult() { return <div className="bg-white p-4 rounded shadow mb-4">Sync Result (TBD)</div>; }
function PrivateChannel() { return <div className="bg-white p-4 rounded shadow">Private Chat (TBD)</div>; }
