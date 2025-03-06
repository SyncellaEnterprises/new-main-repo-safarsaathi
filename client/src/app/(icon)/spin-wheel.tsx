import React, { useState } from "react";
import { View, Text, TouchableOpacity, Dimensions, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from "expo-blur";
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withSequence,
  useSharedValue, 
  runOnJS 
} from "react-native-reanimated";
import Svg, { Path, G, Text as SvgText } from "react-native-svg";
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.85;
const WHEEL_CENTER = WHEEL_SIZE / 2;

const SEGMENTS = [
  { points: 10, color: '#1a237e', chance: 30 },
  { points: 20, color: '#283593', chance: 25 },
  { points: 30, color: '#1a237e', chance: 20 },
  { points: 50, color: '#283593', chance: 15 },
  { points: 100, color: '#1a237e', chance: 9 },
  { points: 200, color: '#283593', chance: 1 },
];

interface RewardModalProps {
  visible: boolean;
  points: number;
  onClose: () => void;
  onClaim: () => void;
}

const RewardModal = ({ visible, points, onClose, onClaim }: RewardModalProps) => (
  <Modal visible={visible} transparent animationType="fade">
    <BlurView intensity={40} className="flex-1 justify-center items-center p-6">
      <View className="bg-white rounded-3xl p-6 w-[90%] items-center">
        <View className="w-20 h-20 bg-indigo-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="gift" size={40} color="#4F46E5" />
        </View>
        <Text className="text-2xl font-bold text-gray-800 mb-2">Congratulations! 🎉</Text>
        <Text className="text-4xl font-bold text-indigo-600 mb-4">{points} Points</Text>
        <Text className="text-gray-500 text-center mb-6">
          You've won {points} Safar points!{'\n'}Claim now and start exploring.
        </Text>
        <TouchableOpacity onPress={onClaim} className="w-full bg-indigo-600 rounded-xl py-4 mb-3">
          <Text className="text-white text-center font-bold text-lg">Claim Reward</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text className="text-gray-500">Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  </Modal>
);

export default function SpinWheelScreen() {
  const router = useRouter();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [wonPoints, setWonPoints] = useState(0);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const calculateWinningSegment = (rotationValue: number) => {
    const normalizedRotation = rotationValue % 360;
    const segmentSize = 360 / SEGMENTS.length;
    const winningIndex = Math.floor(normalizedRotation / segmentSize);
    return SEGMENTS[winningIndex];
  };

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Select winning segment based on weighted chances
    let totalChance = 0;
    const randomChance = Math.random() * 100;
    const selectedSegment = SEGMENTS.find(segment => {
      totalChance += segment.chance;
      return randomChance <= totalChance;
    }) || SEGMENTS[0]; // Fallback if no match (should not happen)

    const segmentSize = 360 / SEGMENTS.length;
    const targetRotation = 360 * 5 + segmentSize * SEGMENTS.findIndex(segment => segment.points === selectedSegment.points);

    scale.value = withSequence(withSpring(1.1), withSpring(1));
    rotation.value = withTiming(targetRotation, { duration: 5000 }, (finished) => {
      if (finished) {
        runOnJS(setIsSpinning)(false);
        runOnJS(setWonPoints)(selectedSegment.points);
        runOnJS(setShowModal)(true);
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
      }
    });
  };

  const handleClaim = () => {
    setShowModal(false);
    router.push('/safar-points');
  };

  const renderWheel = () => {
    const segmentAngle = 360 / SEGMENTS.length;
    return (
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
        <G transform={`translate(${WHEEL_CENTER},${WHEEL_CENTER})`}>
          {SEGMENTS.map((segment, index) => {
            const angle = index * segmentAngle;
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * (WHEEL_SIZE * 0.35);
            const y = Math.sin(rad) * (WHEEL_SIZE * 0.35);
            return (
              <G key={index}>
                <Path
                  d={`M 0 0 
                     L ${WHEEL_SIZE/2 * Math.cos((angle-segmentAngle/2) * Math.PI/180)} 
                       ${WHEEL_SIZE/2 * Math.sin((angle-segmentAngle/2) * Math.PI/180)} 
                     A ${WHEEL_SIZE/2} ${WHEEL_SIZE/2} 0 0 1 
                       ${WHEEL_SIZE/2 * Math.cos((angle+segmentAngle/2) * Math.PI/180)} 
                       ${WHEEL_SIZE/2 * Math.sin((angle+segmentAngle/2) * Math.PI/180)} 
                     Z`}
                  fill={segment.color}
                  stroke="#fff"
                  strokeWidth="2"
                />
                <SvgText
                  x={x}
                  y={y}
                  fill="#fff"
                  fontSize="20"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${angle + segmentAngle / 2})`}
                >
                  {segment.points}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    );
  };

  return (
    <View className="flex-1">
      <LinearGradient colors={['#4F46E5', '#7C3AED']} className="flex-1">
        {/* Header */}
        <View className="pt-14 px-6 pb-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">Spin & Win</Text>
            <View className="w-10" />
          </View>
        </View>

        {/* Wheel Container */}
        <View className="flex-1 items-center justify-center">
          <View className="w-8 h-8 bg-white rounded-b-2xl z-10 mb-[-16px]" />
          <Animated.View style={wheelStyle}>{renderWheel()}</Animated.View>
          <TouchableOpacity
            onPress={spinWheel}
            disabled={isSpinning}
            className={`mt-12 px-8 py-4 rounded-2xl ${isSpinning ? 'bg-gray-400' : 'bg-white'}`}
          >
            <Text className={`text-xl font-bold ${isSpinning ? 'text-gray-600' : 'text-indigo-600'}`}>
              {isSpinning ? 'Spinning...' : 'SPIN NOW'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reward Modal */}
        <RewardModal visible={showModal} points={wonPoints} onClose={() => setShowModal(false)} onClaim={handleClaim} />
      </LinearGradient>
    </View>
  );
}
