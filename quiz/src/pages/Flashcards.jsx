import { useState } from "react";
import axios from "axios";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Loader2,
} from "lucide-react";
import { showToast } from "../utils/toast";
import "./flashcards.css";

export default function Flashcards() {
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Generate flashcards from API
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      showToast("Please enter a subject topic", "error");
      return;
    }

    try {
      setLoading(true);
      setFlipped(false);
      
      // Get API Key from localStorage
      const settings = JSON.parse(localStorage.getItem("quizSettings")) || {};
      const geminiApiKey = settings.geminiApiKey || "";

      const res = await axios.post("/api/ai/flashcards", {
        subject: subject.trim(),
        apiKey: geminiApiKey,
      });

      const generatedCards = res.data?.cards || [];
      if (generatedCards.length > 0) {
        setCards(generatedCards);
        setCurrentIndex(0);
        showToast(
          res.data.source === "ai"
            ? "AI Flashcards generated successfully!"
            : "Offline mode: Generated mock study cards.",
          "success"
        );
      } else {
        showToast("No flashcards returned. Try again.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to generate flashcards. Using mock offline fallback.", "error");
      
      // Secondary fallback client side
      const mockOffline = [
        {
          term: `${subject} - Central Concept`,
          definition: `The primary and most fundamental idea inside ${subject}.`,
          context: `Essential for developing basic competency and resolving practical scenarios in this field.`,
        },
        {
          term: `${subject} - Advanced Theory`,
          definition: `A comprehensive system of ideas intended to explain something in ${subject}.`,
          context: `Formulated based on general principles and observations, forming the standard scientific approach.`,
        },
        {
          term: `${subject} - Key Rule / Equation`,
          definition: `The structured logic or mathematical relation defining systems in ${subject}.`,
          context: `Allows calculations, predictions, and automated logic blocks to solve complex problems.`,
        },
      ];
      setCards(mockOffline);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1);
      }, 150);
    }
  };

  const handleReset = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex(0);
    }, 150);
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="flashcards-page">
      {/* HERO SECTION */}
      <section className="fc-hero">
        <div>
          <p className="fc-eyebrow">Smart Study AI</p>
          <h1>AI Study Flashcards</h1>
          <p>
            Generate smart, context-aware flashcards on any subject. Tap on a card
            to flip and reveal the detailed explanation and real-world context.
          </p>
        </div>

        <form className="fc-generator-card" onSubmit={handleGenerate}>
          <div className="fc-input-group">
            <label htmlFor="topic-input">Enter Subject or Topic</label>
            <input
              id="topic-input"
              type="text"
              value={subject}
              placeholder="e.g. Photosynthesis, React Hooks, Calculus"
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
            />
          </div>
          <button className="fc-gen-btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="fc-spinner" size={18} />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Cards
              </>
            )}
          </button>
        </form>
      </section>

      {/* FLASHCARD VIEW AREA */}
      {loading ? (
        <section className="fc-loading-panel">
          <Loader2 className="fc-spinner" size={40} />
          <p>QuizCopilot is analyzing "{subject}" to craft flashcards...</p>
        </section>
      ) : cards.length > 0 ? (
        <section className="fc-playground">
          <div
            className={`fc-card-container ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped(!flipped)}
          >
            <div className="fc-card-flipper">
              {/* Front Side */}
              <div className="fc-card-face fc-card-front">
                <span className="fc-card-badge">Concept Term</span>
                <h2 className="fc-term-text">{currentCard.term}</h2>
                <div className="fc-flip-hint">Click card to reveal definition</div>
              </div>

              {/* Back Side */}
              <div className="fc-card-face fc-card-back">
                <span className="fc-card-badge">Definition</span>
                <p className="fc-definition-text">{currentCard.definition}</p>
                {currentCard.context && (
                  <div className="fc-context-text">
                    <strong>Context / Example:</strong> {currentCard.context}
                  </div>
                )}
                <div className="fc-flip-hint">Click card to show term</div>
              </div>
            </div>
          </div>

          {/* Controls and Counters */}
          <div className="fc-controls-bar">
            <button className="fc-reset-btn" onClick={handleReset}>
              <RotateCcw size={16} />
              Reset Cards
            </button>

            <span className="fc-counter">
              Card {currentIndex + 1} of {cards.length}
            </span>

            <div className="fc-nav-btns">
              <button
                className="fc-nav-btn"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                aria-label="Previous card"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="fc-nav-btn"
                onClick={handleNext}
                disabled={currentIndex === cards.length - 1}
                aria-label="Next card"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* EMPTY STATE */
        <section className="fc-empty-state">
          <div className="fc-empty-icon">
            <BookOpen size={36} />
          </div>
          <h3>Study Cards Ready</h3>
          <p>
            Enter a subject or concept topic above and generate customized 3D interactive flashcards instantly.
          </p>
        </section>
      )}
    </div>
  );
}
