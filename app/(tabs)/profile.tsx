import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  onSnapshot,
} from "firebase/firestore";

interface PredictionRecord {
  id: string;
  patientId: string;
  createdAt?: any;
  [key: string]: any;
}

const FIELD_ORDER = [
  "age",
  "sex",
  "test_time",
  "Jitter(%)",
  "Jitter:PPQ5",
  "Shimmer(dB)",
  "Shimmer:APQ5",
  "Shimmer:DDA",
  "NHR",
  "HNR",
  "RPDE",
  "DFA",
  "PPE",
];

const FEATURE_MAPPING: { [key: string]: string } = {
  age: "Age",
  sex: "Sex (0 = Female, 1 = Male)",
  test_time: "Test Time (Sec)",
  "Jitter(%)": "Pitch Wobbliness (Jitter)",
  "Jitter:PPQ5": "Refined Pitch Wobbliness (Jitter:PPQ5)",
  "Shimmer(dB)": "Loudness Unsteadiness (Shimmer)",
  "Shimmer:APQ5": "Refined Loudness Unsteadiness (Shimmer:APQ5)",
  "Shimmer:DDA": "Loudness Instability (Shimmer:DDA)",
  NHR: "Noisiness Score (NHR)",
  HNR: "Clarity Score (HNR)",
  RPDE: "Signal Randomness (RPDE)",
  DFA: "Pitch Pattern Consistency (DFA)",
  PPE: "Pitch Period Disorder (PPE)",
};

export default function Profile() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [userLastName, setUserLastName] = useState<string | null>(null);

  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [patientIds, setPatientIds] = useState<string[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    let unsubscribeRecords: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/screens/LoginScreen");
      } else {
        // Listen to user doc in real-time
        const userDocRef = doc(db, "Users", user.uid);
        unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserEmail(data.email || user.email);
            setUserFirstName(data.firstName || "");
            setUserLastName(data.lastName || "");
          } else {
            setUserEmail(user.email);
            setUserFirstName("");
            setUserLastName("");
          }
        });

        // Listen to patient records in real-time
        unsubscribeRecords = subscribePatientRecords(user.uid);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser?.();
      unsubscribeRecords?.();
    };
  }, []);

  const subscribePatientRecords = (uid: string) => {
    setLoadingRecords(true);
    const q = query(
      collection(db, "predictions"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allRecords: PredictionRecord[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          createdAt: doc.data().createdAt || null,
          ...doc.data(),
        }));

        allRecords.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return tB - tA;
        });

        setRecords(allRecords);

        const uniqueIds = Array.from(new Set(allRecords.map((r) => r.patientId)));
        setPatientIds(uniqueIds);

        // Always select the newest patient
        if (uniqueIds.length > 0) setSelectedPatient(uniqueIds[0]);
        else setSelectedPatient(null);

        setLoadingRecords(false);
      },
      (error) => {
        Alert.alert(
          "Error",
          "Could not load prediction records. Check Firestore indexes."
        );
        setLoadingRecords(false);
      }
    );

    return unsubscribe;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Success", "You have been logged out.");
      router.replace("/screens/LoginScreen");
    } catch (error: any) {
      Alert.alert("Logout Error", error.message);
    }
  };

  const filteredRecords = selectedPatient
    ? records.filter((r) => r.patientId === selectedPatient)
    : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <FontAwesome name="user-md" size={42} color={theme.primary} />
        </View>
        <Text style={[styles.doctorName, { color: theme.text }]}>
          Dr. {userFirstName} {userLastName}
        </Text>
        <Text style={styles.subtitle}>Medical Analysis Dashboard</Text>
      </View>

      {/* Email */}
      <View style={styles.card}>
        <Text style={styles.label}>CONNECTED EMAIL</Text>
        <View style={styles.emailRow}>
          <FontAwesome
            name="envelope-o"
            size={16}
            color="#6b7280"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.value}>{userEmail || "Loading email..."}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <FontAwesome name="shield" size={16} color="#4b5563" />
        <Text style={styles.infoText}>
          Patient data is securely stored and used only for clinical analysis.
        </Text>
      </View>

      {/* Patient Selector */}
      <Text style={[styles.recordsTitle, { color: theme.text }]}>
        Select Patient
      </Text>

      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setDropdownVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>
          {selectedPatient || "Select Patient"}
        </Text>
        <FontAwesome name="chevron-down" size={16} color="#374151" />
      </TouchableOpacity>

      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalContent}>
            <ScrollView>
              {patientIds.map((id) => (
                <TouchableOpacity
                  key={id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedPatient(id);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{id}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Records */}
      {loadingRecords ? (
        <Text style={{ textAlign: "center", marginVertical: 10 }}>
          Loading records...
        </Text>
      ) : filteredRecords.length === 0 ? (
        <Text style={{ textAlign: "center", marginVertical: 10 }}>
          No records for this patient.
        </Text>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.recordCard}>
              <Text style={styles.recordDate}>
                {item.createdAt?.toDate
                  ? item.createdAt.toDate().toLocaleString()
                  : "N/A"}
              </Text>

              {FIELD_ORDER.map((key) => {
                if (!(key in item)) return null;
                return (
                  <View key={key} style={styles.recordRow}>
                    <Text style={styles.recordKey}>
                      {FEATURE_MAPPING[key] || key}
                    </Text>
                    <Text style={styles.recordValue}>{item[key]}</Text>
                  </View>
                );
              })}
            </View>
          )}
        />
      )}

      {/* Logout */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && { opacity: 0.8 },
        ]}
        onPress={logout}
      >
        <FontAwesome
          name="sign-out"
          size={18}
          color="#fff"
          style={{ marginRight: 10 }}
        />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { alignItems: "center", marginBottom: 20 },
  avatarCircle: {
    width: 85,
    height: 85,
    borderRadius: 45,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 5,
  },
  doctorName: { fontSize: 24, fontWeight: "800", marginTop: 6 },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1c33d8",
    letterSpacing: 1,
    marginBottom: 8,
  },
  emailRow: { flexDirection: "row", alignItems: "center" },
  value: { fontSize: 17, fontWeight: "600", color: "#111827" },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(28, 51, 216, 0.05)",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  infoText: { fontSize: 13, color: "#4b5563", marginLeft: 10, flex: 1 },
  recordsTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  dropdownButtonText: { fontSize: 16, color: "#111827" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    maxHeight: "50%",
  },
  modalItem: {
    padding: 16,
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
  },
  modalItemText: { fontSize: 16, color: "#111827" },
  recordCard: {
    backgroundColor: "rgba(28, 51, 216, 0.05)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  recordDate: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  recordKey: { fontSize: 13, fontWeight: "600", color: "#374151" },
  recordValue: { fontSize: 13, color: "#111827" },
  logoutButton: {
    backgroundColor: "#1c33d8",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});