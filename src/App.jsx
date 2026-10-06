import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import happyVulture from "./assets/images/happy.webp";
import normalVulture from "./assets/images/normal.webp";
import angryVulture from "./assets/images/angry.webp";
import MiniGames from "./MiniGames";
import { MAX_TEXT_LENGTH, makeId, loadChat, saveChat, conversationHistory, friendlyError, requestReply } from "./chat";

const MOODS = {
  normal: { image: normalVulture, label: "Normal / Calm" },
  happy: { image: happyVulture, label: "Happy / Playful" },
  angry: { image: angryVulture, label: "Angry / Strict" },
};

function App() {
  const [session, setSession] = useState(loadChat);
  const [turns, setTurns] = useState(() => session.turns);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [personality, setPersonality] = useState("normal");
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia?.("(max-width: 768px)").matches);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const sidebarRef = useRef(null);
  const toggleRef = useRef(null);
  const requestRef = useRef(null);
  const nearBottom = useRef(true);
  const composingRef = useRef(false);

  useEffect(() => {
    saveChat(session.sessionId, turns);
  }, [session.sessionId, turns]);

  useEffect(() => {
    if (nearBottom.current && chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [turns, loading]);

  useEffect(() => () => {
    const request = requestRef.current;
    requestRef.current = null;
    request?.controller.abort();
  }, []);

  async function sendMessage(retryTurn) {
    const text = retryTurn ? retryTurn.text : input.trim();
    if (!text || text.length > MAX_TEXT_LENGTH || requestRef.current) return;
    const id = retryTurn?.id || makeId();
    const mood = retryTurn?.personality || personality;
    const controller = new AbortController();
    const request = { id, controller, cancelled: false };
    requestRef.current = request;
    const previous = retryTurn ? turns.slice(0, turns.findIndex((turn) => turn.id === id)) : turns;
    const turn = { id, text, personality: mood, status: "pending" };
    setTurns((items) => retryTurn ? items.map((item) => item.id === id ? turn : item) : [...items, turn].slice(-40));
    if (!retryTurn) setInput("");
    setLoading(true);
    nearBottom.current = true;
    try {
      const data = await requestReply({ text, personality: mood, sessionId: session.sessionId, history: conversationHistory(previous) }, controller.signal);
      if (requestRef.current !== request) return;
      setTurns((items) => items.map((item) => item.id === id ? { ...item, reply: data.reply.trim(), status: "complete" } : item));
    } catch (error) {
      if (requestRef.current !== request) return;
      const requestId = error.response?.data?.requestId;
      setTurns((items) => items.map((item) => item.id === id ? { ...item, status: "failed", error: request.cancelled ? "Reply stopped. You can retry this message." : friendlyError(error), requestId: typeof requestId === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(requestId) ? requestId : undefined } : item));
    } finally {
      if (requestRef.current === request) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }

  function stopReply() {
    if (requestRef.current) {
      requestRef.current.cancelled = true;
      requestRef.current.controller.abort();
    }
  }

  function clearChat() {
    const request = requestRef.current;
    requestRef.current = null;
    request?.controller.abort();
    setLoading(false);
    setTurns([]);
    setSession({ sessionId: makeId(), turns: [] });
    setInput("");
    inputRef.current?.focus();
  }

  function toggleSidebar() {
    if (sidebarOpen && sidebarRef.current?.contains(document.activeElement)) toggleRef.current?.focus();
    setSidebarOpen((open) => !open);
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>🦅 BeakSpeak</h1>
        <button type="button" ref={toggleRef} className="sidebar-toggle" aria-expanded={sidebarOpen} aria-controls="quiz-sidebar" onClick={toggleSidebar}>
          {sidebarOpen ? "Hide Game" : "Show Game"}
        </button>
      </header>
      <main className="main-content">
        <aside id="quiz-sidebar" className="sidebar" ref={sidebarRef} hidden={!sidebarOpen} aria-label="Hooded vulture quiz" onKeyDown={(event) => { if (event.key === "Escape") { setSidebarOpen(false); toggleRef.current?.focus(); } }}>
          <MiniGames />
        </aside>
        <section className="chat-area" aria-label="Chat with BeakSpeak">
          <div className="personality-selector" role="group" aria-label="BeakSpeak personality">
            {Object.entries(MOODS).map(([mood, details]) => (
              <button key={mood} type="button" aria-pressed={personality === mood} className={personality === mood ? "selected" : ""} onClick={() => setPersonality(mood)}>{details.label}</button>
            ))}
          </div>
          <div className="vulture-top">
            <img src={MOODS[personality].image} alt={personality + " BeakSpeak vulture"} width="150" height="150" className="vulture-image" />
          </div>
          <div className="chat-toolbar">
            <h2>Vulture chat</h2>
            <button type="button" className="text-button" onClick={clearChat} disabled={!turns.length && !input}>Clear chat</button>
          </div>
          <div className="chat-box" ref={chatBoxRef} role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text" aria-atomic="false" onScroll={() => { const box = chatBoxRef.current; nearBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80; }}>
            {!turns.length && <p className="welcome">Ask me about hooded vultures, their habitats, or conservation. Choose a mood to change my tone!</p>}
            {turns.map((turn, index) => (
              <React.Fragment key={turn.id}>
                <div className="msg user-msg"><span className="sr-only">You: </span>{turn.text}</div>
                {turn.status === "complete" && <div className="msg bot-msg"><span className="sr-only">BeakSpeak: </span>{turn.reply}</div>}
                {turn.status === "failed" && (
                  <div className="chat-error" role="alert">
                    <p>{turn.error}</p>
                    {turn.requestId && <p className="request-id">Reference: {turn.requestId}</p>}
                    {index === turns.length - 1 && <div className="error-actions">
                      <button type="button" onClick={() => sendMessage(turn)} disabled={loading}>Retry message</button>
                      <button type="button" className="text-button" onClick={() => { setInput(turn.text); inputRef.current?.focus(); }} disabled={loading}>Edit message</button>
                    </div>}
                  </div>
                )}
              </React.Fragment>
            ))}
            {loading && <div className="msg bot-msg typing" role="status"><span className="sr-only">BeakSpeak is replying…</span><i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" /></div>}
          </div>
          <form className="input-area" onSubmit={(event) => { event.preventDefault(); if (!composingRef.current) sendMessage(); }}>
            <label htmlFor="chat-input" className="sr-only">Message BeakSpeak</label>
            <input id="chat-input" ref={inputRef} type="text" value={input} maxLength={MAX_TEXT_LENGTH} onChange={(event) => setInput(event.target.value)} onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }} onKeyDown={(event) => { if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229 || composingRef.current)) event.preventDefault(); }} placeholder="Ask about the hooded vulture…" autoComplete="off" aria-describedby="input-help" />
            {loading ? <button type="button" onClick={stopReply}>Stop</button> : <button type="submit" disabled={!input.trim()}>Send</button>}
          </form>
          <p id="input-help" className="input-help">{input.length} / {MAX_TEXT_LENGTH} characters</p>
        </section>
      </main>
    </div>
  );
}

export default App;
