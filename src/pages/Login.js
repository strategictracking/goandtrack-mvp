// src/pages/Login.js
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('✅ Login successful');
      // ⬇️ Add this line to redirect after login
      navigate('/dashboard');
    }
  };

  const handlePasswordReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset`, // Update if needed
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('📧 Password reset email sent!');
      setShowReset(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: '10px', width: '100%' }}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: '10px', width: '100%' }}
        />
        <br />
        <button type="submit" style={{ width: '100%', padding: '10px' }}>
          Login
        </button>
      </form>

      <p style={{ marginTop: '10px' }}>
        <button
          onClick={() => setShowReset(true)}
          style={{
            border: 'none',
            background: 'none',
            color: 'blue',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Forgot your password?
        </button>
      </p>

      {showReset && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h4>Reset your password</h4>
          <input
            type="email"
            placeholder="Enter your email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            style={{ marginBottom: '10px', width: '100%' }}
          />
          <button onClick={handlePasswordReset} style={{ width: '100%', padding: '10px' }}>
            Send reset link
          </button>
        </div>
      )}

      {message && <p style={{ marginTop: '1rem', color: 'red' }}>{message}</p>}
    </div>
  );
};

export default Login;