import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";
import { Platform, KeyboardAvoidingView } from "react-native";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validateFields = (): boolean => {
    const newErrors: typeof errors = {};
    let valid = true;

    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateFields()) return;

    setLoading(true);
    setErrors({});

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/(tabs)/Home");
    } catch (error: any) {
      setErrors({ general: "Login failed: please check your email and password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.box}>
          <Text style={styles.title}>Login to Your Account</Text>

          <TextInput
            placeholder="Email"
            style={[styles.input, errors.email ? styles.inputError : null]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            placeholder="Password"
            style={[styles.input, errors.password ? styles.inputError : null]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {errors.general && <Text style={[styles.errorText, { textAlign: "center" }]}>{errors.general}</Text>}

          <TouchableOpacity style={styles.btn} onPress={handleLogin}>
            <Text style={styles.btnText}>{loading ? "Logging in..." : "Login"}</Text>
          </TouchableOpacity>

          <Text style={styles.switchText}>
            Don't have an account?
            <Text style={styles.link} onPress={() => router.push("/screens/SignupScreen")}>
              {" "}Sign Up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e6e8fc",
    paddingVertical: 30,
  },
  box: {
    width: width * 0.9,
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    color: "#1c33d8",
  },
  input: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 5,
    fontSize: 16,
  },
  inputError: { borderColor: "#f00" },
  errorText: { color: "#f00", fontSize: 12, marginBottom: 10 },
  btn: {
    width: "100%",
    backgroundColor: "#1c33d8",
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  btnText: { textAlign: "center", color: "#fff", fontSize: 18, fontWeight: "bold" },
  switchText: { marginTop: 18, textAlign: "center", fontSize: 15 },
  link: { color: "#1c33d8", fontWeight: "bold" },
});
