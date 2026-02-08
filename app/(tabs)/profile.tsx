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
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";

interface PredictionRecord {
  id: string;
  patientId: string;
  createdAt?: any;
  [key: string]: any;
}

export default function Profile() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [patientIds, setPatientIds] = useState<string[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/screens/LoginScreen");
      } else {
        const userDocRef = doc(db, "Users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          setUserEmail(userSnap.data().email);
        } else {
          setUserEmail(user.email);
        }

        fetchAllPatients(user.uid);
      }
    });

    return unsubscribe;
  }, []);

  const fetchAllPatients = async (uid: string) => {
    setLoadingRecords(true);
    try {
      const q = query(
        collection(db, "predictions"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const allRecords: PredictionRecord[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        createdAt: doc.data().createdAt || null,
        ...doc.data(),
      }));

      setRecords(allRecords);

      // Get unique patient IDs
      const uniqueIds = Array.from(new Set(allRecords.map((r) => r.patientId)));
      setPatientIds(uniqueIds);

      if (uniqueIds.length > 0) setSelectedPatient(uniqueIds[0]);
    } catch (error) {
      console.error("Error fetching records:", error);
      Alert.alert(
        "Error",
        "Could not load your prediction records. Check Firestore indexes."
      );
    } finally {
      setLoadingRecords(false);
    }
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
          Dr. {userEmail?.split("@")[0] || "Doctor"}
        </Text>
        <Text style={styles.subtitle}>Medical Analysis Dashboard</Text>
      </View>

      {/* Email Card */}
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

      {/* Info Box */}
      <View style={styles.infoBox}>
        <FontAwesome name="shield" size={16} color="#4b5563" />
        <Text style={styles.infoText}>
          Patient data is securely stored and used only for clinical analysis.
        </Text>
      </View>

      {/* Dropdown */}
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
              {Object.entries(item).map(([key, value]) => {
                if (["userId", "createdAt", "id", "patientId"].includes(key))
                  return null;
                return (
                  <View key={key} style={styles.recordRow}>
                    <Text style={styles.recordKey}>{key}</Text>
                    <Text style={styles.recordValue}>{value}</Text>
                  </View>
                );
              })}
            </View>
          )}
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.8 }]}
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
    shadowColor: "#1c33d8",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  doctorName: { fontSize: 24, fontWeight: "800", marginTop: 6 },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#1c33d8",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  label: { fontSize: 11, fontWeight: "800", color: "#9ca3af", letterSpacing: 1, marginBottom: 8 },
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

  // Dropdown styles
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  dropdownButtonText: { fontSize: 16, color: "#111827" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", padding: 24 },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, maxHeight: "50%" },
  modalItem: { padding: 16, borderBottomColor: "#e5e7eb", borderBottomWidth: 1 },
  modalItemText: { fontSize: 16, color: "#111827" },

  recordCard: { backgroundColor: "#f3f4f6", padding: 12, borderRadius: 12, marginBottom: 10 },
  recordDate: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  recordRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
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