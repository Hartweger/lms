// src/components/mascot/MascotBear.tsx
import "./MascotBear.css";

export type MascotState =
  | "happy"      // osmeh, lagano ljuljanje
  | "celebrate"  // poskok + zvezdice + srca
  | "proud"      // namiguje + zvezdica
  | "thinking"   // oblačić misli
  | "sleepy"     // Zzz, klimanje
  | "sad";       // suza, naginjanje

type Props = {
  state?: MascotState;
  size?: "full" | "head";
  animated?: boolean;
  className?: string;
};

// Uši, glava, njuška, nos
function BaseHead() {
  return (
    <>
      <circle cx="50" cy="30" r="17" fill="#C98A4B" />
      <circle cx="125" cy="30" r="17" fill="#C98A4B" />
      <circle cx="50" cy="32" r="9" fill="#E6C089" />
      <circle cx="125" cy="32" r="9" fill="#E6C089" />
      <circle cx="87" cy="62" r="46" fill="#D69A5A" />
      <ellipse cx="87" cy="74" rx="23" ry="18" fill="#F2D7AE" />
      <ellipse cx="87" cy="64" rx="8" ry="6" fill="#5a3a1c" />
    </>
  );
}

// Mirne kratke šapice sa strane (iste u svim stanjima) — crtaju se IZA tela,
// pa proviruju sa strane kao prirodne ruke.
function CalmArms() {
  return (
    <>
      <ellipse cx="40" cy="135" rx="12" ry="20" fill="#C98A4B" transform="rotate(10 40 135)" />
      <ellipse cx="134" cy="135" rx="12" ry="20" fill="#C98A4B" transform="rotate(-10 134 135)" />
    </>
  );
}

function BodyAndLegs() {
  return (
    <>
      <ellipse cx="58" cy="166" rx="20" ry="15" fill="#C98A4B" />
      <ellipse cx="117" cy="166" rx="20" ry="15" fill="#C98A4B" />
      <ellipse cx="58" cy="168" rx="10" ry="7" fill="#E6C089" />
      <ellipse cx="117" cy="168" rx="10" ry="7" fill="#E6C089" />
      <ellipse cx="87" cy="134" rx="46" ry="40" fill="#D69A5A" />
      <ellipse cx="87" cy="140" rx="28" ry="27" fill="#F2D7AE" opacity="0.65" />
    </>
  );
}

function BowTie() {
  return (
    <>
      <path d="M70 108 L87 116 L104 108 L100 125 L87 118 L74 125 Z" fill="#0AB3D7" />
      <circle cx="87" cy="116" r="5" fill="#0894B5" />
    </>
  );
}

