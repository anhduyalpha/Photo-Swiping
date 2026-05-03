import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ClusterStack } from "@/components/ClusterStack";
import { usePhotoCleaner } from "@/context/PhotoCleanerContext";
import { useColors } from "@/hooks/useColors";

type Tab = "duplicates" | "blurry" | "screenshots";

export default function CleanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scanResult, deletePhotos, dismissCluster, dismissPhoto, status } = usePhotoCleaner();
  const [activeTab, setActiveTab] = useState<Tab>("duplicates");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!scanResult || status !== "done") {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background, paddingTop: topPad + 20 }]}>
        <Ionicons name="scan-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Scan Yet</Text>
        <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
          Go to Home and run a scan first
        </Text>
      </View>
    );
  }

  async function handleKeepBest(clusterId: string) {
    const cluster = scanResult!.clusters.find((c) => c.id === clusterId);
    if (!cluster) return;
    const toDelete = cluster.photos.filter((p) => p.id !== cluster.bestPhotoId);
    const ok = await deletePhotos(toDelete);
    if (ok) {
      dismissCluster(clusterId);
    } else {
      Alert.alert(
        "Could Not Delete",
        "Make sure you've granted full photo library access in Settings."
      );
    }
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const photos =
      activeTab === "blurry"
        ? scanResult!.blurryPhotos.filter((p) => selected.has(p.id))
        : scanResult!.screenshots.filter((p) => selected.has(p.id));

    const ok = await deletePhotos(photos);
    if (ok) {
      photos.forEach((p) => dismissPhoto(p.id));
      setSelected(new Set());
    } else {
      Alert.alert("Could Not Delete", "Make sure you've granted full photo library access.");
    }
  }

  function toggleSelect(id: string) {
    Haptics.selectionAsync();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "duplicates", label: "Duplicates", count: scanResult.clusters.length },
    { key: "blurry", label: "Blurry", count: scanResult.blurryPhotos.length },
    { key: "screenshots", label: "Screenshots", count: scanResult.screenshots.length },
  ];

  const currentPhotos =
    activeTab === "blurry" ? scanResult.blurryPhotos : scanResult.screenshots;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16, borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Review & Clean</Text>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                setActiveTab(tab.key);
                setSelected(new Set());
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab.key ? "#fff" : colors.mutedForeground },
                ]}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    {
                      backgroundColor:
                        activeTab === tab.key ? "rgba(255,255,255,0.3)" : colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      {
                        color:
                          activeTab === tab.key ? "#fff" : colors.mutedForeground,
                      },
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {activeTab === "duplicates" && (
        <FlatList
          data={scanResult.clusters}
          keyExtractor={(c) => c.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <ClusterStack
              cluster={item}
              onPress={() => router.push(`/cluster/${item.id}` as any)}
              onKeepBest={() => handleKeepBest(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyInline}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All clear!</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                No duplicate groups found
              </Text>
            </View>
          }
        />
      )}

      {(activeTab === "blurry" || activeTab === "screenshots") && (
        <>
          {selected.size > 0 && (
            <View style={[styles.selectionBar, { backgroundColor: colors.destructive }]}>
              <Text style={styles.selectionText}>{selected.size} selected</Text>
              <Pressable onPress={handleDeleteSelected} style={styles.deleteBtn}>
                <Feather name="trash-2" size={16} color="#fff" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>
            </View>
          )}
          <FlatList
            data={currentPhotos}
            keyExtractor={(p) => p.id}
            numColumns={3}
            contentContainerStyle={[
              styles.grid,
              { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 },
            ]}
            renderItem={({ item }) => {
              const isSelected = selected.has(item.id);
              return (
                <Pressable
                  onPress={() => toggleSelect(item.id)}
                  style={[
                    styles.gridItem,
                    isSelected && { opacity: 0.7 },
                  ]}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.gridPhoto}
                    contentFit="cover"
                  />
                  {isSelected && (
                    <View style={styles.checkOverlay}>
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyInline}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All clear!</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  No {activeTab === "blurry" ? "blurry" : "screenshot"} photos found
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 5,
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  list: {
    padding: 16,
  },
  grid: {
    padding: 4,
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  gridPhoto: {
    width: "100%",
    height: "100%",
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectionText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptyInline: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
