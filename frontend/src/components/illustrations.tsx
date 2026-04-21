/** Custom SVG illustrations — license-free, built for Midnight theme */

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 440" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="currentColor" opacity="0.08" />
        </pattern>
        <linearGradient id="shield-grad" x1="280" y1="60" x2="280" y2="380" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.72 0.19 160)" stopOpacity="0.3" />
          <stop offset="1" stopColor="oklch(0.72 0.19 160)" stopOpacity="0" />
        </linearGradient>
        <filter id="blur1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
        </filter>
      </defs>

      <rect width="560" height="440" fill="url(#grid)" />

      {/* Ambient glow orbs */}
      <circle cx="280" cy="200" r="140" fill="oklch(0.72 0.19 160)" opacity="0.06" filter="url(#blur1)" />
      <circle cx="180" cy="300" r="80" fill="oklch(0.65 0.15 200)" opacity="0.04" filter="url(#blur1)" />
      <circle cx="400" cy="140" r="60" fill="oklch(0.6 0.18 280)" opacity="0.04" filter="url(#blur1)" />

      {/* Connection lines — data flow */}
      <g stroke="oklch(0.72 0.19 160)" strokeWidth="1" opacity="0.2">
        <line x1="80" y1="120" x2="200" y2="180" strokeDasharray="4 4" />
        <line x1="480" y1="100" x2="360" y2="170" strokeDasharray="4 4" />
        <line x1="100" y1="320" x2="220" y2="260" strokeDasharray="4 4" />
        <line x1="460" y1="340" x2="340" y2="270" strokeDasharray="4 4" />
        <line x1="280" y1="280" x2="280" y2="370" strokeDasharray="4 4" />
      </g>

      {/* Outer ring */}
      <circle cx="280" cy="210" r="130" stroke="oklch(0.72 0.19 160)" strokeWidth="0.5" opacity="0.15" fill="none" />
      <circle cx="280" cy="210" r="100" stroke="oklch(0.72 0.19 160)" strokeWidth="0.5" opacity="0.1" fill="none" strokeDasharray="6 6" />

      {/* Shield shape — central */}
      <path
        d="M280 100 L340 130 L340 220 C340 270 310 310 280 330 C250 310 220 270 220 220 L220 130 Z"
        fill="url(#shield-grad)"
        stroke="oklch(0.72 0.19 160)"
        strokeWidth="1.5"
        opacity="0.8"
      />

      {/* Lock icon inside shield */}
      <rect x="266" y="195" width="28" height="22" rx="4" stroke="oklch(0.72 0.19 160)" strokeWidth="1.5" fill="oklch(0.72 0.19 160)" fillOpacity="0.15" />
      <path d="M272 195 L272 185 C272 178 276 174 280 174 C284 174 288 178 288 185 L288 195" stroke="oklch(0.72 0.19 160)" strokeWidth="1.5" fill="none" />
      <circle cx="280" cy="207" r="2.5" fill="oklch(0.72 0.19 160)" />

      {/* Checkmark on shield */}
      <path d="M269 155 L277 163 L293 147" stroke="oklch(0.72 0.19 160)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Floating nodes — reporter */}
      <g transform="translate(80, 100)">
        <rect width="56" height="36" rx="8" fill="oklch(0.2 0.015 260)" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.7" />
        <circle cx="20" cy="14" r="5" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" fill="none" opacity="0.5" />
        <path d="M14 28 C14 22 26 22 26 28" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" fill="none" opacity="0.5" />
        <line x1="34" y1="14" x2="48" y2="14" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.3" />
        <line x1="34" y1="22" x2="44" y2="22" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.3" />
      </g>

      {/* Document node */}
      <g transform="translate(424, 80)">
        <rect width="56" height="36" rx="8" fill="oklch(0.2 0.015 260)" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.7" />
        <rect x="12" y="10" width="16" height="18" rx="2" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" fill="none" opacity="0.5" />
        <line x1="16" y1="16" x2="24" y2="16" stroke="oklch(0.72 0.19 160)" strokeWidth="0.6" opacity="0.4" />
        <line x1="16" y1="20" x2="24" y2="20" stroke="oklch(0.72 0.19 160)" strokeWidth="0.6" opacity="0.4" />
        <line x1="36" y1="14" x2="48" y2="14" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.3" />
        <line x1="36" y1="22" x2="44" y2="22" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.3" />
      </g>

      {/* Encrypted block */}
      <g transform="translate(60, 300)">
        <rect width="68" height="40" rx="8" fill="oklch(0.2 0.015 260)" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.7" />
        <text x="12" y="24" fill="oklch(0.72 0.19 160)" fontSize="8" fontFamily="monospace" opacity="0.5">••••••</text>
      </g>

      {/* Storage node */}
      <g transform="translate(420, 320)">
        <rect width="68" height="40" rx="8" fill="oklch(0.2 0.015 260)" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.7" />
        <rect x="14" y="12" width="18" height="16" rx="2" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" fill="none" opacity="0.5" />
        <path d="M18 16 L26 16 M18 20 L24 20 M18 24 L28 24" stroke="oklch(0.72 0.19 160)" strokeWidth="0.6" opacity="0.3" />
        <rect x="40" y="16" width="16" height="8" rx="2" fill="oklch(0.72 0.19 160)" fillOpacity="0.1" stroke="oklch(0.72 0.19 160)" strokeWidth="0.5" opacity="0.4" />
      </g>

      {/* Status badge */}
      <g transform="translate(248, 370)">
        <rect width="64" height="28" rx="14" fill="oklch(0.72 0.19 160)" fillOpacity="0.12" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" />
        <circle cx="16" cy="14" r="3" fill="oklch(0.72 0.19 160)" opacity="0.6" />
        <text x="24" y="18" fill="oklch(0.72 0.19 160)" fontSize="8" fontFamily="sans-serif" opacity="0.7">Secure</text>
      </g>

      {/* Pulse rings */}
      <circle cx="280" cy="210" r="45" stroke="oklch(0.72 0.19 160)" strokeWidth="0.5" opacity="0.1" fill="none">
        <animate attributeName="r" from="45" to="90" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.12" to="0" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="280" cy="210" r="45" stroke="oklch(0.72 0.19 160)" strokeWidth="0.5" opacity="0.1" fill="none">
        <animate attributeName="r" from="45" to="90" dur="3s" begin="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.12" to="0" dur="3s" begin="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function GridPattern({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <pattern id="landing-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.04" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#landing-grid)" />
    </svg>
  );
}

