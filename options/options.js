"use strict";

/*
AI Assistant Sidebar
Copyright (C) 2026 Woobat8

A copy of the lisence can be found at <https://github.com/Woobat-8/AI-Sidebar-Extension/blob/main/LICENSE> 
If you don't have access to the lisence, see <https://www.gnu.org/licenses/>.
*/

const providerEl = document.getElementById("provider");
const openaiSection = document.getElementById("openaiSection");
const geminiSection = document.getElementById("geminiSection");
const openaiApiKeyEl = document.getElementById("openaiApiKey");
const geminiApiKeyEl = document.getElementById("geminiApiKey");
const openaiModelEl = document.getElementById("openaiModel");
const geminiModelEl = document.getElementById("geminiModel");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");
let statusClearTimer = null;

function showStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.className = "status " + (isError ? "error" : "success");
  if (statusClearTimer) {
    clearTimeout(statusClearTimer);
  }
  statusClearTimer = setTimeout(() => {
    statusEl.textContent = "";
    statusEl.className = "status";
    statusClearTimer = null;
  }, 3000);
}

function updateProviderSections() {
  const isOpenAI = providerEl.value === "openai";
  openaiSection.classList.toggle("hidden", !isOpenAI);
  geminiSection.classList.toggle("hidden", isOpenAI);
}

providerEl.addEventListener("change", updateProviderSections);

saveBtn.addEventListener("click", async () => {
  const provider = providerEl.value || "openai";
  const openaiApiKey = (openaiApiKeyEl.value || "").trim();
  const geminiApiKey = (geminiApiKeyEl.value || "").trim();
  const openaiModel = openaiModelEl.value || "gpt-4.1-nano";
  const geminiModel = geminiModelEl.value || "gemini-2.5-flash-lite-preview";
  await browser.storage.local.set({
    provider,
    openaiApiKey,
    geminiApiKey,
    openaiModel,
    geminiModel,
  });
  showStatus("Saved.");
  if (browser.runtime && typeof browser.runtime.reload === "function") {
    browser.runtime.reload();
  }
});

browser.storage.local
  .get(["provider", "openaiApiKey", "geminiApiKey", "openaiModel", "geminiModel", "apiKey", "model"])
  .then((data) => {
    if (data.provider) providerEl.value = data.provider;
    openaiApiKeyEl.value = data.openaiApiKey || data.apiKey || "";
    if (data.geminiApiKey) geminiApiKeyEl.value = data.geminiApiKey;
    openaiModelEl.value = data.openaiModel || data.model || "gpt-4.1-nano";
    if (data.geminiModel) geminiModelEl.value = data.geminiModel;
    updateProviderSections();
  });
