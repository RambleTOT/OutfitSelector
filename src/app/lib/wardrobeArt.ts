const paletteMap: Record<string, string> = {
  белый: "#F7F7F5",
  молочный: "#F3EEE6",
  бежевый: "#D8C4A8",
  песочный: "#C8B28C",
  серый: "#B7BBC2",
  графит: "#50545A",
  черный: "#1E2227",
  синий: "#4C6898",
  деним: "#5D77A7",
  красный: "#FC7070",
  бордовый: "#8C3F50",
  пудровый: "#D8B3AC",
  коричневый: "#72584A",
  золотой: "#D3B56A",
  серебристый: "#C7CCD3",
};

export type GarmentArtKind =
  | "shirt"
  | "blouse"
  | "longsleeve"
  | "blazer"
  | "trench"
  | "coat"
  | "trousers"
  | "jeans"
  | "skirt"
  | "sneakers"
  | "boots"
  | "loafers"
  | "bag"
  | "scarf"
  | "earrings";

interface GarmentPiece {
  kind: GarmentArtKind;
  primary: string;
  secondary?: string;
  accent?: string;
  x: number;
  y: number;
  scale: number;
  rotate?: number;
}

function toDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function colorOf(token?: string, fallback = "#D6D8DD") {
  if (!token) {
    return fallback;
  }

  return paletteMap[token.toLowerCase()] ?? token ?? fallback;
}

function shade(hex: string, amount: number) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const num = parseInt(value, 16);
  const clamp = (input: number) => Math.max(0, Math.min(255, input));
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0xff) + amount);
  const b = clamp((num & 0xff) + amount);

  return `#${[r, g, b].map((item) => item.toString(16).padStart(2, "0")).join("")}`;
}

function renderPiece({
  kind,
  primary,
  secondary,
  accent,
  x,
  y,
  scale,
  rotate = 0,
}: GarmentPiece) {
  const dark = secondary ?? shade(primary, -28);
  const light = shade(primary, 24);
  const trim = accent ?? "#FFFFFF";

  const open = `<g transform="translate(${x} ${y}) scale(${scale}) rotate(${rotate} 60 80)">`;
  const close = "</g>";

  switch (kind) {
    case "shirt":
      return [
        open,
        `<path d="M26 28 L40 12 H80 L94 28 L86 50 L72 42 V144 H48 V42 L34 50 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M48 12 H72 L60 34 Z" fill="${light}" stroke="${dark}" stroke-width="1.5"/>`,
        `<path d="M60 34 V138" stroke="${dark}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4 5"/>`,
        close,
      ].join("");
    case "blouse":
      return [
        open,
        `<path d="M24 34 L42 16 H78 L96 34 L88 54 L74 48 V144 H46 V48 L32 54 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M48 18 Q60 40 72 18" fill="none" stroke="${dark}" stroke-width="2"/>`,
        `<circle cx="60" cy="48" r="4" fill="${trim}"/>`,
        close,
      ].join("");
    case "longsleeve":
      return [
        open,
        `<path d="M18 34 L36 18 H84 L102 34 L96 62 L80 56 V144 H40 V56 L24 62 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M40 26 H80" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>`,
        close,
      ].join("");
    case "blazer":
      return [
        open,
        `<path d="M24 26 L40 12 H80 L96 26 L92 60 L80 56 V146 H40 V56 L28 60 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M46 28 L60 58 L74 28" fill="${secondary ?? shade(primary, -18)}" stroke="${dark}" stroke-width="1.5"/>`,
        `<path d="M60 58 V146" stroke="${dark}" stroke-width="1.5"/>`,
        `<circle cx="60" cy="82" r="3" fill="${trim}"/><circle cx="60" cy="104" r="3" fill="${trim}"/>`,
        close,
      ].join("");
    case "trench":
      return [
        open,
        `<path d="M22 22 L42 10 H78 L98 22 L92 66 L82 62 V148 H38 V62 L28 66 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M46 24 L60 58 L74 24" fill="${light}" stroke="${dark}" stroke-width="1.5"/>`,
        `<path d="M40 88 H80" stroke="${accent ?? "#FC7070"}" stroke-width="6" stroke-linecap="round"/>`,
        `<path d="M60 56 V148" stroke="${dark}" stroke-width="1.5" stroke-dasharray="4 5"/>`,
        close,
      ].join("");
    case "coat":
      return [
        open,
        `<path d="M28 18 L44 10 H76 L92 18 L88 54 L80 52 V150 H40 V52 L32 54 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M48 20 L60 48 L72 20" fill="${secondary ?? shade(primary, 18)}" stroke="${dark}" stroke-width="1.5"/>`,
        `<path d="M60 48 V150" stroke="${dark}" stroke-width="1.6"/>`,
        close,
      ].join("");
    case "trousers":
      return [
        open,
        `<path d="M34 18 H86 L78 150 H58 L60 84 H52 L54 150 H34 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M60 18 V148" stroke="${dark}" stroke-width="1.5" stroke-dasharray="4 5"/>`,
        close,
      ].join("");
    case "jeans":
      return [
        open,
        `<path d="M34 18 H86 L80 150 H60 L60 86 H54 L54 150 H34 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M42 18 Q60 40 78 18" fill="${light}" stroke="${dark}" stroke-width="1.5"/>`,
        `<path d="M60 18 V148" stroke="${dark}" stroke-width="1.5"/>`,
        close,
      ].join("");
    case "skirt":
      return [
        open,
        `<path d="M40 22 H80 L92 148 H28 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M40 32 H80" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>`,
        close,
      ].join("");
    case "sneakers":
      return [
        open,
        `<path d="M18 92 Q34 66 58 70 L72 80 L102 88 L100 104 H22 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M30 104 H98" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`,
        `<path d="M42 82 H72" stroke="${trim}" stroke-width="2" stroke-dasharray="4 4"/>`,
        close,
      ].join("");
    case "boots":
      return [
        open,
        `<path d="M34 24 H74 V96 L98 102 V122 H24 V92 H34 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M34 122 H98" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`,
        close,
      ].join("");
    case "loafers":
      return [
        open,
        `<path d="M24 86 Q38 68 68 72 L94 84 L98 98 H18 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M34 84 H76" stroke="${trim}" stroke-width="2"/>`,
        close,
      ].join("");
    case "bag":
      return [
        open,
        `<rect x="28" y="40" width="64" height="78" rx="10" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M42 40 C42 18, 78 18, 78 40" fill="none" stroke="${dark}" stroke-width="3"/>`,
        close,
      ].join("");
    case "scarf":
      return [
        open,
        `<path d="M34 20 H74 L60 70 H24 Z" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<path d="M70 20 H94 L74 146 H54 Z" fill="${secondary ?? light}" stroke="${dark}" stroke-width="2"/>`,
        close,
      ].join("");
    case "earrings":
      return [
        open,
        `<circle cx="40" cy="68" r="18" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<circle cx="80" cy="68" r="18" fill="${primary}" stroke="${dark}" stroke-width="2"/>`,
        `<circle cx="40" cy="36" r="8" fill="${trim}" stroke="${dark}" stroke-width="2"/>`,
        `<circle cx="80" cy="36" r="8" fill="${trim}" stroke="${dark}" stroke-width="2"/>`,
        close,
      ].join("");
    default:
      return "";
  }
}

