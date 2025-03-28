// src/App.jsx
import React from 'react';
import TypingTest from './TypingTest'; // Import your component
import './App.css'; // Optional: Keep if you have global styles here, or remove

function App() {
  return (
    <div className="App">
      <TypingTest /> {/* Render your TypingTest component */}
    </div>
  );
}

export default App;