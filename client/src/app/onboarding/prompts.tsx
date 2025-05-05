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
  TextInput,
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import IMAGES from "@/src/constants/images";
import Animated, { FadeIn } from "react-native-reanimated";

// Fix for TypeScript error with StatusBar.currentHeight
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
const { width } = Dimensions.get("window");

interface Prompt {
  id: string;
  question: string;
  placeholder: string;
  category: string;
  icon: string;
}

const PROMPT_OPTIONS: Prompt[] = [
  { 
    id: "dream_destination", 
    question: "My dream destination is...",
    placeholder: "Share where you'd love to travel next and why",
    category: "Travel Dreams",
    icon: "airplane-outline"
  },
  { 
    id: "best_trip", 
    question: "The best trip I've ever had was...",
    placeholder: "Tell us about your favorite travel experience",
    category: "Experiences",
    icon: "map-outline"
  },
  { 
    id: "travel_buddy", 
    question: "I'm looking for a travel buddy who...",
    placeholder: "Describe your ideal travel companion",
    category: "Companionship",
    icon: "people-outline"
  },
  { 
    id: "travel_style", 
    question: "My travel style is...",
    placeholder: "Are you an adventurer, luxury traveler, backpacker?",
    category: "Style",
    icon: "compass-outline"
  },
  { 
    id: "next_adventure",
    question: "My next adventure will be...",
    placeholder: "What are you planning or dreaming about?",
    category: "Planning",
    icon: "calendar-outline"
  },
  { 
    id: "local_cuisine",
    question: "My favorite travel food experience...",
    placeholder: "Tell us about a memorable culinary moment",
    category: "Food",
    icon: "restaurant-outline"
  },
  { 
    id: "hidden_gem",
    question: "A hidden gem I discovered was...",
    placeholder: "Share a special place others might not know about",
    category: "Discovery",
    icon: "diamond-outline"
  },
  { 
    id: "travel_lesson",
    question: "Travel has taught me that...",
    placeholder: "Share an insight or lesson learned while traveling",
    category: "Reflection",
    icon: "bulb-outline"
  },
  { 
    id: "bucket_list",
    question: "On my travel bucket list is...",
    placeholder: "What experience are you eager to check off?",
    category: "Goals",
    icon: "checkmark-circle-outline"
  },
  { 
    id: "travel_quote",
    question: "My favorite travel quote is...",
    placeholder: "Share words that inspire your wanderlust",
    category: "Inspiration",
    icon: "chatbubble-outline"
  }
];

const MAX_PROMPTS = 2;
const MAX_ANSWER_LENGTH = 200;

