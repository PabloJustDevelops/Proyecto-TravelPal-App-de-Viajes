"use client";

import { useState } from "react";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";

interface ChatbotButtonProps {
  onClick: () => void;
  isOpen: boolean;
  unreadCount?: number;
}

export default function ChatbotButton({ onClick, isOpen, unreadCount = 0 }: ChatbotButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full p-0 shadow-lg hover:shadow-xl hover:scale-105"
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
    </Button>
  );
}
