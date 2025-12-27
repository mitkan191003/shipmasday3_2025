'use client';

import { useCallback, useRef, useState } from 'react';
import { createHash, createEntropyFromPositions } from '@/lib/hash';

interface TouchTrackerProps {
  onComplete: (hash: string) => void;
  onCancel: () => void;
}

// Number of taps required - easily changeable
const TAPS_REQUIRED = 8;

interface TapPoint {
  x: number;
  y: number;
  id: number;
}

interface Position {
  x: number;
  y: number;
  t: number;
}

export default function TouchTracker({ onComplete, onCancel }: TouchTrackerProps) {
  const [taps, setTaps] = useState<TapPoint[]>([]);
  const positionsRef = useRef<Position[]>([]);
  const tapIdRef = useRef(0);
  const zoneRef = useRef<HTMLDivElement>(null);

  const handleTap = useCallback(async (clientX: number, clientY: number) => {
    if (!zoneRef.current) return;
    if (taps.length >= TAPS_REQUIRED) return;

    const rect = zoneRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Make sure we're inside the zone
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;
    const now = Date.now();

    // Add position for entropy
    positionsRef.current.push({ x: normalizedX, y: normalizedY, t: now });

    // Add visual tap point
    const newTap: TapPoint = { x, y, id: tapIdRef.current++ };
    const newTaps = [...taps, newTap];
    setTaps(newTaps);

    // Check if we've reached the goal
    if (newTaps.length >= TAPS_REQUIRED) {
      // Small delay for visual feedback
      setTimeout(async () => {
        const entropyData = createEntropyFromPositions(positionsRef.current);
        const hash = await createHash(entropyData);
        onComplete(hash);
      }, 300);
    }
  }, [taps, onComplete]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      handleTap(touch.clientX, touch.clientY);
    }
  }, [handleTap]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    handleTap(e.clientX, e.clientY);
  }, [handleTap]);

  const progress = taps.length / TAPS_REQUIRED;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '2rem',
      padding: '2rem',
      width: '100%',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Tap the Zone
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Tap {TAPS_REQUIRED} random spots in the area below
        </p>
      </div>

      {/* Progress indicator */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        alignItems: 'center',
      }}>
        {[...Array(TAPS_REQUIRED)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: i < taps.length 
                ? 'linear-gradient(135deg, var(--accent-ice), var(--accent-glow))'
                : 'var(--bg-elevated)',
              border: i < taps.length ? 'none' : '1px solid var(--border-subtle)',
              transition: 'all 0.2s ease',
              transform: i < taps.length ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Touch zone */}
      <div
        ref={zoneRef}
        className="touch-zone"
        onTouchStart={handleTouch}
        onClick={handleClick}
      >
        {/* Tap points visualization */}
        {taps.map((tap) => (
          <div
            key={tap.id}
            className="touch-point"
            style={{
              left: tap.x,
              top: tap.y,
            }}
          />
        ))}
        
        {/* Center hint */}
        {taps.length === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '1.1rem',
            pointerEvents: 'none',
          }}>
            Tap anywhere here
          </div>
        )}

        {/* Completion overlay */}
        {progress >= 1 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 14, 20, 0.8)',
            color: 'var(--accent-frost)',
            fontSize: '1.2rem',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            Generating...
          </div>
        )}
      </div>

      <button className="btn-reset" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