// Lica po stanju
const FACES: Record<MascotState, React.ReactNode> = {
  happy: (
    <>
      <circle cx="68" cy="56" r="7.5" fill="#3a2613" />
      <circle cx="106" cy="56" r="7.5" fill="#3a2613" />
      <circle cx="70.5" cy="53.5" r="2.6" fill="#fff" />
      <circle cx="108.5" cy="53.5" r="2.6" fill="#fff" />
      <ellipse cx="57" cy="72" rx="8" ry="5" fill="#F78687" opacity="0.4" />
      <ellipse cx="117" cy="72" rx="8" ry="5" fill="#F78687" opacity="0.4" />
      <path d="M87 70 V80 M87 80 Q80 86 73 82 M87 80 Q94 86 101 82" stroke="#7a5226" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  celebrate: (
    <>
      <path d="M61 57 Q68 49 75 57" stroke="#3a2613" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M99 57 Q106 49 113 57" stroke="#3a2613" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="56" cy="73" rx="9" ry="6" fill="#F78687" opacity="0.45" />
      <ellipse cx="118" cy="73" rx="9" ry="6" fill="#F78687" opacity="0.45" />
      <path d="M74 78 Q87 96 100 78 Q87 88 74 78 Z" fill="#7a5226" />
    </>
  ),
  proud: (
    <>
      <path d="M61 56 Q68 51 75 56" stroke="#3a2613" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="106" cy="56" r="7.5" fill="#3a2613" />
      <circle cx="108.5" cy="53.5" r="2.6" fill="#fff" />
      <ellipse cx="57" cy="72" rx="8" ry="5" fill="#F78687" opacity="0.4" />
      <ellipse cx="117" cy="72" rx="8" ry="5" fill="#F78687" opacity="0.4" />
      <path d="M87 70 V80 M87 80 Q80 86 73 82 M87 80 Q94 86 101 82" stroke="#7a5226" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  thinking: (
    <>
      <circle cx="68" cy="56" r="7" fill="#3a2613" />
      <circle cx="106" cy="56" r="7" fill="#3a2613" />
      <circle cx="70" cy="53.5" r="2.3" fill="#fff" />
      <circle cx="108" cy="53.5" r="2.3" fill="#fff" />
      <path d="M75 80 L99 80" stroke="#7a5226" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  sleepy: (
    <>
      <path d="M61 57 Q68 62 75 57" stroke="#3a2613" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M99 57 Q106 62 113 57" stroke="#3a2613" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="87" cy="82" rx="5" ry="6" fill="none" stroke="#7a5226" strokeWidth="2" />
      <text x="118" y="34" fontSize="18" fill="#9BB8CC" fontWeight="bold">z</text>
      <text x="130" y="22" fontSize="13" fill="#B9D0DE" fontWeight="bold">z</text>
    </>
  ),
  sad: (
    <>
      <path d="M60 50 Q68 46 76 51" stroke="#7a5226" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M98 51 Q106 46 114 50" stroke="#7a5226" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="68" cy="60" rx="6" ry="7" fill="#3a2613" />
      <ellipse cx="106" cy="60" rx="6" ry="7" fill="#3a2613" />
      <circle cx="69.5" cy="58" r="2" fill="#fff" />
      <circle cx="107.5" cy="58" r="2" fill="#fff" />
      <path d="M62 66 Q65 74 68 80" stroke="#7EC8E3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="68" cy="81" rx="2.3" ry="3.2" fill="#7EC8E3" />
      <path d="M73 88 Q87 80 101 88" stroke="#7a5226" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
};

// Mali efekti preko svega (zvezdice, srca, oblačić misli)
const EFFECTS: Partial<Record<MascotState, React.ReactNode>> = {
  celebrate: (
    <>
      <text x="16" y="46" fontSize="20" fill="#FFC83D">✦</text>
      <text x="150" y="36" fontSize="15" fill="#FFC83D">✦</text>
      <text x="38" y="152" fontSize="14" fill="#FFC83D">✦</text>
      <path d="M150 118 q3 -6 8 -2 q5 -4 8 2 q1 5 -8 12 q-10 -7 -8 -12 Z" fill="#F2546E" />
      <path d="M20 112 q2 -5 6 -1 q4 -3 6 1 q1 4 -6 9 q-8 -5 -6 -9 Z" fill="#FF8FA3" />
    </>
  ),
  proud: (
    <path d="M150 44 L153 55 L164 58 L153 61 L150 72 L147 61 L136 58 L147 55 Z" fill="#FFC83D" />
  ),
  thinking: (
    <g fill="#9ca3af">
      <circle cx="140" cy="44" r="2.5" />
      <circle cx="150" cy="34" r="3.5" />
      <circle cx="162" cy="22" r="5" />
    </g>
  ),
};

export function MascotBear({ state = "happy", size = "full", animated = true, className }: Props) {
  const viewBox = size === "head" ? "28 6 118 116" : "0 0 175 190";
  const animClass = animated ? `mascot mascot--${state}` : "";
  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Meda maskota"
      className={[animClass, className].filter(Boolean).join(" ")}
    >
      {size === "full" && <CalmArms />}
      {size === "full" && <BodyAndLegs />}
      <BaseHead />
      {FACES[state]}
      {size === "full" && state !== "sleepy" && state !== "sad" && <BowTie />}
      {size === "full" && EFFECTS[state]}
    </svg>
  );
}
