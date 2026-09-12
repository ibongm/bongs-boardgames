import { useState } from 'react';
import { TYPE_COLORS } from './names.js';
import { CARD_BACK, DISTRICT_PHOTO, ROLE_PHOTO } from './photos.js';

const TYPE_FILL = {
  noble: '#c4a35a',
  religious: '#4a6fa5',
  trade: '#2f6b4f',
  military: '#a3543a',
  unique: '#6b4a8a',
  role: '#6366f1',
};

const GLYPH = {
  manor: 'M18 70 V42 L40 26 L62 42 V70 H18 M30 70 V52 H50 V70',
  castle: 'M16 72 V40 H26 V28 H34 V40 H46 V28 H54 V40 H64 V72 Z M28 56 H36 V72 H28 Z M44 56 H52 V72 H44 Z',
  palace: 'M14 72 L14 44 Q40 20 66 44 V72 Z M26 72 V58 H38 V72 M42 72 V58 H54 V72 M36 44 H44 V52 H36 Z',
  temple: 'M16 72 H64 V64 L40 28 L16 64 Z M36 72 V56 H44 V72 M40 24 V18',
  church: 'M18 72 H62 V60 L40 30 L18 60 Z M36 48 H44 V72 H36 Z M40 22 V32 M34 26 H46',
  monastery: 'M14 72 H38 V40 H14 Z M42 72 H66 V36 L54 24 L42 36 Z M22 50 H30 V58 H22 Z M50 48 H58 V56 H50 Z',
  cathedral: 'M10 74 H70 V62 L40 18 L10 62 Z M36 42 H44 V74 H36 Z M40 12 V22 M32 16 H48 M22 62 H30 V74 H22 Z M50 62 H58 V74 H50 Z',
  tavern: 'M18 72 H62 V44 L40 28 L18 44 Z M28 52 H36 V72 H28 Z M44 56 C52 56 52 68 44 68 H44',
  market: 'M14 72 H66 V64 H14 Z M18 64 L26 40 H54 L62 64 M30 48 H36 V56 H30 Z M44 48 H50 V56 H44 Z',
  'trading-post': 'M16 72 H64 V48 H16 Z M20 48 L40 28 L60 48 M28 56 H36 V64 H28 Z M48 40 H56 V48',
  docks: 'M12 60 H68 V66 H12 Z M20 60 V48 H28 V60 M36 60 V44 H44 V60 M52 60 V50 H60 V60 M14 70 Q40 78 66 70',
  harbor: 'M12 58 H68 V64 H12 Z M16 58 L28 36 H36 L24 58 M44 58 L56 34 H64 L52 58 M14 70 Q40 80 66 70',
  'town-hall': 'M16 74 H64 V46 L40 26 L16 46 Z M28 50 H36 V62 H28 Z M44 50 H52 V62 H44 Z M36 74 V64 H44 V74 M40 22 V16',
  watchtower: 'M30 76 H50 V36 L40 22 L30 36 Z M34 44 H46 V52 H34 Z M38 22 V14 H42 V22',
  prison: 'M18 74 H62 V34 H18 Z M26 42 H34 V66 H26 Z M46 42 H54 V66 H46 Z M22 34 L40 18 L58 34',
  battlefield: 'M16 70 L28 42 L40 70 L52 42 L64 70 Z M40 28 L44 42 H36 Z M22 74 H58',
  fortress: 'M14 74 V40 H24 V28 H34 V40 H46 V28 H56 V40 H66 V74 Z M30 52 H38 V74 H30 Z M42 52 H50 V74 H42 Z',
  'dragon-gate': 'M16 70 L28 34 H36 L24 70 Z M44 70 L56 30 H64 L52 70 Z M30 48 H50 M22 22 Q40 8 58 22',
  factory: 'M14 72 H66 V48 H50 V32 H34 V48 H14 Z M38 32 V20 H46 V32 M22 56 H30 V64 H22 Z M54 56 H62 V64 H54 Z',
  'haunted-quarter': 'M20 72 L28 36 H36 L32 72 Z M44 72 L52 32 H60 L56 72 Z M30 24 Q40 12 50 24 Q40 30 30 24',
  'imperial-treasury': 'M22 70 H58 V46 L40 30 L22 46 Z M32 52 H48 V62 H32 Z M40 24 V30 M28 70 H52 V74 H28 Z',
  keep: 'M24 74 H56 V38 L40 22 L24 38 Z M32 48 H40 V58 H32 Z M36 22 V14 H44 V22 H36 M28 74 V64 H48 V74',
  laboratory: 'M30 72 H50 L46 44 H34 Z M28 44 H52 L40 28 Z M36 20 H44 V28 H36 Z',
  library: 'M18 72 H62 V32 H18 Z M24 40 H30 V64 H24 Z M36 40 H42 V64 H36 Z M48 40 H54 V64 H48 Z M18 32 L40 18 L62 32',
  'map-room': 'M20 28 H60 V68 H20 Z M28 36 L36 52 L48 40 L56 58 M24 62 H56',
  quarry: 'M16 70 L28 44 L40 62 L54 36 L66 70 Z M30 44 L38 28 L48 40',
  'school-of-magic': 'M20 72 L40 24 L60 72 Z M32 56 H48 M40 16 V24 M28 20 H52',
  smithy: 'M18 72 H62 V50 H18 Z M26 50 V36 H38 L42 50 M46 34 H58 V42 H46 Z M24 60 H34',
  statue: 'M36 74 H44 V52 H36 Z M28 52 H52 L40 28 Z M36 24 H44 V30 H36 Z',
  'thieves-den': 'M18 72 H62 V48 L40 30 L18 48 Z M30 52 H38 V62 H30 Z M48 40 Q56 40 56 50',
  'wishing-well': 'M28 34 H52 V70 H28 Z M24 34 H56 M32 42 H48 M32 52 H48 M36 70 V78 H44 V70',
  assassin: 'M28 78 C20 58 24 40 40 30 C56 40 60 58 52 78 Z M40 30 C36 18 48 14 50 26 M24 48 H34',
  thief: 'M26 78 C20 56 26 38 40 30 C54 38 60 56 54 78 Z M28 46 H36 M40 22 C32 22 32 34 40 34 C46 34 48 24 42 22',
  magician: 'M26 78 L32 46 L40 28 L48 46 L54 78 Z M34 22 H46 L40 12 Z M22 50 H32',
  king: 'M26 78 C22 54 28 40 40 32 C52 40 58 54 54 78 Z M28 28 L34 18 L40 26 L46 18 L52 28 Z',
  bishop: 'M28 78 C24 56 30 40 40 32 C50 40 56 56 52 78 Z M40 14 L34 28 H46 Z M40 14 V8',
  merchant: 'M26 78 C22 56 28 40 40 32 C52 40 58 56 54 78 Z M24 46 H34 M46 44 L56 52 L50 58 L40 50 Z',
  architect: 'M26 78 C22 56 28 40 40 32 C52 40 58 56 54 78 Z M22 50 L40 22 L58 50 M32 50 H48',
  warlord: 'M24 78 C20 56 28 40 40 30 C52 40 60 56 56 78 Z M28 28 H52 L40 16 Z M18 48 H30 L26 56',
};

