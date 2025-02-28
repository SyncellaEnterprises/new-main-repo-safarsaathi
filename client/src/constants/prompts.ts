export const PROMPTS = [
  {
    id: '1',
    question: 'I am happiest when...',
    placeholder: 'Share what brings joy to your life',
  },
  {
    id: '2',
    question: 'My perfect travel day includes...',
    placeholder: 'Describe your ideal adventure',
  },
  {
    id: '3',
    question: 'Two truths and a lie...',
    placeholder: 'Keep them guessing!',
  },
  {
    id: '4',
    question: 'My simple pleasures...',
    placeholder: 'Little things that make you smile',
  },
  {
    id: '5',
    question: 'My most controversial opinion...',
    placeholder: 'Start a conversation!',
  },
  {
    id: '6',
    question: 'My go-to karaoke song...',
    placeholder: 'What gets you singing?',
  },
  {
    id: '7',
    question: 'My ideal weekend looks like...',
    placeholder: 'Paint a picture of your perfect weekend',
  },
  {
    id: '8',
    question: 'My life goal is to...',
    placeholder: 'Share your dreams and ambitions',
  },
  {
    id: '9',
    question: 'I get way too excited about...',
    placeholder: 'What makes you geek out?',
  },
  {
    id: '10',
    question: 'My best travel story...',
    placeholder: 'Share an unforgettable moment',
  },
];

export interface Prompt {
  id: string;
  question: string;
  answer?: string;
} 