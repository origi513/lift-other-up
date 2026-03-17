export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  streak: number;
  totalRecognitions: number;
  createdAt: any; // Firestore Timestamp
  persona?: string;
  goals?: {
    study: boolean;
    exercise: boolean;
    sleep: boolean;
  };
}

export interface CheckIn {
  id?: string;
  userId: string;
  mood: string;
  reason: string;
  aiFeedback?: string;
  createdAt: any;
}

export interface Reflection {
  id?: string;
  userId: string;
  category: 'academic' | 'spiritual' | 'mental' | 'emotional' | 'personal';
  content: string;
  aiFeedback?: string;
  createdAt: any;
}

export interface Recognition {
  id?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  category: 'Teamwork' | 'Empathy' | 'Leadership' | 'Resilience' | 'Kindness' | 'Academic Help';
  message: string;
  isAnonymous: boolean;
  createdAt: any;
}