export default function PromptsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updatePrompts, isLoading } = useOnboarding();
  const [selectedPrompts, setSelectedPrompts] = React.useState<{[key: string]: string}>({});
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  
  // Get unique categories
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(PROMPT_OPTIONS.map(prompt => prompt.category));
    return ['All', ...Array.from(uniqueCategories)];
  }, []);
  
  // Filter prompts by category
  const filteredPrompts = React.useMemo(() => {
    if (!activeCategory || activeCategory === 'All') {
      return PROMPT_OPTIONS;
    }
    return PROMPT_OPTIONS.filter(prompt => prompt.category === activeCategory);
  }, [activeCategory]);
  
  const handleSelectPrompt = (promptId: string) => {
    if (selectedPrompts[promptId]) {
      // If already selected, deselect it
      const newSelectedPrompts = {...selectedPrompts};
      delete newSelectedPrompts[promptId];
      setSelectedPrompts(newSelectedPrompts);
    } else {
      // If already at the limit of MAX_PROMPTS, remove the oldest selection
      if (Object.keys(selectedPrompts).length >= MAX_PROMPTS) {
        const selectedPromptIds = Object.keys(selectedPrompts);
        const oldestPromptId = selectedPromptIds[0]; // First one is the oldest
        
        // Keep all except the oldest one, and add the new one
        const newSelectedPrompts = {...selectedPrompts};
        delete newSelectedPrompts[oldestPromptId];
        
        setSelectedPrompts({
          ...newSelectedPrompts,
          [promptId]: ""
        });
      } else {
        // Otherwise, just add the new selection
        setSelectedPrompts({
          ...selectedPrompts,
          [promptId]: ""
        });
      }
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
  
  // Generate background pattern elements
  const renderPatternElements = () => {
    return (
      <View style={styles.patternContainer} pointerEvents="none">
        <View style={[styles.patternElement, styles.patternElement1]} />
        <View style={[styles.patternElement, styles.patternElement2]} />
        <View style={[styles.patternElement, styles.patternElement3]} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {renderPatternElements()}
      
      <View style={styles.header}>
        <Image 
          source={IMAGES.safarsaathi}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Your Travel Story</Text>
        <Text style={styles.subtitle}>
          Select up to {MAX_PROMPTS} prompts to share what makes you unique.
        </Text>
        
        {/* Category Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryPill,
                activeCategory === category && styles.activeCategoryPill
              ]}
              onPress={() => setActiveCategory(category === activeCategory ? null : category)}
              activeOpacity={0.9}
            >
              <Text 
                style={[
                  styles.categoryText,
                  activeCategory === category && styles.activeCategoryText
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Prompt Grid */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.promptsGrid}
        >
          {filteredPrompts.map((prompt) => (
            <Animated.View
              key={prompt.id}
              entering={FadeIn.duration(400).delay(100)}
              style={styles.promptCard}
            >
              <TouchableOpacity
                style={[
                  styles.promptOption,
                  isPromptSelected(prompt.id) && styles.selectedPrompt
                ]}
                onPress={() => handleSelectPrompt(prompt.id)}
                activeOpacity={0.9}
              >
                <View style={styles.promptHeader}>
                  <View style={[
                    styles.promptIconContainer,
                    isPromptSelected(prompt.id) && styles.selectedPromptIcon
                  ]}>
                    <Ionicons 
                      name={prompt.icon as any} 
                      size={16} 
                      color={isPromptSelected(prompt.id) ? "#FFFFFF" : "#00CEC9"} 
                    />
                  </View>
                  <Text style={styles.promptCategory}>{prompt.category}</Text>
                </View>
                
                <Text style={styles.promptQuestion}>{prompt.question}</Text>
                
                <View style={styles.promptSelection}>
                  <View style={[
                    styles.selectionIndicator,
                    isPromptSelected(prompt.id) && styles.selectedIndicator
                  ]}>
                    {isPromptSelected(prompt.id) && (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
        
        {/* Selected Prompts with Answers */}
        {Object.entries(selectedPrompts).length > 0 && (
          <View style={styles.selectedPromptsContainer}>
            <Text style={styles.sectionTitle}>Your Responses</Text>
            
            {Object.entries(selectedPrompts).map(([promptId, answer]) => {
              const promptData = PROMPT_OPTIONS.find(p => p.id === promptId);
              return (
                <View key={`answer-${promptId}`} style={styles.answerContainer}>
                  <View style={styles.answerHeader}>
                    <Text style={styles.answerLabel}>{promptData?.question}</Text>
                    <TouchableOpacity 
                      onPress={() => handleSelectPrompt(promptId)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  
                  <TextInput
                    value={answer}
                    onChangeText={(text) => handleAnswerChange(promptId, text)}
                    placeholder={promptData?.placeholder}
                    placeholderTextColor="#9CA3AF"
                    multiline
                    style={styles.answerInput}
                    maxLength={MAX_ANSWER_LENGTH}
                  />
                  
                  <View style={styles.characterCountContainer}>
                    <View style={[
                      styles.characterCountBar,
                      {
                        width: `${Math.min(100, (answer.length / MAX_ANSWER_LENGTH) * 100)}%`,
                        backgroundColor: answer.length > MAX_ANSWER_LENGTH * 0.8 ? '#FF9AA2' : '#00CEC9'
                      }
                    ]} />
                    <Text style={styles.characterCount}>
                      {answer.length}/{MAX_ANSWER_LENGTH}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        
        {/* Info Box */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={22} color="#00CEC9" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Your responses help others understand your travel style and connect with you more meaningfully.
          </Text>
        </View>
        
        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={[styles.indicator, styles.activeIndicator]} />
        </View>
      </View>
      
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
          activeOpacity={0.9}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>Finish</Text>
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
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternElement: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.05,
  },
  patternElement1: {
    backgroundColor: '#00CEC9',
    width: 300,
    height: 300,
    top: -150,
    right: -100,
  },
  patternElement2: {
    backgroundColor: '#00CEC9',
    width: 200,
    height: 200,
    bottom: 100,
    left: -100,
  },
  patternElement3: {
    backgroundColor: '#FF7675',
    width: 150,
    height: 150,
    bottom: -50,
    right: -30,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  logo: {
    width: 100,
    height: 100,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 90, // Space for button
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    color: '#00CEC9',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'montserrat',
    color: 'grey',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  categoryContainer: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
  },
  activeCategoryPill: {
    backgroundColor: '#00CEC9',
  },
  categoryText: {
    fontSize: 13,
    fontFamily: 'montserrat',
    color: '#4B5563',
  },
  activeCategoryText: {
    color: '#FFFFFF',
    fontFamily: 'montserratBold',
  },
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  promptCard: {
    width: (width - 40) / 2,
    marginBottom: 12,
  },
  promptOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    height: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedPrompt: {
    borderColor: '#00CEC9',
    backgroundColor: 'rgba(0, 206, 201, 0.05)',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedPromptIcon: {
    backgroundColor: '#00CEC9',
  },
  promptCategory: {
    fontSize: 11,
    fontFamily: 'montserrat',
    color: '#6B7280',
  },
  promptQuestion: {
    fontSize: 13,
    fontFamily: 'montserratBold',
    color: '#111827',
    flex: 1,
  },
  promptSelection: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  selectionIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    backgroundColor: '#00CEC9',
    borderColor: '#00CEC9',
  },
  selectedPromptsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'montserratBold',
    color: '#111827',
    marginBottom: 16,
  },
  answerContainer: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 14,
    fontFamily: 'montserratBold',
    color: '#111827',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  answerInput: {
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#374151',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCountContainer: {
    marginTop: 8,
  },
  characterCountBar: {
    height: 3,
    backgroundColor: '#00CEC9',
    borderRadius: 1.5,
    marginBottom: 4,
  },
  characterCount: {
    fontSize: 11,
    fontFamily: 'montserrat',
    color: '#9CA3AF',
    textAlign: 'right',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'montserrat',
    color: '#374151',
    flex: 1,
    lineHeight: 18,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#00CEC9',
    width: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  continueButton: {
    backgroundColor: '#00CEC9',
    borderRadius: 12,
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