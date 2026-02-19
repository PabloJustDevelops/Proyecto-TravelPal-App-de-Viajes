"use client";

import { useState, useEffect, useRef } from "react";
import {
  MinusIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import ChatbotMessage, { Message } from "./ChatbotMessage";
import ChatbotInput from "./ChatbotInput";
import type { LLMMessage } from "@/lib/llmService";

interface ChatbotWindowProps {
  onClose: () => void;
}

export default function ChatbotWindow({ onClose }: ChatbotWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "¡Hola! 👋 Soy tu asistente de viajes. ¿En qué puedo ayudarte hoy?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    try {
      // Prepare history excluding the welcome message
      const llmMessages: LLMMessage[] = messages
        .filter((msg) => msg.sender !== "bot" || msg.id !== "1")
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        }));

      // Add the current message
      llmMessages.push({ role: "user", content });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: llmMessages }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Error al parsear respuesta JSON:", parseError);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.content,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error desconocido al comunicarse con el servidor";
      setError(errorMessage);
      console.error("Error en handleSendMessage:", err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl z-40 overflow-hidden flex flex-col transition-all duration-300 ease-in-out dark:bg-gray-800 dark:border dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-lg">✈️</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Asistente de Viajes
            </h3>
            <p className="text-xs text-blue-100">En línea</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg hover:bg-blue-500 transition-colors text-white"
            aria-label={isMinimized ? "Expandir" : "Minimizar"}
          >
            <ChevronDownIcon
              className={`h-5 w-5 transition-transform ${
                isMinimized ? "rotate-180" : ""
              }`}
            />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-blue-500 transition-colors text-white"
            aria-label="Cerrar"
          >
            <MinusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 max-h-96">
            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <ChatbotMessage key={message.id} message={message} />
            ))}

            {isTyping && (
              <div className="flex w-full mb-4 justify-start">
                <div className="flex flex-row gap-2">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm">✈️</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-900 rounded-bl-sm dark:bg-gray-800 dark:text-gray-100">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <ChatbotInput onSendMessage={handleSendMessage} disabled={isTyping} />
        </>
      )}
    </div>
  );
}
