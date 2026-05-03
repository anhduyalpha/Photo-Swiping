import * as MediaLibrary from "expo-media-library";

export interface PhotoCluster {
  id: string;
  photos: MediaLibrary.Asset[];
  bestPhotoId: string;
  reason: "burst" | "duplicate";
  estimatedSavingsMB: number;
}

export interface ScanResult {
  clusters: PhotoCluster[];
  blurryPhotos: MediaLibrary.Asset[];
  screenshots: MediaLibrary.Asset[];
  totalPhotos: number;
  estimatedSavingsMB: number;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function pickBestPhoto(photos: MediaLibrary.Asset[]): string {
  let best = photos[0];
  for (const p of photos) {
    const pSize = (p.fileSize ?? 0);
    const bestSize = (best.fileSize ?? 0);
    if (pSize > bestSize) {
      best = p;
    }
  }
  return best.id;
}

function estimateMB(photos: MediaLibrary.Asset[]): number {
  const totalBytes = photos.reduce((sum, p) => sum + (p.fileSize ?? 2_000_000), 0);
  return Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
}

export function detectBursts(assets: MediaLibrary.Asset[]): PhotoCluster[] {
  if (assets.length === 0) return [];

  const sorted = [...assets].sort((a, b) => a.creationTime - b.creationTime);
  const clusters: PhotoCluster[] = [];
  let currentGroup: MediaLibrary.Asset[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const asset = sorted[i];
    const last = currentGroup[currentGroup.length - 1];
    const timeDiff = asset.creationTime - last.creationTime;

    if (timeDiff < 3000) {
      currentGroup.push(asset);
    } else {
      if (currentGroup.length >= 2) {
        const bestId = pickBestPhoto(currentGroup);
        const toDelete = currentGroup.filter((p) => p.id !== bestId);
        clusters.push({
          id: generateId(),
          photos: currentGroup,
          bestPhotoId: bestId,
          reason: "burst",
          estimatedSavingsMB: estimateMB(toDelete),
        });
      }
      currentGroup = [asset];
    }
  }

  if (currentGroup.length >= 2) {
    const bestId = pickBestPhoto(currentGroup);
    const toDelete = currentGroup.filter((p) => p.id !== bestId);
    clusters.push({
      id: generateId(),
      photos: currentGroup,
      bestPhotoId: bestId,
      reason: "burst",
      estimatedSavingsMB: estimateMB(toDelete),
    });
  }

  return clusters;
}

const SCREENSHOT_ASPECT_RATIOS = [
  { w: 9, h: 19.5 },
  { w: 9, h: 20 },
  { w: 9, h: 21 },
  { w: 9, h: 16 },
  { w: 390, h: 844 },
  { w: 1080, h: 2340 },
  { w: 1080, h: 2400 },
  { w: 1170, h: 2532 },
  { w: 1284, h: 2778 },
  { w: 750, h: 1334 },
];

function isScreenshotAspectRatio(width: number, height: number): boolean {
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);
  const ratio = maxDim / minDim;
  return ratio >= 1.9 && ratio <= 2.3;
}

export function detectScreenshots(assets: MediaLibrary.Asset[]): MediaLibrary.Asset[] {
  return assets.filter((asset) => {
    const filename = asset.filename?.toLowerCase() ?? "";
    if (
      filename.startsWith("screenshot") ||
      filename.startsWith("screen_shot") ||
      filename.startsWith("screen-shot") ||
      filename.includes("_screenshot")
    ) {
      return true;
    }
    if (asset.width && asset.height) {
      return isScreenshotAspectRatio(asset.width, asset.height);
    }
    return false;
  });
}

export function detectBlurry(assets: MediaLibrary.Asset[]): MediaLibrary.Asset[] {
  return assets.filter((asset) => {
    if (!asset.fileSize || !asset.width || !asset.height) return false;

    const megapixels = (asset.width * asset.height) / 1_000_000;
    if (megapixels < 0.05) return true;

    const bytesPerPixel = asset.fileSize / (asset.width * asset.height);
    return bytesPerPixel < 0.04;
  });
}

export function analyzePhotos(assets: MediaLibrary.Asset[]): ScanResult {
  const videoFiltered = assets.filter(
    (a) => a.mediaType === MediaLibrary.MediaType.photo
  );

  const clusters = detectBursts(videoFiltered);
  const clusteredIds = new Set<string>();
  clusters.forEach((c) => c.photos.forEach((p) => clusteredIds.add(p.id)));

  const remaining = videoFiltered.filter((a) => !clusteredIds.has(a.id));
  const screenshots = detectScreenshots(remaining);
  const screenshotIds = new Set(screenshots.map((s) => s.id));

  const nonScreenshots = remaining.filter((a) => !screenshotIds.has(a.id));
  const blurryPhotos = detectBlurry(nonScreenshots);

  const totalSavings =
    clusters.reduce((sum, c) => sum + c.estimatedSavingsMB, 0) +
    estimateMB(screenshots) +
    estimateMB(blurryPhotos);

  return {
    clusters,
    blurryPhotos,
    screenshots,
    totalPhotos: videoFiltered.length,
    estimatedSavingsMB: Math.round(totalSavings * 10) / 10,
  };
}
