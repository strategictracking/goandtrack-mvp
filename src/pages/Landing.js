// /pages/Landing.js
import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div style={{ textAlign: 'center', paddingTop: 100 }}>
      <h1>Welcome to GoandTrack</h1>
      <p>Your AI-powered shipment tracking solution</p>
      <Link to="/login"><button>Login</button></Link>
    </div>
  );
};

export default Landing;
