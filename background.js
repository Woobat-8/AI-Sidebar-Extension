"use strict";

/*
AI Assistant Sidebar
Copyright (C) 2026 Woobat8

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

A copy of the lisence can be found at <https://github.com/Woobat-8/AI-Sidebar-Extension/blob/main/LICENSE> 
If you don't have access to the lisence, see <https://www.gnu.org/licenses/>.
*/

try {
  if (typeof browser === "undefined" && typeof chrome !== "undefined") {
    var browser = (function () {
      function wrapAsync(fn) {
        return function (...args) {
          return new Promise((resolve, reject) => {
            fn(...args, (result) => {
              const err = chrome.runtime && chrome.runtime.lastError;
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        };
      }

      const runtime = {
        ...chrome.runtime,
        sendMessage: wrapAsync(chrome.runtime.sendMessage),
        openOptionsPage: chrome.runtime.openOptionsPage
          ? wrapAsync(chrome.runtime.openOptionsPage)
          : undefined,
      };

      const storage = {
        ...chrome.storage,
        local: {
          get: wrapAsync(chrome.storage.local.get),
          set: wrapAsync(chrome.storage.local.set),
        },
      };

      return {
        ...chrome,
        runtime,
        storage,
      };
    })();
  }
} catch (_) {}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

if (browser.action && browser.action.onClicked) {
  browser.action.onClicked.addListener(async (tab) => {
    try {
      if (browser.sidePanel && typeof browser.sidePanel.open === "function") {
        const windowId = tab && tab.windowId;
        await browser.sidePanel.open(
          windowId != null ? { windowId } : undefined
        );
        if (browser.sidePanel.setOptions && tab && tab.id != null) {
          await browser.sidePanel.setOptions({
            tabId: tab.id,
            path: "sidebar/chat.html",
          });
        }
        return;
      }
    } catch (_) {}

    if (browser.sidebarAction && typeof browser.sidebarAction.open === "function") {
      try {
        await browser.sidebarAction.open();
        return;
      } catch (_) {}
    }

    if (browser.runtime && typeof browser.runtime.reload === "function") {
      browser.runtime.reload();
    }
  });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "chat") {
    const requestId = message.requestId;
    handleChat(
      message.messages,
      message.stream,
      message.model,
      requestId,
      sendResponse
    ).catch((err) => sendResponse({ error: err.message || "API error" }));
    return true;
  }
  if (message.type === "hasApiKey") {
    getStoredSettings().then(({ apiKey }) => {
      sendResponse({ hasKey: Boolean(apiKey && apiKey.trim()) });
    });
    return true;
  }
});

async function getStoredSettings() {
  const out = await browser.storage.local.get([
    "provider",
    "openaiApiKey",
    "geminiApiKey",
    "claudeApiKey",
    "openaiModel",
    "geminiModel",
    "claudeModel",
    "apiKey",
    "model",
  ]);
  const provider = out.provider || "openai";
  const openaiApiKey = (out.openaiApiKey || out.apiKey || "").trim();
  const geminiApiKey = (out.geminiApiKey || "").trim();
  const claudeApiKey = (out.claudeApiKey || "").trim();

  let apiKey;
  if (provider === "gemini") {
    apiKey = geminiApiKey;
  } else if (provider === "claude") {
    apiKey = claudeApiKey;
  } else {
    apiKey = openaiApiKey;
  }

  const openaiModel = out.openaiModel || out.model || "gpt-4o-mini";
  const geminiModel = out.geminiModel || "gemini-2.5-flash-lite";
  const claudeModel = out.claudeModel || "claude-haiku-4-5";
  const model =
    provider === "gemini"
      ? geminiModel
      : provider === "claude"
      ? claudeModel
      : openaiModel;

  return { provider, apiKey, model };
}

async function handleChat(messages, stream, modelOverride, requestId, sendResponse) {
  const { provider, apiKey, model } = await getStoredSettings();
  const key = apiKey;
  const effectiveModel = modelOverride || model;

  if (!key) {
    return sendResponse({
      error: "Missing API key. Add it in extension options.",
    });
  }

  if (provider === "gemini") {
    return handleGeminiChat(key, effectiveModel, messages, stream, requestId, sendResponse);
  }
  if (provider === "claude") {
    return handleClaudeChat(key, effectiveModel, messages, stream, requestId, sendResponse);
  }
  return handleOpenAIChat(key, effectiveModel, messages, stream, requestId, sendResponse);
}

function openAIMessagesToAnthropic(messages) {
  const anthropicMessages = [];
  const systemParts = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      if (msg.content) {
        systemParts.push(msg.content);
      }
      continue;
    }
    let role = msg.role;
    if (role === "assistant") role = "assistant";
    else role = "user";
    anthropicMessages.push({
      role,
      content: msg.content || "",
    });
  }

  const system = systemParts.length ? systemParts.join("\n\n") : null;
  return { messages: anthropicMessages, system };
}

