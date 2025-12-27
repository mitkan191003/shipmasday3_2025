'use client';

import { useEffect, useState } from 'react';

type InputMethod = 'audio' | 'cursor' | 'touch';

interface InputModalProps {
  onSelect: (method: InputMethod) => void;
}

export default function InputModal({ onSelect }: InputModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if user is on mobile/touch device
    const checkMobile = () => {
      setIsMobile(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 768
      );
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: 300, 
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, var(--accent-frost), var(--accent-ice))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Create Your Snowflake
        </h2>
        <p style={{ 
          color: 'var(--text-secondary)', 
          marginBottom: '2rem',
          fontSize: '1.1rem',
          lineHeight: 1.6,
        }}>
          Choose how you&apos;d like to generate your unique crystal pattern. 
          Your input will be transformed into a one-of-a-kind snowflake.
        </p>

        <button className="btn-choice" onClick={() => onSelect('audio')}>
          <div className="btn-choice-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 500 }}>Record Audio</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              2 seconds of sound
            </div>
          </div>
        </button>

        {isMobile ? (
          <button className="btn-choice" onClick={() => onSelect('touch')}>
            <div className="btn-choice-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 500 }}>Tap Screen</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                8 random taps
              </div>
            </div>
          </button>
        ) : (
          <button className="btn-choice" onClick={() => onSelect('cursor')}>
            <div className="btn-choice-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                <path d="M13 13l6 6"/>
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 500 }}>Move Cursor</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Draw freely in a zone
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

