export function getOptimizedUrl(url: string, width: number, height?: number): string {
  if (!url || !url.includes('/upload/')) return url;

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transformations = [
    `w_${width}`,
    height ? `h_${height}` : '',
    'c_fill',
    'q_auto',
    'f_auto',
  ]
    .filter(Boolean)
    .join(',');

  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
}
