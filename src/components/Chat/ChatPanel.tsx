
import React, { useState, useEffect, useRef } from 'react';
import { Box, Input, Button, Text, Flex, VStack, HStack, Textarea } from '@chakra-ui/react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Przewijanie do najnowszej wiadomości
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Wysyłanie wiadomości
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Dodaj wiadomość użytkownika
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      // Tutaj logika komunikacji z API
      const aiResponse = await processCommand(input);
      
      // Dodaj odpowiedź AI
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse || "Zadanie wykonane pomyślnie",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Błąd podczas przetwarzania komendy:', error);
      
      // Wiadomość o błędzie
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Wystąpił błąd: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Przykładowa funkcja przetwarzania komendy
  const processCommand = async (command: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Komunikacja z background script
        chrome.runtime.sendMessage(
          { type: 'CHAT_COMMAND', payload: { action: 'automate', params: command, source: 'popup' } },
          (response) => {
            resolve(response?.message || 'Zadanie wykonane');
          }
        );
      }, 1000);
    });
  };
  
  return (
    <Box height="100%" display="flex" flexDirection="column">
      <VStack flex="1" overflowY="auto" spacing={4} p={4} alignItems="stretch">
        {messages.map((msg) => (
          <Box 
            key={msg.id} 
            alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
            bg={msg.sender === 'user' ? 'blue.100' : 'gray.100'}
            p={3}
            borderRadius="lg"
            maxWidth="80%"
          >
            <Text>{msg.content}</Text>
            <Text fontSize="xs" color="gray.500">
              {msg.timestamp.toLocaleTimeString()}
            </Text>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </VStack>
      
      <HStack p={4} bg="white" borderTop="1px" borderColor="gray.200">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Wpisz polecenie..."
          resize="none"
          rows={2}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button 
          colorScheme="blue" 
          onClick={handleSendMessage}
          isLoading={isProcessing}
          loadingText="Wysyłanie"
        >
          Wyślij
        </Button>
      </HStack>
    </Box>
  );
};

export default ChatPanel;
