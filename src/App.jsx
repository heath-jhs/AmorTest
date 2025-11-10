// src/App.jsx — FINAL
// ... (top part unchanged)

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async () => {
    setMessage('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for confirmation link!');
        setTimeout(() => setMessage(''), 5000); // Auto-clear
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage(err.message);
      setTimeout(() => setMessage(''), 5000);
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
        {message && (
          <p className="text-sm text-center mb-4 p-3 bg-green-100 text-green-800 rounded">
            {message}
          </p>
        )}
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
