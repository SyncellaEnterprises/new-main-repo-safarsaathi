import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  ImageBackground,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { Link, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import IMAGES from "@/src/constants/images";

// Fix for TypeScript error with StatusBar.currentHeight
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleRegister = async () => {
    try {
      setIsSubmitting(true);

      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        toast.show("Please fill in all fields", "error");
        return;
      }

      if (!validateEmail(formData.email)) {
        toast.show("Please enter a valid email", "error");
        return;
      }

      if (formData.password.length < 6) {
        toast.show("Password must be at least 6 characters", "error");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.show("Passwords do not match", "error");
        return;
      }

      const success = await signUp(formData.name.trim(), formData.email.trim(), formData.password);

      if (success) {
        toast.show("Registration successful!", "success");
        router.replace("/onboarding/age");
      } else {
        toast.show("Registration failed. Please try again.", "error");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = "Registration failed. Please try again.";

      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = "Email already exists.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.show(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || authLoading;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ImageBackground 
        source={IMAGES.patternBg}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(78,205,196,0.3)', 'rgba(69,183,209,0.95)']}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardAvoid}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Logo */}
              <Animated.View 
                entering={FadeInDown.duration(800).springify()}
                style={styles.logoContainer}
              >
                <ImageBackground
                  source={IMAGES.safarsaathi}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </Animated.View>
              
              <Animated.View 
                entering={FadeInDown.duration(800).delay(200).springify()}
                style={styles.formCard}
              >
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>
                    Create Your Account
                  </Text>
                  <Text style={styles.formSubtitle}>
                    Join the community of travel enthusiasts
                  </Text>
                </View>

                <View style={styles.inputsContainer}>
                  {/* Name Input */}
                  <Animated.View 
                    entering={FadeInUp.delay(300)}
                    style={styles.inputWrapper}
                  >
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View style={styles.inputContainer}>
                      <View style={styles.iconContainer}>
                        <Ionicons name="person-outline" size={20} color="#4ECDC4" />
                      </View>
                      <TextInput
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        style={styles.textInput}
                        placeholder="Your full name"
                        placeholderTextColor="#9CA3AF"
                        editable={!isLoading}
                      />
                    </View>
                  </Animated.View>

                  {/* Email Input */}
                  <Animated.View 
                    entering={FadeInUp.delay(400)}
                    style={styles.inputWrapper}
                  >
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={styles.inputContainer}>
                      <View style={styles.iconContainer}>
                        <Ionicons name="mail-outline" size={20} color="#4ECDC4" />
                      </View>
                      <TextInput
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        style={styles.textInput}
                        placeholder="your@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#9CA3AF"
                        editable={!isLoading}
                      />
                    </View>
                  </Animated.View>

                  {/* Password Input */}
                  <Animated.View 
                    entering={FadeInUp.delay(500)}
                    style={styles.inputWrapper}
                  >
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputContainer}>
                      <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#4ECDC4" />
                      </View>
                      <TextInput
                        value={formData.password}
                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                        style={styles.textInput}
                        secureTextEntry={!showPassword}
                        placeholder="Min. 6 characters"
                        placeholderTextColor="#9CA3AF"
                        editable={!isLoading}
                      />
                      <TouchableOpacity 
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                        disabled={isLoading}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#4ECDC4"
                        />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>

                  {/* Confirm Password Input */}
                  <Animated.View 
                    entering={FadeInUp.delay(600)}
                    style={styles.inputWrapper}
                  >
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.inputContainer}>
                      <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#4ECDC4" />
                      </View>
                      <TextInput
                        value={formData.confirmPassword}
                        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                        style={styles.textInput}
                        secureTextEntry={!showConfirmPassword}
                        placeholder="Re-enter password"
                        placeholderTextColor="#9CA3AF"
                        editable={!isLoading}
                      />
                      <TouchableOpacity 
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                        disabled={isLoading}
                      >
                        <Ionicons 
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#4ECDC4"
                        />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </View>

                {/* Register Button */}
                <Animated.View 
                  entering={FadeInUp.delay(700)}
                  style={styles.buttonContainer}
                >
                  <TouchableOpacity
                    onPress={handleRegister}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#4ECDC4', '#45B7D1']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientButton}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.buttonText}>Create Account</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Sign In Link */}
                <Animated.View 
                  entering={FadeInUp.delay(800)}
                  style={styles.signInContainer}
                >
                  <Text style={styles.signInText}>Already have an account? </Text>
                  <Link href="/auth/login" asChild>
                    <TouchableOpacity>
                      <Text style={styles.signInLink}>Sign In</Text>
                    </TouchableOpacity>
                  </Link>
                </Animated.View>
              </Animated.View>

              {/* Back Button */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back-circle" size={24} color="white" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#45B7D1',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: statusBarHeight + 16,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 150,
    height: 60,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'montserratBold',
    color: '#334155',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#64748B',
    textAlign: 'center',
  },
  inputsContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'montserratMedium',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 52,
  },
  iconContainer: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: '#334155',
    fontFamily: 'montserrat',
    fontSize: 15,
  },
  eyeIcon: {
    padding: 8,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  gradientButton: {
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'montserratBold',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#64748B',
  },
  signInLink: {
    fontSize: 14,
    fontFamily: 'montserratBold',
    color: '#45B7D1',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  backButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'montserratMedium',
  },
});
