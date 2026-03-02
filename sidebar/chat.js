"use strict";

/*
AI Assistant Sidebar
Copyright (C) 2026 Woobat8

A copy of the lisence can be found at <https://github.com/Woobat-8/AI-Sidebar-Extension/blob/main/LICENSE> 
If you don't have access to the lisence, see <https://www.gnu.org/licenses/>.
*/

const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("form");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");
const noKeyEl = document.getElementById("noKey");
const chatWrapEl = document.getElementById("chatWrap");
const openOptionsBtn = document.getElementById("openOptions");
const toggleCollapseBtn = document.getElementById("toggleCollapse");
const reloadExtensionBtn = document.getElementById("reloadExtension");

let conversation = [];

function showNoKey(show) {
  noKeyEl.classList.toggle("hidden", !show);
  chatWrapEl.classList.toggle("hidden", show);
}

function appendMessage(role, content, isError = false) {
  const div = document.createElement("div");
  div.className = "msg " + (isError ? "error" : role);
  div.setAttribute("data-role", role);
  const inner = document.createElement("div");
  inner.className = "content";
  inner.textContent = content;
  div.appendChild(inner);
  messagesEl.appendChild(div);
  div.scrollIntoView({ behavior: "smooth" });
  return inner;
}

function setApiKeyCheck() {
  browser.runtime.sendMessage({ type: "hasApiKey" }).then(({ hasKey }) => {
    showNoKey(!hasKey);
  }).catch(() => showNoKey(true));
}

openOptionsBtn.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

if (toggleCollapseBtn) {
  toggleCollapseBtn.addEventListener("click", () => {
    const body = document.body;
    const collapsed = body.classList.toggle("collapsed");
    toggleCollapseBtn.setAttribute("aria-pressed", String(collapsed));
    toggleCollapseBtn.textContent = collapsed ? "+" : "−";
  });
}

if (reloadExtensionBtn && browser.runtime && typeof browser.runtime.reload === "function") {
  reloadExtensionBtn.addEventListener("click", () => {
    browser.runtime.reload();
  });
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = (inputEl.value || "").trim();
  if (!text) return;

  const hasKey = (await browser.runtime.sendMessage({ type: "hasApiKey" }))?.hasKey;
  if (!hasKey) {
    showNoKey(true);
    return;
  }

  inputEl.value = "";
  sendBtn.disabled = true;

  conversation.push({ role: "user", content: text });
  appendMessage("user", text);

  const requestId = "req-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  const assistantBubble = appendMessage("assistant", "");

  const listener = (msg) => {
    if (msg.type === "streamChunk" && msg.requestId === requestId && msg.content) {
      assistantBubble.textContent += msg.content;
      assistantBubble.parentElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  browser.runtime.onMessage.addListener(listener);

  try {
    const res = await browser.runtime.sendMessage({
      type: "chat",
      requestId,
      messages: conversation,
      stream: true,
    });

    browser.runtime.onMessage.removeListener(listener);

    if (res && res.error) {
      assistantBubble.parentElement.classList.add("error");
      assistantBubble.textContent = res.error;
      if (res.error.includes("API key")) showNoKey(true);
    } else if (res && res.streamDone) {
      const fullContent = assistantBubble.textContent;
      conversation.push({ role: "assistant", content: fullContent });
    }
  } catch (err) {
    browser.runtime.onMessage.removeListener(listener);
    assistantBubble.parentElement.classList.add("error");
    assistantBubble.textContent = err.message || "Something went wrong.";
  } finally {
    sendBtn.disabled = false;
  }
});

setApiKeyCheck();
