
export function $skip(options: { node: Element }) {
  const { node } = options;
  node.nodeValue = 'true';
}