import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePhotoCleaner } from "@/context/PhotoCleanerContext";

const PRIMARY = "#7C3AED";
const SUCCESS = "#34D399";
const WARNING = "#FBBF24";
const DANGER = "#F87171";

function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  return {
    bg: dark ? "#0C0C0E" : "#F2F2F7",
    card: dark ? "#1C1C1E" : "#FFFFFF",
    border: dark ? "#2C2C2E" : "#E5E5EA",
    text: dark ? "#FFFFFF" : "#000000",
    subtext: dark ? "#8E8E93" : "#6B6B6B",
    dark,
  };
}

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, progress, scanResult, startScan } = usePhotoCleaner();

  const isScanning = status === "scanning" || status === "requesting_permission";
  const isDone = status === "done";
  const isIdle = status === "idle" || status === "no_permission" || status === "unsupported";

  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const bottomPad = Platform.OS === "web" ? 90 : insets.bottom + 80;

  const scanPct =
    progress.total > 0 ? Math.round((progress.scanned / progress.total) * 100) : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.logoBox, { backgroundColor: PRIMARY + "22" }]}>
          <Ionicons name="sparkles" size={24} color={PRIMARY} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.appName, { color: theme.text }]}>CleanSnap</Text>
          <Text style={[styles.appSub, { color: theme.subtext }]}>AI-powered photo cleaner</Text>
        </View>
        {isDone && (
          <Pressable onPress={startScan} style={[styles.rescanBtn, { borderColor: theme.border }]}>
            <Ionicons name="refresh" size={18} color={PRIMARY} />
          </Pressable>
        )}
      </View>

      {/* IDLE - Big Scan CTA */}
      {isIdle && (
        <View style={[styles.ctaCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.ctaIconWrap, { backgroundColor: PRIMARY + "18" }]}>
            <Ionicons name="scan" size={48} color={PRIMARY} />
          </View>
          <Text style={[styles.ctaTitle, { color: theme.text }]}>
            Ready to clean your library?
          </Text>
          <Text style={[styles.ctaSub, { color: theme.subtext }]}>
            CleanSnap will scan your photos and find duplicates, blurry images, and screenshots you
            can safely delete.
          </Text>

          <View style={styles.featureRow}>
            {[
              { icon: "copy-outline", label: "Duplicates", color: WARNING },
              { icon: "eye-off-outline", label: "Blurry", color: DANGER },
              { icon: "phone-portrait-outline", label: "Screenshots", color: SUCCESS },
            ].map((f) => (
              <View key={f.label} style={[styles.featureChip, { backgroundColor: f.color + "18" }]}>
                <Ionicons name={f.icon as any} size={16} color={f.color} />
                <Text style={[styles.featureLabel, { color: f.color }]}>{f.label}</Text>
              </View>
            ))}
          </View>

          {status === "no_permission" && (
            <View style={[styles.permBanner, { backgroundColor: DANGER + "18", borderColor: DANGER + "44" }]}>
              <Ionicons name="warning-outline" size={16} color={DANGER} />
              <Text style={[styles.permText, { color: DANGER }]}>
                Photo access denied. Please enable in Settings.
              </Text>
            </View>
          )}

          <Pressable style={[styles.scanBtn, { backgroundColor: PRIMARY }]} onPress={startScan}>
            <Ionicons name="search" size={20} color="#FFF" />
            <Text style={styles.scanBtnText}>Start Scan</Text>
          </Pressable>
        </View>
      )}

      {/* SCANNING */}
      {isScanning && (
        <View style={[styles.scanningCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={[styles.scanningTitle, { color: theme.text }]}>
            {status === "requesting_permission" ? "Requesting permission…" : "Scanning photos…"}
          </Text>
          {progress.total > 0 && (
            <>
              <Text style={[styles.scanningCount, { color: theme.subtext }]}>
                {progress.scanned.toLocaleString()} of {progress.total.toLocaleString()} photos
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { backgroundColor: PRIMARY, width: `${scanPct}%` }]} />
              </View>
              <Text style={[styles.scanPct, { color: PRIMARY }]}>{scanPct}%</Text>
            </>
          )}
        </View>
      )}

      {/* DONE - Results */}
      {isDone && scanResult && (
        <>
          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: PRIMARY + "18", borderColor: PRIMARY + "33" }]}>
            <Text style={[styles.summaryLabel, { color: PRIMARY }]}>SCAN COMPLETE</Text>
            <Text style={[styles.summaryBig, { color: theme.text }]}>
              {scanResult.estimatedSavingsMB.toFixed(1)} MB
            </Text>
            <Text style={[styles.summarySub, { color: theme.subtext }]}>
              can be freed · {scanResult.totalPhotos.toLocaleString()} photos scanned
            </Text>
          </View>

          {/* Category cards */}
          <Text style={[styles.sectionLabel, { color: theme.subtext }]}>WHAT WAS FOUND</Text>

          <Pressable
            style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/(tabs)/clean" as any)}
          >
            <View style={[styles.resultIcon, { backgroundColor: WARNING + "22" }]}>
              <Ionicons name="copy-outline" size={22} color={WARNING} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: theme.text }]}>Duplicate Groups</Text>
              <Text style={[styles.resultSub, { color: theme.subtext }]}>
                {scanResult.clusters.reduce((s, c) => s + c.estimatedSavingsMB, 0).toFixed(1)} MB saveable
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: WARNING + "22" }]}>
              <Text style={[styles.countText, { color: WARNING }]}>{scanResult.clusters.length}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
          </Pressable>

          <Pressable
            style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/(tabs)/clean" as any)}
          >
            <View style={[styles.resultIcon, { backgroundColor: DANGER + "22" }]}>
              <Ionicons name="eye-off-outline" size={22} color={DANGER} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: theme.text }]}>Blurry Photos</Text>
              <Text style={[styles.resultSub, { color: theme.subtext }]}>
                {scanResult.blurryPhotos.reduce((s, p) => s + (p.fileSize ?? 2_000_000) / (1024 * 1024), 0).toFixed(1)} MB saveable
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: DANGER + "22" }]}>
              <Text style={[styles.countText, { color: DANGER }]}>{scanResult.blurryPhotos.length}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
          </Pressable>

          <Pressable
            style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/(tabs)/clean" as any)}
          >
            <View style={[styles.resultIcon, { backgroundColor: SUCCESS + "22" }]}>
              <Ionicons name="phone-portrait-outline" size={22} color={SUCCESS} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: theme.text }]}>Screenshots</Text>
              <Text style={[styles.resultSub, { color: theme.subtext }]}>
                {scanResult.screenshots.reduce((s, p) => s + (p.fileSize ?? 1_000_000) / (1024 * 1024), 0).toFixed(1)} MB saveable
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: SUCCESS + "22" }]}>
              <Text style={[styles.countText, { color: SUCCESS }]}>{scanResult.screenshots.length}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
          </Pressable>

          {/* Swipe Mode */}
          <Text style={[styles.sectionLabel, { color: theme.subtext }]}>MANUAL REVIEW</Text>
          <Pressable
            style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/(tabs)/swipe" as any)}
          >
            <View style={[styles.resultIcon, { backgroundColor: PRIMARY + "22" }]}>
              <Ionicons name="swap-horizontal" size={22} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: theme.text }]}>Swipe to Keep / Delete</Text>
              <Text style={[styles.resultSub, { color: theme.subtext }]}>
                Review all {scanResult.totalPhotos.toLocaleString()} photos one by one
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  appSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  rescanBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 14,
  },
  ctaIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  ctaSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  featureRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  featureLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  permBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "stretch",
  },
  permText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 36,
    borderRadius: 16,
    alignSelf: "stretch",
    justifyContent: "center",
    marginTop: 4,
  },
  scanBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  scanningCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  scanningTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  scanningCount: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    alignSelf: "stretch",
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  scanPct: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 4,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  summaryBig: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    lineHeight: 56,
  },
  summarySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 4,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  resultSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  countBadge: {
    minWidth: 32,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
});
