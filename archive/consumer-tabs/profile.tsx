import { useState } from "react";
import {View,Text,StyleSheet,Button, ScrollView,Pressable,Switch,SafeAreaView,TextInput,Alert,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHairProfile } from "../../context/HairProfileContext";
import MyProfileContent from "../../components/profile/MyProfileContent";
import { router } from "expo-router";
import { logoutUser } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
type ProfileSection = "profile" | "routine" | "settings";

type RoutineStep = {
  id: string;
  step: string;
  product: string;
  status: "check" | "dash";
};

const initialRoutineSteps: RoutineStep[] = [
  {
    id: "1",
    step: "Cleanse",
    product: "SheaMoisture Retention Shampoo",
    status: "check",
  },
  {
    id: "2",
    step: "Deep Condition",
    product: "Mielle Honey Mask",
    status: "check",
  },
  {
    id: "3",
    step: "Leave-In Conditioner",
    product: "As I am Leave-In Detangler",
    status: "check",
  },
  {
    id: "4",
    step: "Seal",
    product: "Jamaican Castor Oil",
    status: "dash",
  },
  {
    id: "5",
    step: "Style",
    product: "Camille Rose Curl Cream",
    status: "check",
  },
];

export default function ProfileScreen() {
  const [activeSection, setActiveSection] = useState<ProfileSection>("profile");
  const { hairProfile } = useHairProfile();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const avatar = profile?.avatar;

  const [routineSteps, setRoutineSteps] =
    useState<RoutineStep[]>(initialRoutineSteps);

  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newStep, setNewStep] = useState("");
  const [newProduct, setNewProduct] = useState("");

  const handleAddProduct = () => {
    if (!newStep.trim() || !newProduct.trim()) {
      Alert.alert("Missing Info", "Please enter both a step and product name.");
      return;
    }

    setRoutineSteps((currentSteps) => [
      ...currentSteps,
      {
        id: String(currentSteps.length + 1),
        step: newStep.trim(),
        product: newProduct.trim(),
        status: "check",
      },
    ]);

    setNewStep("");
    setNewProduct("");
    setShowAddProductForm(false);

    Alert.alert("Product Added", "The product has been added to your routine.");
  };

  const handleSettingsPress = (label: string) => {
    Alert.alert(label, `${label} was clicked.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.avatarSection}>
  <View style={styles.avatarCircle}>
    <Text style={styles.avatarEmoji}>
      {avatar?.hairShape === "Curly" || avatar?.hairShape === "Coily"
        ? "🧑‍🦱"
        : avatar?.hairShape === "Bald"
        ? "👤"
        : "🧑"}
    </Text>
  </View>

  <Pressable
    style={styles.editAvatarButton}
    onPress={() => router.push("/edit-avatar")}
  >
    <Text style={styles.editAvatarButtonText}>Edit Avatar</Text>
  </Pressable>
</View>


          <View style={styles.profileInfo}>
            <Text style={styles.name}>Ellen Ojo</Text>

            <Text style={styles.hairSummary}>
              {hairProfile.hairType} | {hairProfile.porosity} Porosity |{" "}
              {hairProfile.density} Density
            </Text>

            <View style={styles.proBadge}>
              <Ionicons name="star" size={14} color="#BFD3F2" />
              <Text style={styles.proBadgeText}>ManeLine Pro</Text>
            </View>
          </View>
        </View>

        <View style={styles.topTabs}>
          <Pressable
            style={[
              styles.topTab,
              activeSection === "profile" && styles.activeTab,
            ]}
            onPress={() => setActiveSection("profile")}
          >
            <Text style={styles.topTabText}>My Profile</Text>
          </Pressable>

          <Pressable
            style={[
              styles.topTab,
              activeSection === "routine" && styles.activeTab,
            ]}
            onPress={() => setActiveSection("routine")}
          >
            <Text style={styles.topTabText}>Routine</Text>
          </Pressable>

          <Pressable
            style={[
              styles.topTab,
              activeSection === "settings" && styles.activeTab,
            ]}
            onPress={() => setActiveSection("settings")}
          >
            <Text style={styles.topTabText}>Settings</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeSection === "profile" && <MyProfileContent />}

          {activeSection === "routine" && (
            <RoutineContent
              routineSteps={routineSteps}
              showAddProductForm={showAddProductForm}
              setShowAddProductForm={setShowAddProductForm}
              newStep={newStep}
              setNewStep={setNewStep}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              handleAddProduct={handleAddProduct}
            />
          )}

          {activeSection === "settings" && (
            <SettingsContent
              notificationsEnabled={notificationsEnabled}
              setNotificationsEnabled={setNotificationsEnabled}
              handleSettingsPress={handleSettingsPress}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type RoutineContentProps = {
  routineSteps: RoutineStep[];
  showAddProductForm: boolean;
  setShowAddProductForm: (value: boolean) => void;
  newStep: string;
  setNewStep: (value: string) => void;
  newProduct: string;
  setNewProduct: (value: string) => void;
  handleAddProduct: () => void;
};

function RoutineContent({
  routineSteps,
  showAddProductForm,
  setShowAddProductForm,
  newStep,
  setNewStep,
  newProduct,
  setNewProduct,
  handleAddProduct,
}: RoutineContentProps) {
  return (
    <View>
      <View style={styles.routineHeaderRow}>
        <Text style={styles.routineTitle}>Wash Day Routine</Text>

        <Pressable onPress={() => setShowAddProductForm(true)}>
          <Text style={styles.newRoutine}>+ New Routine</Text>
        </Pressable>
      </View>

      <View style={styles.routineContent}>
        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>Compatibility Score</Text>
            <Text style={styles.scoreSubtext}>No Conflicts Detected</Text>
          </View>

          <Text style={styles.scoreNumber}>85</Text>
        </View>

        {routineSteps.map((item) => (
          <Pressable
            key={item.id}
            style={styles.stepCard}
            onPress={() => Alert.alert(item.step, item.product)}
          >
            <View style={styles.stepNumberCircle}>
              <Text style={styles.stepNumber}>{item.id}</Text>
            </View>

            <View style={styles.stepTextContainer}>
              <Text style={styles.stepName}>{item.step}</Text>
              <Text style={styles.productName}>{item.product}</Text>
            </View>

            {item.status === "check" ? (
              <Ionicons name="checkmark" size={24} color="#78A85C" />
            ) : (
              <Text style={styles.dashIcon}>—</Text>
            )}
          </Pressable>
        ))}

        {showAddProductForm && (
          <View style={styles.addProductForm}>
            <Text style={styles.formTitle}>Add Product</Text>

            <TextInput
              style={styles.formInput}
              placeholder="Step e.g. Moisturize"
              placeholderTextColor="#7A7A7A"
              value={newStep}
              onChangeText={setNewStep}
            />

            <TextInput
              style={styles.formInput}
              placeholder="Product name"
              placeholderTextColor="#7A7A7A"
              value={newProduct}
              onChangeText={setNewProduct}
            />

            <View style={styles.formButtonRow}>
              <Pressable
                style={styles.cancelProductButton}
                onPress={() => setShowAddProductForm(false)}
              >
                <Text style={styles.cancelProductText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.saveProductButton}
                onPress={handleAddProduct}
              >
                <Text style={styles.saveProductText}>Save Product</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Pressable
          style={styles.addProductButton}
          onPress={() => setShowAddProductForm(true)}
        >
          <Text style={styles.addProductText}>+ Add Product</Text>
        </Pressable>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Moisture Balance Check</Text>
          <Text style={styles.tipText}>
            Consider adding a light protein treatment every 4 weeks to maintain
            balance.
          </Text>
        </View>
      </View>
    </View>
  );
}

type SettingsContentProps = {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  handleSettingsPress: (label: string) => void;
};

function SettingsContent({
  notificationsEnabled,
  setNotificationsEnabled,
  handleSettingsPress,
}: SettingsContentProps) {
  return (
    <View style={styles.settingsContent}>
      <Text style={styles.settingsSectionTitle}>General</Text>

      <View style={styles.settingsCard}>
        <SettingsRow label="Edit Name" onPress={handleSettingsPress} />
        <SettingsRow label="Change Phone Number" onPress={handleSettingsPress} />
        <SettingsRow label="Change Email Address" onPress={handleSettingsPress} />
        <SettingsRow label="Change Password" onPress={handleSettingsPress} />

        <View style={styles.settingsRow}>
          <Text style={styles.settingsRowText}>Notification Preferences</Text>

          <View style={styles.switchWrapper}>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#B9B9B9", true: "#7AC45A" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <SettingsRow label="Multiple Profiles" onPress={handleSettingsPress} />
        <SettingsRow label="Offline Mode" onPress={handleSettingsPress} isLast />
      </View>

      <Text style={styles.settingsSectionTitle}>Support</Text>

      <View style={styles.settingsCard}>
        <SettingsRow label="Rate Our App" onPress={handleSettingsPress} />
        <SettingsRow label="Help & FAQs" onPress={handleSettingsPress} />
        <SettingsRow label="Terms and Conditions" onPress={handleSettingsPress} />
        <SettingsRow label="Privacy Policy" onPress={handleSettingsPress} />
        <SettingsRow label="About ManeLine" onPress={handleSettingsPress} isLast />
      </View>

      <Text style={styles.settingsSectionTitle}>Account Activation</Text>

      <View style={styles.settingsCard}>
        <SettingsRow label="Sign Out" danger onPress={handleSettingsPress} />

        <SettingsRow
          label="Delete Account"
          danger
          onPress={handleSettingsPress}
          isLast
        />
      </View>
    </View>
  );
}

type SettingsRowProps = {
  label: string;
  isLast?: boolean;
  danger?: boolean;
  onPress: (label: string) => void;
};

function SettingsRow({
  label,
  isLast = false,
  danger = false,
  onPress,
}: SettingsRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsRow,
        isLast && styles.lastSettingsRow,
        pressed && styles.pressedRow,
      ]}
      onPress={() => onPress(label)}
    >
      <Text style={[styles.settingsRowText, danger && styles.dangerText]}>
        {label}
      </Text>

      <Ionicons name="chevron-forward" size={18} color="#5E5E5E" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1D314F",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FDF9E4",
  },

  header: {
    height: 164,
    backgroundColor: "#1D314F",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 35,
    paddingTop: 18,
  },
  // profileImage: {
  //   width: 82,
  //   height: 82,
  //   borderRadius: 41,
  //   backgroundColor: "#D9D9D9",
  //   marginRight: 12,
  // },
  avatarSection: {
  alignItems: "center",
  marginBottom: 15,
  marginRight: 12
},

avatarCircle: {
  width: 82,
  height: 82,
  borderRadius: 41,
  backgroundColor: "#FFF8F1",
  alignItems: "center",
  //justifyContent: "center",
  borderWidth: 1,
  borderColor: "#E2D2C3",
  marginBottom: 12,
},

avatarEmoji: {
  fontSize: 50,
 // alignItems: "center",
 marginTop: 10,
 marginBottom: 10,
 marginLeft: 10,
 marginRight: 10,
},

editAvatarButton: {
  backgroundColor: "#2F1B12",
  borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  alignItems: "center",
},

editAvatarButtonText: {
  color: "#FFFFFF",
  fontSize: 9,
  fontWeight: "700",
},
  profileInfo: {
    flex: 1,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "serif",
    marginBottom: 4,
  },
  hairSummary: {
    color: "#BFD3F2",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  proBadge: {
    backgroundColor: "#4D668D",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
  },
  proBadgeText: {
    color: "#BFD3F2",
    fontSize: 12,
  },

  topTabs: {
    height: 39,
    backgroundColor: "#FFF8BD",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#B8AA73",
  },
  topTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#3B251A",
  },
  topTabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },

  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },

  routineHeaderRow: {
    height: 44,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routineTitle: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "900",
  },
  newRoutine: {
    fontSize: 14,
    color: "#1D314F",
    fontWeight: "800",
    marginRight: 31,
  },
  routineContent: {
    paddingHorizontal: 22,
  },
  scoreCard: {
    height: 63,
    backgroundColor: "#D6EDB8",
    borderRadius: 10,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#6D9447",
    marginBottom: 2,
  },
  scoreSubtext: {
    fontSize: 12,
    color: "#6D9447",
  },
  scoreNumber: {
    fontSize: 31,
    fontWeight: "500",
    color: "#7EAA54",
  },
  stepCard: {
    height: 62,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stepNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B251A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  stepNumber: {
    color: "#FFFFFF",
    fontSize: 21,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000000",
    marginBottom: 4,
  },
  productName: {
    fontSize: 13,
    color: "#000000",
  },
  dashIcon: {
    fontSize: 24,
    color: "#B8931F",
    paddingRight: 6,
  },
  addProductButton: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1D487",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  addProductText: {
    fontSize: 20,
    color: "#000000",
  },
  addProductForm: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
    color: "#000000",
  },
  formInput: {
    height: 42,
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#FDF9E4",
  },
  formButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelProductButton: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: "#1D314F",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelProductText: {
    color: "#1D314F",
    fontWeight: "800",
  },
  saveProductButton: {
    flex: 1,
    height: 38,
    backgroundColor: "#1D314F",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  saveProductText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  tipCard: {
    backgroundColor: "#FFF8BD",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 9,
    borderLeftWidth: 5,
    borderLeftColor: "#F3C85B",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#3B251A",
    marginBottom: 3,
  },
  tipText: {
    fontSize: 12,
    color: "#000000",
    lineHeight: 16,
  },

  settingsContent: {
    paddingHorizontal: 14,
    paddingTop: 20,
  },
  settingsSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#000000",
    marginLeft: 8,
    marginBottom: 8,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#B9B9B9",
    paddingBottom: 6,
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 10,
    marginBottom: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  settingsRow: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#B9B9B9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastSettingsRow: {
    borderBottomWidth: 0,
  },
  settingsRowText: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "600",
    flex: 1,
  },
  switchWrapper: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  pressedRow: {
    opacity: 0.6,
  },
  dangerText: {
    color: "#FF0000",
  },
});