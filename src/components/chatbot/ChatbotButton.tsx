"use client";

import { useState } from "react";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ChatbotButtonProps {
  onClick: () => void;
  isOpen: boolean;
  unreadCount?: number;
}

export default function ChatbotButton({ onClick, isOpen, unreadCount = 0 }: ChatbotButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-4 right-4 z-50 group flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700"
      aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
    >
      {isOpen ? (
        <XMarkIcon className="h-6 w-6 transition-transform duration-300" />
      ) : (
        <div className="relative">
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
