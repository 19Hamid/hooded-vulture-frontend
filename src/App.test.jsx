import { vi } from "vitest";
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import App from './App';
import { SESSION_KEY, chatEndpoint, conversationHistory } from './chat';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

function send(text) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Message BeakSpeak' }), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Send', exact: true }));
}

test('normalises the existing production base URL and complete endpoints', () => {
  expect(chatEndpoint('https://hooded-vulture-backend.vercel.app/')).toBe('https://hooded-vulture-backend.vercel.app/api/chat');
  expect(chatEndpoint('https://example.com/api/chat/')).toBe('https://example.com/api/chat');
  expect(() => chatEndpoint('https://example.com/wrong-route')).toThrow();
});

test('sends moods and complete conversation turns with an individual session', async () => {
  axios.post.mockResolvedValueOnce({ data: { reply: 'Hooded vultures clean up carrion.' } }).mockResolvedValueOnce({ data: { reply: 'They help keep habitats clean.' } });
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Happy / Playful' }));
  expect(screen.getByRole('button', { name: 'Happy / Playful' })).toHaveAttribute('aria-pressed', 'true');
  send('What do vultures eat?');
  await screen.findByText('Hooded vultures clean up carrion.');
  send('Why does that matter?');
  await screen.findByText('They help keep habitats clean.');
  const [url, payload, options] = axios.post.mock.calls[1];
  expect(url).toBe('https://hooded-vulture-backend.vercel.app/api/chat');
  expect(payload.personality).toBe('happy');
  expect(payload.sessionId).not.toBe('user_hamid');
  expect(payload.history).toEqual([{ role: 'user', content: 'What do vultures eat?' }, { role: 'assistant', content: 'Hooded vultures clean up carrion.' }]);
  expect(options.timeout).toBe(30000);
  expect(options.signal).toBeDefined();
  expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)).turns).toHaveLength(2);
});

test('retry recovers the failed turn without duplicating it or inventing context', async () => {
  axios.post.mockRejectedValueOnce({ response: { status: 503, data: { code: 'PROVIDER_KEY_REJECTED', requestId: 'request-123' } } }).mockResolvedValueOnce({ data: { reply: 'Recovered reply' } });
  render(<App />);
  send('Tell me about vultures');
  await screen.findByText(/service configuration needs attention/);
  expect(screen.getByText('Reference: request-123')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry message' }));
  await screen.findByText('Recovered reply');
  expect(screen.getAllByText('Tell me about vultures')).toHaveLength(1);
  expect(axios.post.mock.calls[1][1].history).toEqual([]);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('guards repeated submit events and aborts a stopped request', async () => {
  let signal;
  axios.post.mockImplementation((url, payload, options) => new Promise((resolve, reject) => {
    signal = options.signal;
    signal.addEventListener('abort', () => reject({ code: 'ERR_CANCELED' }));
  }));
  render(<App />);
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'Hello' } });
  fireEvent.submit(input.closest('form'));
  fireEvent.submit(input.closest('form'));
  expect(axios.post).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
  await screen.findByText(/Reply stopped/);
  expect(signal.aborted).toBe(true);
  expect(screen.getByRole('button', { name: 'Retry message' })).toBeEnabled();
});

test('clear chat invalidates an in-flight response and resets the session', async () => {
  let resolve;
  axios.post.mockImplementation(() => new Promise((done) => { resolve = done; }));
  render(<App />);
  send('A pending question');
  const firstSession = axios.post.mock.calls[0][1].sessionId;
  fireEvent.click(screen.getByRole('button', { name: 'Clear chat' }));
  await act(async () => resolve({ data: { reply: 'Stale response' } }));
  expect(screen.queryByText('Stale response')).not.toBeInTheDocument();
  expect(screen.queryByText('A pending question')).not.toBeInTheDocument();
  expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)).sessionId).not.toBe(firstSession);
});

test('composition Enter does not send, and hidden game buttons leave keyboard navigation', () => {
  render(<App />);
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'こんにちは' } });
  fireEvent.compositionStart(input);
  fireEvent.submit(input.closest('form'));
  expect(axios.post).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
  expect(axios.post).not.toHaveBeenCalled();
  fireEvent.compositionEnd(input);
  const toggle = screen.getByRole('button', { name: 'Hide Game' });
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Large trees' })).not.toBeInTheDocument();
});

test('restores only valid successful turns and limits context to complete pairs', () => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: 'saved-session', turns: [
    { id: 'valid', text: 'Hello', reply: 'Hi', status: 'complete' },
    { id: 'pending', text: 'unfinished', status: 'pending' },
  ] }));
  render(<App />);
  expect(screen.getByText('Hi')).toBeInTheDocument();
  expect(screen.queryByText('unfinished')).not.toBeInTheDocument();
  const turns = Array.from({ length: 10 }, (_, i) => ({ text: 'Q' + i, reply: 'A' + i, status: 'complete' }));
  expect(conversationHistory(turns)).toHaveLength(12);
  expect(conversationHistory(turns)[0].content).toBe('Q4');
});

test('small screens start with the game closed and the toggle opens it', () => {
  const previous = window.matchMedia;
  window.matchMedia = () => ({ matches: true });
  render(<App />);
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Show Game' }));
  expect(screen.getByRole('complementary', { name: 'Hooded vulture quiz' })).toBeInTheDocument();
  window.matchMedia = previous;
});
