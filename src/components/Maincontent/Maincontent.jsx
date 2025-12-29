import React, { useContext } from "react";
import "./Maincontent.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";

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
  } = useContext(Context);

  return (
    <>
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
                <div className="card" onClick={() => onSent("Suggest beautiful places to see on an upcoming road trip")}>
                  <p>Briefly summarize this concept: urban planning</p>
                  <img src={assets.bulb_icon} />
                </div>
                <div className="card" onClick={() => onSent("Suggest beautiful places to see on an upcoming road trip")}>
                  <p>Brainstorm team bonding activities for our work retreat</p>
                  <img src={assets.message_icon} />
                </div>
                <div className="card" onClick={() => onSent("Suggest beautiful places to see on an upcoming road trip")}>
                  <p>Tell me about React js and React native</p>
                  <img src={assets.code_icon} />
                </div>
              </div>
            </>
          ) : (
            <div className="result">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <p className="response-text">{resultData}</p>
              )}
            </div>

          )}

          <div className="main-bottom">
            <div className="search-box">
              <input
                onChange={(e) => setInput(e.target.value)}
                value={input}
                type="text"
                placeholder="Enter a prompt here"
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
              Gemini may display inaccurate info, including about people, so
              double-check its responses. Your privacy and Gemini Apps
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default Maincontent;
