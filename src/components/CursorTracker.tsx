'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
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

interface TrailPoint {
  x: number;
  y: number;
}

export default function CursorTracker({ onComplete, onCancel }: CursorTrackerProps) {
  const [totalDistance, setTotalDistance] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  const [currentPos, setCurrentPos] = useState<TrailPoint | null>(null);
  
  const positionsRef = useRef<Position[]>([]);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastEntropyPosRef = useRef<{ x: number; y: number } | null>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const progress = Math.min(totalDistance / MIN_PIXELS_REQUIRED, 1);

  // Fade out old trail points over time
  useEffect(() => {
    if (!isTracking && trailPoints.length > 0) {
      const timer = setTimeout(() => {
        setTrailPoints(prev => prev.slice(Math.floor(prev.length * 0.1)));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isTracking, trailPoints]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!zoneRef.current || completedRef.current) return;

    const rect = zoneRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Make sure we're inside the zone
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

    // Update current cursor position for the glow effect
    setCurrentPos({ x, y });

    // Always add to trail for smooth visualization
    setTrailPoints(prev => {
      const newPoints = [...prev, { x, y }];
      // Keep last 150 points for a smooth trail
      return newPoints.slice(-150);
    });

    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;
    const now = Date.now();

    // Calculate distance from last point
    if (lastPosRef.current) {
      const dx = x - lastPosRef.current.x;
      const dy = y - lastPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Add all movement to distance (continuous tracking)
      if (distance > 0.5) {
        setTotalDistance(prev => {
          const newTotal = prev + distance;
          
          // Check if we've reached the goal
          if (newTotal >= MIN_PIXELS_REQUIRED && !completedRef.current) {
            completedRef.current = true;
            // Generate hash
            const entropyData = createEntropyFromPositions(positionsRef.current);
            createHash(entropyData).then(onComplete);
          }
          
          return newTotal;
        });
      }
    }

    // Add position for entropy (sample every few pixels for variety)
    if (!lastEntropyPosRef.current) {
      lastEntropyPosRef.current = { x, y };
      positionsRef.current.push({ x: normalizedX, y: normalizedY, t: now });
    } else {
      const dx = x - lastEntropyPosRef.current.x;
      const dy = y - lastEntropyPosRef.current.y;
      const entropyDistance = Math.sqrt(dx * dx + dy * dy);
      
      if (entropyDistance > 5) {
        positionsRef.current.push({ x: normalizedX, y: normalizedY, t: now });
        lastEntropyPosRef.current = { x, y };
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
    // Reset trail on new stroke
    setTrailPoints([]);
    lastPosRef.current = null;
  };
  
  const handleMouseUp = () => setIsTracking(false);
  const handleMouseLeave = () => setIsTracking(false);

  // Generate SVG path from trail points
  const generatePath = useCallback(() => {
    if (trailPoints.length < 2) return '';
    
    // Use a smooth curve through points
    let path = `M ${trailPoints[0].x} ${trailPoints[0].y}`;
    
    for (let i = 1; i < trailPoints.length; i++) {
      const curr = trailPoints[i];
      const prev = trailPoints[i - 1];
      
      // Simple line for performance with many points
      path += ` L ${curr.x} ${curr.y}`;
    }
    
    return path;
  }, [trailPoints]);

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
          transition: 'width 0.05s linear',
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
        {/* SVG Trail */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-glow)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--accent-ice)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--accent-frost)" stopOpacity="1" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Main trail path */}
          {trailPoints.length > 1 && (
            <path
              d={generatePath()}
              fill="none"
              stroke="url(#trailGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
          )}
          
          {/* Cursor glow */}
          {currentPos && isTracking && (
            <>
              <circle
                cx={currentPos.x}
                cy={currentPos.y}
                r="12"
                fill="var(--accent-frost)"
                opacity="0.2"
              />
              <circle
                cx={currentPos.x}
                cy={currentPos.y}
                r="6"
                fill="var(--accent-frost)"
                opacity="0.8"
              />
            </>
          )}
        </svg>
        
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
