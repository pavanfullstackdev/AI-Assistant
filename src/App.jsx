import { useState, useEffect, useRef } from "react";
import {
  Send,
  Trash2,
  Sparkles,
  Menu,
  Plus,
  MessageSquare,
  Loader2,
  Pencil,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const App = () => {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // Load conversations from memory on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("conversations") || "[]");
    setConversations(saved);
    if (saved.length > 0) {
      setCurrentConversationId(saved[0].id);
      setChats(saved[0].messages);
    }
  }, []);

  // Save conversations to memory whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
        );
        const data = await response.json();

        const availableModels = data.models
          .filter(
            (m) =>
              m.supportedGenerationMethods.includes("generateContent") &&
              m.name.includes("gemini")
          )
          .sort((a, b) => (a.version > b.version ? -1 : 1));

        if (availableModels.length > 0) {
          const modelName = availableModels[0].name.split("/").pop();
          setSelectedModel(modelName);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchModels();
  }, []);

  const formatAIResponse = (text) => {
    if (!text) return "";
    let clean = text.replace(/(\*\*|__)/g, "");
    clean = clean.replace(/^#+\s+/gm, "");
    clean = clean.replace(/<\/?[^>]+(>|$)/g, "");
    return clean.trim();
  };

  const typewriterEffect = async (text, chatId) => {
    const words = text.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, message: currentText } : chat
        )
      );

      // Adjust speed based on word length for more natural typing
      await new Promise((resolve) =>
        setTimeout(resolve, 30 + Math.random() * 20)
      );
    }
  };

  const saveConversation = (updatedChats) => {
    if (currentConversationId) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? {
                ...conv,
                messages: updatedChats,
                updatedAt: new Date().toISOString(),
              }
            : conv
        )
      );
    } else {
      const newConv = {
        id: Date.now(),
        title: updatedChats[0]?.message.slice(0, 30) + "..." || "New Chat",
        messages: updatedChats,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
    }
  };

  const createChat = async (e) => {
    e?.preventDefault();
    if (!message.trim() || !selectedModel || isTyping) return;

    const userMsg = { sender: "user", message: message.trim(), id: Date.now() };
    const updatedChats = [...chats, userMsg];
    setChats(updatedChats);
    setMessage("");
    setTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const payload = {
        contents: [{ parts: [{ text: message.trim() }] }],
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      const aiResult =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I apologize, but I couldn't generate a response.";

      const formattedResult = formatAIResponse(aiResult);
      const aiChatId = Date.now() + 1;

      // Add empty AI message first
      const aiMsg = { sender: "ai", message: "", id: aiChatId };
      const chatsWithAI = [...updatedChats, aiMsg];
      setChats(chatsWithAI);
      setTyping(false);

      // Start typewriter effect
      await typewriterEffect(formattedResult, aiChatId);

      // Save to conversations after typing is complete
      const finalChats = chatsWithAI.map((chat) =>
        chat.id === aiChatId ? { ...chat, message: formattedResult } : chat
      );
      saveConversation(finalChats);
    } catch (err) {
      setTyping(false);
      const errorMsg = {
        sender: "ai",
        message: "Sorry, an error occurred. Please try again.",
        id: Date.now() + 1,
      };
      const errorChats = [...updatedChats, errorMsg];
      setChats(errorChats);
      saveConversation(errorChats);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, isTyping]);

  const newChat = () => {
    setChats([]);
    setCurrentConversationId(null);
    setMessage("");
  };

  const loadConversation = (convId) => {
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setCurrentConversationId(convId);
      setChats(conv.messages);
    }
  };

  const deleteConversation = (convId, e) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (currentConversationId === convId) {
      newChat();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      createChat(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-gray-200 bg-white/80 backdrop-blur-sm flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`group relative flex items-center gap-2 px-3 py-2.5 mb-1 rounded-lg cursor-pointer transition-colors duration-200 ${
                currentConversationId === conv.id
                  ? "bg-amber-100 text-gray-900"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-sm truncate">{conv.title}</span>
              <TooltipProvider>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity">
                        <Pencil className="w-3 h-3 text-gray-600" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  AI Assistant
                </h1>
                <p className="text-xs text-gray-500">Powered by Gemini</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 mt-20">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    How can I help you today?
                  </h2>
                  <p className="text-gray-600">
                    Ask me anything, and I'll do my best to assist you.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                  {[
                    "Explain quantum computing",
                    "Write a poem about the ocean",
                    "Help me plan a trip",
                    "Explain how AI works",
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setMessage(prompt)}
                      className="p-4 text-left border border-gray-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 text-sm text-gray-700 hover:text-gray-900"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex gap-4 ${
                      chat.sender === "user" ? "justify-end" : "justify-start"
                    } animate-in fade-in slide-in-from-bottom-4 duration-500`}
                  >
                    {chat.sender === "ai" && (
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                        chat.sender === "user"
                          ? "bg-gray-900 text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                        {chat.message}
                      </p>
                    </div>
                    {chat.sender === "user" && (
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm font-medium">
                          You
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="relative flex items-end gap-2 bg-white border border-gray-300 rounded-2xl shadow-sm focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all duration-200">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Message AI Assistant..."
                disabled={isTyping}
                rows={1}
                className="flex-1 resize-none bg-transparent px-4 py-3 outline-none text-gray-900 placeholder-gray-400 disabled:opacity-50 max-h-[200px]"
                style={{ minHeight: "48px" }}
              />
              <button
                onClick={createChat}
                disabled={!message.trim() || isTyping}
                className="m-2 p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
