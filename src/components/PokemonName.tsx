type Props = {
  name: string;
  as?: 'h2' | 'p' | 'span';
  className?: string;
  title?: string;
};

/** Renders a Pokémon name with break opportunities at hyphens. */
export function PokemonName({ name, as: Tag = 'span', className = '', title }: Props) {
  const parts = name.split('-');

  return (
    <Tag className={className} title={title ?? name}>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {index > 0 && (
            <>
              <wbr />-<wbr />
            </>
          )}
          {part}
        </span>
      ))}
    </Tag>
  );
}
