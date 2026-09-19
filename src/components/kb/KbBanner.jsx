import { bannerTheme, initialOf } from '@/lib/logic';

/**
 * Category-coloured band with a monogram disc, as traced in the handoff file.
 * `height` covers the card (100px) and the article hero (180px).
 */
export default function KbBanner({ cat, height = 100, discSize = 44, className = '' }) {
  const theme = bannerTheme(cat);

  return (
    <div
      style={{ background: theme.bg, height }}
      className={`flex w-full items-center justify-center ${className}`}
    >
      <div
        style={{ background: theme.accent, width: discSize, height: discSize }}
        className="flex items-center justify-center rounded-full font-extrabold text-white"
      >
        {initialOf(cat)}
      </div>
    </div>
  );
}
