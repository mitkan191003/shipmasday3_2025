'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import { hashToParams } from '@/lib/hash';
import type { ReactNode } from 'react';

interface Snowflake3DProps {
  hash: string;
  onStageChange?: (stage: string) => void;
}

interface SnowflakeParams {
  mainBranchLength: number;
  secondaryBranchLength: number;
  tertiaryBranchLength: number;
  branchPositions: number[];
  branchAngles: number[];
  hasEndCaps: boolean;
  endCapSize: number;
  mainThickness: number;
  hasCenterHex: boolean;
  centerHexSize: number;
  hasCrystalTips: boolean;
  crystalTipAngle: number;
  hasTertiaryBranches: boolean;
  tertiaryPositions: number[];
}

function extractParams(hash: string): SnowflakeParams {
  const values = hashToParams(hash);
  const norm = (v: number, min: number, max: number) => min + (v / 255) * (max - min);

  const scale = 50;
  
  return {
    mainBranchLength: norm(values[0], 80, 120) / scale,
    secondaryBranchLength: norm(values[1], 25, 50) / scale,
    tertiaryBranchLength: norm(values[2], 10, 25) / scale,
    branchPositions: [
      norm(values[3], 0.2, 0.4),
      norm(values[4], 0.45, 0.65),
      norm(values[5], 0.7, 0.9),
    ],
    branchAngles: [
      norm(values[6], 35, 70),
      norm(values[7], 40, 75),
      norm(values[8], 30, 60),
    ],
    hasEndCaps: values[9] > 100,
    endCapSize: norm(values[10], 4, 12) / scale,
    mainThickness: norm(values[11], 2, 4) / scale,
    hasCenterHex: values[13] > 80,
    centerHexSize: norm(values[14], 8, 20) / scale,
    hasCrystalTips: values[15] > 120,
    crystalTipAngle: norm(values[16], 15, 35),
    hasTertiaryBranches: values[17] > 100,
    tertiaryPositions: [
      norm(values[18], 0.3, 0.5),
      norm(values[19], 0.6, 0.8),
    ],
  };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Animation timing constants (slowed down further)
const TIMINGS = {
  MAIN_DELAY: 0,
  MAIN_DURATION: 3.0,
  HEX_DELAY: 0.5,
  HEX_DURATION: 1.8,
  SEC_DELAY: 1.5,
  SEC_DURATION: 2.2,
  TER_DELAY: 3.0,
  TER_DURATION: 1.8,
  TIP_DELAY: 4.0,
  TIP_DURATION: 1.5,
  CAP_DELAY: 5.0,
  CAP_DURATION: 1.2,
  COMPLETE: 6.5,
};

// Stage names for status display
function getStage(time: number): string {
  if (time < 0.2) return 'Nucleating crystal seed...';
  if (time < TIMINGS.MAIN_DURATION * 0.4) return 'Growing primary dendrites...';
  if (time < TIMINGS.SEC_DELAY) return 'Extending main branches...';
  if (time < TIMINGS.SEC_DELAY + TIMINGS.SEC_DURATION * 0.4) return 'Forming secondary arms...';
  if (time < TIMINGS.TER_DELAY) return 'Branching secondary structures...';
  if (time < TIMINGS.TER_DELAY + TIMINGS.TER_DURATION * 0.4) return 'Crystallizing tertiary details...';
  if (time < TIMINGS.TIP_DELAY) return 'Adding micro-branches...';
  if (time < TIMINGS.CAP_DELAY) return 'Forming crystal tips...';
  if (time < TIMINGS.COMPLETE) return 'Finishing ice formations...';
  return '';
}

function AnimatedBranchSegment({ 
  start, 
  end, 
  thickness,
  material,
  delay,
  duration,
  growthTime,
}: { 
  start: THREE.Vector3;
  end: THREE.Vector3;
  thickness: number;
  material: THREE.Material;
  delay: number;
  duration: number;
  growthTime: number;
}) {
  const localTime = Math.max(0, growthTime - delay);
  const rawProgress = Math.min(1, localTime / duration);
  const progress = easeOutCubic(rawProgress);
  
  if (progress <= 0) return null;
  
  const direction = new THREE.Vector3().subVectors(end, start);
  const fullLength = direction.length();
  if (fullLength < 0.001) return null;
  
  const currentEnd = new THREE.Vector3().lerpVectors(start, end, progress);
  const currentLength = fullLength * progress;
  
  const midpoint = new THREE.Vector3().addVectors(start, currentEnd).multiplyScalar(0.5);
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
  
  return (
    <mesh position={midpoint} quaternion={quaternion} material={material}>
      <cylinderGeometry args={[thickness * progress, thickness * progress, currentLength, 6]} />
    </mesh>
  );
}

function AnimatedSphere({
  position,
  radius,
  material,
  delay,
  duration,
  growthTime,
}: {
  position: THREE.Vector3;
  radius: number;
  material: ReactNode;
  delay: number;
  duration: number;
  growthTime: number;
}) {
  const localTime = Math.max(0, growthTime - delay);
  const rawProgress = Math.min(1, localTime / duration);
  const progress = easeOutCubic(rawProgress);
  
  if (progress <= 0) return null;
  
  return (
    <mesh position={position} scale={progress}>
      <sphereGeometry args={[radius, 8, 8]} />
      {material}
    </mesh>
  );
}

function SnowflakeMesh({ hash, onStageChange }: { hash: string; onStageChange?: (stage: string) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const params = useMemo(() => extractParams(hash), [hash]);
  const [growthTime, setGrowthTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const lastStageRef = useRef<string>('');

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
    
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    setGrowthTime(elapsed);
    
    // Update stage
    const stage = getStage(elapsed);
    if (stage !== lastStageRef.current && onStageChange) {
      lastStageRef.current = stage;
      onStageChange(stage);
    }
  });

  const iceMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#b0e8ff'),
    metalness: 0.0,
    roughness: 0.15,
    transmission: 0.85,
    thickness: 1.5,
    envMapIntensity: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    ior: 1.31,
    transparent: true,
    opacity: 0.95,
  }), []);

  const capMaterial = (
    <meshPhysicalMaterial
      color="#d4f5ff"
      metalness={0.1}
      roughness={0.05}
      transmission={0.9}
      thickness={0.5}
      clearcoat={1}
      transparent={true}
    />
  );

  const branches = useMemo(() => {
    const elements: ReactNode[] = [];
    const t = params.mainThickness * 0.5;
    const center = new THREE.Vector3(0, 0, 0);
    const rad = (deg: number) => (deg * Math.PI) / 180;

    for (let i = 0; i < 6; i++) {
      const mainAngle = i * 60;
      const mainAngleRad = rad(mainAngle);
      const branchDelay = i * 0.08;
      
      const dirX = Math.cos(mainAngleRad);
      const dirZ = Math.sin(mainAngleRad);
      
      const mainEnd = new THREE.Vector3(
        dirX * params.mainBranchLength,
        0,
        dirZ * params.mainBranchLength
      );

      elements.push(
        <AnimatedBranchSegment
          key={`main-${i}`}
          start={center}
          end={mainEnd}
          thickness={t}
          material={iceMaterial}
          delay={TIMINGS.MAIN_DELAY + branchDelay}
          duration={TIMINGS.MAIN_DURATION}
          growthTime={growthTime}
        />
      );

      for (let j = 0; j < params.branchPositions.length; j++) {
        const pos = params.branchPositions[j];
        const branchAngleDeg = params.branchAngles[j % params.branchAngles.length];
        const branchLength = params.secondaryBranchLength * (1 - pos * 0.3);
        const secDelay = TIMINGS.SEC_DELAY + branchDelay + j * 0.15;
        
        const branchStart = new THREE.Vector3(
          dirX * params.mainBranchLength * pos,
          0,
          dirZ * params.mainBranchLength * pos
        );

        for (const side of [-1, 1]) {
          const secAngleRad = rad(mainAngle + side * branchAngleDeg);
          const secEnd = new THREE.Vector3(
            branchStart.x + Math.cos(secAngleRad) * branchLength,
            0,
            branchStart.z + Math.sin(secAngleRad) * branchLength
          );

          elements.push(
            <AnimatedBranchSegment
              key={`sec-${i}-${j}-${side}`}
              start={branchStart}
              end={secEnd}
              thickness={t * 0.7}
              material={iceMaterial}
              delay={secDelay}
              duration={TIMINGS.SEC_DURATION}
              growthTime={growthTime}
            />
          );

          if (params.hasTertiaryBranches && j < 2) {
            const tertiaryPos = params.tertiaryPositions[j];
            const tertiaryLength = params.tertiaryBranchLength;
            const terDelay = TIMINGS.TER_DELAY + branchDelay + j * 0.15;
            
            const terStart = new THREE.Vector3(
              branchStart.x + Math.cos(secAngleRad) * branchLength * tertiaryPos,
              0,
              branchStart.z + Math.sin(secAngleRad) * branchLength * tertiaryPos
            );
            
            const terAngleRad = rad(mainAngle + side * branchAngleDeg + side * 45);
            const terEnd = new THREE.Vector3(
              terStart.x + Math.cos(terAngleRad) * tertiaryLength,
              0,
              terStart.z + Math.sin(terAngleRad) * tertiaryLength
            );

            elements.push(
              <AnimatedBranchSegment
                key={`ter-${i}-${j}-${side}`}
                start={terStart}
                end={terEnd}
                thickness={t * 0.5}
                material={iceMaterial}
                delay={terDelay}
                duration={TIMINGS.TER_DURATION}
                growthTime={growthTime}
              />
            );
          }
        }
      }

      if (params.hasCrystalTips) {
        const tipAngle = params.crystalTipAngle;
        const tipLength = params.secondaryBranchLength * 0.4;
        const tipDelay = TIMINGS.TIP_DELAY + branchDelay;
        
        for (const side of [-1, 1]) {
          const tipAngleRad = rad(mainAngle + side * tipAngle + side * 90);
          const tipEnd = new THREE.Vector3(
            mainEnd.x + Math.cos(tipAngleRad) * tipLength,
            0,
            mainEnd.z + Math.sin(tipAngleRad) * tipLength
          );

          elements.push(
            <AnimatedBranchSegment
              key={`tip-${i}-${side}`}
              start={mainEnd}
              end={tipEnd}
              thickness={t * 0.6}
              material={iceMaterial}
              delay={tipDelay}
              duration={TIMINGS.TIP_DURATION}
              growthTime={growthTime}
            />
          );
        }
      }

      if (params.hasEndCaps) {
        elements.push(
          <AnimatedSphere
            key={`cap-${i}`}
            position={mainEnd}
            radius={params.endCapSize * 0.8}
            material={capMaterial}
            delay={TIMINGS.CAP_DELAY + branchDelay}
            duration={TIMINGS.CAP_DURATION}
            growthTime={growthTime}
          />
        );
      }
    }

    return elements;
  }, [hash, params, iceMaterial, growthTime, capMaterial]);

  const centerHex = useMemo(() => {
    if (!params.hasCenterHex) return null;
    
    const size = params.centerHexSize;
    const points: THREE.Vector3[] = [];
    
    for (let i = 0; i < 6; i++) {
      const angle = ((i * 60) - 30) * (Math.PI / 180);
      points.push(new THREE.Vector3(
        Math.cos(angle) * size,
        0,
        Math.sin(angle) * size
      ));
    }
    
    const hexElements: ReactNode[] = [];
    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6;
      hexElements.push(
        <AnimatedBranchSegment
          key={`hex-${i}`}
          start={points[i]}
          end={points[next]}
          thickness={params.mainThickness * 0.3}
          material={iceMaterial}
          delay={TIMINGS.HEX_DELAY + i * 0.08}
          duration={TIMINGS.HEX_DURATION}
          growthTime={growthTime}
        />
      );
    }
    
    return hexElements;
  }, [params, iceMaterial, growthTime]);

  const centerProgress = easeOutCubic(Math.min(1, growthTime / 0.8));

  return (
    <group ref={groupRef}>
      <mesh scale={centerProgress}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.5} />
      </mesh>
      {centerHex}
      {branches}
    </group>
  );
}

export default function Snowflake3D({ hash, onStageChange }: Snowflake3DProps) {
  return (
    <div 
      style={{ 
        width: '100%', 
        height: '300px',
      }}
      className="snowflake-3d-container"
    >
      <Canvas
        camera={{ position: [0, 5, 5], fov: 40 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} color="#7dd3fc" />
        <pointLight position={[0, 2, 0]} intensity={0.8} color="#a5f3fc" />

        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
          <group scale={0.7}>
            <SnowflakeMesh hash={hash} onStageChange={onStageChange} />
          </group>
        </Float>

        <Environment preset="night" />
      </Canvas>
    </div>
  );
}
