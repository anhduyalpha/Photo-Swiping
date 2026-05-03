import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePhotoCleaner } from "@/context/PhotoCleanerContext";
import { useColors } from "@/hooks/useColors";

export default function ClusterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scanResult, deletePhotos, dismissCluster } = usePhotoCleaner();
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(new Set());

  const cluster = scanResult?.clusters.find((c) => c.id === id);

  if (!cluster) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Cluster not found
        </Text>
      </View>
    );
  }

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const initialMarked = new Set(
    cluster.photos
      .filter((p) => p.id !== cluster.bestPhotoId)
      .map((p) => p.id)
  );

  function toggleMark(id: string) {
    Haptics.selectionAsync();
    setMarkedForDeletion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  React.useEffect(() => {
    setMarkedForDeletion(initialMarked);
  }, [cluster.id]);

  async function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const toDelete = cluster.photos.filter((p) => markedForDeletion.has(p.id));
    if (toDelete.length === 0) return;
    const ok = await deletePhotos(toDelete);
    if (ok) {
      dismissCluster(cluster.id);
      router.back();
    } else {
      Alert.alert("Could Not Delete", "Make sure you have full photo library access.");
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={cluster.photos}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 100 }]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {cluster.photos.length} Similar Photos
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Tap to select which to delete. Best quality is pre-selected to keep.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isBest = item.id === cluster.bestPhotoId;
          const isMarked = markedForDeletion.has(item.id);
          return (
            <Pressable style={styles.gridItem} onPress={() => toggleMark(item.id)}>
              <Image
                source={{ uri: item.uri }}
                style={[
                  styles.photo,
                  isMarked && styles.markedPhoto,
                ]}
                contentFit="cover"
              />
              {isBest && (
                <View style={[styles.bestTag, { backgroundColor: colors.primary }]}>
                  <Text style={styles.bestTagText}>Best</Text>
                </View>
              )}
              {isMarked && (
                <View style={styles.deleteOverlay}>
                  <Ionicons name="trash" size={28} color="#fff" />
                  <Text style={styles.deleteOverlayText}>Delete</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 16,
          },
        ]}
      >
        <Text style={[styles.footerInfo, { color: colors.mutedForeground }]}>
          {markedForDeletion.size} of {cluster.photos.length} marked for deletion
        </Text>
        <Pressable
          style={[
            styles.deleteBtn,
            {
              backgroundColor:
                markedForDeletion.size > 0 ? colors.destructive : colors.muted,
            },
          ]}
          onPress={handleDelete}
          disabled={markedForDeletion.size === 0}
        >
          <Ionicons
            name="trash"
            size={18}
            color={markedForDeletion.size > 0 ? "#fff" : colors.mutedForeground}
          />
          <Text
            style={[
              styles.deleteBtnText,
              {
                color:
                  markedForDeletion.size > 0 ? "#fff" : colors.mutedForeground,
              },
            ]}
          >
            Delete {markedForDeletion.size} Photos
          </Text>
        </Pressable>
      </View>
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
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  listHeader: {
    padding: 16,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  sub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  grid: {
    paddingHorizontal: 4,
  },
  gridItem: {
    flex: 0.5,
    margin: 4,
    borderRadius: 12,
    overflow: "hidden",
    aspectRatio: 1,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  markedPhoto: {
    opacity: 0.5,
  },
  bestTag: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestTagText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  deleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,69,58,0.5)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deleteOverlayText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 16,
    gap: 8,
  },
  footerInfo: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  deleteBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
