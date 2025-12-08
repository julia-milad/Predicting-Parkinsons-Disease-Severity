import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { getPrediction, PredictionResult } from "../../services/api";

// NEW TS: Define the required structure for the input state
interface FeatureValues {
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

// NEW MAPPING: Associates the technical key (for the API) with the user-friendly label (for the UI)
const FEATURE_MAPPING: { [key in keyof FeatureValues]?: string } = {
  age: "Age",
  sex: "Sex (0=Female, 1=Male)",
  test_time: "Test Time (Sec)",
  "Jitter(%)": "Pitch Wobbliness",
  "Jitter:PPQ5": "Refined Pitch Wobbliness",
  "Shimmer(dB)": "Loudness Unsteadiness",
  "Shimmer:APQ5": "Refined Loudness Unsteadiness",
  NHR: "Noisiness Score",
  HNR: "Clarity Score",
  RPDE: "Signal Randomness",
  DFA: "Pitch Pattern Consistency",
  PPE: "Pitch Period Disorder",
};

// Use the technical keys for internal logic (state and API call)
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
  age: "59",
  sex: "0",
  test_time: "12.66",
  "Jitter(%)": "0.007",
  "Jitter:PPQ5": "0.004",
  "Shimmer(dB)": "0.25",
  "Shimmer:APQ5": "0.02",
  NHR: "0.02",
  HNR: "21",
  RPDE: "0.45",
  DFA: "0.55",
  PPE: "0.1",
};

type HomeScreenProps = {
    navigation: {
        navigate: (screen: string) => void;
    };
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [featureValues, setFeatureValues] = useState<FeatureValues>(initialFeatureValues);

  const handleInputChange = (key: keyof FeatureValues, value: string): void => {
    setFeatureValues((prevValues) => ({
      ...prevValues,
      [key]: value,
    }));
  };

  const sendPredictionData = async (): Promise<void> => {
    setLoading(true);
    setPredictions(null);

    // The features object MUST use the TECHNICAL names for the API
    const features: { [key: string]: number } = {};
    let allFieldsValid = true;

    for (const key of featureKeys) {
      const value = featureValues[key];
      const parsedValue = parseFloat(value);
      
      const friendlyName = FEATURE_MAPPING[key] || key; // Get user-friendly name for alert

      // Validation check
      if (!value || isNaN(parsedValue)) {
          Alert.alert("Input Error", `Please ensure all fields are filled with valid numbers. Missing or invalid value for: ${friendlyName}`);
          allFieldsValid = false;
          break;
      }
      features[key] = parsedValue;
    }

    if (!allFieldsValid) {
        setLoading(false);
        return;
    }
    
    try {
      const result = await getPrediction(features); // API call still uses technical keys
      setPredictions(result);
    } catch (error) {
      Alert.alert(
        "Connection Error",
        "Could not reach the server. Ensure the Node gateway is running."
      );
      console.error("Prediction Error:", error as Error); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Parkinson's Disease Severity</Text>
        <Text style={styles.description}>
          Enter 12 voice characteristic scores below to run a prediction analysis.
        </Text>

        <Button title="Home" onPress={() => navigation.navigate("Home")} />
        
        <View style={styles.inputGrid}>
          {featureKeys.map((key) => (
            <View key={key} style={styles.inputGroup}>
              {/* MODIFIED: Display the user-friendly name from the mapping */}
              <Text style={styles.inputLabel}>{FEATURE_MAPPING[key] || key}</Text> 
              <TextInput
                style={styles.input}
                onChangeText={(text) => handleInputChange(key, text)} 
                value={featureValues[key]}
                keyboardType="numeric"
                placeholder={`Enter score for ${FEATURE_MAPPING[key]}`}
                placeholderTextColor="#bbb"
              />
            </View>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c7" />
            <Text style={styles.loadingText}>ML Model Analyzing Features...</Text>
          </View>
        ) : (
          <Button
            title="Run Severity Analysis"
            onPress={sendPredictionData}
            color="#2c7"
          />
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
    </ScrollView>
  );
}

// ... (Styles remain the same)
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  container: { flex: 1, backgroundColor: "#fff", padding: 24 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", color: "#333", marginBottom: 8, marginTop: 20 },
  description: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 32 },
  inputGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  inputGroup: {
    width: "48%",
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    color: "#444",
    marginBottom: 4,
    fontWeight: "600",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#333",
  },
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
    shadowRadius: 4,
    marginBottom: 30,
  },
  resultLabel: { fontSize: 14, color: "#777", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" },
  resultValue: { fontSize: 32, fontWeight: "bold", textAlign: "center", color: "#2c7", marginVertical: 10 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 15 },
});