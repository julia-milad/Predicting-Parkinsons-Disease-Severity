import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Link } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { getPrediction, PredictionResult } from "@/api";
import { serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/firebase";
import { collection, addDoc, query, where, getDocs, limit } from "firebase/firestore";

interface FeatureValues {
  patientId: string;
  age: string;
  sex: string;
  test_time: string;
  "Jitter(%)": string;
  "Jitter:PPQ5": string;
  "Shimmer(dB)": string;
  "Shimmer:APQ5": string;
  NHR: string;
  HNR: string;
  RPDE: string;
  DFA: string;
  PPE: string;
  [key: string]: string;
}

const FEATURE_MAPPING: { [key in keyof FeatureValues]?: string } = {
  patientId: "Patient ID",
  age: "Age",
  sex: "Sex (0 = Female, 1 = Male)",
  test_time: "Test Time (Sec)",
  "Jitter(%)": "Pitch Wobbliness (Jitter)",
  "Jitter:PPQ5": "Refined Pitch Wobbliness (Jitter:PPQ5)",
  "Shimmer(dB)": "Loudness Unsteadiness (Shimmer)",
  "Shimmer:APQ5": "Refined Loudness Unsteadiness (Shimmer:APQ5)",
  NHR: "Noisiness Score (NHR)",
  HNR: "Clarity Score (HNR)",
  RPDE: "Signal Randomness (RPDE)",
  DFA: "Pitch Pattern Consistency (DFA)",
  PPE: "Pitch Period Disorder (PPE)",
};

const featureKeys: (keyof FeatureValues)[] = [
  "age",
  "sex",
  "test_time",
  "Jitter(%)",
  "Jitter:PPQ5",
  "Shimmer(dB)",
  "Shimmer:APQ5",
  "NHR",
  "HNR",
  "RPDE",
  "DFA",
  "PPE",
];

const initialFeatureValues: FeatureValues = {
  patientId: "",
  age: "",
  sex: "",
  test_time: "",
  "Jitter(%)": "",
  "Jitter:PPQ5": "",
  "Shimmer(dB)": "",
  "Shimmer:APQ5": "",
  NHR: "",
  HNR: "",
  RPDE: "",
  DFA: "",
  PPE: "",
};

const FEATURE_CONSTRAINTS: { [key in keyof FeatureValues]?: { min?: number; max?: number } } = {
  age: { min: 41, max: 82 },
  sex: { min: 0, max: 1 },
  test_time: { min: 0, max: 6 },
  "Jitter(%)": { min: 0.001, max: 0.03 },
  "Jitter:PPQ5": { min: 0.001, max: 0.02 },
  "Shimmer(dB)": { min: 0.01, max: 0.7 },
  "Shimmer:APQ5": { min: 0.01, max: 0.5 },
  NHR: { min: 0.0, max: 0.2 },
  HNR: { min: 10, max: 35 },
  RPDE: { min: 0.2, max: 0.8 },
  DFA: { min: 0.5, max: 1.0 },
  PPE: { min: 0.1, max: 0.6 },
};

export default function Home() {
  const colorScheme = useColorScheme();
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [featureValues, setFeatureValues] = useState<FeatureValues>(initialFeatureValues);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const fetchTimeout = useRef<number | null>(null);

  // --- Fetch patient data only if it belongs to the current doctor ---
  const fetchPatientData = async (id: string) => {
    if (!id || !auth.currentUser) return;

    try {
      const q = query(
        collection(db, "predictions"),
        where("patientId", "==", id),
        where("userId", "==", auth.currentUser.uid), // filter by current doctor
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setFeatureValues((prev) => ({
          ...prev,
          age: docData.age?.toString() ?? "",
          sex: docData.sex?.toString() ?? "",
        }));
      } else {
        setFeatureValues((prev) => ({ ...prev, age: "", sex: "" }));
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
    }
  };

  const handleInputChange = (key: keyof FeatureValues, value: string) => {
    setFeatureValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));

    if (key === "patientId") {
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
      fetchTimeout.current = setTimeout(() => {
        fetchPatientData(value.trim());
      }, 500) as unknown as number;
    }
  };

  const sendPredictionData = async () => {
    setLoading(true);
    setPredictions(null);

    const features: { [key: string]: number } = {};
    let hasError = false;
    const newErrors: { [key: string]: string } = {};

    if (!featureValues.patientId.trim()) {
      newErrors.patientId = "Patient ID is required";
      hasError = true;
    }

    for (const key of featureKeys) {
      const value = featureValues[key];
      const parsedValue = parseFloat(value);
      const friendlyName = FEATURE_MAPPING[key] || key;
      const constraints = FEATURE_CONSTRAINTS[key];

      if (!value) {
        newErrors[key] = `${friendlyName} is required`;
        hasError = true;
        continue;
      }

      if (isNaN(parsedValue)) {
        newErrors[key] = `${friendlyName} must be a number`;
        hasError = true;
        continue;
      }

      if (constraints) {
        if (constraints.min !== undefined && parsedValue < constraints.min) {
          newErrors[key] = `${friendlyName} must be ≥ ${constraints.min}`;
          hasError = true;
          continue;
        }
        if (constraints.max !== undefined && parsedValue > constraints.max) {
          newErrors[key] = `${friendlyName} must be ≤ ${constraints.max}`;
          hasError = true;
          continue;
        }
      }

      features[key] = parsedValue;
    }

    setFieldErrors(newErrors);
    if (hasError) {
      setLoading(false);
      return;
    }

    try {
      const result = await getPrediction(features);
      setPredictions(result);

      await addDoc(collection(db, "predictions"), {
        patientId: featureValues.patientId,
        ...features,
        motor_UPDRS: result.motor_UPDRS,
        total_UPDRS: result.total_UPDRS,
        userId: auth.currentUser?.uid || null, // store doctor UID
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      setFieldErrors({ general: "Could not save to Firestore or reach the server." });
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
      >
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>
              Parkinson Analyzer
            </Text>
            <Link href="/screens/HowToUse" asChild>
              <Pressable style={styles.infoButton}>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={22}
                    color={Colors[colorScheme ?? "light"].primary}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          </View>

          <Text style={styles.description}>
            Enter voice feature scores from the lab report to analyze severity. Tap the top icon for details.
          </Text>

          {fieldErrors.general ? <Text style={styles.errorText}>{fieldErrors.general}</Text> : null}

          <View style={styles.card}>
            {/* Patient ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Patient ID</Text>
              <TextInput
                style={[styles.input, fieldErrors.patientId ? styles.inputErrorBorder : null]}
                value={featureValues.patientId ?? ""}
                onChangeText={(text) => handleInputChange("patientId", text)}
                placeholder="Enter patient ID"
                placeholderTextColor="#999"
              />
              {fieldErrors.patientId ? <Text style={styles.errorText}>{fieldErrors.patientId}</Text> : null}
            </View>

            {/* Feature Inputs */}
            <View style={styles.inputGrid}>
              {featureKeys.map((key) => (
                <View key={key} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{FEATURE_MAPPING[key] || key}</Text>
                  <TextInput
                    style={[styles.input, fieldErrors[key] ? styles.inputErrorBorder : null]}
                    value={featureValues[key] ?? ""}
                    onChangeText={(text) => handleInputChange(key, text)}
                    keyboardType="numeric"
                    placeholder={
                      FEATURE_CONSTRAINTS[key]
                        ? `${FEATURE_CONSTRAINTS[key]?.min} - ${FEATURE_CONSTRAINTS[key]?.max}`
                        : "0.00"
                    }
                    placeholderTextColor="#999"
                  />
                  {fieldErrors[key] ? <Text style={styles.errorText}>{fieldErrors[key]}</Text> : null}
                </View>
              ))}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].primary} />
                <Text style={styles.loadingText}>Analyzing...</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.mainButton, pressed && { opacity: 0.8 }]}
                onPress={sendPredictionData}
              >
                <Text style={styles.buttonText}>Run Severity Analysis</Text>
              </Pressable>
            )}
          </View>

          {/* Prediction Results */}
          {predictions ? (
            <View style={styles.resultBox}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Motor UPDRS</Text>
                <Text style={styles.resultValue}>
                  {predictions.motor_UPDRS !== undefined ? predictions.motor_UPDRS.toFixed(3) : "-"}
                </Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Total UPDRS</Text>
                <Text style={styles.resultValue}>
                  {predictions.total_UPDRS !== undefined ? predictions.total_UPDRS.toFixed(3) : "-"}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Styles (unchanged) ---
const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 20, paddingTop: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  description: { fontSize: 15, color: "#6b7280", marginBottom: 24, lineHeight: 20 },
  infoButton: { padding: 8, borderRadius: 20, backgroundColor: "#fff", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 20, elevation: 4, shadowColor: "#1c33d8", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20 },
  inputGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  inputGroup: { width: "47%", marginBottom: 18 },
  inputLabel: { fontSize: 11, color: "#4b5563", marginBottom: 6, fontWeight: "700", textTransform: "uppercase" },
  input: { height: 48, borderColor: "#e5e7eb", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, backgroundColor: "#f9fafb", fontSize: 15, color: "#111827", fontWeight: "500" },
  inputErrorBorder: { borderColor: "#ef4444" },
  errorText: { color: "#ef4444", fontSize: 10, marginTop: 4 },
  mainButton: { backgroundColor: "#1c33d8", height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loadingContainer: { alignItems: "center", marginVertical: 10 },
  loadingText: { marginTop: 8, color: "#1c33d8", fontWeight: "600" },
  resultBox: { marginTop: 24, padding: 24, borderRadius: 24, backgroundColor: "#1c33d8", flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  resultItem: { alignItems: "center" },
  resultLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "600", marginBottom: 4 },
  resultValue: { fontSize: 24, fontWeight: "800", color: "#fff" },
  dividerVertical: { width: 1, height: "60%", backgroundColor: "rgba(255,255,255,0.2)" },
});