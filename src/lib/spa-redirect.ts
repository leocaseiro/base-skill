export const detectPrPreviewRedirect = (
  pathname: string,
  base: string,
): string | null => {
  if (base.includes('/pr/')) return null;
  const prefix = `${base}/pr/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  const match = rest.match(/^(\d+)\/app\//);
  if (!match) return null;
  return `${prefix}${match[1]}/app/`;
};
