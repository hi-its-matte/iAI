document.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatContainer = document.getElementById("chatContainer");
  const counterElement = document.getElementById("messageCounter");

  let remainingMessages = 50;

  async function updateRemaining() {
    try {
      const res = await fetch("https://iam-backend-ibpf.onrender.com/usage");
      const data = await res.json();
      remainingMessages = data.remaining;
      counterElement.textContent = `Messaggi rimasti oggi: ${remainingMessages}/50`;

      if (remainingMessages <= 0) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Limite raggiunto";
      }
    } catch {
      counterElement.textContent = "Impossibile recuperare il contatore messaggi.";
    }
  }

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

      if (!response.ok) {
        if (response.status === 429) {
          // Limite raggiunto lato server
          appendMessage("bot", "⛔ Limite giornaliero di messaggi raggiunto.");
          sendBtn.disabled = true;
          sendBtn.textContent = "Limite raggiunto";
          remainingMessages = 0;
          counterElement.textContent = `Messaggi rimasti oggi: 0/50`;
          return;
        } else {
          throw new Error(`Errore dal server: ${response.status}`);
        }
      }

      const data = await response.json();
      const loadingMsg = chatContainer.querySelector(".message.bot:last-child");
      if (loadingMsg && loadingMsg.textContent.includes("⏳")) {
        loadingMsg.textContent = data.reply;
      } else {
        appendMessage("bot", data.reply);
      }

      remainingMessages = data.remaining;
      counterElement.textContent = `Messaggi rimasti oggi: ${remainingMessages}/50`;

      if (remainingMessages <= 0) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Limite raggiunto";
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

  // All'avvio aggiorno il contatore globale
  updateRemaining();
});