export function StepIllustration({ step, className }: { step: number; className?: string }) {
  const content: Record<number, React.JSX.Element> = {
    1: (
      <g>
        <rect x="20" y="12" width="40" height="56" rx="6" fill="oklch(0.2 0.015 260)" stroke="oklch(0.72 0.19 160)" strokeWidth="1" />
        <line x1="28" y1="24" x2="52" y2="24" stroke="oklch(0.72 0.19 160)" strokeWidth="1" opacity="0.4" />
        <line x1="28" y1="32" x2="48" y2="32" stroke="oklch(0.72 0.19 160)" strokeWidth="1" opacity="0.3" />
        <line x1="28" y1="40" x2="52" y2="40" stroke="oklch(0.72 0.19 160)" strokeWidth="1" opacity="0.4" />
        <line x1="28" y1="48" x2="44" y2="48" stroke="oklch(0.72 0.19 160)" strokeWidth="1" opacity="0.3" />
        <rect x="28" y="54" width="24" height="8" rx="4" fill="oklch(0.72 0.19 160)" fillOpacity="0.2" />
        <circle cx="40" cy="4" r="4" fill="oklch(0.72 0.19 160)" opacity="0.15">
          <animate attributeName="opacity" values="0.15;0.3;0.15" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
    ),
    2: (
      <g>
        <rect x="12" y="20" width="56" height="40" rx="8" fill="oklch(0.2 0.015 260)" stroke="oklch(0.72 0.19 160)" strokeWidth="1" />
        <text x="22" y="36" fill="oklch(0.72 0.19 160)" fontSize="6" fontFamily="monospace" opacity="0.5">TRACK-ID</text>
        <text x="20" y="50" fill="oklch(0.72 0.19 160)" fontSize="9" fontFamily="monospace" fontWeight="bold" opacity="0.8">SS-••••</text>
        <rect x="54" y="42" width="10" height="10" rx="2" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" fill="none" opacity="0.3" />
        <rect x="56" y="44" width="6" height="6" rx="1" stroke="oklch(0.72 0.19 160)" strokeWidth="0.6" fill="none" opacity="0.3" />
        <circle cx="40" cy="4" r="4" fill="oklch(0.72 0.19 160)" opacity="0.15">
          <animate attributeName="opacity" values="0.15;0.3;0.15" dur="2s" begin="0.6s" repeatCount="indefinite" />
        </circle>
      </g>
    ),
    3: (
      <g>
        <circle cx="20" cy="22" r="6" fill="oklch(0.72 0.19 160)" fillOpacity="0.2" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" />
        <circle cx="20" cy="22" r="2.5" fill="oklch(0.72 0.19 160)" opacity="0.6" />
        <line x1="20" y1="28" x2="20" y2="40" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.3" />
        <circle cx="20" cy="46" r="6" fill="oklch(0.72 0.19 160)" fillOpacity="0.15" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" />
        <circle cx="20" cy="46" r="2.5" fill="oklch(0.72 0.19 160)" opacity="0.4" />
        <line x1="20" y1="52" x2="20" y2="64" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.2" />
        <circle cx="20" cy="70" r="6" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.2" fill="none" />
        <line x1="32" y1="21" x2="60" y2="21" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.4" />
        <line x1="32" y1="45" x2="54" y2="45" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.3" />
        <line x1="32" y1="69" x2="48" y2="69" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.15" />
        <circle cx="40" cy="4" r="4" fill="oklch(0.72 0.19 160)" opacity="0.15">
          <animate attributeName="opacity" values="0.15;0.3;0.15" dur="2s" begin="1.2s" repeatCount="indefinite" />
        </circle>
      </g>
    ),
  };

  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {content[step]}
    </svg>
  );
}

