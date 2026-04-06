'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error, stop } = useChat({
    onError: (err) => {
      console.error(err);
    },
  });

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="space-y-4 mb-4">
        {messages.map((message) => (
          <div key={message.id} className="border rounded p-3">
            <div className="font-semibold mb-1">{message.role}</div>

            {message.parts?.map((part, i) => {
              if (part.type === 'text') {
                return <p key={i}>{part.text}</p>;
              }

              if (part.type === 'tool-databaseChatTool') {
                return (
                  <pre
                    key={i}
                    className="bg-gray-100 p-2 rounded overflow-auto text-sm"
                  >
                    {JSON.stringify(part, null, 2)}
                  </pre>
                );
              }

              if (part.type === 'tool-movieSearchTool') {
                return (
                  <pre
                    key={i}
                    className="bg-gray-100 p-2 rounded overflow-auto text-sm"
                  >
                    {JSON.stringify(part, null, 2)}
                  </pre>
                );
              }

              if (part.type === 'tool-dadJokeTool') {
                return (
                  <pre
                    key={i}
                    className="bg-gray-100 p-2 rounded overflow-auto text-sm"
                  >
                    {JSON.stringify(part, null, 2)}
                  </pre>
                );
              }

              return null;
            })}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-red-600">Something failed: {error.message}</p>
      )}
      {status === 'streaming' && <p>Loading...</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput('');
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
          placeholder="Ask about movies, users, reviews, or jokes..."
        />
        <button className="border rounded px-4 py-2" type="submit">
          Send
        </button>
        <button
          className="border rounded px-4 py-2"
          type="button"
          onClick={stop}
        >
          Stop
        </button>
      </form>
    </div>
  );
}
