import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send, Sparkles, Bot, User, HelpCircle, BookOpen, Lightbulb, Award } from "lucide-react";
import "./quizcopilot.css";

export default function QuizCopilot({ activeQuestion = null, submitted = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: "Hello! I am QuizCopilot, your supportive AI study companion. Ask me anything about your quiz topics, formulas, or study tips! 📚✨",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Read Gemini API Key from Settings
  const getApiKey = () => {
    try {
      const settings = JSON.parse(localStorage.getItem("quizSettings")) || {};
      return settings.geminiApiKey || "";
    } catch {
      return "";
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const apiKey = getApiKey();
      
      // Prepare context if active question is provided
      let context = null;
      if (activeQuestion) {
        context = {
          activeQuestion: activeQuestion.question,
          options: activeQuestion.options || [],
          type: activeQuestion.type || "mcq",
        };
      }

      const res = await axios.post("/api/ai/chat", {
        message: text,
        context,
        apiKey,
      });

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: res.data.reply || "I'm sorry, I couldn't process that.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Copilot Error:", err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        text: "Oops! I encountered an error connecting to the learning server. Please check if the backend is running.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const triggerQuickAction = (type) => {
    if (!activeQuestion) {
      if (type === "study_tip") {
        handleSendMessage("Can you give me a quick study tip?");
      } else if (type === "study_plan") {
        handleSendMessage("Can you generate a balanced weekly study plan for my quiz preparation? (Subjects: Mathematics, Physics, Chemistry, Biology, Computer Science, English).");
      } else if (type === "motivation") {
        handleSendMessage("I need some study motivation. Give me a quick inspirational learning quote and dynamic advice!");
      }
      return;
    }

    if (type === "hint") {
      handleSendMessage(`Can you give me a conceptual hint for the current question: "${activeQuestion.question}"? Please don't reveal the exact answer directly.`);
    } else if (type === "explain") {
      handleSendMessage(`Can you explain the core concepts related to this topic/question: "${activeQuestion.question}"?`);
    } else if (type === "study_tip") {
      handleSendMessage("Can you give me a quick study tip to stay focused during exams?");
    }
  };

  return (
    <div className="quiz-copilot-container">
      {/* Floating Action Button */}
      <button
        className={`copilot-trigger-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Ask QuizCopilot AI"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
        {!isOpen && <span className="pulse-glow" />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="copilot-chat-window">
          {/* Header */}
          <div className="copilot-header">
            <div className="header-info">
              <Sparkles size={18} className="sparkle-icon" />
              <div>
                <h3>QuizCopilot AI</h3>
                <span className="online-tag">Study Companion</span>
              </div>
            </div>
            <button className="close-panel-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="copilot-messages-area">
            {messages.map((msg) => (
              <div key={msg.id} className={`copilot-message-row ${msg.sender}`}>
                <div className="avatar-wrapper">
                  {msg.sender === "ai" ? (
                    <div className="ai-avatar"><Bot size={16} /></div>
                  ) : (
                    <div className="user-avatar"><User size={16} /></div>
                  )}
                </div>
                <div className="message-content-bubble">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                  <span className="msg-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing / Loading Indicator */}
            {loading && (
              <div className="copilot-message-row ai">
                <div className="avatar-wrapper">
                  <div className="ai-avatar"><Bot size={16} /></div>
                </div>
                <div className="message-content-bubble loading-bubble">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Contextual Quick Actions */}
          <div className="copilot-quick-actions">
            {activeQuestion && !submitted ? (
              <>
                <button onClick={() => triggerQuickAction("hint")}>
                  <Lightbulb size={13} />
                  Get Hint
                </button>
                <button onClick={() => triggerQuickAction("explain")}>
                  <BookOpen size={13} />
                  Explain Concept
                </button>
              </>
            ) : (
              <>
                <button onClick={() => triggerQuickAction("study_plan")}>
                  <Sparkles size={13} />
                  Study Plan
                </button>
                <button onClick={() => triggerQuickAction("motivation")}>
                  <Award size={13} />
                  Get Motivation
                </button>
              </>
            )}
            <button onClick={() => triggerQuickAction("study_tip")}>
              <HelpCircle size={13} />
              Study Tip
            </button>
          </div>

          {/* Input Panel */}
          <form
            className="copilot-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              placeholder="Ask QuizCopilot anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !inputValue.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
