import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useColorScheme } from "react-native";

const PRIMARY = "#7C3AED";
const DARK_BG = "#0C0C0E";
const DARK_BORDER = "#1C1C1E";
const LIGHT_BG = "#F2F2F7";
const LIGHT_BORDER = "#E5E5EA";

export default function TabLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const bg = isDark ? DARK_BG : LIGHT_BG;
  const border = isDark ? DARK_BORDER : LIGHT_BORDER;
  const inactive = isDark ? "#636366" : "#8E8E93";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clean"
        options={{
          title: "Clean",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="swipe"
        options={{
          title: "Swipe",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
