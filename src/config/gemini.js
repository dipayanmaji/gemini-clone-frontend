const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const streamResponse = async (messages, signal, onChunk) => {
  const validMessages = messages.filter((message) => message.text?.trim());
  const response = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: validMessages }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || "Unable to get a response right now.");
  }

  if (!response.body) throw new Error("Streaming is not supported by this browser.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    result += text;
    onChunk(text);
  }

  return result + decoder.decode();
};

export default streamResponse;
