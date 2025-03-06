import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="privacy" 
        options={{
          headerShown: false,
          title: "Privacy"
        }}
      />
      <Stack.Screen 
        name="app-permissions" 
        options={{
          headerShown: false,
          title: "App Permissions"
        }}
      />
    </Stack>
  );
} 