import React, { useContext, useRef, useEffect } from "react";
import "./Maincontent.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";
import SkeletonMessage from "../Skeleton/SkeletonMessage";
import ReactMarkdown from "react-markdown";

const Maincontent = () => {
  const {
    response,
    onSent,
    recentPrompt,
    showResult,
    loading,
    resultData,
    setInput,
    input,
    messages
  } = useContext(Context);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);


  return (
    <div className="main">
      <div className="nav">
        <p>Gemini</p>
        <img src={assets.user_icon} />
      </div>

      <div className="main-container">
        {!showResult ? (
          <>
            <div className="greet">
              <p>
                <span>Hello, Dev.</span>
              </p>
              <p>How Can I Help You Today?</p>
            </div>
            <div className="cards">
              <div className="card" onClick={() => onSent("Suggest beautiful places to see on an upcoming road trip")}>
                <p>
                  Suggest beautiful places to see on an upcoming road trip
                </p>
                <img src={assets.compass_icon} />
              </div>
              <div className="card" onClick={() => onSent("Briefly summarize this concept: urban planning")}>
                <p>Briefly summarize this concept: urban planning</p>
                <img src={assets.bulb_icon} />
              </div>
              <div className="card" onClick={() => onSent("Brainstorm team bonding activities for our work retreat")}>
                <p>Brainstorm team bonding activities for our work retreat</p>
                <img src={assets.message_icon} />
              </div>
              <div className="card" onClick={() => onSent("Tell me about React js and React native")}>
                <p>Tell me about React js and React native</p>
                <img src={assets.code_icon} />
              </div>
            </div>
          </>
        ) : (
          <div className="result">
            {messages.map((eachMsgObj, index) => (
              <div key={index} className={`chat-row ${eachMsgObj.role}`}>
                {/* <span className="role">{eachMsgObj.role}</span> */}

                <div className="text">
                  <ReactMarkdown>
                    {eachMsgObj.text}
                  </ReactMarkdown>
                </div>


              </div>
            ))}

            {loading && <SkeletonMessage />}
            <div ref={bottomRef}></div>

          </div>

        )}

        <div className="main-bottom">
          <div className="search-box">
            <input
              type="text"
              placeholder="Ask Gemeni"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSent();
                }
              }}
            />

            <div>
              <img src={assets.gallery_icon} alt="" />
              <img src={assets.mic_icon} alt="" />
              <img
                className="sendbtn"
                onClick={() => onSent()}
                src={assets.send_icon}
                alt=""
              />
            </div>
          </div>
          <p className="bottom-info">
            Gemini may display inaccurate info, including about people, so double-check its responses. Your privacy and Gemini Apps
          </p>
        </div>

      </div>
    </div>
  );
};

export default Maincontent;
