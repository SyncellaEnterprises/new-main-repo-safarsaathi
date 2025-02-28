interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: {
    [key: string]: string[];
  };
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    onboardingCompleted: boolean;
  };
}

interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  age?: number;
  gender?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  photos?: string[];
  bio?: string;
  occupation?: string;
  lifestyle?: string;
  interests?: string[];
  budget?: number;
  drinking?: 'yes' | 'no' | 'occasionally' | 'prefer_not_to_say';
  smoking?: 'yes' | 'no' | 'occasionally' | 'prefer_not_to_say';
  prompts?: Array<{
    questionId: string;
    question: string;
    answer: string;
  }>;
  isVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
} 