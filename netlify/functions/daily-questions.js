// netlify/functions/daily-questions.js
import { supabase } from '../../src/lib/supabaseClient.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { user_id } = JSON.parse(event.body);
  if (!user_id) return { statusCode: 400, body: 'user_id required' };

  try {
    // Get user profile + weights
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (!profile) return { statusCode: 404, body: 'Profile not found' };

    // Avoid out-of-bounds
    const excluded = profile.out_of_bounds_questions || [];

    // Weighted random selection by construct
    const weights = {
      sensory: profile.sensory_weight,
      playfulness: profile.playfulness_weight,
      embodiment: profile.embodiment_weight,
      nostalgia: profile.nostalgia_weight,
      autonomy: profile.autonomy_weight,
      transcendence: profile.transcendence_weight,
      temporal: profile.temporal_weight
    };

    const questionCount = import.meta.env.VITE_DAILY_QUESTION_COUNT || 6;

    let questions = [];
    for (const [construct, weight] of Object.entries(weights)) {
      const count = Math.max(1, Math.floor(questionCount * weight));
      const { data } = await supabase
        .from('questions')
        .select('id, text, type')
        .eq('construct1', construct)
        .or(`construct2.eq.${construct}`)
        .not('id', 'in', `(${excluded.join(',')})`)
        .limit(count * 3); // oversample

      const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, count);
      questions = questions.concat(shuffled);
    }

    // Final shuffle + slice
    questions = questions.sort(() => 0.5 - Math.random()).slice(0, questionCount);

    return {
      statusCode: 200,
      body: JSON.stringify(questions)
    };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};
