/* global React */
// VerseQuest — minimal SVG glyph set. No emoji, no figurative drawing.
// Each glyph is a small geometric mark (cross, circle, ring, check, arrow).
// Stroke is currentColor unless overridden via fill/stroke props.

function GBook({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2.5" stroke={color} strokeWidth="1.6"/>
      <path d="M12 4v16" stroke={color} strokeWidth="1.6"/>
      <path d="M7.5 8.5h2M14.5 8.5h2M7.5 12h2M14.5 12h2" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function GCross({ size = 20, color = 'currentColor', stroke = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4v16M6 10h12" stroke={color} strokeWidth={stroke} strokeLinecap="round"/>
    </svg>
  );
}

function GHands({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="3" stroke={color} strokeWidth="1.6"/>
      <path d="M5 19c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function GHeart({ size = 20, color = 'currentColor', filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <path d="M12 19s-7-4.3-7-9.5C5 7 6.8 5.5 8.8 5.5c1.4 0 2.6.7 3.2 1.8.6-1.1 1.8-1.8 3.2-1.8 2 0 3.8 1.5 3.8 4 0 5.2-7 9.5-7 9.5z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

function GCheck({ size = 16, color = 'currentColor', stroke = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4 4 10-10" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GFlame({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3c1 3 4 4 4 8a4 4 0 11-8 0c0-1.5.5-2.5 1-3 0 1 .5 1.5 1.5 1.5C11 6 10 5 12 3z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

function GSparkle({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function GBack({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 6l-6 6 6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GChevronR({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GHome({ size = 22, color = 'currentColor', filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 1}>
      <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z" stroke={color} strokeWidth="1.7" strokeLinejoin="round"/>
    </svg>
  );
}

function GUsers({ size = 22, color = 'currentColor', filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 1}>
      <circle cx="9" cy="9" r="3.2" stroke={color} strokeWidth="1.7"/>
      <circle cx="16.5" cy="10" r="2.5" stroke={color} strokeWidth="1.7"/>
      <path d="M3 19c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M16.5 14.5c2.2 0 4 1.2 4.5 3.5" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function GPray({ size = 22, color = 'currentColor', filled = false }) {
  // Praying hands: two hands palm-to-palm, fingertips up, wrists joined at base
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Left hand */}
      <path
        d="M11 21V10c0-2.5-.6-4.5-1.6-6.2-.5-.8-1.7-.6-2 .3L5.6 11c-.4 1.2-.6 2.4-.6 3.6V17c0 2.2 1.8 4 4 4h2z"
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 1}
        stroke={color} strokeWidth="1.5" strokeLinejoin="round"
      />
      {/* Right hand */}
      <path
        d="M13 21V10c0-2.5.6-4.5 1.6-6.2.5-.8 1.7-.6 2 .3L18.4 11c.4 1.2.6 2.4.6 3.6V17c0 2.2-1.8 4-4 4h-2z"
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 1}
        stroke={color} strokeWidth="1.5" strokeLinejoin="round"
      />
      {/* Center seam */}
      <path d="M12 6v15" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6"/>
    </svg>
  );
}

function GCheckCircle({ size = 22, color = 'currentColor', filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 1}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.7"/>
      <path d="M8 12.5l3 3 5-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GPlus({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function GPhone({ size = 16, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 4h4l1.5 4-2 1.2c1 2.4 2.9 4.3 5.3 5.3l1.2-2 4 1.5v4c0 .8-.7 1.5-1.5 1.5C9.5 19.5 4.5 14.5 4.5 5.5 4.5 4.7 5.2 4 6 4z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

function GWhatsApp({ size = 20, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3.5 20.5l1.3-4.3a8 8 0 113.1 3.1L3.5 20.5z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M9 9.5c0 3.3 2.2 5.5 5.5 5.5l1.5-1.5-2-1-1 .8-1.3-1.3.8-1-1-2L9.8 8 9 9.5z" fill={color}/>
    </svg>
  );
}

function GMoon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20 14a8 8 0 01-10-10 8 8 0 1010 10z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

function GBoltSmall({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

function GClock({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6"/>
      <path d="M12 7v5l3 2" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function GLogout({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M10 8l-4 4 4 4M6 12h10" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

Object.assign(window, {
  GBook, GCross, GHands, GHeart, GCheck, GFlame, GSparkle, GBack, GChevronR,
  GHome, GUsers, GPray, GCheckCircle, GPlus, GPhone, GWhatsApp, GMoon,
  GBoltSmall, GClock, GLogout,
});
