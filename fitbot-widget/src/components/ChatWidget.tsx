import { useState, useEffect, useRef } from 'preact/hooks';
import { MessageCircle, X, Send, Info } from 'lucide-preact';
import { ApiClient } from '../api/client';
import type { Message, WidgetConfig } from '../types';
import snarkdown from 'snarkdown';

interface ChatWidgetProps {
    apiKey: string;
}

export function ChatWidget({ apiKey }: ChatWidgetProps) {
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
        clientRef.current = new ApiClient(apiKey);
        clientRef.current.getConfig()
            .then(setConfig)
            .catch((err) => console.error('Config load failed:', err));
    }, [apiKey]);

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
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: bottom right;
          opacity: ${isOpen ? 1 : 0};
          transform: ${isOpen ? 'scale(1)' : 'scale(0.8)'};
          pointer-events: ${isOpen ? 'all' : 'none'};
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
        }
        .fitbot-message.user {
          margin-left: auto;
        }
        .fitbot-bubble {
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
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
          outline: none;
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
                        <span style={{ fontWeight: 600 }}>FitBot Assistant</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="fitbot-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`fitbot-message ${msg.role}`}>
                            <div
                                className="fitbot-bubble"
                                dangerouslySetInnerHTML={{ __html: snarkdown(msg.content) }}
                            />
                            {msg.role === 'assistant' && msg.explanation && (
                                <ExplanationItem explanation={msg.explanation} />
                            )}
                        </div>
                    ))}
                    {isTyping && messages[messages.length - 1].isStreaming === false && (
                        <div className="fitbot-message assistant">
                            <div className="fitbot-bubble">...</div>
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

function ExplanationItem({ explanation }: { explanation: any }) {
    const [show, setShow] = useState(false);

    return (
        <div style={{ marginTop: '4px' }}>
            <button
                className="explanation-toggle"
                onClick={() => setShow(!show)}
            >
                <Info size={12} />
                {show ? 'Hide reasoning' : 'Why did I say this?'}
            </button>
            {show && (
                <div className="explanation-content">
                    <div style={{ marginBottom: '4px', textDecoration: 'underline', fontWeight: 600 }}>Source & Reasoning</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px' }}>
                        <strong>Provider:</strong> <span>{explanation.provider}</span>
                        <strong>Model:</strong> <span>{explanation.model}</span>
                        <strong>Context:</strong> <span>{explanation.contextUsed}</span>
                        <strong>Prompt:</strong> <span>{explanation.systemPromptSummary}</span>
                        <strong>Latency:</strong> <span>{explanation.responseTimeMs}ms</span>
                        {explanation.validationResults?.length > 0 && (
                            <>
                                <strong>Safety:</strong>
                                <span>{explanation.validationResults.map((r: any) => `${r.ruleId} (${r.severity})`).join(', ')}</span>
                            </>
                        )}
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '10px', color: '#999', textAlign: 'right' }}>
                        {new Date(explanation.timestamp).toLocaleString()}
                    </div>
                </div>
            )}
        </div>
    );
}
