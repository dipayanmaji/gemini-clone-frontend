const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const run = async (messages) => {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json();
  return data.reply;
};

export default run;
