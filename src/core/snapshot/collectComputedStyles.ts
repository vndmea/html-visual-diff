const STYLE_KEYS = [
  'display',
  'position',
  'width',
  'height',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'font-size',
  'font-weight',
  'font-family',
  'line-height',
  'color',
  'background-color',
  'text-align',
  'vertical-align',
  'white-space',
  'opacity',
  'visibility',
  'overflow',
  'transform'
] as const;

export function collectComputedStyles(el: Element): Record<string, string> {
  const computed = getComputedStyle(el);
  const styles: Record<string, string> = {};
  for (const key of STYLE_KEYS) styles[key] = computed.getPropertyValue(key);
  return styles;
}
