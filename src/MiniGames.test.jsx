import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MiniGames from './MiniGames';
import { QUIZ_QUESTIONS, quizReducer, shuffledQuestions } from './quiz';

beforeEach(() => localStorage.clear());

function questionOnScreen() { return QUIZ_QUESTIONS.find((question) => screen.queryByText(question.question)); }

test('one choice per question, bounded scoring, final badges, and safe replay under StrictMode', () => {
  render(<React.StrictMode><MiniGames /></React.StrictMode>);
  for (let i = 0; i < 5; i += 1) {
    const question = questionOnScreen();
    const answer = screen.getByRole('button', { name: question.answer, exact: true });
    fireEvent.click(answer);
    fireEvent.click(answer);
    fireEvent.click(answer);
    expect(answer).toBeDisabled();
    expect(screen.getByText(/Question .* Score:/)).toHaveTextContent('Score: ' + (i + 1) + ' / 5');
    fireEvent.click(screen.getByRole('button', { name: i === 4 ? 'See results' : 'Next question' }));
  }
  expect(screen.getByText('Your score: 5 / 5')).toBeInTheDocument();
  expect(screen.getByText('Your badges (5 / 5)')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Replay quiz' }));
  expect(screen.getByText(/Question 1 of 5/)).toHaveTextContent('Score: 0 / 5');
  expect(screen.getByText('Your badges (5 / 5)')).toBeInTheDocument();
});

test('a wrong answer cannot be changed to gain points', () => {
  render(<MiniGames />);
  const question = questionOnScreen();
  const wrong = question.options.find((option) => option !== question.answer);
  fireEvent.click(screen.getByRole('button', { name: wrong, exact: true }));
  fireEvent.click(screen.getByRole('button', { name: question.answer, exact: true }));
  expect(screen.getByText(/Question .* Score:/)).toHaveTextContent('Score: 0 / 5');
  expect(screen.getByText(/Incorrect. The correct answer was:/)).toBeInTheDocument();
});

test('progress survives remount and hidden state without re-enabling an answered question', () => {
  const view = render(<MiniGames />);
  const question = questionOnScreen();
  fireEvent.click(screen.getByRole('button', { name: question.answer, exact: true }));
  view.unmount();
  render(<MiniGames />);
  expect(screen.getByRole('button', { name: question.answer, exact: true })).toBeDisabled();
  expect(screen.getByText(/Question .* Score:/)).toHaveTextContent('Score: 1 / 5');
});

test('queued duplicate and stale answers cannot mutate a later question', () => {
  const state = { questions: QUIZ_QUESTIONS, index: 0, answers: [], badges: [] };
  const action = { type: 'answer', id: 'nest', option: 'Large trees' };
  const answered = quizReducer(state, action);
  expect(quizReducer(answered, action)).toBe(answered);
  const next = quizReducer(answered, { type: 'next' });
  expect(quizReducer(next, action)).toBe(next);
  expect(state.answers).toEqual([]);
  expect(state.badges).toEqual([]);
});

test('preserves the two requested answers and shuffles without losing questions', () => {
  expect(QUIZ_QUESTIONS.find((question) => question.id === 'threat').answer).toBe('Habitat loss');
  expect(QUIZ_QUESTIONS.find((question) => question.id === 'country').answer).toBe('Senegal');
  expect(new Set(shuffledQuestions(() => 0).map((question) => question.id))).toEqual(new Set(QUIZ_QUESTIONS.map((question) => question.id)));
});
