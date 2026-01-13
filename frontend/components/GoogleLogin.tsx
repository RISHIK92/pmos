import React, { useEffect } from "react";
import { StyleSheet, TouchableOpacity, Text, View, Alert } from "react-native";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

// Required for web browser to close properly
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID =
  "259162332596-1n34g91i5e7qte51e7kcdote5k9f2va5.apps.googleusercontent.com";

const ANDROID_CLIENT_ID =
  "259162332596-j0ar6u1aetfvtfpe06mqqp1u0vev937q.apps.googleusercontent.com";

interface GoogleLoginProps {
  onLoginSuccess?: () => void;
}

export default function GoogleLogin({ onLoginSuccess }: GoogleLoginProps) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    // We use the same client ID for now, as we only have the Web Client ID from google-services.json.
    // Ideally, you should generate native iOS/Android Client IDs in Google Cloud Console for better native CX.
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    redirectUri: "com.rishik.pmos:/oauth2redirect",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;

      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((result) => {
          console.log("User signed in:", result.user.email);
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        })
        .catch((error) => {
          // Handle specific error codes if needed
          console.error(error);
          Alert.alert("Sign In Error", error.message);
        });
    } else if (response?.type === "error") {
      Alert.alert(
        "Sign In Error",
        response.error?.message || "Something went wrong"
      );
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Ionicons name="logo-google" size={18} color="#FFF" />
        <Text style={styles.buttonText}>Continue with Google</Text>
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
    justifyContent: "center",
    backgroundColor: "#4285F4", // Google Blue
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
