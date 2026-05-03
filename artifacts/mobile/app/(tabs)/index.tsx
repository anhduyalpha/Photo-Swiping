import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryCard } from "@/components/CategoryCard";
import { ScanProgress } from "@/components/ScanProgress";
import { usePhotoCleaner } from "@/context/PhotoCleanerContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, progress, scanResult, startScan } = usePhotoCleaner();

  const isScanning = status === "scanning";
  const isDone = status === "done";
  const isIdle = status === "idle" || status === "no_permission";
  const isUnsupported = status === "unsupported";

  function handleScan() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startScan();
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 16,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[colors.primary + "22", "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.4 }}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            CleanSnap
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            AI-powered photo cleaner
          </Text>
        </View>
        {isDone && (
          <Pressable onPress={handleScan} style={styles.rescanBtn}>
            <Feather name="refresh-cw" size={18} color={colors.primary} />
          </Pressable>
        )}
      </View>

      {isUnsupported && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="cellphone" size={32} color={colors.mutedForeground} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Native Device Required
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            Scan your photos on a real iOS or Android device using the Expo Go app.
          </Text>
        </View>
      )}

      {(isIdle || status === "requesting_permission") && !isUnsupported && (
        <Pressable
          style={[styles.scanCta, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleScan}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary + "CC"]}
            style={styles.scanIcon}
          >
            <Ionicons name="scan-outline" size={32} color="#fff" />
          </LinearGradient>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Scan Your Library
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            AI will detect duplicates, blurry photos, and screenshots so you can clean fast.
          </Text>
          <View style={[styles.scanBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.scanBtnText}>
              {status === "requesting_permission" ? "Requesting Access..." : "Start Scan"}
            </Text>
          </View>
        </Pressable>
      )}

      {isScanning && (
        <ScanProgress scanned={progress.scanned} total={progress.total} />
      )}

      {isDone && scanResult && (
        <>
          <View style={[styles.summaryCard, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
            <Text style={[styles.summaryTitle, { color: colors.primary }]}>
              Scan Complete
            </Text>
            <Text style={[styles.summaryBig, { color: colors.foreground }]}>
              {scanResult.estimatedSavingsMB.toFixed(1)} MB
            </Text>
            <Text style={[styles.summarySub, { color: colors.mutedForeground }]}>
              could be freed from {scanResult.totalPhotos.toLocaleString()} photos
            </Text>
          </View>

          <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
            FOUND ISSUES
          </Text>

          <View style={styles.categories}>
            <CategoryCard
              icon={<Ionicons name="copy-outline" size={24} color="#FF9F0A" />}
              label="Duplicate Groups"
              count={scanResult.clusters.length}
              savingsMB={scanResult.clusters.reduce((s, c) => s + c.estimatedSavingsMB, 0)}
              color="#FF9F0A"
              onPress={() => router.push("/(tabs)/clean" as any)}
            />
            <CategoryCard
              icon={<Ionicons name="eye-off-outline" size={24} color="#FF453A" />}
              label="Blurry Photos"
              count={scanResult.blurryPhotos.length}
              savingsMB={scanResult.blurryPhotos.reduce((s, p) => s + (p.fileSize ?? 2_000_000) / (1024 * 1024), 0)}
              color="#FF453A"
              onPress={() => router.push("/(tabs)/clean" as any)}
            />
            <CategoryCard
              icon={<Ionicons name="phone-portrait-outline" size={24} color="#32D74B" />}
              label="Screenshots"
              count={scanResult.screenshots.length}
              savingsMB={scanResult.screenshots.reduce((s, p) => s + (p.fileSize ?? 1_000_000) / (1024 * 1024), 0)}
              color="#32D74B"
              onPress={() => router.push("/(tabs)/clean" as any)}
            />
          </View>

          <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
            ACTIONS
          </Text>

          <Pressable
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/swipe" as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + "22" }]}>
              <MaterialCommunityIcons name="gesture-swipe" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                Manual Swipe Mode
              </Text>
              <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>
                Review photos one by one — swipe to keep or delete
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  rescanBtn: {
    padding: 10,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  cardSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  scanCta: {
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    alignItems: "center",
  },
  scanIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginTop: 4,
  },
  scanBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryBig: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
  },
  summarySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: -8,
  },
  categories: {
    gap: 10,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
    gap: 3,
  },
  actionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  actionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
