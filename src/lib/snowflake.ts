import { hashToParams } from './hash';

interface SnowflakeParams {
  // Number of main branches (always 6 for snowflake, but angle can vary)
  numBranches: number;
  // Length ratios for different branch segments
  mainBranchLength: number;
  secondaryBranchLength: number;
  tertiaryBranchLength: number;
  // Branch positions (where secondary branches attach)
  branchPositions: number[];
  // Angles for secondary branches
  branchAngles: number[];
  // Whether to add end decorations
  hasEndCaps: boolean;
  endCapSize: number;
  // Line thickness variation
  mainThickness: number;
  secondaryThickness: number;
  // Whether to add center decoration
  hasCenterHex: boolean;
  centerHexSize: number;
  // Crystal variations
  hasCrystalTips: boolean;
  crystalTipAngle: number;
  // Tertiary branch details
  hasTertiaryBranches: boolean;
  tertiaryPositions: number[];
}

/**
 * Extract snowflake parameters from a hash
 */
function extractParams(hash: string): SnowflakeParams {
  const values = hashToParams(hash);
  
  // Normalize value to range
  const norm = (v: number, min: number, max: number) => min + (v / 255) * (max - min);
  
  return {
    numBranches: 6, // Always 6 for traditional snowflake
    mainBranchLength: norm(values[0], 80, 120),
    secondaryBranchLength: norm(values[1], 25, 50),
    tertiaryBranchLength: norm(values[2], 10, 25),
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
    endCapSize: norm(values[10], 4, 12),
    mainThickness: norm(values[11], 2, 4),
    secondaryThickness: norm(values[12], 1.5, 3),
    hasCenterHex: values[13] > 80,
    centerHexSize: norm(values[14], 8, 20),
    hasCrystalTips: values[15] > 120,
    crystalTipAngle: norm(values[16], 15, 35),
    hasTertiaryBranches: values[17] > 100,
    tertiaryPositions: [
      norm(values[18], 0.3, 0.5),
      norm(values[19], 0.6, 0.8),
    ],
  };
}

/**
 * Generate SVG path data for a single branch
 */
function generateBranchPath(
  params: SnowflakeParams,
  angle: number,
  centerX: number,
  centerY: number
): string {
  const rad = (a: number) => (a * Math.PI) / 180;
  const paths: string[] = [];
  
  const mainLength = params.mainBranchLength;
  const endX = centerX + Math.cos(rad(angle)) * mainLength;
  const endY = centerY + Math.sin(rad(angle)) * mainLength;
  
  // Main branch line
  paths.push(`M ${centerX} ${centerY} L ${endX} ${endY}`);
  
  // Secondary branches at different positions
  for (let i = 0; i < params.branchPositions.length; i++) {
    const pos = params.branchPositions[i];
    const branchAngle = params.branchAngles[i % params.branchAngles.length];
    const branchLength = params.secondaryBranchLength * (1 - pos * 0.3);
    
    const branchStartX = centerX + Math.cos(rad(angle)) * mainLength * pos;
    const branchStartY = centerY + Math.sin(rad(angle)) * mainLength * pos;
    
    // Branch going one direction
    const branch1EndX = branchStartX + Math.cos(rad(angle - branchAngle)) * branchLength;
    const branch1EndY = branchStartY + Math.sin(rad(angle - branchAngle)) * branchLength;
    paths.push(`M ${branchStartX} ${branchStartY} L ${branch1EndX} ${branch1EndY}`);
    
    // Mirror branch going other direction
    const branch2EndX = branchStartX + Math.cos(rad(angle + branchAngle)) * branchLength;
    const branch2EndY = branchStartY + Math.sin(rad(angle + branchAngle)) * branchLength;
    paths.push(`M ${branchStartX} ${branchStartY} L ${branch2EndX} ${branch2EndY}`);
    
    // Tertiary branches
    if (params.hasTertiaryBranches && i < 2) {
      const tertiaryPos = params.tertiaryPositions[i];
      const tertiaryLength = params.tertiaryBranchLength;
      
      // On first secondary branch
      const t1X = branchStartX + Math.cos(rad(angle - branchAngle)) * branchLength * tertiaryPos;
      const t1Y = branchStartY + Math.sin(rad(angle - branchAngle)) * branchLength * tertiaryPos;
      const t1EndX = t1X + Math.cos(rad(angle - branchAngle - 45)) * tertiaryLength;
      const t1EndY = t1Y + Math.sin(rad(angle - branchAngle - 45)) * tertiaryLength;
      paths.push(`M ${t1X} ${t1Y} L ${t1EndX} ${t1EndY}`);
      
      // On mirror secondary branch
      const t2X = branchStartX + Math.cos(rad(angle + branchAngle)) * branchLength * tertiaryPos;
      const t2Y = branchStartY + Math.sin(rad(angle + branchAngle)) * branchLength * tertiaryPos;
      const t2EndX = t2X + Math.cos(rad(angle + branchAngle + 45)) * tertiaryLength;
      const t2EndY = t2Y + Math.sin(rad(angle + branchAngle + 45)) * tertiaryLength;
      paths.push(`M ${t2X} ${t2Y} L ${t2EndX} ${t2EndY}`);
    }
  }
  
  // Crystal tips at the end
  if (params.hasCrystalTips) {
    const tipAngle = params.crystalTipAngle;
    const tipLength = params.secondaryBranchLength * 0.4;
    
    const tip1X = endX + Math.cos(rad(angle - tipAngle - 90)) * tipLength;
    const tip1Y = endY + Math.sin(rad(angle - tipAngle - 90)) * tipLength;
    const tip2X = endX + Math.cos(rad(angle + tipAngle + 90)) * tipLength;
    const tip2Y = endY + Math.sin(rad(angle + tipAngle + 90)) * tipLength;
    
    paths.push(`M ${tip1X} ${tip1Y} L ${endX} ${endY} L ${tip2X} ${tip2Y}`);
  }
  
  return paths.join(' ');
}

