'use client';

import { useEffect, useRef, useState } from 'react';
import { createHash } from '@/lib/hash';

interface AudioRecorderProps {
  onComplete: (hash: string) => void;
  onCancel: () => void;
}

const RECORDING_DURATION_MS = 2000; // 2 seconds - easily changeable

export default function AudioRecorder({ onComplete, onCancel }: AudioRecorderProps) {
  const [status, setStatus] = useState<'requesting' | 'recording' | 'processing' | 'error'>('requesting');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startRecording = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setStatus('processing');
          
          // Combine all chunks
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();
          
          // Create hash from audio data
          const hash = await createHash(arrayBuffer);
          
          // Stop all tracks
          stream?.getTracks().forEach(track => track.stop());
          
          onComplete(hash);
        };

        // Start recording
        setStatus('recording');
        startTimeRef.current = Date.now();
        mediaRecorder.start(100); // Collect data every 100ms

        // Animate progress
        const animate = () => {
          const elapsed = Date.now() - startTimeRef.current;
          const newProgress = Math.min(elapsed / RECORDING_DURATION_MS, 1);
          setProgress(newProgress);

          if (elapsed < RECORDING_DURATION_MS) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            mediaRecorder.stop();
          }
        };
        animationRef.current = requestAnimationFrame(animate);

      } catch (err) {
        console.error('Microphone access error:', err);
        setStatus('error');
        setErrorMessage(
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Microphone permission denied. Please allow access and try again.'
            : 'Could not access microphone. Please check your device settings.'
        );
      }
    };

    startRecording();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [onComplete]);

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference * (1 - progress);

  if (status === 'error') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '2rem',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: 'rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Microphone Error</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{errorMessage}</p>
        </div>
        <button className="btn-reset" onClick={onCancel}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '2rem',
      padding: '2rem',
    }}>
      <div className="progress-ring">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="progress-ring-circle"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-ice)" />
              <stop offset="100%" stopColor="var(--accent-frost)" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {status === 'requesting' ? (
            <div style={{ color: 'var(--text-secondary)' }}>
              Requesting access...
            </div>
          ) : status === 'processing' ? (
            <div style={{ color: 'var(--text-secondary)' }}>
              Processing...
            </div>
          ) : (
            <>
              <div className="audio-visualizer">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className="audio-bar"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <div style={{ 
                marginTop: '0.5rem',
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
              }}>
                {((RECORDING_DURATION_MS / 1000) * (1 - progress)).toFixed(1)}s
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          {status === 'requesting' ? 'Allow Microphone Access' : 
           status === 'processing' ? 'Creating Your Snowflake' :
           'Recording Sound'}
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          {status === 'requesting' ? 'Please allow microphone access when prompted' :
           status === 'processing' ? 'Transforming audio into crystal patterns...' :
           'Speak, sing, or just let the ambient noise flow'}
        </p>
      </div>

      <button className="btn-reset" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

