// src/components/OnboardingFlow.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const questions = [
  { id: 'sensory', text: 'I notice subtle smells, textures, and sounds often.', weight: true },
  { id: 'playfulness', text: 'I love being silly and playful.', weight: true },
  { id: 'embodiment', text: 'I feel deeply connected to my body.', weight: true },
  { id: 'nostalgia', text: 'Past memories with my partner turn me on.', weight: true },
  { id: 'autonomy', text: 'I need freedom even in love.', weight: true },
  { id: 'transcendence', text: 'Moments of awe make me feel romantic.', weight: true },
  { id: 'temporal', text: 'Time slows when I’m aroused.', weight: true },
  // Add 30–50 more...
];

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState('');
  const [partnerCode, setPartnerCode] = useState('');

  const handleAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    setTimeout(() => setStep(prev => prev + 1), 300);
  };

  const finalize = async () => {
    const weights = {};
    Object.keys(answers).forEach(k => {
      weights[`${k}_weight`] = answers[k] / 5;
    });

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('profiles').upsert({
      id: user.id,
      display_name: name,
      partner_id: partnerCode ? await findPartnerByCode(partnerCode) : null,
      onboarding_completed: true,
      ...weights
    });

    onComplete();
  };

  if (step === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Welcome to AMORTEST</h1>
        <input
          placeholder="Your display name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="border p-2 mt-4 w-full"
        />
        <input
          placeholder="Partner code (optional)"
          value={partnerCode}
          onChange={e => setPartnerCode(e.target.value)}
          className="border p-2 mt-2 w-full"
        />
        <button onClick={() => setStep(1)} className="bg-blue-600 text-white p-2 mt-4">Start</button>
      </div>
    );
  }

  if (step <= questions.length) {
    const q = questions[step - 1];
    return (
      <div className="p-6 text-center">
        <p className="text-lg mb-6">{q.text}</p>
        <div className="flex justify-center gap-2">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              onClick={() => handleAnswer(q.id, n)}
              className="w-12 h-12 border rounded-full hover:bg-gray-200"
            >{n}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl">All set!</h2>
      <button onClick={finalize} className="bg-green-600 text-white p-3 mt-4">Begin Daily Check-In</button>
    </div>
  );
}

async function findPartnerByCode(code) {
  // Future: use invite codes
  return null;
}
