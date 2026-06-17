'use client';

import { useEffect, useRef } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { IoClose, IoSend } from 'react-icons/io5';
import { useBelaChat } from '@/context/BelaChatContext';
import { BelaAvatar } from './BelaAvatar';

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function BelaChatPanel() {
  const {
    isOpen,
    messages,
    isTyping,
    input,
    whatsappUrl,
    setInput,
    closeChat,
    sendMessage,
  } = useBelaChat();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      window.setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages, isTyping]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeChat();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeChat]);

  if (!isOpen) return null;

  return (
    <div
      className="bela-chat-panel fixed inset-0 z-[100001] flex items-end justify-end bg-black/20 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Chat with Bela"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeChat();
      }}
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-white sm:h-[min(640px,calc(100vh-2rem))] sm:max-w-[420px] sm:rounded-2xl sm:shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <span className="bela-pulse-ring absolute h-[52px] w-[52px] rounded-full bg-blue-light" />
              <div className="bela-image-container flex h-11 w-11 items-center justify-center p-0.5">
                <BelaAvatar size={40} priority />
              </div>
              <span className="absolute bottom-0.5 right-0.5 z-20 h-3 w-3 rounded-full border-2 border-white bg-green-normal" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Bela</p>
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-green-normal" />
                AI Assistant
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeChat}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
            aria-label="Close chat"
          >
            <IoClose size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
          {messages.map((message) => {
            const isUser = message.sender === 'user';
            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'rounded-br-md bg-blue-normal text-white'
                        : 'rounded-bl-md bg-white text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    {message.showWhatsApp && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#1ebe5d]"
                      >
                        <FaWhatsapp size={16} />
                        Message us
                      </a>
                    )}
                  </div>
                  <p className={`mt-1 text-[10px] text-gray-400 ${isUser ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                Bela is typing…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <footer className="border-t border-gray-200 bg-white px-3 py-3">
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Message Bela..."
              maxLength={500}
              className="min-h-11 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/15"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-normal text-white transition hover:bg-blue-normal-hover disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <IoSend size={18} className="ml-0.5" />
            </button>
          </form>
          <p className="pt-2 text-center text-[10px] font-medium tracking-wide text-gray-400 uppercase">
            Powered by Belsoft Systems
          </p>
        </footer>
      </div>
    </div>
  );
}
