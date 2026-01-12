import React, { useState } from "react";
import { Slot, Stack } from "expo-router";
import { Sidebar } from "@/components/ui/Sidebar";
import { View, StyleSheet } from "react-native";

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
            contentStyle: { backgroundColor: "#FFFFFF" },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="memory" />
          <Stack.Screen name="tasks" />
          <Stack.Screen name="health" />
          <Stack.Screen name="finance" />
          <Stack.Screen name="content" />
          <Stack.Screen name="restrictor" />
          <Stack.Screen name="config" />
          <Stack.Screen name="nutrition" />
          {/* Add other screens here if needed */}
        </Stack>
      </Sidebar>
    </SidebarContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
