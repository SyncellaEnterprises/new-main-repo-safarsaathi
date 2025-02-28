import { TravelSuggestion } from "@/types/calendar";

export const MOCK_MESSAGES = [
  {
    id: '1',
    type: 'text',
    content: 'Hey, how are you?',
    senderId: 'other-user',
    receiverId: 'current-user',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: true,
  },
  {
    id: '2',
    type: 'text',
    content: 'I\'m good! Just finished my workout 💪',
    senderId: 'current-user',
    receiverId: 'other-user',
    timestamp: new Date(Date.now() - 3300000).toISOString(),
    isRead: true,
  },
  {
    id: '3',
    type: 'image',
    content: 'https://picsum.photos/400/300',
    senderId: 'other-user',
    receiverId: 'current-user',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    isRead: true,
  },
  {
    id: '4',
    type: 'text',
    content: 'That looks amazing! Where is this?',
    senderId: 'current-user',
    receiverId: 'other-user',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    isRead: false,
  },
];

export const MOCK_USER = {
  id: 'other-user',
  name: 'Jane Doe',
  avatar: 'https://picsum.photos/200',
  isOnline: true,
};

export const MOCK_HOLIDAYS: Holiday[] = [
  {
    date: '2024-01-01',
    name: "New Year's Day",
    type: 'national'
  },
  {
    date: '2024-01-26',
    name: 'Republic Day',
    type: 'national'
  },
  // Add more holidays...
];

export const MOCK_SUGGESTIONS: TravelSuggestion[] = [
  {
    id: '1',
    dates: {
      start: '2024-01-25',
      end: '2024-01-28',
    },
    totalDays: 4,
    holidays: [MOCK_HOLIDAYS[1]],
    weekends: 2,
    description: 'Long weekend getaway including Republic Day holiday'
  },
  // Add more suggestions...
];

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: '1',
    title: 'Advanced Travel Planning',
    description: 'Access to premium travel suggestions and holiday calendar',
    icon: 'airplane'
  },
  {
    id: '2',
    title: 'Priority Support',
    description: '24/7 dedicated customer support',
    icon: 'headset'
  },
  // Add more features...
];

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: '1',
    name: 'Monthly',
    price: 9.99,
    interval: 'month',
    features: [
      'All premium features',
      'Priority support',
      'No ads'
    ]
  },
  {
    id: '2',
    name: 'Yearly',
    price: 99.99,
    interval: 'year',
    features: [
      'All premium features',
      'Priority support',
      'No ads',
      '2 months free'
    ],
    isPopular: true
  }
]; 