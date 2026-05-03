import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeCardProps {
  asset: MediaLibrary.Asset;
  onKeep: () => void;
  onDelete: () => void;
  isTop: boolean;
}

export function SwipeCard({ asset, onKeep, onDelete, isTop }: SwipeCardProps) {
  const colors = useColors();
  const position = useRef(new Animated.ValueXY()).current;
  const swipeDir = useRef<"left" | "right" | null>(null);

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const keepOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const deleteOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
  }, [asset.id]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        if (gesture.dx > 30 && swipeDir.current !== "right") {
          swipeDir.current = "right";
          if (Platform.OS !== "web") Haptics.selectionAsync();
        } else if (gesture.dx < -30 && swipeDir.current !== "left") {
          swipeDir.current = "left";
          if (Platform.OS !== "web") Haptics.selectionAsync();
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            onKeep();
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            onDelete();
          });
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
        swipeDir.current = null;
      },
    })
  ).current;

  if (!isTop) {
    return (
      <View style={[styles.card, styles.backCard, { backgroundColor: colors.card }]}>
        <Image source={{ uri: asset.uri }} style={styles.image} contentFit="cover" />
      </View>
    );
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
          ],
        },
      ]}
    >
      <Image source={{ uri: asset.uri }} style={styles.image} contentFit="cover" />

      <Animated.View style={[styles.label, styles.keepLabel, { opacity: keepOpacity }]}>
        <Text style={styles.keepText}>KEEP</Text>
      </Animated.View>

      <Animated.View style={[styles.label, styles.deleteLabel, { opacity: deleteOpacity }]}>
        <Text style={styles.deleteText}>DELETE</Text>
      </Animated.View>

      <View style={[styles.info, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <Text style={styles.infoText} numberOfLines={1}>
          {asset.filename}
        </Text>
        <Text style={styles.infoSub}>
          {asset.width}×{asset.height}
          {asset.fileSize
            ? ` • ${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB`
            : ""}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "center",
  },
  backCard: {
    transform: [{ scale: 0.95 }, { translateY: 16 }],
  },
  image: {
    width: "100%",
    height: "100%",
  },
  label: {
    position: "absolute",
    top: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  keepLabel: {
    right: 20,
    borderColor: "#32D74B",
    transform: [{ rotate: "15deg" }],
  },
  deleteLabel: {
    left: 20,
    borderColor: "#FF453A",
    transform: [{ rotate: "-15deg" }],
  },
  keepText: {
    color: "#32D74B",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  deleteText: {
    color: "#FF453A",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  info: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    gap: 2,
  },
  infoText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  infoSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
