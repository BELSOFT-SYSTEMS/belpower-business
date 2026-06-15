'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type BelaChatMessage = {
  id: string;
  sender: 'user' | 'bela';
  text: string;
  createdAt: Date;
  showWhatsApp?: boolean;
};

const WHATSAPP_URL =
  'https://api.whatsapp.com/send/?phone=2347073112239&text&type=phone_number&app_absent=0';

const INITIAL_MESSAGES: BelaChatMessage[] = [
  {
    id: 'welcome',
    sender: 'bela',
    text: "Hello! I'm Bela, your virtual assistant.\nHow can I help you today?",
    createdAt: new Date(Date.now() - 90_000),
  },
];

type BelaChatContextValue = {
  isOpen: boolean;
  messages: BelaChatMessage[];
  isTyping: boolean;
  input: string;
  whatsappUrl: string;
  setInput: (value: string) => void;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: () => void;
};

const BelaChatContext = createContext<BelaChatContextValue | null>(null);

export function BelaChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<BelaChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: BelaChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    window.setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bela-${Date.now()}`,
          sender: 'bela',
          text: "Currently in progress. We'll alert you as soon as it's available. Thank you for choosing BelPower.\nBut you can contact us on WhatsApp:",
          createdAt: new Date(),
          showWhatsApp: true,
        },
      ]);
    }, 1800);
  }, [input]);

  const value = useMemo(
    () => ({
      isOpen,
      messages,
      isTyping,
      input,
      whatsappUrl: WHATSAPP_URL,
      setInput,
      openChat,
      closeChat,
      sendMessage,
    }),
    [isOpen, messages, isTyping, input, openChat, closeChat, sendMessage]
  );

  return <BelaChatContext.Provider value={value}>{children}</BelaChatContext.Provider>;
}

export function useBelaChat() {
  const ctx = useContext(BelaChatContext);
  if (!ctx) throw new Error('useBelaChat must be used within BelaChatProvider');
  return ctx;
}
