// Content script for Taxy AI browser automation
import { watchForRPCRequests } from '../../helpers/pageRPC';
import { setupActionListener } from './actionExecutor';
import './chatInterceptor'; // Import the chat interceptor

console.log('Taxy AI Content script loaded');

// Set up RPC request handling for existing functionality
watchForRPCRequests();

// Set up action listener for new chat-based commands
setupActionListener();
