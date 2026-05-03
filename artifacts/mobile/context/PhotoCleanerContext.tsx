import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import { analyzePhotos, PhotoCluster, ScanResult } from "@/utils/photoAnalysis";

const CACHE_KEY = "photo_cleaner_scan_cache_v2";
const DELETED_KEY = "photo_cleaner_deleted_ids";

interface CachedScan {
  result: ScanResult;
  timestamp: number;
  totalPhotos: number;
}

type ScanStatus =
  | "idle"
  | "requesting_permission"
  | "scanning"
  | "done"
  | "no_permission"
  | "unsupported";

interface PhotoCleanerContextType {
  status: ScanStatus;
  progress: { scanned: number; total: number };
  scanResult: ScanResult | null;
  deletedIds: Set<string>;
  startScan: () => Promise<void>;
  deletePhotos: (assets: MediaLibrary.Asset[]) => Promise<boolean>;
  dismissCluster: (clusterId: string) => void;
  dismissPhoto: (photoId: string) => void;
  undoDelete: () => void;
  allPhotos: MediaLibrary.Asset[];
}

const defaultResult: ScanResult = {
  clusters: [],
  blurryPhotos: [],
  screenshots: [],
  totalPhotos: 0,
  estimatedSavingsMB: 0,
};

const PhotoCleanerContext = createContext<PhotoCleanerContextType>({
  status: "idle",
  progress: { scanned: 0, total: 0 },
  scanResult: null,
  deletedIds: new Set(),
  startScan: async () => {},
  deletePhotos: async () => false,
  dismissCluster: () => {},
  dismissPhoto: () => {},
  undoDelete: () => {},
  allPhotos: [],
});

export function PhotoCleanerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [progress, setProgress] = useState({ scanned: 0, total: 0 });
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [allPhotos, setAllPhotos] = useState<MediaLibrary.Asset[]>([]);
  const lastDeletedRef = useRef<MediaLibrary.Asset[]>([]);

  useEffect(() => {
    if (Platform.OS === "web") {
      setStatus("unsupported");
      return;
    }
    loadCached();
    loadDeletedIds();
  }, []);

  async function loadDeletedIds() {
    try {
      const raw = await AsyncStorage.getItem(DELETED_KEY);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        setDeletedIds(new Set(ids));
      }
    } catch {
      // ignore
    }
  }

  async function loadCached() {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const cached: CachedScan = JSON.parse(raw);
      const age = Date.now() - cached.timestamp;
      if (age < 1000 * 60 * 60 * 2) {
        setScanResult(cached.result);
        setStatus("done");
      }
    } catch {
      // ignore
    }
  }

  const startScan = useCallback(async () => {
    if (Platform.OS === "web") {
      setStatus("unsupported");
      return;
    }

    setStatus("requesting_permission");
    const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();
    if (permStatus !== "granted") {
      setStatus("no_permission");
      return;
    }

    setStatus("scanning");
    setProgress({ scanned: 0, total: 0 });
    setScanResult(null);

    try {
      let allAssets: MediaLibrary.Asset[] = [];
      let after: string | undefined = undefined;
      let total = 0;

      do {
        const page = await MediaLibrary.getAssetsAsync({
          mediaType: [MediaLibrary.MediaType.photo],
          first: 200,
          after,
          sortBy: [MediaLibrary.SortBy.creationTime],
        });

        allAssets = [...allAssets, ...page.assets];
        after = page.hasNextPage ? page.endCursor : undefined;
        total = page.totalCount;
        setProgress({ scanned: allAssets.length, total });

        await new Promise((r) => setTimeout(r, 10));
      } while (after);

      setAllPhotos(allAssets);

      const result = analyzePhotos(allAssets);
      setScanResult(result);
      setStatus("done");

      const cached: CachedScan = {
        result,
        timestamp: Date.now(),
        totalPhotos: allAssets.length,
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (err) {
      setStatus("idle");
    }
  }, []);

  const deletePhotos = useCallback(
    async (assets: MediaLibrary.Asset[]): Promise<boolean> => {
      if (Platform.OS === "web") return false;
      try {
        lastDeletedRef.current = assets;
        await MediaLibrary.deleteAssetsAsync(assets);
        const ids = assets.map((a) => a.id);
        setDeletedIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.add(id));
          return next;
        });
        const raw = await AsyncStorage.getItem(DELETED_KEY);
        const existing: string[] = raw ? JSON.parse(raw) : [];
        await AsyncStorage.setItem(
          DELETED_KEY,
          JSON.stringify([...existing, ...ids])
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const dismissCluster = useCallback((clusterId: string) => {
    setScanResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        clusters: prev.clusters.filter((c) => c.id !== clusterId),
      };
    });
  }, []);

  const dismissPhoto = useCallback((photoId: string) => {
    setScanResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blurryPhotos: prev.blurryPhotos.filter((p) => p.id !== photoId),
        screenshots: prev.screenshots.filter((p) => p.id !== photoId),
      };
    });
  }, []);

  const undoDelete = useCallback(() => {
    const ids = lastDeletedRef.current.map((a) => a.id);
    setDeletedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    lastDeletedRef.current = [];
  }, []);

  return (
    <PhotoCleanerContext.Provider
      value={{
        status,
        progress,
        scanResult,
        deletedIds,
        startScan,
        deletePhotos,
        dismissCluster,
        dismissPhoto,
        undoDelete,
        allPhotos,
      }}
    >
      {children}
    </PhotoCleanerContext.Provider>
  );
}

export function usePhotoCleaner() {
  return useContext(PhotoCleanerContext);
}
