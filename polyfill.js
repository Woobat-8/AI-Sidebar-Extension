/*
AI Assistant Sidebar
Copyright (C) 2026 Woobat8

A copy of the lisence can be found at <https://github.com/Woobat-8/AI-Sidebar-Extension/blob/main/LICENSE> 
If you don't have access to the lisence, see <https://www.gnu.org/licenses/>.
*/

(function () {
  if (typeof browser !== "undefined") {
    return;
  }
  if (typeof chrome === "undefined") {
    return;
  }

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

  window.browser = {
    ...chrome,
    runtime,
    storage,
  };
})();

