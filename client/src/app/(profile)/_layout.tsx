import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f8fafc" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="edit-photos" />
      <Stack.Screen name="edit-info" />
      <Stack.Screen name="edit-location" 
      options={{
        presentation: "modal",
        animation: "slide_from_bottom",
      }}/>
      <Stack.Screen name="edit-interests" />
      <Stack.Screen name="verification" />
      <Stack.Screen 
        name="edit-about"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
} 