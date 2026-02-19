import { UserCircleIcon, SparklesIcon } from "@heroicons/react/24/outline";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatbotMessageProps {
  message: Message;
}

export default function ChatbotMessage({ message }: ChatbotMessageProps) {
  const isUser = message.sender === "user";
  const timeString = message.timestamp.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex w-full mb-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        } gap-2`}
      >
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
        
        <div
          className={`flex flex-col ${
            isUser ? "items-end" : "items-start"
          }`}
        >
          <div
            className={`px-4 py-2 rounded-2xl max-w-full break-words ${
              isUser
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm dark:bg-gray-800 dark:text-gray-100"
            }`}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <span className="text-xs text-gray-500 mt-2 dark:text-gray-400">
            {timeString}
          </span>
        </div>

        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center dark:bg-gray-600">
              <UserCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
