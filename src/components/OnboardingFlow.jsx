// src/components/OnboardingFlow.jsx — FINAL
// ... (top part unchanged)

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
          onClick={onComplete} // ← CALL onComplete
          className="w-full bg-gradient-to-r from-pink-600 to-blue-600 text-white p-4 rounded-lg font-semibold text-lg hover:opacity-90 transition"
        >
          Go to Daily Check-In
        </button>
      </div>
    </div>
  );
}
