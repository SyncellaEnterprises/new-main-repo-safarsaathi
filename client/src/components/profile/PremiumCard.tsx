import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const PREMIUM_FEATURES = [
  {
    id: '1',
    icon: 'diamond',
    title: 'Premium Visibility',
    description: 'Get featured at the top of search results',
  },
  {
    id: '2',
    icon: 'infinite',
    title: 'Unlimited Matches',
    description: 'No daily limit on your potential connections',
  },
  {
    id: '3',
    icon: 'shield-checkmark',
    title: 'Advanced Filters',
    description: "Find exactly who you're looking for",
  },
  {
    id: '4',
    icon: 'star',
    title: 'Priority Support',
    description: '24/7 VIP customer service',
  },
];

const PREMIUM_PLANS = [
  {
    id: '1',
    name: 'Monthly',
    price: '799',
    interval: 'month',
    features: ['All Premium Features', 'Cancel Anytime', 'Priority Support'],
    isPopular: false,
  },
  {
    id: '2',
    name: 'Yearly',
    price: '6999',
    interval: 'year',
    features: ['All Premium Features', '2 Months Free', 'Exclusive Events', 'VIP Badge'],
    isPopular: true,
  },
];

export function PremiumCard() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-4  rounded-3xl overflow-hidden bg-transparent"

        >
          <Animated.View
            entering={FadeIn}
            className="p-6"
          >
            <View className="flex-row items-center justify-between mb-4 bg-transparent">
              <View className="flex-row items-center">
                <Ionicons name="diamond" size={24} color="#FFD700" />
                <Text className="text-white text-xl font-bold ml-2">Premium</Text>
              </View>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-4 py-2 rounded-full"
              >
                <Text className="text-white font-semibold">Upgrade</Text>
              </LinearGradient>
            </View>

            <Text className="text-white/90 text-base mb-4">
              Unlock exclusive features and enhance your experience
            </Text>

            <View className="flex-row flex-wrap">
              {PREMIUM_FEATURES.slice(0, 2).map((feature) => (
                <View key={feature.id} className="flex-row items-center mr-4 mb-2">
                  <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                  <Text className="text-white/80 ml-1">{feature.title}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <BlurView intensity={90} tint="dark" className="flex-1">
          <Animated.View
            entering={FadeInDown}
            className="flex-1 mt-20 bg-white rounded-t-3xl"
          >
            <View className="p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-gray-800">
                  Upgrade to Premium
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={28} color="#374151" />
                </TouchableOpacity>
              </View>

              <View className="mb-8">
                {PREMIUM_FEATURES.map((feature, index) => (
                  <Animated.View
                    key={feature.id}
                    entering={FadeInDown.delay(200 * index)}
                    className="flex-row items-start mb-6 bg-gray-50 p-4 rounded-2xl"
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      className="p-3 rounded-full"
                    >
                      <Ionicons name={feature.icon as any} size={24} color="white" />
                    </LinearGradient>
                    <View className="ml-4 flex-1">
                      <Text className="text-lg font-semibold text-gray-800">
                        {feature.title}
                      </Text>
                      <Text className="text-gray-600 mt-1">
                        {feature.description}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>

              <Text className="text-xl font-bold text-gray-800 mb-4">
                Choose Your Plan
              </Text>

              {PREMIUM_PLANS.map((plan, index) => (
                <Animated.View
                  key={plan.id}
                  entering={FadeInDown.delay(200 * (index + PREMIUM_FEATURES.length))}
                  className="mb-4"
                >
                  <TouchableOpacity
                    className={`p-6 rounded-2xl relative ${plan.isPopular
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        : 'bg-gray-50'
                      }`}
                  >
                    {plan.isPopular && (
                      <View className="absolute -top-3 right-4 bg-yellow-400 px-4 py-1 rounded-full">
                        <Text className="text-sm font-bold text-white">
                          Best Value
                        </Text>
                      </View>
                    )}

                    <Text className={`text-xl font-bold ${plan.isPopular ? 'text-white' : 'text-gray-800'}`}>
                      {plan.name}
                    </Text>

                    <View className="flex-row items-baseline mt-2">
                      <Text className={`text-3xl font-bold ${plan.isPopular ? 'text-white' : 'text-gray-800'}`}>
                        ₹{plan.price}
                      </Text>
                      <Text className={`ml-1 ${plan.isPopular ? 'text-white/80' : 'text-gray-600'}`}>
                        /{plan.interval}
                      </Text>
                    </View>

                    <View className="mt-4">
                      {plan.features.map((feature, featureIndex) => (
                        <View key={featureIndex} className="flex-row items-center mt-2">
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={plan.isPopular ? '#ffffff' : '#6366F1'}
                          />
                          <Text className={`ml-2 ${plan.isPopular ? 'text-white/90' : 'text-gray-600'
                            }`}>
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </BlurView>
      </Modal>
    </>
  );
}
