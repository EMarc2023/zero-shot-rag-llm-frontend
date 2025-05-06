import React, { useState, useCallback } from "react";
import "./index.css"; // Import your CSS file for styles

interface ChatMessage {
  text: string;
  isUser: boolean;
}

const ChatInterface: React.FC = () => {
  // State variables
  const [query, setKeyword] = useState("");
  const [prompt, setPrompt] = useState("");
  const [method, setMethod] = useState("bart"); // Default method
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Function to format the chat history for download
  const formatChatHistory = useCallback((): string => {
    return chatHistory
      .map((message) => `${message.isUser ? "User" : "Bot"}: ${message.text}`)
      .join("\n");
  }, [chatHistory]);

  // Function to trigger the download of the chat history
  const downloadChat = useCallback(() => {
    const chatText = formatChatHistory();
    const blob = new Blob([chatText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chat_history.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the object URL
  }, [formatChatHistory]);

  // Function to handle sending the message
  const handleSendMessage = useCallback(async () => {
    if (!query.trim()) {
      return; // Prevent sending empty queries
    }

    setLoading(true);
    setChatHistory((prevHistory) => [
      ...prevHistory,
      {
        text: `<strong>User:</strong> RAG keyword(s): ${query}, summarisation method: ${method}, prompt: ${prompt}`,
        isUser: true,
      },
    ]);

    // Construct the API URL
    // Ensure the backend API URL is set in the environment variables
    const backendApiUrl = process.env.REACT_APP_BACKEND_API_URL;
    const apiUrl = `${backendApiUrl}/answer_with_user_prompts/`;

    // Send the request to the backend
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          query: query.trim(),
          method: method,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `HTTP error! status: ${res.status}, message: ${errorData?.detail || "Unknown error"}`,
        );
      }

      const data = await res.json();
      setChatHistory((prevHistory) => [
        ...prevHistory,
        {
          text: `<strong>Bot:</strong> ${data.cleaned_response}`,
          isUser: false,
        },
      ]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorMessage = (error as Error).message; // Type assertion
        setChatHistory((prevHistory) => [
          ...prevHistory,
          {
            text: `<strong>Bot:</strong> A JavaScript error occurred. ${errorMessage}`,
            isUser: false,
          },
        ]);
      } else {
        setChatHistory((prevHistory) => [
          ...prevHistory,
          {
            text: "<strong>Bot:</strong> An unexpected error occurred.",
            isUser: false,
          },
        ]);
      }
    } finally {
      setLoading(false);
      setKeyword(""); // Reset query
      setPrompt(""); // Reset prompt
      setMethod("bart"); // Reset method to default
    }
  }, [method, prompt, query]);

  // Function to handle clearing the forms
  const handleClearForms = useCallback(() => {
    setKeyword("");
    setPrompt("");
    setMethod("bart");
  }, []);

  // Function to handle clearing the chat
  const handleClearChat = useCallback(() => {
    setChatHistory([]);
  }, []);

  return (
    <div className="flex flex-col h-screen p-8 bg-neutral-100 max-w-4xl mx-auto space-y-8 font-sans">
      <h1 className="text-3xl font-bold text-center text-neutral-800 mb-8">
        RAG-LLM chatbot UI
      </h1>

      {/* Chat history */}
      <div className="flex flex-col flex-grow overflow-y-auto space-y-4 min-h-[100px] bg-neutral-100">
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg text-sm whitespace-pre-wrap break-words max-w-full shadow-md ${
              message.isUser
                ? "self-end bg-primary-100 text-primary-800"
                : "self-start bg-neutral-200 text-neutral-800 border border-neutral-300"
            }`}
            dangerouslySetInnerHTML={{ __html: message.text }}
          />
        ))}

        {loading && (
          <div className="self-end flex items-center space-x-2 text-neutral-500 italic">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Inputs */}
      <div className="flex flex-col space-y-6 w-full">
        {/* Keyword input */}
        <div className="flex flex-col w-full">
          <label
            htmlFor="keyword"
            className="block text-sm font-semibold text-neutral-700 mb-1"
          >
            RAG keyword(s):
          </label>
          <input
            type="text"
            id="keyword"
            value={query}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter keywords"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 
            text-neutral-800 shadow-sm"
          />
        </div>

        {/* User prompt */}
        <div className="flex flex-col w-full">
          <label
            htmlFor="prompt"
            className="block text-sm font-semibold text-neutral-700 mb-1"
          >
            User prompt:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={1}
            placeholder="Your prompt"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 
            text-neutral-800 shadow-sm"
          />
        </div>

        {/* Summarisation method dropdown */}
        <div className="flex flex-col w-full">
          <label
            htmlFor="method"
            className="block text-sm font-semibold text-neutral-700 mb-1"
          >
            Summarisation method:
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 
            text-neutral-800 shadow-sm"
          >
            <option value="bart">BART summary</option>
            <option value="truncate">Truncate context</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-4 justify-between">
        <button
          onClick={handleSendMessage}
          disabled={loading || !query.trim() || !prompt.trim()} // Disable when loading, empty query or prompt
          className={`flex-1 btn-gradient py-3 rounded-md transition shadow-md focus:outline-none focus:ring-2 
            focus:ring-primary-400 
            ${
              loading || !query.trim() || !prompt.trim()
                ? "cursor-not-allowed" // Disabled state
                : "text-white" // Enabled state
            }`}
        >
          Send to chatbot
        </button>
        {/* Clear forms */}
        <button
          onClick={handleClearForms}
          className="flex-1 btn-gradient py-3 rounded-md transition shadow-md focus:outline-none focus:ring-2 
          text-white"
        >
          Clear forms
        </button>

        {/* Clear chat */}
        <button
          onClick={handleClearChat}
          className="flex-1 btn-gradient py-3 rounded-md transition shadow-md focus:outline-none focus:ring-2 
          text-white"
        >
          Clear chat
        </button>

        {/* Download chat */}
        <button
          onClick={downloadChat}
          className="flex-1 btn-gradient py-3 rounded-md transition shadow-md focus:outline-none focus:ring-2 
          text-white"
        >
          Download chat
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
