import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from "react";

const LANGUAGES = [
  {
    code: "en",
    name: "English",
    region: "United States",
    flag: "🇺🇸"
  },
  {
    code: "es",
    name: "Spanish",
    region: "Spain",
    flag: "🇪🇸"
  },
  {
    code: "fr",
    name: "French",
    region: "France",
    flag: "🇫🇷"
  },
  {
    code: "de",
    name: "German",
    region: "Germany",
    flag: "🇩🇪"
  },
  {
    code: "it",
    name: "Italian",
    region: "Italy",
    flag: "🇮🇹"
  },
  {
    code: "pt",
    name: "Portuguese",
    region: "Portugal",
    flag: "🇵🇹"
  },
  {
    code: "ru",
    name: "Russian",
    region: "Russia",
    flag: "🇷🇺"
  },
  {
    code: "zh",
    name: "Chinese",
    region: "China",
    flag: "🇨🇳"
  },
  {
    code: "ja",
    name: "Japanese",
    region: "Japan",
    flag: "🇯🇵"
  },
  {
    code: "ko",
    name: "Korean",
    region: "South Korea",
    flag: "🇰🇷"
  }
];

export default function LanguageScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  return (
    <View className="flex-1 bg-[#1e293b]">
      <LinearGradient
        colors={['#1e293b', '#334155', '#475569']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <Animated.View
          entering={FadeInDown.duration(500)}
          className="px-6 pt-6 pb-4"
        >
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white ml-4">Language</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {LANGUAGES.map((language, index) => (
            <Animated.View
              key={language.code}
              entering={FadeInDown.delay(index * 100)}
            >
              <TouchableOpacity
                onPress={() => setSelectedLanguage(language.code)}
                className={`flex-row items-center p-4 mb-3 rounded-xl ${
                  selectedLanguage === language.code ? 'bg-primary/20' : 'bg-white/10'
                }`}
              >
                <Text className="text-3xl mr-4">{language.flag}</Text>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-lg">
                    {language.name}
                  </Text>
                  <Text className="text-white/60">
                    {language.region}
                  </Text>
                </View>
                {selectedLanguage === language.code && (
                  <View className="w-8 h-8 bg-primary rounded-full items-center justify-center">
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
          
          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
} 