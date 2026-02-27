import { useState, useEffect, useRef } from 'preact/hooks';
import { MessageCircle, X, Send, Info, RotateCcw, FileText } from 'lucide-preact';
import { ApiClient } from '../api/client';
import type { Message, WidgetConfig, ExplanationMetadata } from '../types';
import snarkdown from 'snarkdown';
import DOMPurify from 'dompurify';

interface ChatWidgetProps {
  apiKey: string;
  apiUrl: string;
}

export function ChatWidget({ apiKey, apiUrl }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm FitBot, your gym assistant. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const clientRef = useRef<ApiClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clientRef.current = new ApiClient(apiKey, apiUrl);
    clientRef.current.getConfig()
      .then(setConfig)
      .catch((err) => console.error('Config load failed:', err));
  }, [apiKey, apiUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !clientRef.current || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Use history excluding the last message (current user message)
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const stream = clientRef.current.streamChat(userMessage.content, history);

      let accumulatedContent = '';
      for await (const chunk of stream) {
        if (typeof chunk === 'string') {
          accumulatedContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulatedContent } : m
            )
          );
        } else if (chunk.explanation) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, explanation: chunk.explanation } : m
            )
          );
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: (m.content || '') + '\n\n[Error: Connection failed]' } : m
        )
      );
    } finally {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
      setIsTyping(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: config?.greetingMessage || "Hi! I'm FitBot, your gym assistant. How can I help you today?",
      },
    ]);
    setInputValue('');
  };

  const primaryColor = config?.widgetColor || '#2563EB';

  return (
    <div className="fitbot-widget-container">
      {/* Custom Styles */}
      <style>{`
        .fitbot-widget-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .fitbot-launcher {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: ${primaryColor};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: transform 0.2s ease;
          border: none;
        }
        .fitbot-launcher:hover {
          transform: scale(1.05);
        }
        .fitbot-chat-window {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 380px;
          height: 600px;
          max-height: calc(100vh - 110px);
          max-width: calc(100vw - 40px);
          background-color: white;
          border-radius: 16px;
          box-shadow: 0 5px 40px rgba(0,0,0,0.16);
          display: ${isOpen ? 'flex' : 'none'};
          flex-direction: column;
          overflow: hidden;
          z-index: 999999;
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: bottom right;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .fitbot-header {
          background-color: ${primaryColor};
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fitbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background-color: #f8f9fa;
        }
        .fitbot-message {
          margin-bottom: 12px;
          max-width: 85%;
          position: relative;
          animation: fadeIn 0.3s ease-out forwards;
        }
        .fitbot-message.user {
          margin-left: auto;
        }
        .fitbot-bubble {
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .fitbot-message.user .fitbot-bubble {
          background-color: ${primaryColor};
          color: white;
          border-bottom-right-radius: 4px;
        }
        .fitbot-message.assistant .fitbot-bubble {
          background-color: white;
          color: #333;
          border: 1px solid #e0e0e0;
          border-bottom-left-radius: 4px;
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 6px 0;
          align-items: center;
        }
        .typing-dot {
          width: 5px;
          height: 5px;
          background-color: #999;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        .fitbot-input-area {
          padding: 12px;
          border-top: 1px solid #eee;
          display: flex;
          gap: 8px;
        }
        .fitbot-input {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
          color: #111827;
          background-color: #ffffff;
          outline: none;
          transition: border-color 0.2s;
        }
        .fitbot-input::placeholder {
          color: #6b7280;
        }
        .fitbot-input:focus {
          border-color: ${primaryColor};
        }
        .fitbot-send-btn {
          background: none;
          border: none;
          color: ${primaryColor};
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: transform 0.2s;
        }
        .fitbot-send-btn:hover:not(:disabled) {
          transform: scale(1.1);
        }
        .fitbot-send-btn:disabled {
          color: #ccc;
        }
        .explanation-toggle {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          color: #888;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 3px;
          transition: color 0.2s;
        }
        .explanation-toggle:hover {
          color: ${primaryColor};
        }
        .explanation-content {
          margin-top: 8px;
          padding: 8px;
          background: #f0f4f8;
          border-radius: 8px;
          font-size: 11px;
          color: #555;
          border-left: 3px solid ${primaryColor};
          animation: fadeIn 0.2s ease-out;
        }

        .explanation-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 9px;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .sources-container {
          margin-top: 8px;
        }
        .sources-label {
          font-size: 10px;
          font-weight: 700;
          color: #666;
          margin-bottom: 6px;
        }
        .sources-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 4px 0 12px 0;
          -webkit-overflow-scrolling: touch;
          mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
        .sources-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .sources-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .sources-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .sources-scroll::-webkit-scrollbar-thumb:hover {
          background: ${primaryColor};
        }
        .source-card {
          flex: 0 0 200px;
          min-width: 200px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
        }
        .source-card:hover {
          border-color: ${primaryColor};
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .source-card-header {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
        }
        .source-filename {
          font-size: 10px;
          font-weight: 600;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .source-snippet {
          font-size: 9px;
          line-height: 1.3;
          color: #777;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .no-sources {
          font-style: italic;
          opacity: 0.7;
        }

        @media (max-width: 480px) {
          .fitbot-chat-window {
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            max-width: 100vw;
            bottom: 0;
            right: 0;
            border-radius: 0;
          }
          .fitbot-launcher {
            display: ${isOpen ? 'none' : 'flex'};
          }
        }
      `}</style>

      {/* Launcher */}
      <button
        className="fitbot-launcher"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      <div className="fitbot-chat-window">
        <div className="fitbot-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={20} />
            <span style={{ fontWeight: 600 }}>{config?.widgetTitle || 'FitBot Assistant'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={resetChat}
              title="Reset Chat"
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              title="Close"
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="fitbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`fitbot-message ${msg.role}`}>
              <div
                className="fitbot-bubble"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(snarkdown(msg.content)) }}
              />
              {msg.role === 'assistant' && msg.explanation && (
                <ExplanationItem explanation={msg.explanation} />
              )}
            </div>
          ))}
          {isTyping && messages[messages.length - 1].isStreaming === false && (
            <div className="fitbot-message assistant">
              <div className="fitbot-bubble" style={{ width: 'fit-content' }}>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="fitbot-input-area">
          <input
            className="fitbot-input"
            value={inputValue}
            onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            disabled={isTyping}
          />
          <button
            className="fitbot-send-btn"
            onClick={handleSend}
            disabled={isTyping || !inputValue.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExplanationItem({ explanation }: { explanation: ExplanationMetadata }) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ marginTop: '4px' }}>
      <button
        className="explanation-toggle"
        onClick={() => setShow(!show)}
      >
        <Info size={12} />
        {show ? 'Hide sources & reasoning' : 'Why did I say this?'}
      </button>

      {show && (
        <div className="explanation-content">
          {/* Summary Stats */}
          <div className="explanation-stats">
            <span>{explanation.provider}/{explanation.model}</span>
            <span>{explanation.responseTimeMs}ms</span>
          </div>

          {/* Source Cards */}
          {explanation.sources && explanation.sources.length > 0 && (
            <div className="sources-container">
              <div className="sources-label">Cited Documents:</div>
              <div className="sources-scroll">
                {explanation.sources.map((source) => (
                  <div key={source.id} className="source-card" title={source.fileName}>
                    <div className="source-card-header">
                      <FileText size={12} className="text-primary" />
                      <span className="source-filename">{source.fileName}</span>
                    </div>
                    <p className="source-snippet">
                      "{source.content.length > 100 ? source.content.substring(0, 100) + '...' : source.content}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!explanation.sources?.length && (
            <div className="no-sources">No specific document was cited (using general gym knowledge).</div>
          )}

          <div style={{ marginTop: '8px', fontSize: '9px', color: '#bbb', textAlign: 'right' }}>
            Reference: {new Date(explanation.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
