import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

interface ScanProgressProps {
  scanned: number;
  total: number;
}

export function ScanProgress({ scanned, total }: ScanProgressProps) {
  const colors = useColors();
  const progress = useSharedValue(0);
  const pct = total > 0 ? Math.min(scanned / total, 1) : 0;

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 300 });
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.foreground }]}>
        Scanning your library...
      </Text>
      <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
        <Animated.View
          style={[styles.bar, barStyle, { backgroundColor: colors.primary }]}
        />
      </View>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        {scanned.toLocaleString()} of {total > 0 ? total.toLocaleString() : "?"} photos analyzed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 3,
  },
  sub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
