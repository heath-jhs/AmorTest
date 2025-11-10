// netlify/functions/congruence-engine.js
import { supabase, generateCoupleId } from '../../src/lib/supabaseClient.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { user_id } = JSON.parse(event.body);
  if (!user_id) return { statusCode: 400 };

  try {
    const profile = await getProfile(user_id);
    const partner = await getPartner(profile);
    if (!partner) return { statusCode: 400, body: 'No partner' };

    const coupleId = generateCoupleId(user_id, partner.id);
    const today = new Date().toISOString().split('T')[0];

    // Get both responses
    const [myResp, partnerResp] = await Promise.all([
      getResponses(user_id, today),
      getResponses(partner.id, today)
    ]);

    if (myResp.length < 3 || partnerResp.length < 3) {
      return { statusCode: 200, body: JSON.stringify({ score: null, suggestion: 'incomplete' }) };
    }

    const score = calculateCongruence(myResp, partnerResp);
    const suggestionType = score >= 70 ? 'intimate' : score < 50 ? 'platonic' : 'neutral';

    // Save sync
    await supabase.from('daily_syncs').upsert({
      couple_id: coupleId,
      date: today,
      score,
      suggestion_type: suggestionType
    });

    // Get suggestion
    const { data: activity } = await supabase
      .from('activities')
      .select('text')
      .eq('type', suggestionType)
      .order('random()')
      .limit(1)
      .single();

    return {
      statusCode: 200,
      body: JSON.stringify({
        score,
        suggestion: activity?.text || 'Enjoy your day together.',
        type: suggestionType
      })
    };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};

async function getProfile(id) {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
  return data;
}

async function getPartner(profile) {
  if (!profile.partner_id) return null;
  const { data } = await supabase.from('profiles').select('id').eq('id', profile.partner_id).single();
  return data;
}

async function getResponses(userId, date) {
  const { data } = await supabase
    .from('responses')
    .select('question_id, response_likert, response_emoji, response_text')
    .eq('user_id', userId)
    .eq('response_date', date);
  return data;
}

function calculateCongruence(a, b) {
  const mapA = Object.fromEntries(a.map(r => [r.question_id, r]));
  const mapB = Object.fromEntries(b.map(r => [r.question_id, r]));

  const shared = a.filter(r => mapB[r.question_id]);
  if (shared.length === 0) return 50;

  let totalDiff = 0;
  for (const r of shared) {
    const ra = mapA[r.question_id];
    const rb = mapB[r.question_id];

    if (ra.response_likert && rb.response_likert) {
      totalDiff += Math.abs(ra.response_likert - rb.response_likert);
    }
    // Emoji/freetext: future NLP
  }

  const maxDiff = shared.length * 4;
  const similarity = 1 - (totalDiff / maxDiff);
  return Math.round(similarity * 100);
}
