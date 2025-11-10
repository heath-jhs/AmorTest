// src/components/OnboardingFlow.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const questions = [
  { id: 'sensory', text: 'I notice subtle smells, textures, and sounds often.' },
  { id: 'playfulness', text: 'I love being silly and playful.' },
  { id: 'embodiment', text: 'I feel deeply connected to my body.' },
  { id: 'nostalgia', text: 'Past memories with my partner turn me on.' },
  { id: 'autonomy', text: 'I need freedom even in love.' },
  { id: 'transcendence', text: 'Moments of awe make me feel romantic.' },
  { id: 'temporal', text: 'Time slows when I’m aroused.' },
];

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    setTimeout(() => setStep(prev => prev + 1), 350);
  };

  const finalize = async () => {
    setLoading(true);
    const weights = {};
    Object.keys(answers).forEach(k => {
      weights[`${k}_weight`] = answers[k] / 5;
    });

    const { data: { user } } = await supabase.auth.getUser();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    let partnerId = null;
    if (partnerCode) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('invite_code', partnerCode)
        .single();
      partnerId = data?.id || null;
    }

    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: name,
        partner_id: partnerId,
        invite_code: code,
        onboarding_completed: true,
        ...weights
      })
      .select()
      .single();

    setInviteCode(code);
    setStep('invite');
    setLoading(false);

    onComplete(newProfile);
  };

  // STEP 0: Name + Partner Code
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2">Welcome to AMORTEST</h1>
          <p className="text-center text-gray-600 mb-8">Let’s set you up</p>

          <input
            placeholder="Your display name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-4 mb-4 text-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition"
          />

          <input
            placeholder="Partner code (optional)"
            value={partnerCode}
            onChange={e => setPartnerCode(e.target.value.toUpperCase())}
            className="w-full border border-gray-300 rounded-lg p-4 mb-6 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />

          <button
            onClick={() => name.trim() && setStep(1)}
            disabled={!name.trim()}
            className="w-full bg-gradient-to-r from-pink-600 to-blue-600 text-white p-4 rounded-lg font-semibold text-lg hover:opacity-90 transition shadow-md disabled:opacity-50"
          >
            Start Onboarding
          </button>
        </div>
      </div>
    );
  }

  // STEP 1–7: Questions
  if (step <= questions.length) {
    const q = questions[step - 1];
    const allAnswered = Object.keys(answers).length === questions.length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-gray-500">Question {step} of {questions.length}</span>
            <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-600 to-blue-600 transition-all duration-300"
                style={{ width: `${(step / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <h2 className="text-2xl font-medium text-center mb-10">{q.text}</h2>

          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => handleAnswer(q.id, n)}
                className={`w-16 h-16 rounded-full border-2 text-lg font-semibold transition-all transform hover:scale-110
                  ${answers[q.id] === n 
                    ? 'bg-gradient-to-r from-pink-600 to-blue-600 text-white border-transparent shadow-lg scale-110' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-pink-400'
                  }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-8 text-sm text-gray-500">
            <span>Strongly Disagree</span>
            <span>Strongly Agree</span>
          </div>

          {allAnswered && step === questions.length && (
            <button
              onClick={finalize}
              disabled={loading}
              className="mt-10 w-full bg-gradient-to-r from-pink-600 to-blue-600 text-white p-4 rounded-lg font-semibold text-lg hover:opacity-90 transition shadow-md disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Onboarding'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // FINAL: Show Invite Code
  if (step === 'invite') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">You're all set!</h2>
          <p className="text-gray-600 mb-6">Share this code with your partner:</p>

          <div className="bg-gray-100 rounded-lg p-4 font-mono text-2xl tracking-widest mb-6 select-all">
            {inviteCode}
          </div>

          <button
            onClick={() => onComplete()}
            className="w-full bg-gradient-to-r from-pink-600 to-blue-600 text-white p-4 rounded-lg font-semibold text-lg hover:opacity-90 transition"
          >
            Go to Daily Check-In
          </button>
        </div>
      </div>
    );
  }

  return null;
}
