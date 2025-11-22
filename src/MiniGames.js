import React, { useState, useEffect } from "react";

// Five quiz questions about hooded vultures
const QUIZ_QUESTIONS = [
  {
    question: "Where do hooded vultures usually nest?",
    options: ["High cliffs", "Large trees", "Underground burrows", "Open grasslands"],
    answer: "Large trees",
    badge: "Nest Master"
  },
  {
    question: "What is the primary threat to hooded vultures in West Africa?",
    options: ["Habitat loss", "Overfishing", "Invasive species", "Climate cooling"],
    answer: "Habitat loss",
    badge: "Conservation Hero"
  },
  {
    question: "Hooded vultures are known to help which of these human activities?",
    options: ["Pollination", "Carcass disposal", "Water purification", "Farming"],
    answer: "Carcass disposal",
    badge: "Eco Helper"
  },
  {
    question: "Which conservation status is assigned to hooded vultures by the IUCN?",
    options: ["Least Concern", "Endangered", "Critically Endangered", "Vulnerable"],
    answer: "Critically Endangered",
    badge: "Status Expert"
  },
  {
    question: "Which country has the largest hooded vulture population?",
    options: ["Senegal", "India", "Egypt", "South Africa"],
    answer: "Senegal",
    badge: "Vulture Geography Pro"
  }
];

function MiniGames() {
  const [activeTab, setActiveTab] = useState("quiz");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({
    questions_answered: 0,
    badges: [],
  });
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [message, setMessage] = useState("");
  const [earnedBadge, setEarnedBadge] = useState("");
  const [fadeMessage, setFadeMessage] = useState(true);

  // Initialize quiz questions (shuffled)
  const startQuiz = () => {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
    setQuizQuestions(shuffled);
    setCurrentIndex(0);
    setStats({ questions_answered: 0, badges: [] });
    setCorrectAnswersCount(0);
    setMessage("");
    setEarnedBadge("");
    setFadeMessage(true);
  };

  const handleAnswerClick = (selectedOption) => {
    const currentQuestion = quizQuestions[currentIndex];
    if (!currentQuestion) return;

    const correct = selectedOption === currentQuestion.answer;
    let badgeEarned = "";
    let resultMessage = "";

    // Increment correct answers once if correct
    if (correct) setCorrectAnswersCount(prev => prev + 1);

    setStats(prevStats => {
      const newStats = { ...prevStats, questions_answered: prevStats.questions_answered + 1 };

      if (correct) {
        badgeEarned = currentQuestion.badge;
        if (!prevStats.badges.includes(badgeEarned)) newStats.badges.push(badgeEarned);
        resultMessage = `✅ Correct! Badge earned: ${badgeEarned}`;
      } else {
        resultMessage = `❌ Incorrect. The correct answer was: ${currentQuestion.answer}`;
      }

      setMessage(resultMessage);
      setEarnedBadge(badgeEarned);
      setFadeMessage(true);

      return newStats;
    });

    // Move to next question after 2 seconds with fade effect
    setTimeout(() => {
      setFadeMessage(false); // trigger fade out
      setTimeout(() => {
        if (currentIndex + 1 < quizQuestions.length) {
          setCurrentIndex(currentIndex + 1);
          setMessage("");
          setEarnedBadge("");
          setFadeMessage(true);
        } else {
          setCurrentIndex(null); // Quiz finished
        }
      }, 500); // fade out duration
    }, 2000); // user reading delay
  };

  const currentQuestion = quizQuestions[currentIndex];

  useEffect(() => {
    startQuiz();
  }, []);

  return (
    <div className="mini-games">
      <h3>Quiz</h3>
      {currentQuestion ? (
        <div className="quiz-tab">
          <p>{currentQuestion.question}</p>
          {currentQuestion.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswerClick(opt)}
              style={{
                display: "block",
                margin: "5px 0",
                width: "100%",
                cursor: "pointer",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="quiz-end">
          <p>🏁 Quiz Finished!</p>
          <p>Your score: {correctAnswersCount} / {quizQuestions.length}</p>
          <button onClick={startQuiz}>Replay Quiz</button>
        </div>
      )}

      {message && (
        <p
          className="mini-game-message"
          style={{
            opacity: fadeMessage ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        >
          {message}
        </p>
      )}

      {earnedBadge && (
        <p
          className="earned-badge"
          style={{
            opacity: fadeMessage ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        >
          🏅 Badge Earned: {earnedBadge}
        </p>
      )}
    </div>
  );
}

export default MiniGames;