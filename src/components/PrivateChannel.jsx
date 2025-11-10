// src/components/PrivateChannel.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { encryptMessage, decryptMessage } from '../lib/crypto.js';

export default function PrivateChannel({ userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [partner, setPartner] = useState(null);
  const fileInput = useRef(null);

  useEffect(() => {
    getPartner();
    fetchMessages();

    const sub = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'encrypted_messages' }, (payload) => {
        if (payload.new.recipient_id === userId || payload.new.sender_id === userId) {
          fetchMessages();
        }
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [userId]);

  const getPartner = async () => {
    const { data } = await supabase.from('profiles').select('partner_id, display_name').eq('id', userId).single();
    if (data.partner_id) {
      const { data: p } = await supabase.from('profiles').select('display_name').eq('id', data.partner_id).single();
      setPartner(p);
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('encrypted_messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('sent_at', { ascending: true });

    const decrypted = await Promise.all(
      data.map(async (m) => {
        try {
          const text = await decryptMessage(m.ciphertext, m.iv);
          return { ...m, text, isMine: m.sender_id === userId };
        } catch {
          return { ...m, text: '[Encrypted]', isMine: m.sender_id === userId };
        }
      })
    );
    setMessages(decrypted);
  };

  const sendMessage = async () => {
    if (!input.trim() || !partner) return;

    const profile = await supabase.from('profiles').select('partner_id').eq('id', userId).single();
    const { ciphertext, iv } = await encryptMessage(input, profile.data.partner_id);

    await supabase.from('encrypted_messages').insert({
      sender_id: userId,
      recipient_id: profile.data.partner_id,
      ciphertext,
      iv,
      sent_at: new Date().toISOString()
    });

    setInput('');
  };

  const sendFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { data } = await supabase.storage.from('encrypted-media').upload(`private/${Date.now()}`, file, {
      upsert: true
    });

    const encryptedPath = await encryptMessage(data.path, 'partner');
    // In production: store encrypted path + thumbnail
    alert('File uploaded (E2EE stub)');
  };

  if (!partner) return <div className="p-4 text-gray-500">No partner linked.</div>;

  return (
    <div className="bg-white rounded-lg shadow h-96 flex flex-col">
      <div className="p-3 border-b font-bold">Chat with {partner.display_name}</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg ${m.isMine ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 border p-2 rounded"
        />
        <input type="file" ref={fileInput} className="hidden" onChange={sendFile} />
        <button onClick={() => fileInput.current.click()} className="px-3">📎</button>
        <button onClick={sendMessage} className="bg-blue-600 text-white px-4 rounded">Send</button>
      </div>
    </div>
  );
}
