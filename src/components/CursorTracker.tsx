'use client';

import { useCallback, useRef, useState } from 'react';
import { createHash, createEntropyFromPositions } from '@/lib/hash';

interface CursorTrackerProps {
  onComplete: (hash: string) => void;
  onCancel: () => void;
}

// Minimum pixels to move for entropy - easily changeable
const MIN_PIXELS_REQUIRED = 1000;

interface Position {
  x: number;
  y: number;
  t: number;
}

export default function CursorTracker({ onComplete, onCancel }: CursorTrackerProps) {
  const [totalDistance, setTotalDistance] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
  
  const positionsRef = useRef<Position[]>([]);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const trailIdRef = useRef(0);
  const zoneRef = useRef<HTMLDivElement>(null);

  const progress = Math.min(totalDistance / MIN_PIXELS_REQUIRED, 1);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!zoneRef.current) return;

    const rect = zoneRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Make sure we're inside the zone
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;
    const now = Date.now();

    // Calculate distance from last point
    if (lastPosRef.current) {
      const dx = x - lastPosRef.current.x;
      const dy = y - lastPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 2) { // Only count movements larger than 2px
        setTotalDistance(prev => {
          const newTotal = prev + distance;
          
          // Check if we've reached the goal
          if (newTotal >= MIN_PIXELS_REQUIRED && prev < MIN_PIXELS_REQUIRED) {
            // Generate hash
            const entropyData = createEntropyFromPositions(positionsRef.current);
            createHash(entropyData).then(onComplete);
          }
          
          return newTotal;
        });

        // Add position for entropy
        positionsRef.current.push({ x: normalizedX, y: normalizedY, t: now });

        // Add to visual trail
        const trailId = trailIdRef.current++;
        setTrail(prev => [...prev.slice(-30), { x, y, id: trailId }]);
      }
    }

    lastPosRef.current = { x, y };
  }, [onComplete]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isTracking) return;
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  }, [isTracking, handleMove]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTracking(true);
  };
  const handleMouseUp = () => setIsTracking(false);
  const handleMouseLeave = () => setIsTracking(false);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '2rem',
      padding: '2rem',
      width: '100%',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Draw in the Zone
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Click and drag your cursor around freely
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ 
        width: '100%', 
        maxWidth: '500px',
        height: '8px',
        background: 'var(--bg-elevated)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, var(--accent-glow), var(--accent-frost))',
          borderRadius: '4px',
          transition: 'width 0.1s ease-out',
        }} />
      </div>
      
      <div style={{ 
        fontSize: '0.9rem', 
        color: 'var(--text-muted)',
      }}>
        {Math.floor(totalDistance)} / {MIN_PIXELS_REQUIRED} pixels
      </div>

      {/* Cursor zone */}
      <div
        ref={zoneRef}
        className="cursor-zone"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Trail visualization */}
        {trail.map((point, index) => (
          <div
            key={point.id}
            className="cursor-trail"
            style={{
              left: point.x,
              top: point.y,
              opacity: 0.3 + (index / trail.length) * 0.4,
              transform: `translate(-50%, -50%) scale(${0.5 + (index / trail.length) * 0.5})`,
            }}
          />
        ))}
        
        {/* Center hint */}
        {totalDistance === 0 && (
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
            Click and drag here
          </div>
        )}
      </div>

      <button className="btn-reset" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