async function handleClaudeChat(apiKey, model, messages, stream, requestId, sendResponse) {
  const { messages: anthropicMessages, system } = openAIMessagesToAnthropic(messages);

  const body = {
    model,
    max_tokens: 8192,
    messages: anthropicMessages,
    stream: Boolean(stream),
    ...(system ? { system } : {}),
  };

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    try {
      const j = JSON.parse(err);
      const msg = j.error?.message || res.statusText || "API error";
      return sendResponse({ error: msg });
    } catch (_) {
      return sendResponse({ error: res.statusText || "API error" });
    }
  }

  if (stream && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "content_block_delta") {
            const text = evt.delta?.text;
            if (text && requestId) {
              try {
                browser.runtime.sendMessage({
                  type: "streamChunk",
                  requestId,
                  content: text,
                }).catch(() => {});
              } catch (_) {}
            }
          }
        } catch (_) {}
      }
    }
    return sendResponse({ streamDone: true });
  }

  const data = await res.json();
  let content = "";
  if (Array.isArray(data.content) && data.content.length > 0) {
    for (const block of data.content) {
      if (typeof block.text === "string") {
        content += block.text;
      } else if (block.type === "text" && typeof block.text === "string") {
        content += block.text;
      }
    }
  }
  return sendResponse({ content });
}

async function handleOpenAIChat(apiKey, model, messages, stream, requestId, sendResponse) {
  const body = {
    model,
    messages,
    stream: Boolean(stream),
  };

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    try {
      const j = JSON.parse(err);
      return sendResponse({
        error: j.error?.message || res.statusText || "API error",
      });
    } catch (_) {
      return sendResponse({ error: res.statusText || "API error" });
    }
  }

  if (stream && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content && requestId) {
              try {
                browser.runtime.sendMessage({
                  type: "streamChunk",
                  requestId,
                  content,
                }).catch(() => {});
              } catch (_) {}
            }
          } catch (_) {}
        }
      }
    }
    return sendResponse({ streamDone: true });
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return sendResponse({ content });
}

function openAIMessagesToGeminiContents(messages) {
  let systemInstruction = null;
  const contents = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = { parts: [{ text: msg.content || "" }] };
      continue;
    }
    const role = msg.role === "assistant" ? "model" : "user";
    contents.push({
      role,
      parts: [{ text: msg.content || "" }],
    });
  }

  return { contents, systemInstruction };
}

async function handleGeminiChat(apiKey, model, messages, stream, requestId, sendResponse) {
  const { contents, systemInstruction } = openAIMessagesToGeminiContents(messages);
  const body = {
    contents,
    ...(systemInstruction && { systemInstruction }),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  const streamParam = stream ? "&alt=sse" : "";
  const url = `${GEMINI_BASE}/${model}:${stream ? "streamGenerateContent" : "generateContent"}?key=${encodeURIComponent(apiKey)}${streamParam}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    try {
      const j = JSON.parse(err);
      const msg = j.error?.message || res.statusText || "API error";
      return sendResponse({ error: msg });
    } catch (_) {
      return sendResponse({ error: res.statusText || "API error" });
    }
  }

  if (stream && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const payload = line.startsWith("data: ") ? line.slice(6).trim() : line.trim();
        if (!payload) continue;
        try {
          const parsed = JSON.parse(payload);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && requestId) {
            try {
              browser.runtime.sendMessage({
                type: "streamChunk",
                requestId,
                content: text,
              }).catch(() => {});
            } catch (_) {}
          }
        } catch (_) {}
      }
    }
    return sendResponse({ streamDone: true });
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return sendResponse({ content: text });
}
