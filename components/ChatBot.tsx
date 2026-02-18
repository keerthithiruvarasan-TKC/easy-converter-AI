import React, { useState, useRef, useEffect } from 'react';
import { chatWithEngineer } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ChatBotProps {
  contextData: any;
}

const ChatBot: React.FC<ChatBotProps> = ({ contextData }) => {
  const brand = contextData.recommendation?.brand || "Technical";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset messages when context changes
    setMessages([
        { id: '1', role: 'model', text: `Hello. I am your ${brand} technical assistant. Do you have questions about this cross-reference or running parameters?` }
    ]);
  }, [brand]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await chatWithEngineer(history, contextData, userMsg.text);

    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'bg-gray-600 rotate-90' : 'bg-red-600 hover:bg-red-700 hover:scale-110'
        }`}
      >
        {isOpen ? (
            <i className="fa-solid fa-times text-2xl text-white"></i>
        ) : (
            <i className="fa-solid fa-headset text-2xl text-white"></i>
        )}
      </button>

      <div
        className={`fixed bottom-24 right-6 w-96 h-[500px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
        }`}
      >
        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            <h3 className="font-bold text-gray-800">{brand} Assistant</h3>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-red-600 text-white rounded-tr-none shadow-md shadow-red-100'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-gray-50 border border-gray-200 text-gray-500 p-3 rounded-2xl rounded-tl-none text-xs flex items-center space-x-1">
                 <i className="fa-solid fa-circle-notch fa-spin"></i>
                 <span>Accessing {brand} engineering data...</span>
               </div>
             </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about speeds, feeds, or materials..."
              className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:bg-gray-300"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBot;