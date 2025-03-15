import { Stack } from "expo-router";

export default function HelpLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="profile-setup" 
        options={{
          title: "Profile Setup",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="finding-matches" 
        options={{
          title: "Finding Matches",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="safety-tips" 
        options={{
          title: "Safety Tips",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="data-usage" 
        options={{
        title: "Data Usage",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="account-security" 
        options={{
          title: "Account Security",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="privacy-settings" 
        options={{
          title: "Privacy Settings",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="account-issues" 
        options={{
          title: "Account Issues",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="payment-questions" 
        options={{
          title: "Payment Questions",
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="technical-problems" 
        options={{
          title: "Technical Problems",
          headerShown: false,
        }}
      />
    </Stack>
  );
} 