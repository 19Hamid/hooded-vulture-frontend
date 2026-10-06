export const QUIZ_QUESTIONS = [
  { id: "nest", question: "Where do hooded vultures usually nest?", options: ["High cliffs", "Large trees", "Underground burrows", "Open grasslands"], answer: "Large trees", badge: "Nest Master" },
  { id: "threat", question: "What is the primary threat to hooded vultures in West Africa?", options: ["Habitat loss", "Overfishing", "Invasive species", "Climate cooling"], answer: "Habitat loss", badge: "Conservation Hero" },
  { id: "activities", question: "Hooded vultures are known to help which of these human activities?", options: ["Pollination", "Carcass disposal", "Water purification", "Farming"], answer: "Carcass disposal", badge: "Eco Helper" },
  { id: "status", question: "Which conservation status is assigned to hooded vultures by the IUCN?", options: ["Least Concern", "Endangered", "Critically Endangered", "Vulnerable"], answer: "Critically Endangered", badge: "Status Expert" },
  { id: "country", question: "Which country has the largest hooded vulture population?", options: ["Senegal", "India", "Egypt", "South Africa"], answer: "Senegal", badge: "Vulture Geography Pro" },
];

export function shuffledQuestions(random = Math.random) {
  const questions = [...QUIZ_QUESTIONS];
  for (let index = questions.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [questions[index], questions[swap]] = [questions[swap], questions[index]];
  }
  return questions;
}

const STORAGE_KEY = "beakspeak.quiz.v1";
export function newQuiz() { return { questions: shuffledQuestions(), index: 0, answers: [], badges: [] }; }

export function loadQuiz() {
  const empty = newQuiz();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const questions = saved?.order?.map((id) => QUIZ_QUESTIONS.find((question) => question.id === id));
    if (!questions || questions.length !== 5 || questions.some((question) => !question) || new Set(saved.order).size !== 5 || !Number.isInteger(saved.index) || saved.index < 0 || saved.index > 5 || !Array.isArray(saved.answers) || saved.answers.length > 5) return empty;
    if (saved.answers.length !== saved.index && saved.answers.length !== saved.index + 1) return empty;
    if (saved.answers.some((answer, index) => !questions[index].options.includes(answer))) return empty;
    const badges = Array.isArray(saved.badges) ? [...new Set(saved.badges)].filter((badge) => QUIZ_QUESTIONS.some((question) => question.badge === badge)) : [];
    return { questions, index: saved.index, answers: saved.answers, badges };
  } catch { return empty; }
}

export function saveQuiz(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ order: state.questions.map((question) => question.id), index: state.index, answers: state.answers, badges: state.badges })); }
  catch { /* The quiz still works if persistent storage is unavailable. */ }
}

export function quizReducer(state, action) {
  if (action.type === "answer") {
    const question = state.questions[state.index];
    if (!question || question.id !== action.id || state.answers.length !== state.index || !question.options.includes(action.option)) return state;
    const correct = question.answer === action.option;
    return { ...state, answers: [...state.answers, action.option], badges: correct && !state.badges.includes(question.badge) ? [...state.badges, question.badge] : state.badges };
  }
  if (action.type === "next" && state.index < state.questions.length && state.answers.length === state.index + 1) return { ...state, index: state.index + 1 };
  if (action.type === "replay") return { questions: action.questions, index: 0, answers: [], badges: state.badges };
  return state;
}
