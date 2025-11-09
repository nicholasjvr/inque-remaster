'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

interface AIBotProps {
  onClose?: () => void;
}

export default function AIBot({ onClose }: AIBotProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: "Hi! I'm your inQ assistant. I can help you navigate the app, create projects, customize your profile, and answer questions. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Navigation help
    if (lowerMessage.includes('create') || lowerMessage.includes('project') || lowerMessage.includes('upload')) {
      return "To create a new project, go to the Widget Studio (/studio). You can upload HTML, CSS, and JavaScript files to create interactive widgets. Click 'Upload Widget' in an empty slot to get started!";
    }

    if (lowerMessage.includes('customize') || lowerMessage.includes('profile') || lowerMessage.includes('avatar')) {
      return "To customize your profile, expand the Profile Hub and open the 'Customization Shop' section. You can choose avatar frames, animations, and background images to personalize your profile!";
    }

    if (lowerMessage.includes('reprack') || lowerMessage.includes('featured')) {
      return "RepRack is your featured projects showcase! You can select up to 3 projects from your uploaded widgets to display prominently on your profile. Go to Featured Projects and use the RepRack Manager to select your best work.";
    }

    if (lowerMessage.includes('explore') || lowerMessage.includes('discover') || lowerMessage.includes('browse')) {
      return "Check out the Explore page (/explore) to discover amazing projects from the community. You can filter by category, sort by popularity, and interact with other creators' work!";
    }

    if (lowerMessage.includes('studio') || lowerMessage.includes('widget')) {
      return "The Widget Studio (/studio) is where you create and manage your projects. You have 3 slots available - upload HTML/CSS/JS files to create interactive widgets that showcase your creativity!";
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return "I can help you with:\n• Creating and uploading projects\n• Customizing your profile\n• Navigating the app\n• Understanding features like RepRack\n• Finding and exploring content\n\nWhat specific topic would you like help with?";
    }

    if (lowerMessage.includes('sign in') || lowerMessage.includes('login') || lowerMessage.includes('account')) {
      return "To sign in, click the Auth button in the header. You can sign in with Google or create an account with email/password. Once signed in, you'll have access to all features!";
    }

    // Default responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello${user ? `, ${user.displayName || user.email?.split('@')[0] || 'there'}` : ' there'}! How can I help you today?`;
    }

    return "I'm here to help! You can ask me about:\n• Creating projects\n• Customizing your profile\n• Navigating the app\n• Using features\n• Getting started\n\nWhat would you like to know?";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    const newUserMessage: ChatMessage = {
      sender: 'user',
      text: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get AI response
    const aiResponse = await handleAIResponse(userMessage);
    
    const aiMessage: ChatMessage = {
      sender: 'ai',
      text: aiResponse,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  return (
    <div className="ai-bot-container">
      <div className="ai-bot-header">
        <div className="ai-bot-title">
          <span className="ai-bot-icon">🤖</span>
          <span>AI Assistant</span>
        </div>
        {onClose && (
          <button className="ai-bot-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>

      <div className="ai-bot-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`ai-bot-message ai-bot-message--${message.sender}`}
          >
            <div className="ai-bot-message-content">
              {message.text.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <div className="ai-bot-message-time">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="ai-bot-message ai-bot-message--ai">
            <div className="ai-bot-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="ai-bot-input-form" onSubmit={handleSend}>
        <input
          type="text"
          className="ai-bot-input"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isTyping}
        />
        <button
          type="submit"
          className="ai-bot-send"
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

