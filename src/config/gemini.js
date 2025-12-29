const run = async (prompt) => {
  const res = await fetch("https://gemini-clone-backend-f0tu.onrender.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  return data.reply;
};

export default run;
