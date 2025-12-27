'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { generateSnowflakeSVGString } from '@/lib/snowflake';

const Snowflake3D = dynamic(() => import('./Snowflake3D'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '350px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-subtle)',
          borderTop: '3px solid var(--accent-ice)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem',
        }} />
        Crystallizing...
      </div>
    </div>
  ),
});

interface SnowflakeDisplayProps {
  hash: string;
  onReset: () => void;
}

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '550px', maxHeight: '80vh', overflow: 'auto' }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: 500, 
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, var(--accent-frost), var(--accent-ice))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          How It Works
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              color: 'var(--accent-ice)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: 'var(--accent-ice)', 
                color: 'var(--bg-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}>1</span>
              Entropy Collection
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Your input creates <strong>entropy</strong>-random, unpredictable data. Audio recordings 
              capture the unique waveforms of sound (including background noise). Cursor movements 
              track the precise X/Y coordinates and timing of your path. Touch inputs record tap 
              positions and millisecond timestamps. This raw chaos becomes the seed of your snowflake.
            </p>
          </section>

          <section>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              color: 'var(--accent-ice)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: 'var(--accent-ice)', 
                color: 'var(--bg-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}>2</span>
              Cryptographic Hashing
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Your entropy is fed through <strong>SHA-256</strong>, a cryptographic hash function. 
              This transforms any input-whether 2 seconds of audio or 1000 pixels of movement-into 
              a fixed 64-character hexadecimal string. Even the tiniest change in input produces a 
              completely different hash. The same input always produces the same hash, making your 
              snowflake reproducible yet unique.
            </p>
          </section>

          <section>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              color: 'var(--accent-ice)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: 'var(--accent-ice)', 
                color: 'var(--bg-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}>3</span>
              Snowflake Generation
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              The hash becomes a <strong>parameter seed</strong>. Each pair of hexadecimal characters 
              (0-255) determines a specific property: branch lengths, angles, positions of secondary 
              dendrites, whether crystal tips form, the size of the center hexagon, and more. 
              Like real snowflakes, the six-fold symmetry is preserved while every other detail 
              varies-creating 2<sup>256</sup> possible unique patterns.
            </p>
          </section>

          <div style={{ 
            padding: '1rem', 
            background: 'var(--bg-elevated)', 
            borderRadius: '12px',
            borderLeft: '3px solid var(--accent-ice)',
          }}>
            <p style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.9rem', 
              fontStyle: 'italic',
              margin: 0,
            }}>
              "No two snowflakes are alike" - and with 2<sup>256</sup> possibilities 
              (more than atoms in the observable universe), neither are yours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SnowflakeDisplay({ hash, onReset }: SnowflakeDisplayProps) {
  const [stage, setStage] = useState('Nucleating crystal seed...');
  const [showInfo, setShowInfo] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [isReplay, setIsReplay] = useState(false);

  const handleReplay = () => {
    setIsReplay(true);
    setAnimationKey(prev => prev + 1);
  };

  const handleStageChange = (newStage: string) => {
    if (!isReplay) {
      setStage(newStage);
    }
  };

  const handleDownload = () => {
    const svgString = generateSnowflakeSVGString(hash);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `snowflake-${hash.substring(0, 16)}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '1.5rem',
        padding: '2rem',
        width: '100%',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: 500, 
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, var(--accent-frost), var(--accent-ice))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Your Unique Snowflake
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Generated from your unique input
        </p>
      </div>

      {/* Action links between header and viewer */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <button
          onClick={handleReplay}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.6rem',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-ice)';
            e.currentTarget.style.background = 'var(--bg-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'none';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Replay
        </button>
        
        <button
          onClick={() => setShowInfo(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.6rem',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-ice)';
            e.currentTarget.style.background = 'var(--bg-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'none';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          How It Works
        </button>
      </div>

      {/* 3D Snowflake */}
      <div style={{
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, rgba(125, 211, 252, 0.1) 0%, transparent 70%)',
        position: 'relative',
      }}>
        <Suspense fallback={
          <div style={{
            width: '100%',
            height: '350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            Crystallizing...
          </div>
        }>
          <Snowflake3D key={animationKey} hash={hash} onStageChange={handleStageChange} />
        </Suspense>
        
        {/* Stage status text - only show on first play */}
        {!isReplay && (
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'var(--accent-frost)',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            opacity: stage ? 1 : 0,
            transition: 'opacity 0.3s ease',
            textShadow: '0 0 10px rgba(125, 211, 252, 0.5)',
            pointerEvents: 'none',
          }}>
            {stage}
          </div>
        )}
      </div>

      {/* Hash display */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        wordBreak: 'break-all',
        textAlign: 'center',
        maxWidth: '100%',
      }}>
        {hash}
      </div>

      {/* Action buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <button className="btn-download" onClick={handleDownload}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download SVG
        </button>
        
        <button className="btn-reset" onClick={onReset}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Create Another
        </button>
      </div>

      {/* Info Modal */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
