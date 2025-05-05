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
import IMAGES from "../../constants/images";

// Fix for TypeScript error with StatusBar.currentHeight
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage("");
  
      if (!formData.email || !formData.password) {
        setErrorMessage("Please fill in all fields");
        return;
      }
  
      if (!validateEmail(formData.email)) {
        setErrorMessage("Please enter a valid email");
        return;
      }
  
      if (formData.password.length < 6) {
        setErrorMessage("Password must be at least 6 characters");
        return;
      }
  
      console.log('Attempting login with:', {
        email: formData.email.trim()
      });

      const success = await signIn(formData.email.trim(), formData.password);
  
      if (success) {
        toast.show("Login successful!", "success");
        router.replace("/(tabs)/home");
      } else {
        setErrorMessage("Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMsg = "Login failed. Please check your credentials.";
  
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = "Invalid email or password.";
        } else if (error.response.data?.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.request) {
        errorMsg = "Network error. Please check your internet connection.";
      }
  
      setErrorMessage(errorMsg);
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
                    Welcome Back!
                  </Text>
                  <Text style={styles.formSubtitle}>
                    Log in to continue your journey
                  </Text>
                </View>

                <View style={styles.inputsContainer}>
                  {/* Email Input */}
                  <Animated.View 
                    entering={FadeInUp.delay(300)}
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
                    entering={FadeInUp.delay(400)}
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
                        placeholder="Enter your password"
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
                  
                  {/* Forgot Password Link */}
                  <Animated.View 
                    entering={FadeInUp.delay(500)}
                    style={styles.forgotPasswordContainer}
                  >
                    <Link href="/auth/forgot-password" asChild>
                      <TouchableOpacity>
                        <Text style={styles.forgotPasswordText}>
                          Forgot Password?
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  </Animated.View>
                </View>

                {/* Error Message */}
                {errorMessage ? (
                  <Animated.View 
                    entering={FadeInUp.delay(550)}
                    style={styles.errorContainer}
                  >
                    <Text style={styles.errorText}>
                      {errorMessage}
                    </Text>
                  </Animated.View>
                ) : null}

                {/* Login Button */}
                <Animated.View 
                  entering={FadeInUp.delay(600)}
                  style={styles.buttonContainer}
                >
                  <TouchableOpacity
                    onPress={handleLogin}
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
                        <Text style={styles.buttonText}>Sign In</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Register Link */}
                <Animated.View 
                  entering={FadeInUp.delay(700)}
                  style={styles.registerContainer}
                >
                  <Text style={styles.registerText}>Don't have an account? </Text>
                  <Link href="/auth/register" asChild>
                    <TouchableOpacity>
                      <Text style={styles.registerLink}>Create Account</Text>
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
    marginBottom: 16,
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontFamily: 'montserratMedium',
    fontSize: 14,
    color: '#45B7D1',
  },
  errorContainer: {
    backgroundColor: 'rgba(254, 226, 226, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontFamily: 'montserratMedium',
    fontSize: 14,
    textAlign: 'center',
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#64748B',
  },
  registerLink: {
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