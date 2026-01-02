import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface AIAssistantState {
  messages: Message[];
  isLoading: boolean;
  
  // Actions
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  askQuestion: (question: string) => Promise<void>;
}

// Mock AI responses for common medication questions
const mockResponses: Record<string, string> = {
  "missed dose": "If you miss a dose, take it as soon as you remember. However, if it's almost time for your next dose, skip the missed dose and take your next dose at the regular time. Don't take two doses to make up for a missed one unless directed by your healthcare provider.",
  "side effects": "Common side effects may include nausea, headache, or dizziness. If you experience severe side effects or an allergic reaction (rash, itching, swelling, severe dizziness, trouble breathing), seek medical attention immediately.",
  "food interactions": "Some medications should be taken with food to reduce stomach upset, while others work best on an empty stomach. Check your prescription label or ask your pharmacist for specific instructions.",
  "alcohol": "Mixing alcohol with many medications can be dangerous. It may increase side effects like drowsiness or dizziness, or cause liver damage. Always check with your healthcare provider about alcohol use with your specific medications.",
  "storage": "Most medications should be stored in a cool, dry place away from direct sunlight. Some may require refrigeration. Always keep medications in their original containers and out of reach of children.",
};

export const useAIAssistantStore = create<AIAssistantState>()(
  persist(
    (set, get) => ({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! I'm your medication assistant. How can I help you today?",
          timestamp: Date.now(),
        },
      ],
      isLoading: false,
      
      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: Date.now().toString(),
          timestamp: Date.now(),
        };
        
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },
      
      clearMessages: () => {
        set({
          messages: [
            {
              id: "welcome",
              role: "assistant",
              content: "Hello! I'm your medication assistant. How can I help you today?",
              timestamp: Date.now(),
            },
          ],
        });
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      askQuestion: async (question) => {
        const { addMessage, setLoading } = get();
        
        // Add user question to messages
        addMessage({
          role: "user",
          content: question,
        });
        
        setLoading(true);
        
        try {
          // In a real app, this would call an AI API
          // For now, we'll use mock responses based on keywords
          await new Promise((resolve) => setTimeout(resolve, 1500));
          
          let response = "I'm not sure about that. Please consult your healthcare provider for specific medical advice.";
          
          // Check if question contains any keywords from mock responses
          for (const [keyword, mockResponse] of Object.entries(mockResponses)) {
            if (question.toLowerCase().includes(keyword)) {
              response = mockResponse;
              break;
            }
          }
          
          addMessage({
            role: "assistant",
            content: response,
          });
        } catch (error) {
          console.error("Error asking question:", error);
          addMessage({
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again later.",
          });
        } finally {
          setLoading(false);
        }
      },
    }),
    {
      name: "ai-assistant-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);