export function createGarmentArt(options: {
  kind: GarmentArtKind;
  primary: string;
  secondary?: string;
  accent?: string;
  background?: string;
}) {
  const primary = colorOf(options.primary);
  const secondary = colorOf(options.secondary, shade(primary, -18));
  const accent = colorOf(options.accent, "#FC7070");
  const background = colorOf(options.background, "#F5F5F4");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${background}"/>
          <stop offset="100%" stop-color="${shade(background, -8)}"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.14"/>
        </filter>
      </defs>
      <rect width="360" height="480" rx="40" fill="url(#bg)"/>
      <ellipse cx="180" cy="408" rx="88" ry="18" fill="#000000" opacity="0.08"/>
      <g filter="url(#shadow)">
        ${renderPiece({
          kind: options.kind,
          primary,
          secondary,
          accent,
          x: 108,
          y: 56,
          scale: 1.2,
        })}
      </g>
    </svg>
  `;

  return toDataUri(svg);
}

export function createLookArt(options: {
  background?: string;
  pieces: Array<{
    kind: GarmentArtKind;
    primary: string;
    secondary?: string;
    accent?: string;
    x: number;
    y: number;
    scale: number;
    rotate?: number;
  }>;
}) {
  const background = colorOf(options.background, "#F5F5F4");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480">
      <defs>
        <linearGradient id="look-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${background}"/>
          <stop offset="100%" stop-color="${shade(background, -10)}"/>
        </linearGradient>
        <filter id="look-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000000" flood-opacity="0.14"/>
        </filter>
      </defs>
      <rect width="360" height="480" rx="40" fill="url(#look-bg)"/>
      <g filter="url(#look-shadow)">
        ${options.pieces
          .map((piece) =>
            renderPiece({
              ...piece,
              primary: colorOf(piece.primary),
              secondary: colorOf(piece.secondary, shade(colorOf(piece.primary), -18)),
              accent: colorOf(piece.accent, "#FC7070"),
            }),
          )
          .join("")}
      </g>
    </svg>
  `;

  return toDataUri(svg);
}
