import "./SkeletonMessage.css";

const SkeletonMessage = () => {
  return (
    <div className="chat-row model">
      <span className="role">Answering...</span>
      <div className="skeleton">
        <div className="line w-80"></div>
        <div className="line w-60"></div>
        <div className="line w-40"></div>
      </div>
    </div>
  );
};

export default SkeletonMessage;
