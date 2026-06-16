/**
 * Hyperscript minimo para montar a arvore que o satori consome.
 * Evita depender de JSX/React no pipeline de composicao.
 *
 * satori le `element.type` e `element.props` (incluindo `props.children`),
 * entao basta produzir objetos nesse formato.
 */
export type SatoriNode = {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
};

type Child = SatoriNode | string | number | null | undefined | false;

export function h(
  type: string,
  props: Record<string, unknown> = {},
  ...children: Child[]
): SatoriNode {
  const flat = children
    .flat(Infinity as 1)
    .filter((child): child is SatoriNode | string | number => {
      return child !== null && child !== undefined && child !== false && child !== "";
    });

  let resolvedChildren: unknown;
  if (flat.length === 0) {
    resolvedChildren = props.children ?? undefined;
  } else if (flat.length === 1) {
    resolvedChildren = flat[0];
  } else {
    resolvedChildren = flat;
  }

  return { type, props: { ...props, children: resolvedChildren } };
}
