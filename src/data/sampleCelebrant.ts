/**
 * High-resolution built-in sample celebrant portrait SVG data URL.
 * Used for one-click demo and testing without needing to find a photo first.
 */
export function getSampleCelebrantDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#14213d"/>
        <stop offset="40%" stop-color="#0a1128"/>
        <stop offset="100%" stop-color="#03071e"/>
      </linearGradient>
      <radialGradient id="warmLight" cx="50%" cy="30%" r="50%">
        <stop offset="0%" stop-color="#e8c36a" stop-opacity="0.35"/>
        <stop offset="50%" stop-color="#d4af37" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8a5333"/>
        <stop offset="50%" stop-color="#734125"/>
        <stop offset="100%" stop-color="#542e18"/>
      </linearGradient>
      <linearGradient id="skinHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#a46944"/>
        <stop offset="100%" stop-color="#734125"/>
      </linearGradient>
      <linearGradient id="dress" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0b522c"/>
        <stop offset="50%" stop-color="#063d20"/>
        <stop offset="100%" stop-color="#032212"/>
      </linearGradient>
      <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f9d976"/>
        <stop offset="50%" stop-color="#e8c36a"/>
        <stop offset="100%" stop-color="#b8860b"/>
      </linearGradient>
      <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1f1815"/>
        <stop offset="100%" stop-color="#0d0a08"/>
      </linearGradient>
      <radialGradient id="halo" cx="50%" cy="40%" r="45%">
        <stop offset="0%" stop-color="#ffd700" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#ffd700" stop-opacity="0"/>
      </radialGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="24" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>

    <!-- Studio Backdrop -->
    <rect width="1080" height="1350" fill="url(#bgGrad)"/>
    <circle cx="540" cy="480" r="420" fill="url(#halo)" filter="url(#softGlow)"/>
    <rect width="1080" height="1350" fill="url(#warmLight)"/>

    <!-- Subtle Golden Sparkles in Background -->
    <g fill="#e8c36a" opacity="0.6">
      <circle cx="210" cy="240" r="4"/>
      <circle cx="280" cy="180" r="2.5"/>
      <circle cx="840" cy="220" r="3.5"/>
      <circle cx="890" cy="310" r="2"/>
      <circle cx="160" cy="480" r="3"/>
      <circle cx="940" cy="520" r="4"/>
    </g>

    <!-- Celebrant Silhouette & Torso (Sunday Best Attire with CYON Scarf/Sash) -->
    <!-- Shoulders & Outfit -->
    <path d="M220 1350 C240 1060 330 940 430 890 L540 960 L650 890 C750 940 840 1060 860 1350 Z" fill="url(#dress)"/>
    
    <!-- Gold Embroidered Collar & Neckline -->
    <path d="M430 890 Q540 980 650 890 Q540 920 430 890 Z" fill="url(#goldTrim)"/>
    <path d="M526 950 L554 950 L554 1140 L526 1140 Z" fill="url(#goldTrim)" opacity="0.9"/>
    
    <!-- Cross Pendant Necklace -->
    <circle cx="540" cy="880" r="3.5" fill="#e8c36a"/>
    <path d="M540 860 L540 915" stroke="#e8c36a" stroke-width="3" stroke-linecap="round"/>
    <path d="M528 878 L552 878" stroke="#e8c36a" stroke-width="3" stroke-linecap="round"/>

    <!-- Neck -->
    <path d="M480 730 L480 870 C480 910 600 910 600 870 L600 730 Z" fill="url(#skin)"/>
    <path d="M480 800 C520 840 560 840 600 800 L600 870 C600 910 480 910 480 870 Z" fill="#542e18" opacity="0.25"/>

    <!-- Head & Hair Back -->
    <ellipse cx="540" cy="520" rx="210" ry="250" fill="url(#hairGrad)"/>

    <!-- Face Shape -->
    <path d="M390 520 C390 730 460 790 540 790 C620 790 690 730 690 520 C690 380 610 350 540 350 C470 350 390 380 390 520 Z" fill="url(#skin)"/>
    
    <!-- Cheeks & Forehead Highlights -->
    <ellipse cx="540" cy="460" rx="100" ry="60" fill="url(#skinHighlight)" opacity="0.6"/>
    <ellipse cx="460" cy="620" rx="35" ry="25" fill="#a46944" opacity="0.4"/>
    <ellipse cx="620" cy="620" rx="35" ry="25" fill="#a46944" opacity="0.4"/>

    <!-- Ears -->
    <ellipse cx="385" cy="550" rx="20" ry="42" fill="url(#skin)"/>
    <ellipse cx="695" cy="550" rx="20" ry="42" fill="url(#skin)"/>
    <!-- Gold Earrings -->
    <circle cx="385" cy="585" r="9" fill="url(#goldTrim)"/>
    <circle cx="695" cy="585" r="9" fill="url(#goldTrim)"/>

    <!-- Hair Styling (Graceful Curls / Updo Crown) -->
    <path d="M370 480 C360 320 440 230 540 230 C640 230 720 320 710 480 C680 380 620 340 540 340 C460 340 400 380 370 480 Z" fill="url(#hairGrad)"/>
    <circle cx="540" cy="240" r="95" fill="url(#hairGrad)"/>
    <circle cx="480" cy="270" r="75" fill="url(#hairGrad)"/>
    <circle cx="600" cy="270" r="75" fill="url(#hairGrad)"/>

    <!-- Eyebrows -->
    <path d="M440 500 Q480 485 515 505" stroke="#1f1815" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M640 500 Q600 485 565 505" stroke="#1f1815" stroke-width="8" stroke-linecap="round" fill="none"/>

    <!-- Eyes (Warm & Smiling) -->
    <!-- Left Eye -->
    <ellipse cx="480" cy="540" rx="28" ry="18" fill="#ffffff"/>
    <ellipse cx="482" cy="540" rx="14" ry="14" fill="#3e2312"/>
    <circle cx="485" cy="537" r="7" fill="#120c08"/>
    <circle cx="488" cy="534" r="3.5" fill="#ffffff"/>
    <path d="M450 535 Q480 520 510 535" stroke="#1a110b" stroke-width="4.5" fill="none"/>
    <!-- Right Eye -->
    <ellipse cx="600" cy="540" rx="28" ry="18" fill="#ffffff"/>
    <ellipse cx="598" cy="540" rx="14" ry="14" fill="#3e2312"/>
    <circle cx="595" cy="537" r="7" fill="#120c08"/>
    <circle cx="598" cy="534" r="3.5" fill="#ffffff"/>
    <path d="M570 535 Q600 520 630 535" stroke="#1a110b" stroke-width="4.5" fill="none"/>

    <!-- Nose -->
    <path d="M540 525 L536 605 Q540 622 552 615 Q540 628 528 615" stroke="#542e18" stroke-width="4" stroke-linecap="round" fill="none"/>
    <ellipse cx="522" cy="615" rx="8" ry="5" fill="#542e18" opacity="0.6"/>
    <ellipse cx="558" cy="615" rx="8" ry="5" fill="#542e18" opacity="0.6"/>

    <!-- Warm Radiant Smile -->
    <path d="M470 665 Q540 735 610 665 C580 660 500 660 470 665 Z" fill="#ffffff"/>
    <path d="M465 665 Q540 685 615 665" stroke="#8b263e" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M465 665 Q540 745 615 665" fill="#a8324f" opacity="0.95"/>
    <path d="M475 668 Q540 710 605 668 Z" fill="#ffffff"/> <!-- Sparkling teeth -->

    <!-- Festive Gold Confetti Accents around the Celebrant -->
    <g fill="#e8c36a">
      <polygon points="190,420 200,435 185,440" opacity="0.75"/>
      <polygon points="860,460 880,455 870,475" opacity="0.75"/>
      <rect x="250" y="680" width="14" height="6" rx="2" transform="rotate(25 250 680)" opacity="0.7"/>
      <rect x="820" y="720" width="16" height="6" rx="2" transform="rotate(-35 820 720)" opacity="0.7"/>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
