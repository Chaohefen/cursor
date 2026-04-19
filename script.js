const reveals = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  },
  { threshold: 0.12 }
);
reveals.forEach((el) => io.observe(el));

const slides = [...document.querySelectorAll(".slide")];
const dotsWrap = document.getElementById("dots");
const prevSlide = document.getElementById("prevSlide");
const nextSlide = document.getElementById("nextSlide");
let current = 0;
let timer = null;

function renderDots() {
  dotsWrap.innerHTML = "";
  slides.forEach((_, idx) => {
    const d = document.createElement("button");
    d.className = "dot" + (idx === current ? " active" : "");
    d.addEventListener("click", () => showSlide(idx));
    dotsWrap.appendChild(d);
  });
}

function showSlide(idx) {
  slides[current].classList.remove("active");
  current = (idx + slides.length) % slides.length;
  slides[current].classList.add("active");
  renderDots();
}

function startAuto() {
  clearInterval(timer);
  timer = setInterval(() => showSlide(current + 1), 5000);
}

prevSlide.addEventListener("click", () => {
  showSlide(current - 1);
  startAuto();
});
nextSlide.addEventListener("click", () => {
  showSlide(current + 1);
  startAuto();
});
renderDots();
startAuto();

const topBtn = document.getElementById("topBtn");
window.addEventListener("scroll", () => {
  topBtn.classList.toggle("show", window.scrollY > 360);
});
topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const chatBody = document.getElementById("chatBody");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const clearChat = document.getElementById("clearChat");
const exportChat = document.getElementById("exportChat");
const toggleTheme = document.getElementById("toggleTheme");
const voiceBtn = document.getElementById("voiceBtn");

const llmConfig = window.LLM_CONFIG || {
  enabled: false,
  endpoint: "",
  apiKey: "",
  model: "",
};

document.querySelectorAll('a[href="#ai-chat"]').forEach((link) => {
  link.addEventListener("click", () => {
    window.setTimeout(() => {
      const input = document.getElementById("chatInput");
      if (input) input.focus({ preventScroll: true });
    }, 400);
  });
});

function scrollChatBottom() {
  chatBody.scrollTop = chatBody.scrollHeight;
}

function addMsg(text, role) {
  const msg = document.createElement("div");
  msg.className = "msg " + role;
  msg.textContent = text;
  chatBody.appendChild(msg);
  scrollChatBottom();
  return msg;
}

function typewriter(text, el, speed = 22) {
  let i = 0;
  el.textContent = "";
  const t = setInterval(() => {
    el.textContent += text.charAt(i);
    i += 1;
    scrollChatBottom();
    if (i >= text.length) clearInterval(t);
  }, speed);
}

async function aiReply(userText) {
  const loading = addMsg("AI 正在思考中…", "ai");
  loading.classList.add("typing");

  const fallbackResponse =
    "你刚刚说的是：" +
    userText +
    "。这是一个不错的方向，我建议先明确目标、再拆分步骤并快速验证。";

  if (!llmConfig.enabled || !llmConfig.endpoint) {
    setTimeout(() => {
      loading.classList.remove("typing");
      typewriter(fallbackResponse, loading);
    }, 900);
    return;
  }

  try {
    const res = await fetch(llmConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(llmConfig.apiKey ? { Authorization: `Bearer ${llmConfig.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          { role: "system", content: "你是一个简洁、友好的中文 AI 助手。" },
          { role: "user", content: userText },
        ],
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const content =
      data?.choices?.[0]?.message?.content ||
      data?.output_text ||
      data?.response ||
      fallbackResponse;

    loading.classList.remove("typing");
    typewriter(content, loading);
  } catch (error) {
    loading.classList.remove("typing");
    loading.textContent = `调用 API 失败，已切换本地回复。${fallbackResponse}`;
  }
}

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMsg(text, "user");
  chatInput.value = "";
  aiReply(text);
}

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

clearChat.addEventListener("click", () => {
  chatBody.innerHTML = '<div class="msg ai">对话已清空。我们重新开始吧。</div>';
});

exportChat.addEventListener("click", () => {
  const lines = [...chatBody.querySelectorAll(".msg")].map((m) =>
    (m.classList.contains("user") ? "[User] " : "[AI] ") + m.textContent
  );
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "chat-log.txt";
  a.click();
  URL.revokeObjectURL(a.href);
});

toggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

voiceBtn.addEventListener("click", () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    addMsg("当前浏览器不支持语音输入。", "ai");
    return;
  }
  const rec = new SR();
  rec.lang = "zh-CN";
  rec.onresult = (e) => {
    chatInput.value = e.results[0][0].transcript;
  };
  rec.start();
});

const workModal = document.getElementById("workModal");
const workTitle = document.getElementById("workTitle");
const workDesc = document.getElementById("workDesc");
const closeWork = document.getElementById("closeWork");
document.querySelectorAll(".work").forEach((item) => {
  item.addEventListener("click", () => {
    workTitle.textContent = item.dataset.title;
    workDesc.textContent = item.dataset.desc;
    workModal.classList.add("show");
  });
});
closeWork.addEventListener("click", () => workModal.classList.remove("show"));
workModal.addEventListener("click", (e) => {
  if (e.target === workModal) workModal.classList.remove("show");
});

document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("消息已发送，我会尽快回复你。");
  e.target.reset();
});
