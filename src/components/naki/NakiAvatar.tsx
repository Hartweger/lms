// NaKI ilustracija (lik) — portovano 1:1 sa originalne WP/HTML stranice (naki-elementor-widget.html).
// "full" = ceo lik za hero (sa rukom koja maše); "face" = samo glava za zaglavlje chata.

export function NakiAvatar({ className }: { className?: string }) {
  return (
    <svg
      width="220"
      height="280"
      viewBox="0 0 220 280"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="NaKI ilustracija"
    >
      <ellipse cx="110" cy="105" rx="72" ry="78" fill="#F2D06B" />
      <path d="M42 105 C38 160, 40 220, 55 260 L65 260 C55 220, 52 160, 55 115 Z" fill="#F2D06B" />
      <path d="M178 105 C182 160, 180 220, 165 260 L155 260 C165 220, 168 160, 165 115 Z" fill="#F2D06B" />
      <path d="M50 120 C45 170, 48 230, 60 265 L70 265 C62 230, 58 170, 60 125 Z" fill="#E8C55A" opacity="0.7" />
      <path d="M170 120 C175 170, 172 230, 160 265 L150 265 C158 230, 162 170, 160 125 Z" fill="#E8C55A" opacity="0.7" />
      <rect x="98" y="158" width="24" height="20" rx="8" fill="#FDDBB5" />
      <path d="M70 178 Q110 168, 150 178 L158 250 Q110 258, 62 250 Z" fill="#0AB3D7" />
      <path d="M92 178 Q110 190, 128 178" stroke="white" strokeWidth="2" fill="none" />
      <ellipse cx="110" cy="115" rx="52" ry="55" fill="#FDDBB5" />
      <path d="M58 95 Q70 55, 110 48 Q150 55, 162 95 Q155 70, 110 62 Q65 70, 58 95 Z" fill="#F2D06B" />
      <path d="M82 98 Q90 93, 98 96" stroke="#C49A6C" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M122 96 Q130 93, 138 98" stroke="#C49A6C" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="90" cy="112" rx="8" ry="9" fill="white" />
      <ellipse cx="130" cy="112" rx="8" ry="9" fill="white" />
      <ellipse cx="91" cy="113" rx="4.5" ry="5" fill="#4A6FA5" />
      <ellipse cx="131" cy="113" rx="4.5" ry="5" fill="#4A6FA5" />
      <circle cx="92.5" cy="111" r="1.8" fill="white" />
      <circle cx="132.5" cy="111" r="1.8" fill="white" />
      <path d="M108 122 Q110 126, 112 122" stroke="#E0A88A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M96 134 Q110 146, 124 134" stroke="#E07070" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="78" cy="128" rx="10" ry="6" fill="#F78687" opacity="0.3" />
      <ellipse cx="142" cy="128" rx="10" ry="6" fill="#F78687" opacity="0.3" />
      <g transform="translate(160, 200)">
        <path
          d="M0 10 Q-2 0, 5 -8 Q8 -14, 10 -8 L12 -12 Q14 -18, 17 -12 L18 -14 Q20 -20, 23 -14 L22 -10 Q25 -16, 28 -10 L26 2 Q24 14, 14 18 Q6 20, 0 10 Z"
          fill="#FDDBB5"
        />
      </g>
    </svg>
  );
}

export function NakiFace({ className }: { className?: string }) {
  return (
    <svg
      viewBox="60 60 100 110"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="NaKI"
    >
      <ellipse cx="110" cy="105" rx="72" ry="78" fill="#F2D06B" />
      <ellipse cx="110" cy="115" rx="52" ry="55" fill="#FDDBB5" />
      <path d="M58 95 Q70 55, 110 48 Q150 55, 162 95 Q155 70, 110 62 Q65 70, 58 95 Z" fill="#F2D06B" />
      <ellipse cx="90" cy="112" rx="8" ry="9" fill="white" />
      <ellipse cx="130" cy="112" rx="8" ry="9" fill="white" />
      <ellipse cx="91" cy="113" rx="4.5" ry="5" fill="#4A6FA5" />
      <ellipse cx="131" cy="113" rx="4.5" ry="5" fill="#4A6FA5" />
      <circle cx="92.5" cy="111" r="1.8" fill="white" />
      <circle cx="132.5" cy="111" r="1.8" fill="white" />
      <path d="M96 134 Q110 146, 124 134" stroke="#E07070" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="78" cy="128" rx="10" ry="6" fill="#F78687" opacity="0.3" />
      <ellipse cx="142" cy="128" rx="10" ry="6" fill="#F78687" opacity="0.3" />
    </svg>
  );
}
