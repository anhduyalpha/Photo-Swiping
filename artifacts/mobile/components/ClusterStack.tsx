import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { PhotoCluster } from "@/utils/photoAnalysis";

interface ClusterStackProps {
  cluster: PhotoCluster;
  onPress: () => void;
  onKeepBest: () => void;
}

export function ClusterStack({ cluster, onPress, onKeepBest }: ClusterStackProps) {
  const colors = useColors();
  const preview = cluster.photos.slice(0, 3);

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.stackArea}>
          {preview.map((photo, i) => (
            <View
              key={photo.id}
              style={[
                styles.stackCard,
                {
                  zIndex: preview.length - i,
                  transform: [
                    { rotate: `${(i - 1) * 5}deg` },
                    { translateX: (i - 1) * 8 },
                    { translateY: i * 2 },
                  ],
                  borderColor: photo.id === cluster.bestPhotoId ? colors.primary : colors.border,
                  borderWidth: photo.id === cluster.bestPhotoId ? 2 : 1,
                },
              ]}
            >
              <Image
                source={{ uri: photo.uri }}
                style={styles.photo}
                contentFit="cover"
              />
              {photo.id === cluster.bestPhotoId && (
                <View style={[styles.bestBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.bestText}>Best</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.info}>
          <Text style={[styles.groupLabel, { color: colors.foreground }]}>
            {cluster.photos.length} similar photos
          </Text>
          <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>
            {cluster.reason === "burst" ? "Burst" : "Duplicates"} •{" "}
            ~{cluster.estimatedSavingsMB.toFixed(1)} MB saveable
          </Text>

          <Pressable
            style={[styles.keepBtn, { backgroundColor: colors.primary }]}
            onPress={(e) => {
              e.stopPropagation?.();
              onKeepBest();
            }}
          >
            <Text style={styles.keepBtnText}>Keep Best, Delete Rest</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    alignItems: "center",
  },
  stackArea: {
    width: 90,
    height: 90,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  stackCard: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  bestBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  groupLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  subLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  keepBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  keepBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
