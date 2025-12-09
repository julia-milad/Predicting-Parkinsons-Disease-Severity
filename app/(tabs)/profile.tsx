import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, FlatList } from "react-native";
import { auth, db } from "@/services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";

interface PredictionRecord {
  id: string;
  createdAt?: any;
  [key: string]: any;
}

export default function Profile() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);

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
        fetchUserRecords(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserRecords = async (uid: string) => {
    setLoadingRecords(true);
    try {
      const q = query(
        collection(db, "predictions"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const userRecords: PredictionRecord[] = snapshot.docs.map(doc => ({
        id: doc.id,
        createdAt: doc.data().createdAt || null,
        ...doc.data(),
      }));
      setRecords(userRecords);
    } catch (error) {
      console.error("Error fetching records:", error);
      Alert.alert(
        "Error",
        "Could not load your prediction records. Make sure you have created the required Firestore index."
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <FontAwesome name="user" size={40} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Account Settings</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>CONNECTED EMAIL</Text>
        <View style={styles.emailRow}>
          <FontAwesome name="envelope-o" size={16} color="#6b7280" style={{ marginRight: 10 }} />
          <Text style={styles.value}>{userEmail || "Loading email..."}</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <FontAwesome name="shield" size={16} color="#4b5563" />
        <Text style={styles.infoText}>Your data is securely handled for analysis purposes.</Text>
      </View>

      <Text style={[styles.recordsTitle, { color: theme.text }]}>Your Prediction Records</Text>

      {loadingRecords ? (
        <Text style={{ textAlign: "center", marginVertical: 10 }}>Loading records...</Text>
      ) : records.length === 0 ? (
        <Text style={{ textAlign: "center", marginVertical: 10 }}>No records yet.</Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.recordCard}>
              <Text style={styles.recordDate}>
                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : "N/A"}
              </Text>
              <View style={styles.recordValues}>
                {Object.entries(item).map(([key, value]) => {
                  if (["userId", "createdAt", "id"].includes(key)) return null;
                  return (
                    <Text key={key} style={styles.recordText}>
                      {key}: {value}
                    </Text>
                  );
                })}
              </View>
            </View>
          )}
        />
      )}

      <Pressable 
        style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.8 }]} 
        onPress={logout}
      >
        <FontAwesome name="sign-out" size={18} color="#fff" style={{ marginRight: 10 }} />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#1c33d8',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#1c33d8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9ca3af",
    letterSpacing: 1,
    marginBottom: 8,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(28, 51, 216, 0.05)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#4b5563',
    marginLeft: 10,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#1c33d8',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  recordCard: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
  },
  recordDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  recordValues: {
    flexDirection: 'column',
  },
  recordText: {
    fontSize: 13,
    color: '#111827',
  },
});
