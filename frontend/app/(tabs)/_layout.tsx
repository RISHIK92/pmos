import React, { useState } from "react";
import { Stack } from "expo-router";
import { Sidebar } from "@/components/ui/Sidebar";
import { View, StyleSheet, AppState } from "react-native";
import { AlarmManager, AlarmLaunchDetails } from "@/utils/AlarmManager";

export const SidebarContext = React.createContext({
  toggleSidebar: () => {},
});

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ toggleSidebar }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="home" />
          <Stack.Screen name="memory" />
          <Stack.Screen name="tasks" />
          <Stack.Screen name="health" />
          <Stack.Screen name="finance" />
          <Stack.Screen name="content" />
          <Stack.Screen name="restrictor" />
          <Stack.Screen name="config" />
          <Stack.Screen name="nutrition" />
          <Stack.Screen name="dev" />
          <Stack.Screen name="journal" />
          {/* Add other screens here if needed */}
          <Stack.Screen
            name="auth-success"
            options={{ presentation: "modal" }}
          />
        </Stack>
      </Sidebar>
    </SidebarContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
