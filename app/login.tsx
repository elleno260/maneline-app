// import { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   Pressable,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import { router } from "expo-router";
// import { loginUser, registerUser } from "../services/authService";

// export default function LoginScreen() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   async function handleLogin() {
//     if (!email || !password) {
//       Alert.alert("Missing info", "Please enter your email and password.");
//       return;
//     }

//     try {
//       setIsSubmitting(true);
//       await loginUser(email.trim(), password);
//       router.replace("/(tabs)");
//     } catch (error: any) {
//       Alert.alert("Login Error", error.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   async function handleRegister() {
//     if (!email || !password) {
//       Alert.alert("Missing info", "Please enter your email and password.");
//       return;
//     }

//     try {
//       setIsSubmitting(true);
//       await registerUser(email.trim(), password);
//       router.replace("/(tabs)");
//       router.replace("/hair-profile-setup");
//     } catch (error: any) {
//       Alert.alert("Signup Error", error.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to ManeLine</Text>
//       <Text style={styles.subtitle}>Log in or create an account to continue.</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         placeholderTextColor="#8A7A70"
//         value={email}
//         onChangeText={setEmail}
//         autoCapitalize="none"
//         keyboardType="email-address"
//       />

//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         placeholderTextColor="#8A7A70"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />

//       <Pressable
//         style={styles.button}
//         onPress={handleLogin}
//         disabled={isSubmitting}
//       >
//         {isSubmitting ? (
//           <ActivityIndicator color="#FFFFFF" />
//         ) : (
//           <Text style={styles.buttonText}>Log In</Text>
//         )}
//       </Pressable>

//       <Pressable
//         style={styles.secondaryButton}
//         onPress={handleRegister}
//         disabled={isSubmitting}
//       >
//         <Text style={styles.secondaryButtonText}>Create Account</Text>
//       </Pressable>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 24,
//     justifyContent: "center",
//     backgroundColor: "#FFF8F1",
//   },
//   title: {
//     fontSize: 30,
//     fontWeight: "700",
//     marginBottom: 8,
//     color: "#2F1B12",
//   },
//   subtitle: {
//     fontSize: 16,
//     marginBottom: 28,
//     color: "#6B4E3D",
//   },
//   input: {
//     backgroundColor: "#FFFFFF",
//     borderWidth: 1,
//     borderColor: "#E2D2C3",
//     borderRadius: 14,
//     padding: 14,
//     marginBottom: 14,
//     fontSize: 16,
//   },
//   button: {
//     backgroundColor: "#2F1B12",
//     padding: 15,
//     borderRadius: 14,
//     alignItems: "center",
//     marginTop: 8,
//   },
//   buttonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   secondaryButton: {
//     padding: 15,
//     borderRadius: 14,
//     alignItems: "center",
//     marginTop: 10,
//   },
//   secondaryButtonText: {
//     color: "#2F1B12",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });
import { Redirect } from 'expo-router';

export default function LoginScreen() {
  return <Redirect href={'/(tabs)' as never} />;
}