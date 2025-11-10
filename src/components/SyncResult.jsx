// src/components/SyncResult.jsx
import { useState, useEffect } from 'react';
import { supabase, generateCoupleId } from '../lib/supabaseClient.js';

export default function SyncResult({ userId }) {
  const [sync, setSync] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSync = async () => {
      const profile = await supabase.from('profiles').select('partner_id').eq('id', userId).single();
      if (!profile.data?.partner_id) {
        setLoading(false);
        return;
      }

      const coupleId = generateCoupleId(userId, profile.data.partner_id);
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('daily_syncs')
        .select('score, suggestion_type')
        .eq('couple_id', coupleId)
        .eq('date', today)
        .single();

      if (data) {
        const { data: activity } = await supabase
          .from('activities')
          .select('text')
          .eq('type', data.suggestion_type)
          .order('random()')
          .limit(1)
          .single();

        setSync({ ...data, suggestion: activity?.text || 'Enjoy your day.' });
      }
      setLoading(false);
    };

    fetchSync();

    const subscription = supabase
      .channel('syncs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_syncs' }, () => fetchSync())
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [userId]);

  if (loading) return <div className="p-4">Checking sync...</div>;
  if (!sync) return <div className="p-4 text-gray-500">Waiting for partner...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow text-center">
      <h2 className="text-xl font-bold mb-2">Amorous Sync</h2>
      <div className="text-5xl font-bold my-4" style={{ color: sync.score >= 70 ? '#e91e63' : sync.score < 50 ? '#607d8b' : '#ff9800' }}>
        {sync.score}%
      </div>
      <p className="text-lg font-medium mb-3">
        {sync.score >= 70 ? 'High Sync' : sync.score < 50 ? 'Low Sync' : 'Mid Sync'}
      </p>
      <p className="italic text-gray-700">{sync.suggestion}</p>
    </div>
  );
}
