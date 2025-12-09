import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useRouter } from "expo-router";

export default function HowToUse() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const medicalFields = [
    { group: "Demographics", items: ["Age", "Sex"] },
    { group: "Timing", items: ["Test Time (Sec)"] },
    { group: "Pitch Stability (Jitter)", items: ["Pitch Wobbliness", "Refined Pitch Wobbliness"] },
    { group: "Loudness (Shimmer)", items: ["Loudness Unsteadiness", "Refined Loudness Unsteadiness"] },
    { group: "Signal Quality", items: ["Noisiness Score", "Clarity Score"] },
    { group: "Complexity", items: ["Signal Randomness", "Pitch Pattern Consistency", "Pitch Period Disorder"] },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <FontAwesome name="info-circle" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Instructions</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>STEP 1: INPUT DATA</Text>
        </View>
        <Text style={styles.sectionTitle}>Required Measurements</Text>
        <Text style={styles.text}>
          Ensure all 12 feature scores are entered correctly from your lab analysis report.
        </Text>

        <View style={styles.gridContainer}>
          {medicalFields.map((field, index) => (
            <View key={index} style={styles.fieldCategory}>
              <Text style={styles.categoryTitle}>{field.group}</Text>
              {field.items.map((item, i) => (
                <View key={i} style={styles.bulletItem}>
                  <FontAwesome name="check-circle" size={14} color={theme.primary} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>STEP 2: RUN AI</Text>
        </View>
        <Text style={styles.sectionTitle}>Run Analysis</Text>
        <Text style={styles.text}>
          After filling the form, press <Text style={styles.boldText}>Run Severity Analysis</Text>. The AI processes vocal dynamics to track symptom intensity.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>STEP 3: RESULTS</Text>
        </View>
        <Text style={styles.sectionTitle}>Understanding Scores</Text>
        <Text style={styles.text}>
          • <Text style={styles.boldText}>Motor UPDRS:</Text> Focuses on physical movement abilities.{"\n"}
          • <Text style={styles.boldText}>Total UPDRS:</Text> Combined clinical assessment score.
        </Text>
      </View>

      {/* Back Button */}
      <Pressable 
        style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.8 }]}
        onPress={() => router.back()}
      >
        <Text style={styles.closeButtonText}>Go to Analysis</Text>
      </Pressable>

      <Text style={styles.footer}>© Parkinson's Prediction</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { 
    padding: 20, 
    paddingTop: 40, 
    paddingBottom: 60 
  },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    elevation: 4, shadowColor: '#1c33d8', shadowOpacity: 0.1, shadowRadius: 10,
  },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20,
    elevation: 3, shadowColor: '#1c33d8', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05, shadowRadius: 15,
  },
  stepBadge: {
    backgroundColor: '#1c33d8', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12,
  },
  stepText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  text: { fontSize: 14, color: "#4b5563", lineHeight: 22 },
  boldText: { fontWeight: '700', color: '#1c33d8' },
  gridContainer: { 
    marginTop: 15, 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  fieldCategory: { width: '48%', marginBottom: 15 },
  categoryTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#1c33d8', 
    marginBottom: 5, 
    textTransform: 'uppercase' 
  },
  bulletItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  bulletText: { marginLeft: 8, fontSize: 12, color: '#374151', fontWeight: '500' },
  disclaimerCard: { 
    backgroundColor: '#fffbeb', 
    borderColor: '#fef3c7', 
    borderWidth: 1 
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  disclaimerTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginLeft: 8 },
  disclaimerText: { fontSize: 13, color: '#b45309', lineHeight: 18 },
  closeButton: {
    backgroundColor: '#1c33d8',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: { marginTop: 10, textAlign: "center", fontSize: 12, fontWeight: '600', color: "#9ca3af" },
});