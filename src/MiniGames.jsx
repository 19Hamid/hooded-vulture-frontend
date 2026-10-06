import React, { useReducer, useEffect, useRef } from "react";
import { loadQuiz, saveQuiz, quizReducer, shuffledQuestions } from "./quiz";

function MiniGames() {
  const [state, dispatch] = useReducer(quizReducer, undefined, loadQuiz);
  const headingRef = useRef(null);
  const shouldFocus = useRef(false);
  const question = state.questions[state.index];
  const answer = state.answers[state.index];
  const answered = answer !== undefined;
  const correct = answered && answer === question?.answer;
  const score = state.answers.filter((choice, index) => choice === state.questions[index].answer).length;
  useEffect(() => { saveQuiz(state); }, [state]);
  useEffect(() => { if (shouldFocus.current) { headingRef.current?.focus(); shouldFocus.current = false; } }, [state.index, state.questions]);

  function advance(type) { shouldFocus.current = true; dispatch({ type, ...(type === "replay" ? { questions: shuffledQuestions() } : {}) }); }
  return (
    <div className="mini-games">
      <h2>Vulture quiz</h2>
      {question ? <>
        <p className="quiz-progress">Question {state.index + 1} of {state.questions.length} · Score: {score} / {state.questions.length}</p>
        <h3 ref={headingRef} tabIndex="-1" id="quiz-question">{question.question}</h3>
        <div className="quiz-options" role="group" aria-labelledby="quiz-question">
          {question.options.map((option) => <button type="button" key={option} className={"answer-btn" + (answer === option ? " selected" : "")} disabled={answered} onClick={() => dispatch({ type: "answer", id: question.id, option })}>{option}</button>)}
        </div>
        <div className="quiz-feedback" role="status" aria-live="polite" aria-atomic="true">
          {answered && <p>{correct ? "✅ Correct! Badge earned: " + question.badge : "❌ Incorrect. The correct answer was: " + question.answer}</p>}
        </div>
        {answered && <button type="button" onClick={() => advance("next")}>{state.index === state.questions.length - 1 ? "See results" : "Next question"}</button>}
      </> : <div className="quiz-end">
        <h3 ref={headingRef} tabIndex="-1">🏁 Quiz finished!</h3>
        <p role="status">Your score: {score} / {state.questions.length}</p>
        <button type="button" onClick={() => advance("replay")}>Replay quiz</button>
      </div>}
      <div className="badge-collection">
        <h3>Your badges ({state.badges.length} / 5)</h3>
        {state.badges.length ? <ul>{state.badges.map((badge) => <li key={badge}>🏅 {badge}</li>)}</ul> : <p>Answer correctly to earn a badge.</p>}
      </div>
    </div>
  );
}
export default MiniGames;
