"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

interface ChatbotInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatbotInput({ onSendMessage, disabled = false }: ChatbotInputProps) {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmedMessage = inputValue.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setInputValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu mensaje..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        style={{ minHeight: "48px", maxHeight: "120px" }}
      />
      <button
        onClick={handleSend}
        disabled={!inputValue.trim() || disabled}
        className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-gray-600"
        aria-label="Enviar mensaje"
      >
        <PaperAirplaneIcon className="h-5 w-5 -ml-0.5 transform rotate-0" />
      </button>
    </div>
  );
}
