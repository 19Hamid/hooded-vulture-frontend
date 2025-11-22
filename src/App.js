import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";
import happyVulture from "./assets/images/happy.png";
import normalVulture from "./assets/images/normal.png";
import angryVulture from "./assets/images/angry.png";
import MiniGames from "./MiniGames";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [personality, setPersonality] = useState("normal");
  const [mood, setMood] = useState("normal");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatBoxRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const moodImages = {
    happy: happyVulture,
    normal: normalVulture,
    angry: angryVulture,
  };

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    // Add user message to chat
    setMessages(prev => [...prev, { sender: "user", text: trimmedInput }]);
    setInput("");
    setLoading(true);

    try {
      // Call the backend using the environment variable
      const res = await axios.post(process.env.REACT_APP_BACKEND_URL, {
        text: trimmedInput,
        personality,
        sessionId: "user_hamid"
      });

      // Add bot response
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: res.data.reply || "🦅 BeakSpeak couldn't respond 😭" }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "💀 BeakSpeak error: " + error.message }
      ]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="App">
      <header>
        <h1>🦅 BeakSpeak</h1>
        <button
          className="mobile-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? "Hide Game" : "Show Game"}
        </button>
      </header>

      <div className={`main-content ${sidebarOpen ? "" : "sidebar-closed"}`}>
        <aside className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
          <MiniGames />
        </aside>

        <div className="chat-area">
          <div className="personality-selector">
            {["normal", "happy", "angry"].map((p) => (
              <button
                key={p}
                className={personality === p ? "selected" : ""}
                onClick={() => {
                  setPersonality(p);
                  setMood(p);
                }}
              >
                {p === "normal" && "Normal / Calm"}
                {p === "happy" && "Happy / Playful"}
                {p === "angry" && "Angry / Strict"}
              </button>
            ))}
          </div>

          <div className="vulture-top">
            <img
              src={moodImages[mood]}
              alt="BeakSpeak Mood"
              className="vulture-image"
            />
          </div>

          <div className="chat-box" ref={chatBoxRef}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`msg ${msg.sender === "user" ? "user-msg" : "bot-msg"}`}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <div className="msg bot-msg typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>

          <div className="input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the hooded vulture..."
            />
            <button onClick={sendMessage} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;