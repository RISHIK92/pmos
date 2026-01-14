import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, Text, View, Alert } from "react-native";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Ionicons } from "@expo/vector-icons";

const WEB_CLIENT_ID =
  "259162332596-1n34g91i5e7qte51e7kcdote5k9f2va5.apps.googleusercontent.com";

export default function GoogleLogin({
  onLoginSuccess,
}: {
  onLoginSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      scopes: ["email", "profile"],
    });
  }, []);

  const onGoogleButtonPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();

      // 1. Sign In via Android System
      const response = await GoogleSignin.signIn();

      // 2. Handle v13+ data structure
      const idToken = response.idToken;
      if (!idToken) throw new Error("No ID Token found");

      // 3. Authenticate with Firebase
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);

      if (onLoginSuccess) onLoginSuccess();
    } catch (error: any) {
      if (error) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          console.log("User cancelled");
        } else {
          // If this happens, it's definitely a SHA-1 issue
          Alert.alert("Native Login Error", error.message);
        }
      } else {
        Alert.alert("Firebase Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onGoogleButtonPress}
        disabled={loading}
      >
        <Ionicons
          name="logo-google"
          size={18}
          color="#2D3436"
          style={styles.icon}
        />
        <Text style={styles.text}>
          {loading ? "Signing in..." : "Continue with Google"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  icon: { marginRight: 4 },
  text: { fontSize: 14, fontWeight: "600", color: "#2D3436" },
});
