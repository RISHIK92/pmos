import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, Text, View, Alert } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../lib/firebase"; // Your Firebase config file
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
    });
  }, []);

  const onGoogleButtonPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Get the user's ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.idToken;
      if (!idToken) {
        throw new Error("No ID token found");
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(auth, googleCredential);

      console.log("User signed in:", userCredential.user.email);

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error(error);
      if (error.code !== "SIGN_IN_CANCELLED") {
        Alert.alert("Login Failed", error.message || "An error occurred");
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
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
  },
});
