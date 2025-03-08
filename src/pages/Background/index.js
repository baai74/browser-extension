// Background script for Taxy AI extension
const processCommand = (command, source) => {
  console.log(`Processing command from ${source}: ${command}`);

  // Parse the command to extract action and parameters
  const parts = command.split(' ');
  const action = parts[0].toLowerCase();
  const params = parts.slice(1).join(' ');

  switch (action) {
    case 'click':
      executeClickAction(params);
      break;
    case 'type':
    case 'input':
      executeTypeAction(params);
      break;
    case 'navigate':
    case 'goto':
      executeNavigateAction(params);
      break;
    default:
      console.log(`Unknown command action: ${action}`);
  }
};

const executeClickAction = (selector) => {
  getCurrentTab().then(tab => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'EXECUTE_ACTION',
        payload: {
          action: 'click',
          selector
        }
      });
    }
  });
};

const executeTypeAction = (params) => {
  // Format expected: "text" in "selector"
  const match = params.match(/"([^"]+)"\s+in\s+"([^"]+)"/);
  if (match) {
    const text = match[1];
    const selector = match[2];

    getCurrentTab().then(tab => {
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'EXECUTE_ACTION',
          payload: {
            action: 'type',
            selector,
            text
          }
        });
      }
    });
  }
};

const executeNavigateAction = (url) => {
  getCurrentTab().then(tab => {
    if (tab) {
      chrome.tabs.update(tab.id, { url });
    }
  });
};

const getCurrentTab = async () => {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

// Listen for commands from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TAXY_CHAT_COMMAND') {
    processCommand(message.payload.command, message.payload.source);
    sendResponse({ success: true });
  }
});

var __signature__ = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal["default"].signature : function (a) {
  return a;
};