function Picture({ color, d, banner }) {
  return (
    <svg viewBox="0 0 80 100" className="w-full h-full" aria-hidden="true">
      <rect width="80" height="100" rx="8" fill="#1e293b" />
      <rect x="3" y="3" width="74" height="94" rx="6" fill="none" stroke={color} strokeWidth="2.4" />
      <rect x="3" y="3" width="74" height="16" rx="6" fill={color} />
      <rect x="3" y="12" width="74" height="8" fill={color} />
      <path d={d} fill="none" stroke={color} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      {banner ? <circle cx="40" cy="88" r="6" fill={color} /> : null}
    </svg>
  );
}

function PhotoOrGlyph({ src, color, d, banner, className = '' }) {
  const [failed, setFailed] = useState(!src);
  if (!src || failed) {
    return (
      <div className={className}>
        <Picture color={color} d={d} banner={banner} />
      </div>
    );
  }
  return (
    <div className={className}>
      <img src={src} alt="" className="w-full h-full object-cover rounded-md" draggable={false} onError={() => setFailed(true)} />
    </div>
  );
}

export function DistrictPicture({ stem, type, className = '' }) {
  const color = TYPE_FILL[type] || TYPE_COLORS[type] || '#6366f1';
  const d = GLYPH[stem] || GLYPH.manor;
  return <PhotoOrGlyph src={DISTRICT_PHOTO[stem]} color={color} d={d} className={className} />;
}

export function RolePicture({ roleId, className = '' }) {
  const d = GLYPH[roleId] || GLYPH.king;
  return <PhotoOrGlyph src={ROLE_PHOTO[roleId]} color={TYPE_FILL.role} d={d} banner className={className} />;
}

export function HiddenPicture({ className = '' }) {
  return <PhotoOrGlyph src={CARD_BACK} color="#475569" d="M24 50 H56 M40 34 V66" className={className} />;
}
