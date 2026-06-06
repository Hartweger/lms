// src/components/hearts/HeartVessel.tsx
type Props = { fillPercent: number; className?: string };

export function HeartVessel({ fillPercent, className }: Props) {
  const clamped = Math.max(0, Math.min(100, fillPercent));
  const fillTop = 90 - (clamped / 100) * 74; // srce ~ y16..y90
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={`Napredak ${clamped}%`} className={className}>
      <defs>
        <clipPath id="heartClip">
          <path d="M50 86 C22 64,10 46,24 30 C35 18,50 24,50 36 C50 24,65 18,76 30 C90 46,78 64,50 86 Z" />
        </clipPath>
      </defs>
      <path d="M50 86 C22 64,10 46,24 30 C35 18,50 24,50 36 C50 24,65 18,76 30 C90 46,78 64,50 86 Z"
            fill="#f7dde2" stroke="#F2546E" strokeWidth="2.5" />
      <g clipPath="url(#heartClip)">
        <rect x="6" y={fillTop} width="88" height="90" fill="#F2546E" />
        <rect x="6" y={fillTop - 2} width="88" height="5" fill="#FF8FA3" />
      </g>
    </svg>
  );
}
