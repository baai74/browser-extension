
export default {
  common: {
    execute: 'Execute',
    cancel: 'Cancel',
    close: 'Close',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
  },
  actions: {
    click: 'Clicking element',
    type: 'Typing text',
    navigate: 'Navigating to page',
    scroll: 'Scrolling page',
    drag: 'Dragging element',
    wait: 'Waiting',
    screenshot: 'Screenshot',
    automate: 'Automation',
  },
  notifications: {
    actionStarted: 'Started: {{action}}',
    actionCompleted: 'Completed: {{action}}',
    actionFailed: 'Failed: {{action}} - {{error}}',
    commandExecuted: 'Executed command: {{command}}',
  },
  chatCommands: {
    help: 'Available commands:\n/taxy click [selector] - click on element\n/taxy type [selector] [text] - type text\n/taxy navigate [url] - navigate to page\n/taxy scroll [options] - scroll page\n/taxy drag [options] - drag element\n/taxy wait [ms] - wait\n/taxy screenshot [selector] - take screenshot\n/taxy automate [instruction] - execute complex automation',
    invalidCommand: 'Invalid command. Use /taxy help to see available commands.',
    unknownCommand: 'Unknown command: {{command}}',
  }
};
