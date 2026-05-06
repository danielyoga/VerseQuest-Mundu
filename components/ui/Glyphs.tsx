// SVG glyph set — geometric marks only, currentColor stroke.
// Each glyph accepts size and color props.

type GlyphProps = { size?: number; color?: string };
type GlyphFilledProps = GlyphProps & { filled?: boolean };
type GCrossProps = GlyphProps & { stroke?: number };
type GCheckProps = GlyphProps & { stroke?: number };

export function GBook({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2.5" stroke={color} strokeWidth="1.6"/>
      <path d="M12 4v16" stroke={color} strokeWidth="1.6"/>
      <path d="M7.5 8.5h2M14.5 8.5h2M7.5 12h2M14.5 12h2" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

export function GCross({ size = 20, color = 'currentColor', stroke = 1.6 }: GCrossProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4v16M6 10h12" stroke={color} strokeWidth={stroke} strokeLinecap="round"/>
    </svg>
  );
}

export function GHands({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="3" stroke={color} strokeWidth="1.6"/>
      <path d="M5 19c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function GHeart({ size = 20, color = 'currentColor', filled = false }: GlyphFilledProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <path d="M12 19s-7-4.3-7-9.5C5 7 6.8 5.5 8.8 5.5c1.4 0 2.6.7 3.2 1.8.6-1.1 1.8-1.8 3.2-1.8 2 0 3.8 1.5 3.8 4 0 5.2-7 9.5-7 9.5z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

export function GCheck({ size = 16, color = 'currentColor', stroke = 2 }: GCheckProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4 4 10-10" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function GFlame({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3c1 3 4 4 4 8a4 4 0 11-8 0c0-1.5.5-2.5 1-3 0 1 .5 1.5 1.5 1.5C11 6 10 5 12 3z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

export function GSparkle({ size = 16, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function GBack({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 6l-6 6 6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function GChevronR({ size = 16, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function GHome({ size = 22, color = 'currentColor', filled = false }: GlyphFilledProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 1}>
      <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z" stroke={color} strokeWidth="1.7" strokeLinejoin="round"/>
    </svg>
  );
}

export function GUsers({ size = 22, color = 'currentColor', filled = false }: GlyphFilledProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 1}>
      <circle cx="9" cy="9" r="3.2" stroke={color} strokeWidth="1.7"/>
      <circle cx="16.5" cy="10" r="2.5" stroke={color} strokeWidth="1.7"/>
      <path d="M3 19c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M16.5 14.5c2.2 0 4 1.2 4.5 3.5" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

export function GPray({ size = 22, color = 'currentColor', filled = false }: GlyphFilledProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M11 21V10c0-2.5-.6-4.5-1.6-6.2-.5-.8-1.7-.6-2 .3L5.6 11c-.4 1.2-.6 2.4-.6 3.6V17c0 2.2 1.8 4 4 4h2z"
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 1}
        stroke={color} strokeWidth="1.5" strokeLinejoin="round"
      />
      <path
        d="M13 21V10c0-2.5.6-4.5 1.6-6.2.5-.8 1.7-.6 2 .3L18.4 11c.4 1.2.6 2.4.6 3.6V17c0 2.2-1.8 4-4 4h-2z"
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 1}
        stroke={color} strokeWidth="1.5" strokeLinejoin="round"
      />
      <path d="M12 6v15" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6"/>
    </svg>
  );
}

export function GCheckCircle({ size = 22, color = 'currentColor', filled = false }: GlyphFilledProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 1}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.7"/>
      <path d="M8 12.5l3 3 5-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function GPlus({ size = 22, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function GPhone({ size = 16, color = '#fff' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 4h4l1.5 4-2 1.2c1 2.4 2.9 4.3 5.3 5.3l1.2-2 4 1.5v4c0 .8-.7 1.5-1.5 1.5C9.5 19.5 4.5 14.5 4.5 5.5 4.5 4.7 5.2 4 6 4z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

export function GWhatsApp({ size = 20, color = '#fff' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3.5 20.5l1.3-4.3a8 8 0 113.1 3.1L3.5 20.5z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M9 9.5c0 3.3 2.2 5.5 5.5 5.5l1.5-1.5-2-1-1 .8-1.3-1.3.8-1-1-2L9.8 8 9 9.5z" fill={color}/>
    </svg>
  );
}

export function GMoon({ size = 16, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20 14a8 8 0 01-10-10 8 8 0 1010 10z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

export function GBoltSmall({ size = 14, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

export function GClock({ size = 14, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6"/>
      <path d="M12 7v5l3 2" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function GLogout({ size = 14, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M10 8l-4 4 4 4M6 12h10" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function GSettings({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.6"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="1.6"/>
    </svg>
  );
}

export function GShare({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M12 3v12M8 7l4-4 4 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function GArchive({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="4" rx="1" stroke={color} strokeWidth="1.6"/>
      <path d="M5 8v10a1 1 0 001 1h12a1 1 0 001-1V8" stroke={color} strokeWidth="1.6"/>
      <path d="M10 12h4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function GPencil({ size = 14, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 20l4-1 11-11a2 2 0 00-3-3L5 16l-1 4z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

export function GNote({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.6"/>
      <path d="M8 8h8M8 12h8M8 16h5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

export function GPin({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2a5 5 0 015 5c0 3.5-5 11-5 11S7 10.5 7 7a5 5 0 015-5z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="12" cy="7" r="1.8" stroke={color} strokeWidth="1.4"/>
    </svg>
  );
}

export function GEcho({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M5 12c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="1.5" fill={color}/>
    </svg>
  );
}

export function GBell({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 10a6 6 0 0112 0v4l2 2H4l2-2v-4z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M10 18a2 2 0 004 0" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function GFilter({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M7 12h10M10 18h4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function GHighlight({ size = 20, color = 'currentColor' }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 20h6M12 3l6 6-8 8-4-1-1-4 7-9z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M15 6l3 3" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
