'use client';

import { useMemo } from 'react';
import { generateSnowflake, generateSnowflakeSVGString } from '@/lib/snowflake';

interface SnowflakeDisplayProps {
  hash: string;
  onReset: () => void;
}

export default function SnowflakeDisplay({ hash, onReset }: SnowflakeDisplayProps) {
  const snowflake = useMemo(() => generateSnowflake(hash), [hash]);

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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '2rem',
      padding: '2rem',
      width: '100%',
      maxWidth: '600px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: 300, 
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

      {/* Snowflake SVG */}
      <div className="snowflake-container">
        <svg
          className="snowflake-svg"
          width={snowflake.width}
          height={snowflake.height}
          viewBox={snowflake.viewBox}
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          {/* Background glow */}
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent-ice)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--accent-ice)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="150" cy="150" r="120" fill="url(#centerGlow)" />
          
          {/* Branch paths */}
          {snowflake.paths.map((path, i) => (
            <path
              key={i}
              d={path.d}
              stroke="var(--accent-ice)"
              strokeWidth={path.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          
          {/* End cap circles */}
          {snowflake.circles.map((circle, i) => (
            <circle
              key={i}
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              fill="var(--accent-ice)"
              opacity="0.8"
            />
          ))}
          
          {/* Center hexagon */}
          {snowflake.hexPath && (
            <path
              d={snowflake.hexPath}
              stroke="var(--accent-ice)"
              strokeWidth="2"
              fill="none"
            />
          )}
        </svg>
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
    </div>
  );
}

