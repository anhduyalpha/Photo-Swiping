import * as Haptics from "expo-haptics";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SwipeCard } from "@/components/SwipeCard";
import { usePhotoCleaner } from "@/context/PhotoCleanerContext";
import { useColors } from "@/hooks/useColors";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function SwipeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { allPhotos, deletePhotos, status, startScan, deletedIds } = usePhotoCleaner();
  const [queue, setQueue] = useState<MediaLibrary.Asset[]>([]);
  const [kept, setKept] = useState(0);
  const [deleted, setDeleted] = useState(0);
  const [finished, setFinished] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (allPhotos.length > 0) {
      const filtered = allPhotos.filter((p) => !deletedIds.has(p.id));
      setQueue(filtered);
      setFinished(false);
      setKept(0);
      setDeleted(0);
    }
  }, [allPhotos]);

  function handleKeep() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQueue((prev) => prev.slice(1));
    setKept((k) => k + 1);
    if (queue.length <= 1) setFinished(true);
  }

  async function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toDelete = queue[0];
    setQueue((prev) => prev.slice(1));
    setDeleted((d) => d + 1);
    if (queue.length <= 1) setFinished(true);
    await deletePhotos([toDelete]);
  }

  if (status === "unsupported") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Ionicons name="phone-portrait-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Native Only</Text>
        <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
          Swipe mode requires a real device
        </Text>
      </View>
    );
  }

  if (status !== "done" || allPhotos.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Ionicons name="scan-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Scan Required</Text>
        <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
          Run a scan from Home first to load your photos
        </Text>
        <Pressable
          style={[styles.scanBtn, { backgroundColor: colors.primary }]}
          onPress={startScan}
        >
          <Text style={styles.scanBtnText}>Start Scan</Text>
        </Pressable>
      </View>
    );
  }

  if (finished || queue.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>All Done!</Text>
        <Text style={[styles.doneStats, { color: colors.mutedForeground }]}>
          Kept {kept} · Deleted {deleted}
        </Text>
        <Pressable
          style={[styles.restartBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            const filtered = allPhotos.filter((p) => !deletedIds.has(p.id));
            setQueue(filtered);
            setFinished(false);
            setKept(0);
            setDeleted(0);
          }}
        >
          <Feather name="refresh-cw" size={16} color={colors.primary} />
          <Text style={[styles.restartText, { color: colors.primary }]}>Review Again</Text>
        </Pressable>
      </View>
    );
  }

  const topTwo = queue.slice(0, 2);
  const progress = Math.round(
    ((allPhotos.length - queue.length) / allPhotos.length) * 100
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Swipe Mode</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {queue.length} remaining
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progress}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.cardArea}>
        {topTwo
          .slice()
          .reverse()
          .map((asset, i) => (
            <SwipeCard
              key={asset.id}
              asset={asset}
              isTop={i === topTwo.length - 1}
              onKeep={handleKeep}
              onDelete={handleDelete}
            />
          ))}
      </View>

      <View
        style={[
          styles.actions,
          { paddingBottom: bottomPad + 16 },
        ]}
      >
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.destructive + "22" }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={28} color={colors.destructive} />
        </Pressable>

        <View style={styles.hint}>
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            ← Delete · Keep →
          </Text>
        </View>

        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.success + "22" }]}
          onPress={handleKeep}
        >
          <Ionicons name="checkmark-outline" size={28} color={colors.success} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  cardArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingTop: 16,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    alignItems: "center",
  },
  hintText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  scanBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  scanBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  doneTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  doneStats: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  restartBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
  },
  restartText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
