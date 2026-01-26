const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");

const botReplies = [
  "I hear you. That shit is heavy.",
  "You don’t sound weak. You sound tired.",
  "It makes sense that you feel this way.",
  "You’re not broken for feeling this.",
  "I’m here. Keep going.",
  "That’s a lot to carry alone."
];

function sendMessage() {
  const text = input.value.trim();
  if (text === "") return;

  addMessage(text, "you");
  input.value = "";

  setTimeout(() => {
    const reply = botReplies[Math.floor(Math.random() * botReplies.length)];
    addMessage(reply, "other");
  }, 800);
}

function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
