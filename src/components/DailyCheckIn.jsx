// src/components/DailyCheckIn.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export default function DailyCheckIn({ userId }) {
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchQuestions();
    checkTodaySubmission();
  }, [userId]);

  const fetchQuestions = async () => {
    const res = await fetch('/api/daily-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    const data = await res.json();
    setQuestions(data);
    setLoading(false);
  };

  const checkTodaySubmission = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('responses')
      .select('id')
      .eq('user_id', userId)
      .eq('response_date', today)
      .limit(1);
    if (data.length > 0) setSubmitted(true);
  };

  const handleResponse = (qid, value) => {
    setResponses(prev => ({ ...prev, [qid]: value }));
  };

  const submit = async () => {
    const entries = Object.entries(responses).map(([qid, value]) => {
      const q = questions.find(q => q.id === qid);
      return {
        user_id: userId,
        question_id: qid,
        responded_at: new Date().toISOString(),
        ...(q.type === 'likert' && { response_likert: value }),
        ...(q.type === 'emoji' && { response_emoji: value }),
        ...(q.type === 'freetext' && { response_text: value })
      };
    });

    await supabase.from('responses').insert(entries);
    setSubmitted(true);

    // Trigger sync
    await fetch('/api/congruence-engine', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    });
  };

  const flagOutOfBounds = async (qid) => {
    await supabase
      .from('profiles')
      .update({ out_of_bounds_questions: supabase.raw('array_append(out_of_bounds_questions, ?)', [qid]) })
      .eq('id', userId);
    setQuestions(prev => prev.filter(q => q.id !== qid));
  };

  if (loading) return <div className="p-4">Loading questions...</div>;
  if (submitted) return <div className="p-4 text-green-600">✓ Check-in complete!</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Daily Check-In (7 Questions)</h2>
      {questions.map((q, i) => (
        <div key={q.id} className="mb-6 p-4 border rounded">
          <div className="flex justify-between items-start">
            <p className="flex-1">{i + 1}. {q.text}</p>
            <button
              onClick={() => flagOutOfBounds(q.id)}
              className="text-xs text-red-500 underline"
            >
              Out of Bounds
            </button>
          </div>

          {q.type === 'likert' && (
            <div className="flex gap-2 mt-3 justify-center">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => handleResponse(q.id, n)}
                  className={`w-10 h-10 rounded-full border ${responses[q.id] === n ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {q.type === 'emoji' && (
            <div className="flex gap-3 mt-3 justify-center text-2xl">
              {['😊','😌','😏','😴','😳'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleResponse(q.id, emoji)}
                  className={`${responses[q.id] === emoji ? 'scale-125' : ''}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {q.type === 'freetext' && (
            <input
              type="text"
              placeholder="Type your answer..."
              onChange={e => handleResponse(q.id, e.target.value)}
              className="mt-3 border p-2 w-full rounded"
            />
          )}
        </div>
      ))}

      <button
        onClick={submit}
        disabled={Object.keys(responses).length < questions.length}
        className="w-full bg-blue-600 text-white p-3 rounded disabled:bg-gray-300"
      >
        Submit Answers
      </button>
    </div>
  );
}
