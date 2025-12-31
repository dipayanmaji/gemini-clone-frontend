import { createContext, useState, useEffect } from "react";
import run from "../config/gemini";

export const Context = createContext();

const ContextProvider = (props) => {
  const [res, setRes] = useState("");
  const [input, setInput] = useState("");
  const [prevPrompts, setPrevPrompts] = useState([]);
  const [recentPrompt, setRecentPrompt] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState("");
  const [messages, setMessages] = useState([]);

  const onSent = async (prompt) => {
    const finalPrompt = prompt || input;
    if (!finalPrompt) return;

    const userMessage = { role: "user", text: finalPrompt };

    // 1️⃣ Add user message first
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    setLoading(true);
    setShowResult(true);
    setRecentPrompt(finalPrompt);
    setInput("");

    try {
      // 2️⃣ Send FULL history to backend
      const response = await run(updatedMessages);

      const aiMessage = { role: "model", text: response };

      // 3️⃣ Append AI reply
      setMessages((prev) => [...prev, aiMessage]);
      setResultData(response);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const contextValue = {
    res,
    prevPrompts,
    setPrevPrompts,
    onSent,
    setRecentPrompt,
    recentPrompt,
    showResult,
    loading,
    resultData,
    input,
    setInput,
    messages,
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
