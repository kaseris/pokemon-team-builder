import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { PokemonSet } from '../types/pokemon';
import {
  getBattleSprite,
  getIconSprite,
  isAnimatedBattleSprite,
  SPRITE_DISPLAY,
  type BattleSprite,
} from '../data/sprites';
import { getGen9SpriteUrl } from '../data/gen9-sprites';
import { getAnimatedSpriteUrl } from '../data/animated-sprites';
import { ItemSprite } from './ItemSprite';

type Props = {
  species: string;
  forme?: string;
  gender?: PokemonSet['gender'];
  shiny?: boolean;
  item?: string;
  size?: keyof typeof SPRITE_DISPLAY;
  /**
   * `showdown`: scaviogifs animated, Showdown GIF, gen-9 static, Showdown static.
   * `gen9`: gen-9 static first, then Showdown (any).
   */
  style?: 'showdown' | 'gen9';
  className?: string;
};

type SpriteTier = 'custom' | 'animated' | 'gen9' | 'static' | 'none';

const ITEM_OVERLAY_SIZE = {
  icon: 'sm',
  sm: 'sm',
  party: 'md',
  lg: 'md',
  xl: 'lg',
  hero: 'xl',
} as const;

function pickSpriteTier(
  style: 'showdown' | 'gen9',
  opts: {
    customAvailable: boolean;
    gen9Available: boolean;
    battleAvailable: boolean;
    animated: boolean;
  },
): SpriteTier {
  const { customAvailable, gen9Available, battleAvailable, animated } = opts;

  if (style === 'gen9') {
    if (gen9Available) return 'gen9';
    if (battleAvailable) return animated ? 'animated' : 'static';
    return 'none';
  }

  if (customAvailable) return 'custom';
  if (animated && battleAvailable) return 'animated';
  if (gen9Available) return 'gen9';
  if (battleAvailable) return 'static';
  return 'none';
}

function Gen9SpriteImg({
  url,
  species,
  onError,
}: {
  url: string;
  species: string;
  onError: () => void;
}) {
  return (
    <img
      src={url}
      alt={species}
      className="max-h-full max-w-full object-contain"
      style={{ imageRendering: 'pixelated' }}
      onError={onError}
      loading="lazy"
    />
  );
}

function AnimatedGifImg({
  url,
  species,
  onError,
}: {
  url: string;
  species: string;
  onError: () => void;
}) {
  return (
    <img
      src={url}
      alt={species}
      className="max-h-full max-w-full object-contain"
      onError={onError}
      loading="lazy"
    />
  );
}

function BattleSpriteImg({
  battle,
  species,
  box,
  onError,
}: {
  battle: BattleSprite;
  species: string;
  box: { width: number; height: number };
  onError: () => void;
}) {
  const scale = Math.min(box.width / battle.w, box.height / battle.h);

  return (
    <img
      src={battle.url}
      alt={species}
      width={Math.round(battle.w * scale)}
      height={Math.round(battle.h * scale)}
      className="max-h-full max-w-full object-contain"
      style={{
        imageRendering: battle.pixelated ? 'pixelated' : 'auto',
        maxWidth: box.width,
        maxHeight: box.height,
      }}
      onError={onError}
      loading="lazy"
    />
  );
}

export function PokemonSprite({
  species,
  forme,
  gender,
  shiny,
  item,
  size = 'sm',
  style = 'showdown',
  className = '',
}: Props) {
  const [customFailed, setCustomFailed] = useState(false);
  const [gen9Failed, setGen9Failed] = useState(false);
  const [battleFailed, setBattleFailed] = useState(false);

  const customUrl = useMemo(
    () => getAnimatedSpriteUrl(species, forme, gender),
    [species, forme, gender],
  );

  const gen9Url = useMemo(
    () => getGen9SpriteUrl(species, forme, gender),
    [species, forme, gender],
  );

  const battle = useMemo(
    () => getBattleSprite(species, forme, { gender, shiny }),
    [species, forme, gender, shiny],
  );

  const animatedBattle = isAnimatedBattleSprite(battle);

  const icon = useMemo(
    () => (size === 'icon' ? getIconSprite(species, forme, { gender }) : null),
    [species, forme, gender, size],
  );

  useEffect(() => {
    setCustomFailed(false);
    setGen9Failed(false);
    setBattleFailed(false);
  }, [species, forme, gender, shiny, style]);

  const itemOverlay = item ? (
    <ItemSprite
      item={item}
      size={ITEM_OVERLAY_SIZE[size]}
      variant={size === 'hero' ? 'plain' : 'boxed'}
      showLabel={size === 'hero'}
      showEffect={size === 'hero'}
      className="pointer-events-auto absolute bottom-0 right-0 z-20 overflow-visible"
    />
  ) : null;

  const box = SPRITE_DISPLAY[size];

  if (!species) {
    return (
      <div
        className={`relative flex shrink-0 items-center justify-center text-muted ${className}`}
        style={{ width: box.width, height: box.height }}
        aria-hidden
      >
        ?
      </div>
    );
  }

  if (size === 'icon' && icon && !battleFailed) {
    return (
      <span className={`relative inline-flex shrink-0 ${className}`}>
        <span
          style={icon.css as CSSProperties}
          role="img"
          aria-label={species}
        />
        {itemOverlay}
      </span>
    );
  }

  const tier = pickSpriteTier(style, {
    customAvailable: Boolean(customUrl && !customFailed),
    gen9Available: Boolean(gen9Url && !gen9Failed),
    battleAvailable: Boolean(battle && !battleFailed),
    animated: animatedBattle,
  });

  if (tier === 'none') {
    return (
      <div
        className={`relative flex shrink-0 items-center justify-center text-xs text-muted ${className}`}
        style={{ width: box.width, height: box.height }}
        aria-hidden
      >
        ?
        {itemOverlay}
      </div>
    );
  }

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-visible ${className}`}
      style={{ width: box.width, height: box.height }}
    >
      {tier === 'custom' && customUrl && (
        <AnimatedGifImg
          url={customUrl}
          species={species}
          onError={() => setCustomFailed(true)}
        />
      )}
      {tier === 'gen9' && gen9Url && (
        <Gen9SpriteImg
          url={gen9Url}
          species={species}
          onError={() => setGen9Failed(true)}
        />
      )}
      {(tier === 'animated' || tier === 'static') && battle && (
        <BattleSpriteImg
          battle={battle}
          species={species}
          box={box}
          onError={() => setBattleFailed(true)}
        />
      )}
      {itemOverlay}
    </span>
  );
}
