import React, { useState } from "react";
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { getPrediction, PredictionResult } from "../../services/api";

export default function HomeScreen() {
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const sendSampleData = async () => {
    setLoading(true);
    setPredictions(null);

    const features = {
      age: 59,
      sex: 0,
      test_time: 12.66,
      "Jitter(%)": 0.007,
      "Jitter:PPQ5": 0.004,
      "Shimmer(dB)": 0.25,
      "Shimmer:APQ5": 0.02,
      NHR: 0.02,
      HNR: 21,
      RPDE: 0.45,
      DFA: 0.55,
      PPE: 0.1
    };

    try {
      const result = await getPrediction(features);
      setPredictions(result);
    } catch (error) {
      Alert.alert("Connection Error", "Could not reach the server. Ensure the Node gateway is running.");
      console.error("Prediction Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parkinson's Disease Severity</Text>
      <Text style={styles.description}>
        Click below to run a prediction analysis on sample speech pattern data.
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c7" />
          <Text style={styles.loadingText}>ML Model Analyzing Features...</Text>
        </View>
      ) : (
        <Button title="Run Severity Analysis" onPress={sendSampleData} color="#2c7" />
      )}

      {predictions && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Predicted Motor UPDRS</Text>
          <Text style={styles.resultValue}>{predictions.motor_UPDRS.toFixed(3)}</Text>

          <View style={styles.divider} />

          <Text style={styles.resultLabel}>Predicted Total UPDRS</Text>
          <Text style={styles.resultValue}>{predictions.total_UPDRS.toFixed(3)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", color: "#333", marginBottom: 8 },
  description: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 32 },
  loadingContainer: { alignItems: "center", marginVertical: 20 },
  loadingText: { marginTop: 10, color: "#666" },
  resultBox: {
    marginTop: 40,
    padding: 24,
    borderRadius: 15,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  resultLabel: { fontSize: 14, color: "#777", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" },
  resultValue: { fontSize: 32, fontWeight: "bold", textAlign: "center", color: "#2c7", marginVertical: 10 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 15 },
});
