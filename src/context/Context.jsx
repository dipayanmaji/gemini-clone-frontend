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

    setLoading(true);
    setShowResult(true);
    setRecentPrompt(finalPrompt);

    try {
      const response = await run(finalPrompt);
      setResultData(response);
      setLoading(false);
      setInput("");
      setMessages(prev => [
        ...prev,
        { role: "user", text: finalPrompt },
        { role: "model", text: response }
      ]);

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
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
