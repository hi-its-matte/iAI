document.addEventListener("DOMContentLoaded", () => {
  // Variabili DOM
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatContainer = document.getElementById("chatContainer");
  const counterElement = document.getElementById("messageCounter");

  // Gestione messaggi rimanenti con localStorage e reset giornaliero
  const today = new Date().toISOString().split("T")[0];
  const savedData = JSON.parse(localStorage.getItem("iAieUsage") || "{}");

  let remainingMessages;
  if (savedData.date === today) {
    remainingMessages = savedData.remaining;
  } else {
    remainingMessages = 50;
    localStorage.setItem("iAieUsage", JSON.stringify({ date: today, remaining: 50 }));
  }

  // Aggiorna contatore UI
  counterElement.textContent = `Messaggi rimasti oggi: ${remainingMessages}/50`;

  sendBtn.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  function appendMessage(role, text) {
    const div = document.createElement("div");
    div.className = `message ${role}`;
    div.textContent = text;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    if (remainingMessages <= 0) {
      appendMessage("bot", "⛔ Hai raggiunto il limite giornaliero di 50 messaggi.");
      sendBtn.disabled = true;
      return;
    }

    appendMessage("user", message);
    userInput.value = "";
    appendMessage("bot", "⏳ Sto pensando...");

    try {
      const response = await fetch("https://iam-backend-ibpf.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error(`Errore dal server: ${response.status}`);

      const data = await response.json();

      const loadingMsg = chatContainer.querySelector(".message.bot:last-child");
      if (loadingMsg && loadingMsg.textContent.includes("⏳")) {
        loadingMsg.textContent = data.reply;
        remainingMessages--;
        counterElement.textContent = `Messaggi rimasti oggi: ${remainingMessages}/50`;

        localStorage.setItem("iAieUsage", JSON.stringify({ date: today, remaining: remainingMessages }));

        if (remainingMessages <= 0) {
          sendBtn.disabled = true;
          sendBtn.textContent = "Limite raggiunto";
        }
      } else {
        appendMessage("bot", data.reply);
      }
    } catch (err) {
      const loadingMsg = chatContainer.querySelector(".message.bot:last-child");
      if (loadingMsg && loadingMsg.textContent.includes("⏳")) {
        loadingMsg.textContent = "❌ Errore di rete, riprova";
      } else {
        appendMessage("bot", "❌ Errore di rete, riprova");
      }
      console.error("Errore nel fetch:", err);
    }
  }
});
