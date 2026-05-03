import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface ScanProgressProps {
  scanned: number;
  total: number;
}

export function ScanProgress({ scanned, total }: ScanProgressProps) {
  const colors = useColors();
  const progress = useRef(new Animated.Value(0)).current;
  const pct = total > 0 ? Math.min(scanned / total, 1) : 0;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.foreground }]}>
        Scanning your library...
      </Text>
      <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
        <Animated.View style={[styles.bar, { backgroundColor: colors.primary, width: barWidth }]} />
      </View>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        {scanned.toLocaleString()} of {total > 0 ? total.toLocaleString() : "?"} photos analyzed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, borderRadius: 16, borderWidth: 1, gap: 10 },
  label: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  bar: { height: "100%", borderRadius: 3 },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