export function ComplianceBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" stroke="oklch(0.72 0.19 160)" strokeWidth="0.8" opacity="0.2" fill="none" />
      <circle cx="50" cy="50" r="38" stroke="oklch(0.72 0.19 160)" strokeWidth="0.5" opacity="0.1" fill="none" strokeDasharray="4 4" />
      <circle cx="50" cy="50" r="30" fill="oklch(0.72 0.19 160)" fillOpacity="0.06" />
      <path
        d="M50 30 L64 38 L64 52 C64 62 57 68 50 72 C43 68 36 62 36 52 L36 38 Z"
        fill="oklch(0.72 0.19 160)"
        fillOpacity="0.1"
        stroke="oklch(0.72 0.19 160)"
        strokeWidth="1"
        opacity="0.5"
      />
      <path d="M44 52 L48 56 L56 46" stroke="oklch(0.72 0.19 160)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" fill="none" />
    </svg>
  );
}

/**
 * Circular architecture flow — 5 nodes around a central shield,
 * connected by curved arrows showing data flow direction.
 */
export function ArchitectureFlow({ className }: { className?: string }) {
  const cx = 240;
  const cy = 240;
  const r = 170;
  const nodeR = 50;

  // 4 nodes: top, right, bottom, left
  const angles = [-90, 0, 90, 180];
  const nodes = [
    { label: "Reporter", sub: "Anonymous" },
    { label: "Gateway", sub: "IP Stripped" },
    { label: "Encryption", sub: "AES-256" },
    { label: "Storage", sub: "Encrypted" },
  ];

  const pos = angles.map((a) => {
    const rad = (a * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  });

  const arcs = pos.map((from, i) => {
    const to = pos[(i + 1) % 4];
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dx = midX - cx;
    const dy = midY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const push = 40;
    const cpX = midX + (dx / dist) * push;
    const cpY = midY + (dy / dist) * push;
    return `M ${from.x} ${from.y} Q ${cpX} ${cpY} ${to.x} ${to.y}`;
  });

  return (
    <svg viewBox="0 0 480 480" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="arc-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
        </filter>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="oklch(0.72 0.19 160)" opacity="0.6" />
        </marker>
      </defs>

      {/* Ambient glow */}
      <circle cx={cx} cy={cy} r="120" fill="oklch(0.72 0.19 160)" opacity="0.04" filter="url(#arc-glow)" />

      {/* Orbit rings */}
      <circle cx={cx} cy={cy} r={r} stroke="oklch(0.72 0.19 160)" strokeWidth="1" opacity="0.1" fill="none" strokeDasharray="8 6" />
      <circle cx={cx} cy={cy} r={r - 60} stroke="oklch(0.72 0.19 160)" strokeWidth="0.5" opacity="0.06" fill="none" />

      {/* Curved arrows */}
      {arcs.map((d, i) => (
        <path key={`arc-${i}`} d={d} stroke="oklch(0.72 0.19 160)" strokeWidth="2" opacity="0.25" fill="none" markerEnd="url(#arrow)" />
      ))}

      {/* Center shield */}
      <circle cx={cx} cy={cy} r="55" fill="oklch(0.2 0.015 260)" stroke="oklch(0.72 0.19 160)" strokeWidth="1.2" opacity="0.7" />
      <path
        d={`M${cx} ${cy - 26} L${cx + 20} ${cy - 14} L${cx + 20} ${cy + 6} C${cx + 20} ${cy + 20} ${cx + 10} ${cy + 28} ${cx} ${cy + 32} C${cx - 10} ${cy + 28} ${cx - 20} ${cy + 20} ${cx - 20} ${cy + 6} L${cx - 20} ${cy - 14} Z`}
        fill="oklch(0.72 0.19 160)"
        fillOpacity="0.15"
        stroke="oklch(0.72 0.19 160)"
        strokeWidth="1.5"
        opacity="0.7"
      />
      {/* Lock */}
      <rect x={cx - 9} y={cy - 2} width="18" height="14" rx="3" stroke="oklch(0.72 0.19 160)" strokeWidth="1.2" fill="oklch(0.72 0.19 160)" fillOpacity="0.15" />
      <path d={`M${cx - 5} ${cy - 2} L${cx - 5} ${cy - 7} C${cx - 5} ${cy - 13} ${cx + 5} ${cy - 13} ${cx + 5} ${cy - 7} L${cx + 5} ${cy - 2}`} stroke="oklch(0.72 0.19 160)" strokeWidth="1.2" fill="none" />
      <circle cx={cx} cy={cy + 4} r="2" fill="oklch(0.72 0.19 160)" opacity="0.7" />

      {/* Center pulse */}
      <circle cx={cx} cy={cy} r="55" stroke="oklch(0.72 0.19 160)" strokeWidth="1" fill="none" opacity="0.08">
        <animate attributeName="r" from="55" to="110" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.12" to="0" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* 4 nodes */}
      {pos.map((p, i) => (
        <g key={`node-${i}`}>
          {/* Glow ring */}
          <circle cx={p.x} cy={p.y} r={nodeR + 6} fill="oklch(0.72 0.19 160)" opacity="0.04" />
          {/* Background */}
          <circle cx={p.x} cy={p.y} r={nodeR} fill="oklch(0.18 0.015 260)" stroke="oklch(0.72 0.19 160)" strokeWidth="1.5" opacity="0.9" />
          {/* Pointer dot */}
          <circle cx={p.x} cy={p.y - 14} r="5" fill="oklch(0.72 0.19 160)" opacity="0.4" />
          <circle cx={p.x} cy={p.y - 14} r="2.5" fill="oklch(0.72 0.19 160)" opacity="0.9" />
          {/* Label — large */}
          <text x={p.x} y={p.y + 6} textAnchor="middle" fill="oklch(0.95 0.005 250)" fontSize="15" fontWeight="700">{nodes[i].label}</text>
          <text x={p.x} y={p.y + 22} textAnchor="middle" fill="oklch(0.65 0.01 250)" fontSize="11">{nodes[i].sub}</text>
          {/* Pulse on Reporter */}
          {i === 0 && (
            <circle cx={p.x} cy={p.y} r={nodeR} stroke="oklch(0.72 0.19 160)" strokeWidth="1" fill="none" opacity="0.15">
              <animate attributeName="r" from={String(nodeR)} to={String(nodeR + 18)} dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.15" to="0" dur="2.5s" repeatCount="indefinite" />
            </circle>
          )}
        </g>
      ))}
    </svg>
  );
}
