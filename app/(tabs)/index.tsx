import React, { useState } from "react";
import { View, Text, Button, Alert, StyleSheet } from "react-native";
import { getPrediction } from "../../services/api";

export default function HomeScreen() {
  const [prediction, setPrediction] = useState(null);

  const sendSampleData = async () => {
    const features = {
      "age": 55,
      "sex": 0,
      "test_time": 100,
      "Jitter(%)": 0.007,
      "Jitter:PPQ5": 0.004,
      "Shimmer(dB)": 0.25,
      "Shimmer:APQ5": 0.02,
      "NHR": 0.02,
      "HNR": 21,
      "RPDE": 0.45,
      "DFA": 0.55,
      "PPE": 0.1
    };

    try {
      const result = await getPrediction(features);

      if (result.prediction !== undefined) {
        setPrediction(result.prediction);
      } else {
        Alert.alert("Error", "Server returned no prediction");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get prediction. Check console.");
      console.error("Prediction Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parkinson Prediction App</Text>

      <Button title="Send Sample Data" onPress={sendSampleData} />

      {prediction !== null && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Predicted Severity:</Text>
          <Text style={styles.resultValue}>{prediction}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 25,
  },
  resultBox: {
    marginTop: 30,
    padding: 20,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  resultValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#2c7",
  },
});