/**
 * Generate center hexagon decoration
 */
function generateCenterHex(size: number, centerX: number, centerY: number): string {
  const points: string[] = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 30) * (Math.PI / 180);
    const x = centerX + Math.cos(angle) * size;
    const y = centerY + Math.sin(angle) * size;
    points.push(`${x},${y}`);
  }
  
  return `M ${points.join(' L ')} Z`;
}

/**
 * Generate end cap circles
 */
function generateEndCaps(
  params: SnowflakeParams,
  centerX: number,
  centerY: number
): Array<{ cx: number; cy: number; r: number }> {
  const caps: Array<{ cx: number; cy: number; r: number }> = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * (Math.PI / 180);
    const x = centerX + Math.cos(angle) * params.mainBranchLength;
    const y = centerY + Math.sin(angle) * params.mainBranchLength;
    caps.push({ cx: x, cy: y, r: params.endCapSize });
  }
  
  return caps;
}

export interface SnowflakeSVG {
  width: number;
  height: number;
  viewBox: string;
  paths: Array<{ d: string; strokeWidth: number }>;
  circles: Array<{ cx: number; cy: number; r: number }>;
  hexPath?: string;
}

/**
 * Generate complete snowflake SVG data from hash
 */
export function generateSnowflake(hash: string): SnowflakeSVG {
  const params = extractParams(hash);
  
  const size = 300;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const paths: Array<{ d: string; strokeWidth: number }> = [];
  
  // Generate 6 main branches
  for (let i = 0; i < 6; i++) {
    const angle = i * 60;
    const branchPath = generateBranchPath(params, angle, centerX, centerY);
    paths.push({ d: branchPath, strokeWidth: params.mainThickness });
  }
  
  // End caps
  const circles = params.hasEndCaps 
    ? generateEndCaps(params, centerX, centerY) 
    : [];
  
  // Center hexagon
  const hexPath = params.hasCenterHex 
    ? generateCenterHex(params.centerHexSize, centerX, centerY) 
    : undefined;
  
  return {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    paths,
    circles,
    hexPath,
  };
}

/**
 * Generate SVG string for download
 */
export function generateSnowflakeSVGString(hash: string): string {
  const data = generateSnowflake(hash);
  
  const pathElements = data.paths
    .map(p => `  <path d="${p.d}" stroke="#7dd3fc" stroke-width="${p.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('\n');
  
  const circleElements = data.circles
    .map(c => `  <circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="#7dd3fc" opacity="0.8"/>`)
    .join('\n');
  
  const hexElement = data.hexPath 
    ? `  <path d="${data.hexPath}" stroke="#7dd3fc" stroke-width="2" fill="none"/>` 
    : '';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${data.width}" height="${data.height}" viewBox="${data.viewBox}">
  <rect width="100%" height="100%" fill="#0a0e14"/>
${pathElements}
${circleElements}
${hexElement}
</svg>`;
}

