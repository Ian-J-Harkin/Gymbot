import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface ChatbotPreviewProps {
  primaryColor: string;
  isActive: boolean;
  widgetTitle?: string;
}

export const ChatbotPreview: React.FC<ChatbotPreviewProps> = ({
  primaryColor,
  isActive,
  widgetTitle = 'FitBot Assistant',
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages] = useState([
    {
      id: 1,
      text: "Hi! I'm FitBot, your gym assistant. How can I help you today?",
      sender: 'bot',
    },
    {
      id: 2,
      text: "What are your opening hours?",
      sender: 'user',
    },
    {
      id: 3,
      text: "We're open Monday to Friday 6 AM - 10 PM, Saturday 8 AM - 8 PM, and Sunday 9 AM - 6 PM. Is there anything else you'd like to know?",
      sender: 'bot',
    },
  ]);

  if (!isActive) {
    return (
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">Chatbot Disabled</h3>
        <p className="text-gray-400">
          Enable the chatbot to see the live preview
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative min-h-[400px]">
      <div className="bg-white rounded-lg shadow-lg h-full relative">
        {/* Preview Browser Header */}
        <div className="bg-gray-100 px-4 py-2 rounded-t-lg border-b">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500 ml-2">
              yourgymnamehere.com
            </span>
          </div>
        </div>

        {/* Mock Website Content */}
        <div className="p-6 bg-white rounded-b-lg min-h-[300px] relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-400 mb-2">
              Mock Website Layout
            </h2>
            <p className="text-gray-400">
              This is a preview of how the widget looks embedded on a page.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-100 h-20 rounded"></div>
            <div className="bg-gray-100 h-20 rounded"></div>
          </div>

          {/* Chatbot Widget */}
          <div className="fixed bottom-6 right-6">
            {isOpen && (
              <div className="mb-4 w-80 h-96 bg-white rounded-lg shadow-xl border overflow-hidden">
                {/* Chat Header */}
                <div
                  className="px-4 py-3 text-white flex items-center justify-between"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span className="font-medium">{widgetTitle}</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 p-4 space-y-3 h-64 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${message.sender === 'user'
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                        style={{
                          backgroundColor:
                            message.sender === 'user' ? primaryColor : undefined,
                        }}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="border-t p-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      disabled
                    />
                    <button
                      className="p-2 text-white rounded-lg"
                      style={{ backgroundColor: primaryColor }}
                      disabled
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-14 h-14 rounded-full text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MessageCircle className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};