// src/components/OnboardingFlow.jsx — FINAL
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

    const { data: newProfile } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: name,
      partner_id: partnerId,
      invite_code: code,
      onboarding_completed: true,
      ...weights
    }).select().single();

    setInviteCode(code);
    setStep('invite');
    setLoading(false);

    // CALL onComplete with full profile
    onComplete(newProfile);
  };

  // ... (rest of UI unchanged)
