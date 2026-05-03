import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

interface CategoryCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  savingsMB?: number;
  color: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function CategoryCard({
  icon,
  label,
  count,
  savingsMB,
  color,
  onPress,
  style,
}: CategoryCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          animStyle,
          style,
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + "22" }]}>
          {icon}
        </View>
        <View style={styles.content}>
          <Text style={[styles.count, { color: colors.foreground }]}>
            {count}
          </Text>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            {label}
          </Text>
          {savingsMB != null && savingsMB > 0 && (
            <Text style={[styles.savings, { color: color }]}>
              ~{savingsMB < 1 ? `${Math.round(savingsMB * 1024)} KB` : `${savingsMB.toFixed(1)} MB`} saveable
            </Text>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  count: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  savings: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
});
