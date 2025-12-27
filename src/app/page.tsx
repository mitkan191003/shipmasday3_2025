'use client';

import { useState } from 'react';
import InputModal from '@/components/InputModal';
import AudioRecorder from '@/components/AudioRecorder';
import CursorTracker from '@/components/CursorTracker';
import TouchTracker from '@/components/TouchTracker';
import SnowflakeDisplay from '@/components/SnowflakeDisplay';
import Particles from '@/components/Particles';

type AppState = 'modal' | 'audio' | 'cursor' | 'touch' | 'display';

export default function Home() {
  const [state, setState] = useState<AppState>('modal');
  const [hash, setHash] = useState<string>('');

  const handleMethodSelect = (method: 'audio' | 'cursor' | 'touch') => {
    setState(method);
  };

  const handleComplete = (generatedHash: string) => {
    setHash(generatedHash);
    setState('display');
  };

  const handleCancel = () => {
    setState('modal');
  };

  const handleReset = () => {
    setHash('');
    setState('modal');
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1,
      padding: '2rem',
    }}>
      <Particles />

      {state === 'modal' && (
        <InputModal onSelect={handleMethodSelect} />
      )}

      {state === 'audio' && (
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 0 60px rgba(125, 211, 252, 0.1)',
          maxWidth: '500px',
          width: '90%',
        }}>
          <AudioRecorder onComplete={handleComplete} onCancel={handleCancel} />
        </div>
      )}

      {state === 'cursor' && (
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 0 60px rgba(125, 211, 252, 0.1)',
          maxWidth: '600px',
          width: '95%',
        }}>
          <CursorTracker onComplete={handleComplete} onCancel={handleCancel} />
        </div>
      )}

      {state === 'touch' && (
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 0 60px rgba(125, 211, 252, 0.1)',
          maxWidth: '500px',
          width: '95%',
        }}>
          <TouchTracker onComplete={handleComplete} onCancel={handleCancel} />
        </div>
      )}

      {state === 'display' && (
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 0 60px rgba(125, 211, 252, 0.1)',
          width: '95%',
          maxWidth: '650px',
        }}>
          <SnowflakeDisplay hash={hash} onReset={handleReset} />
        </div>
      )}

      {/* Footer */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        zIndex: 50,
        padding: '1rem',
        background: 'linear-gradient(to top, var(--bg-deep) 0%, var(--bg-deep) 60%, transparent 100%)',
      }}>
        Each snowflake is unique, just like you
      </footer>
    </main>
  );
}
