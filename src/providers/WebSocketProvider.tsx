import React, { createContext, useContext, useEffect, useState } from 'react';
import { useConfig } from './ConfigProvider';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { websocketService, WebSocketEventType, ConnectionState } from '@/lib/websocket/websocketService';
import { TextMessage } from '@/lib/models';
import { eventService } from '@/lib/events/eventService';

// Define the context type
interface WebSocketContextType {
  isConnected: boolean;
  connectionState: ConnectionState;
  unreadMessages: TextMessage[];
  markAllAsRead: () => void;
  hasUnreadMessages: boolean;
}

// Create the context with a default value
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  connectionState: ConnectionState.DISCONNECTED,
  unreadMessages: [],
  markAllAsRead: () => {},
  hasUnreadMessages: false,
});

// Hook to use the WebSocket context
export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const config = useConfig();
  const location = useLocation();
  const { toast } = useToast();

  // State for connection status and unread messages
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [unreadMessages, setUnreadMessages] = useState<TextMessage[]>([]);

  // Initialize WebSocket service when the component mounts
  useEffect(() => {
    // Initialize the WebSocket service with the API URL
    websocketService.initialize(config.apis.meshBot.baseUrl);

    // Connect to the WebSocket server
    websocketService.connect();

    // Set up event listeners
    const connectedHandler = () => {
      setConnectionState(ConnectionState.CONNECTED);
    };

    const disconnectedHandler = () => {
      setConnectionState(ConnectionState.DISCONNECTED);
    };

    const errorHandler = () => {
      setConnectionState(ConnectionState.ERROR);
    };

    const messageHandler = (message: TextMessage) => {
      // Add the message to unread messages if not on the messages page
      if (!location.pathname.includes('/messages')) {
        setUnreadMessages((prev) => [...prev, message]);

        // Show a toast notification
        toast({
          title: `New message from ${message.sender.long_name || message.sender.node_id_str}`,
          description: message.message_text,
          duration: 5000,
        });
      }
    };

    // Register event handlers
    eventService.subscribe(WebSocketEventType.CONNECTED, connectedHandler);
    eventService.subscribe(WebSocketEventType.DISCONNECTED, disconnectedHandler);
    eventService.subscribe(WebSocketEventType.ERROR, errorHandler);
    eventService.subscribe(WebSocketEventType.MESSAGE_RECEIVED, messageHandler);

    // Clean up event listeners when the component unmounts
    return () => {
      eventService.unsubscribe(WebSocketEventType.CONNECTED, connectedHandler);
      eventService.unsubscribe(WebSocketEventType.DISCONNECTED, disconnectedHandler);
      eventService.unsubscribe(WebSocketEventType.ERROR, errorHandler);
      eventService.unsubscribe(WebSocketEventType.MESSAGE_RECEIVED, messageHandler);

      // Disconnect from the WebSocket server
      websocketService.disconnect();
    };
  }, [config.apis.meshBot.baseUrl, toast, location]);

  // Clear unread messages when navigating to the messages page
  useEffect(() => {
    if (location.pathname.includes('/messages')) {
      setUnreadMessages([]);
    }
  }, [location.pathname]);

  // Function to mark all messages as read
  const markAllAsRead = () => {
    setUnreadMessages([]);
  };

  // Context value
  const contextValue: WebSocketContextType = {
    isConnected: connectionState === ConnectionState.CONNECTED,
    connectionState,
    unreadMessages,
    markAllAsRead,
    hasUnreadMessages: unreadMessages.length > 0,
  };

  return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>;
}
