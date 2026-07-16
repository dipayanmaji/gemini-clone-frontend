import "./SkeletonMessage.css";

const SkeletonMessage = () => {
  return (
    <div className="skeleton-message" aria-label="Gemini is responding">
      <div className="thinking-label">
        <span className="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        Gemini is thinking
      </div>
      <div className="skeleton" aria-hidden="true">
        <div className="line w-70"></div>
        <div className="line w-48"></div>
      </div>
    </div>
  );
};

export default SkeletonMessage;
