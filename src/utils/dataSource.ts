type IntelliPartsSource = 'drive' | 'server';

const normalizeSource = (value: string | undefined): IntelliPartsSource => {
  if (!value) return 'drive';
  const normalized = value.toLowerCase().trim();
  return normalized === 'server' ? 'server' : 'drive';
};

export const getIntelliPartsSource = (): IntelliPartsSource => {
  return normalizeSource(import.meta.env.VITE_INTELLIPARTS_SOURCE as string | undefined);
};

export const isDriveSource = (): boolean => getIntelliPartsSource() === 'drive';
export const isServerSource = (): boolean => getIntelliPartsSource() === 'server';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const ensureIntelliPartsSegment = (baseUrl: string): string => {
  const normalized = trimTrailingSlash(baseUrl);
  if (normalized.toLowerCase().endsWith('/intelliparts')) {
    return normalized;
  }
  return `${normalized}/IntelliParts`;
};

const getServerBaseUrl = (): string | null => {
  const prod = import.meta.env.PROD;
  const base = prod
    ? (import.meta.env.VITE_PROD_INTELLIPARTS_BASE_URL as string | undefined)
    : (import.meta.env.VITE_DEV_INTELLIPARTS_BASE_URL as string | undefined);
  const resolved = base || (import.meta.env.VITE_INTELLIPARTS_BASE_URL as string | undefined);
  if (!resolved) return null;
  return ensureIntelliPartsSegment(resolved);
};

export const getServerIntelliPartsRoot = (): string | null => {
  if (!isServerSource()) return null;
  return getServerBaseUrl();
};

const encodePathSegment = (segment: string): string => encodeURIComponent(segment.trim());

export const buildServerAssetPath = (relativePath: string, fileName?: string): string | null => {
  const root = getServerIntelliPartsRoot();
  if (!root) return null;

  const pathSegments = relativePath
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)
    .map(encodePathSegment);

  const parts = [root, ...pathSegments];
  if (fileName) {
    parts.push(
      fileName
        .split('/')
        .map(segment => segment.trim())
        .filter(Boolean)
        .map(encodePathSegment)
        .join('/')
    );
  }

  const combined = parts
    .map((segment, index) => {
      if (index === 0) return segment;
      return segment.startsWith('/') ? segment.slice(1) : segment;
    })
    .join('/');

  return combined;
};

export const buildServerFileUrl = (relativePath: string, fileName: string): string | null => {
  return buildServerAssetPath(relativePath, fileName);
};


