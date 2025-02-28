import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Story {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  hasUnseenStories: boolean;
  timestamp: string;
}

// Extended mock data
const MOCK_STORIES: Story[] = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'Your Story',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    },
    hasUnseenStories: false,
    timestamp: 'now',
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Sarah',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    },
    hasUnseenStories: false,
    timestamp: '2h',
  },
  {
    id: '3',
    user: {
      id: '3',
      name: 'John',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
    },
    hasUnseenStories: false,
    timestamp: '5h',
  },
  {
    id: '4',
    user: {
      id: '4',
      name: 'Emily',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    },
    hasUnseenStories: true,
    timestamp: '8h',
  },
  {
    id: '5',
    user: {
      id: '5',
      name: 'Mike',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    },
    hasUnseenStories: false,
    timestamp: '12h',
  },
  {
    id: '6',
    user: {
      id: '6',
      name: 'Lisa',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    },
    hasUnseenStories: true,
    timestamp: '16h',
  },
  {
    id: '7',
    user: {
      id: '7',
      name: 'David',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    },
    hasUnseenStories: true,
    timestamp: '20h',
  },
  {
    id: '8',
    user: {
      id: '8',
      name: 'Sophie',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    },
    hasUnseenStories: true,
    timestamp: '22h',
  }
];

interface StoriesProps {
  onAddStory: () => void;
  onViewStory: (story: Story) => void;
}

export default function Stories({ onAddStory, onViewStory }: StoriesProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      className="pt-2 pb-4"
    >
      {MOCK_STORIES.map((story, index) => (
        <TouchableOpacity 
          key={story.id}
          onPress={() => index === 0 ? onAddStory() : onViewStory(story)}
          className="items-center mx-2"
        >
          <View className="relative">
            {story.hasUnseenStories ? (
              // Instagram-like story ring
              <LinearGradient
                colors={['#FF5F6D', '#FFC371']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-[2px] rounded-full"
              >
                <View className="bg-black p-[2px] rounded-full">
                  <Image 
                    source={{ uri: story.user.avatar }}
                    className="w-16 h-16 rounded-full"
                  />
                </View>
              </LinearGradient>
            ) : (
              // No story or viewed story
              <View className={`rounded-full ${index === 0 ? 'border-2 border-gray-500' : ''}`}>
                <Image 
                  source={{ uri: story.user.avatar }}
                  className="w-16 h-16 rounded-full"
                />
                {index === 0 && (
                  <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-6 h-6 items-center justify-center border-2 border-black">
                    <Ionicons name="add" size={16} color="#fff" />
                  </View>
                )}
              </View>
            )}
          </View>
          <Text className="text-white text-xs mt-1" numberOfLines={1}>
            {story.user.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
} 