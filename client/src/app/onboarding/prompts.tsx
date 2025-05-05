import * as React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
  TextInput
} from "react-native";
import { useRouter } from "expo-router";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import IMAGES from "@/src/constants/images";

// Fix for TypeScript error with StatusBar.currentHeight
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

interface Prompt {
  id: string;
  question: string;
  placeholder: string;
}

const PROMPT_OPTIONS: Prompt[] = [
  { 
    id: "dream_destination", 
    question: "My dream destination is...",
    placeholder: "Share where you'd love to travel next and why"
  },
  { 
    id: "best_trip", 
    question: "The best trip I've ever had was...",
    placeholder: "Tell us about your favorite travel experience"
  },
  { 
    id: "travel_buddy", 
    question: "I'm looking for a travel buddy who...",
    placeholder: "Describe your ideal travel companion"
  },
  { 
    id: "travel_style", 
    question: "My travel style is...",
    placeholder: "Are you an adventurer, luxury traveler, backpacker?"
  }
];

const MAX_PROMPTS = 2;
const MAX_ANSWER_LENGTH = 200;

export default function PromptsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updatePrompts, isLoading } = useOnboarding();
  const [selectedPrompts, setSelectedPrompts] = React.useState<{[key: string]: string}>({});
  
  const handleSelectPrompt = (promptId: string) => {
    if (selectedPrompts[promptId]) {
      // If already selected, deselect it
      const newSelectedPrompts = {...selectedPrompts};
      delete newSelectedPrompts[promptId];
      setSelectedPrompts(newSelectedPrompts);
    } else {
      // If not selected and we're at the limit, show error
      if (Object.keys(selectedPrompts).length >= MAX_PROMPTS && !selectedPrompts[promptId]) {
        toast.show(`You can only select ${MAX_PROMPTS} prompts`, "error");
        return;
      }
      
      // Otherwise, select it with empty answer
      setSelectedPrompts({
        ...selectedPrompts,
        [promptId]: selectedPrompts[promptId] || ""
      });
    }
  };
  
  const handleAnswerChange = (promptId: string, answer: string) => {
    setSelectedPrompts({
      ...selectedPrompts,
      [promptId]: answer
    });
  };

  const handleContinue = async () => {
    const selectedPromptEntries = Object.entries(selectedPrompts);
    
    if (selectedPromptEntries.length === 0) {
      toast.show("Please select at least one prompt", "error");
      return;
    }
    
    // Check if any selected prompt has an empty answer
    const hasEmptyAnswer = selectedPromptEntries.some(([_, answer]) => !answer.trim());
    if (hasEmptyAnswer) {
      toast.show("Please complete all selected prompts", "error");
      return;
    }

    try {
      const formattedPrompts = selectedPromptEntries.map(([promptId, answer]) => {
        const promptData = PROMPT_OPTIONS.find(p => p.id === promptId);
        return {
          question: promptData?.question || promptId,
          answer: answer.trim()
        };
      });
      
      const success = await updatePrompts(formattedPrompts);
      if (success) {
        router.replace('/(tabs)/home');
      } else {
        toast.show("Failed to save prompts. Please try again.", "error");
      }
    } catch (error) {
      console.error('Prompt update error:', error);
      toast.show("An error occurred. Please try again.", "error");
    }
  };

  const isPromptSelected = (promptId: string) => {
    return promptId in selectedPrompts;
  };

  const getProgressDotsColors = () => {
    const dots = [
      '#E5E7EB', // Gray for unfinished steps
      '#E5E7EB', 
      '#E5E7EB',
      '#00CEC9'  // Teal for current step
    ];
    return dots;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={IMAGES.safarsaathi}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {getProgressDotsColors().map((color, index) => (
            <View
              key={`dot-${index}`}
              style={[styles.progressDot, { backgroundColor: color }]}
            />
          ))}
        </View>
        
        {/* Main Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Choose Prompts</Text>
          
          <Text style={styles.subtitle}>
            Select up to {MAX_PROMPTS} prompts to share more about yourself.
          </Text>
          
          {/* Prompt Options */}
          <View style={styles.promptsContainer}>
            {PROMPT_OPTIONS.map((prompt) => (
              <TouchableOpacity
                key={prompt.id}
                style={[
                  styles.promptOption,
                  isPromptSelected(prompt.id) && styles.selectedPrompt
                ]}
                onPress={() => handleSelectPrompt(prompt.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.promptText}>{prompt.question}</Text>
                
                <View style={[
                  styles.promptCheckCircle,
                  isPromptSelected(prompt.id) && styles.selectedCheckCircle
                ]}>
                  {isPromptSelected(prompt.id) && (
                    <View style={styles.promptCheckInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Selected Prompts with Answers */}
          {Object.entries(selectedPrompts).length > 0 && (
            <View style={styles.selectedPromptsContainer}>
              {Object.entries(selectedPrompts).map(([promptId, answer]) => {
                const promptData = PROMPT_OPTIONS.find(p => p.id === promptId);
                return (
                  <View key={`answer-${promptId}`} style={styles.answerContainer}>
                    <Text style={styles.answerLabel}>{promptData?.question}</Text>
                    <TextInput
                      value={answer}
                      onChangeText={(text) => handleAnswerChange(promptId, text)}
                      placeholder={promptData?.placeholder}
                      placeholderTextColor="#9CA3AF"
                      multiline
                      style={styles.answerInput}
                      maxLength={MAX_ANSWER_LENGTH}
                    />
                    <Text style={styles.characterCount}>
                      {answer.length}/{MAX_ANSWER_LENGTH}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          
          {/* Info Box */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={22} color="#00CEC9" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Prompts help others understand your travel style and preferences.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (Object.keys(selectedPrompts).length === 0 ||
              Object.values(selectedPrompts).some(answer => !answer.trim())) && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={isLoading || 
                   Object.keys(selectedPrompts).length === 0 ||
                   Object.values(selectedPrompts).some(answer => !answer.trim())}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Home Indicator */}
      <View style={styles.homeIndicator} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100, // Extra space for the fixed button
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 48,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: '#6B7280',
    marginBottom: 32,
  },
  promptsContainer: {
    marginBottom: 24,
  },
  promptOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedPrompt: {
    borderColor: '#00CEC9',
    backgroundColor: '#F0FDFD',
  },
  promptText: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: '#111827',
    flex: 1,
    paddingRight: 12,
  },
  promptCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckCircle: {
    borderColor: '#00CEC9',
  },
  promptCheckInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00CEC9',
  },
  selectedPromptsContainer: {
    marginBottom: 24,
  },
  answerContainer: {
    marginBottom: 24,
  },
  answerLabel: {
    fontSize: 16,
    fontFamily: 'montserratBold',
    color: '#111827',
    marginBottom: 12,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'montserrat',
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'montserrat',
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#374151',
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  continueButton: {
    backgroundColor: '#00CEC9',
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'montserratBold',
  },
  homeIndicator: {
    width: 36,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 2.5,
    opacity: 0.2,
    alignSelf: 'center',
    marginBottom: 8,
  },
});