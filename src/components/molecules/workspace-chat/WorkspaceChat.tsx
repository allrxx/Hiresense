import React, { useState, useRef, useEffect } from 'react';
import { Send, History, Message, Close } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  useTheme,
  Paper,
  Avatar,
  CircularProgress
} from '@mui/material';
import { useToast } from '@/lib/hooks/useToast';
import { useWorkspace } from '@/context/WorkspaceContext';
import WorkspaceSelector from '../Workspace-Selector/WorkspaceSelector';
import CustomButton from '@/components/atoms/button/CustomButton';
import { ChatApi } from '@/lib/api/chatApi'; // Import our ChatApi
import { useChat } from '@/lib/hooks/useChat'; // Import our chat hook

interface MessageType {
  id: string;
  ChatResponse: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages: MessageType[];
}

// Helper function to create a unique ID
const createId = () => {
  // Check if crypto.randomUUID is available (requires secure context or newer envs)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments where crypto.randomUUID is not available
  // Combines timestamp and random number for reasonable uniqueness
  console.warn('crypto.randomUUID not available, using fallback ID generation.');
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

interface WorkspaceChatProps {
  aiResponse?: string | null; // Accept AI response as a prop
}

const WorkspaceChat: React.FC<WorkspaceChatProps> = ({ aiResponse }) => {
  const { toast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const theme = useTheme();
  const [showHistory, setShowHistory] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with welcome message
  useEffect(() => {
    if (activeWorkspace?.name) {
      setMessages([
        {
          id: createId(),
          ChatResponse: `Hello! I'm your CV assistant for the "${activeWorkspace.name}" workspace. How can I help you today?`,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([
        {
          id: createId(),
          ChatResponse: `Hello! I'm your CV assistant. How can I help you today?`,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [activeWorkspace]);

  // Handle aiResponse prop updates
  useEffect(() => {
    if (aiResponse) {
      const aiMessage: MessageType = {
        id: createId(),
        ChatResponse: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
      scrollToBottom();
    }
  }, [aiResponse]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  // Send message to API
  const sendChatMessage = async (message: string, isJdSearch: boolean = false) => {
    try {
      const response = await ChatApi.sendMessage(message);
      return response; 
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Create user message object
    const userMessage: MessageType = {
      id: createId(),
      ChatResponse: input,
      isUser: true,
      timestamp: new Date(),
    };

    // Update messages with user input
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Make API call - response type is now ChatApiResponse
      const jdSearch = activeWorkspace?.type === 'jd' || false;
      const response = await sendChatMessage(userMessage.ChatResponse, jdSearch);
      
      // Extract potential reply, could be string, null, undefined, or even an object
      const aiReply = (response as unknown as { response?: unknown })?.response;

      // Create AI response object
      const aiResponse: MessageType = {
        id: createId(),
        // Ensure ChatResponse is always a string, using fallback if aiReply isn't a string
        ChatResponse: typeof aiReply === 'string' && aiReply.length > 0 ? aiReply : "No response available", 
        isUser: false,
        timestamp: new Date(),
      };

      // Update messages with AI response
      const newMessages = [...updatedMessages, aiResponse];
      setMessages(newMessages);
      scrollToBottom();

      // Handle chat history management
      if (!activeChatId) {
        // Create new chat if there's no active chat
        const newChatId = createId();
        const newChat: ChatHistory = {
          id: newChatId,
          title: userMessage.ChatResponse.slice(0, 30) + (userMessage.ChatResponse.length > 30 ? '...' : ''),
          preview: userMessage.ChatResponse.slice(0, 50) + (userMessage.ChatResponse.length > 50 ? '...' : ''),
          timestamp: new Date(),
          messages: newMessages,
        };

        setChatHistories(prev => [newChat, ...prev]);
        setActiveChatId(newChatId);
        toast({
          title: "Chat saved",
          description: "Your conversation has been saved to history",
        });
      } else {
        // Update existing chat
        setChatHistories(prev =>
          prev.map(chat =>
            chat.id === activeChatId
              ? { ...chat, messages: newMessages, timestamp: new Date() }
              : chat
          )
        );
      }
    } catch (error) {
      // Handle errors
      console.error('Error sending message:', error);

      // Create error message
      const errorMessage: MessageType = {
        id: createId(),
        ChatResponse: "Sorry, I encountered an error processing your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages([...updatedMessages, errorMessage]);

      // Show toast notification with error
      toast({
        title: "Error",
        description: "Failed to get response from assistant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle keyword-based chat
  const handleKeywordChat = async (keyword: string) => {
    if (!keyword.trim()) return;

    // Create user message
    const userMessage: MessageType = {
      id: createId(),
      ChatResponse: `Search for keyword: ${keyword}`,
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // We'd need to add a keywordSearch method to our ChatApi
      // For now, we'll use the standard sendMessage method
      const response = await ChatApi.sendMessage(`Search for keyword: ${keyword}`);

      // Create AI response
      const aiResponse: MessageType = {
        id: createId(),
        ChatResponse: response.data?.reply || "No response available",
        isUser: false,
        timestamp: new Date(),
      };

      // Update messages with AI response
      setMessages([...updatedMessages, aiResponse]);
      scrollToBottom();

      // If there's any candidate matching functionality, it would be processed here
      // Based on the response structure from the API

    } catch (error) {
      console.error('Error in keyword chat:', error);

      // Create error message
      const errorMessage: MessageType = {
        id: createId(),
        ChatResponse: "Sorry, I encountered an error with the keyword search. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages([...updatedMessages, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to process keyword search",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        id: createId(),
        ChatResponse: `Hello! I'm your Medical Assistant for the "${activeWorkspace?.name || 'Current'}" workspace. How can I help you today?`,
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    setActiveChatId(null);
  };

  const loadChatHistory = (chatId: string) => {
    const chat = chatHistories.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setActiveChatId(chatId);
    }
  };

  // Function to handle quick actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'summarize':
        if (activeWorkspace?.type === 'resume' && activeWorkspace?.filePath) {
          // Start a summary request
          if (typeof activeWorkspace.filePath === 'string') {
            handleSummaryRequest(activeWorkspace.filePath);
          } else {
            toast({
              title: "Invalid File Path",
              description: "The file path is not valid or missing.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Cannot summarize",
            description: "Please select a resume file first",
            variant: "destructive",
          });
        }
        break;
      case 'match':
        if (activeWorkspace?.type === 'resume') {
          setInput("Find job matches for this resume");
        } else if (activeWorkspace?.type === 'jd') {
          setInput("Find candidate matches for this job");
        }
        break;
      default:
        break;
    }
  };

  // Function to handle summary requests
  const handleSummaryRequest = async (filePath: string) => {
    // Create user message
    const userMessage: MessageType = {
      id: createId(),
      ChatResponse: "Generate a summary of this resume",
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // For CV summary, we could extend our API to include a getCVSummary method
      // For now, we'll use the sendMessage method with a specific instruction
      const response = await ChatApi.sendMessage(`Generate a summary of the resume at: ${filePath}`);

      // Create AI response with summary
      const summaryResponse: MessageType = {
        id: createId(),
        ChatResponse: response.data?.reply || "No summary available",
        isUser: false,
        timestamp: new Date(),
      };

      // Update messages with the summary
      const newMessages = [...updatedMessages, summaryResponse];
      setMessages(newMessages);
      scrollToBottom();

      // Update chat history
      if (!activeChatId) {
        const newChatId = createId();
        const newChat: ChatHistory = {
          id: newChatId,
          title: "Resume Summary",
          preview: "Generated summary of resume",
          timestamp: new Date(),
          messages: newMessages,
        };

        setChatHistories(prev => [newChat, ...prev]);
        setActiveChatId(newChatId);

        toast({
          title: "Summary generated",
          description: "Resume summary has been created",
        });
      } else {
        setChatHistories(prev =>
          prev.map(chat =>
            chat.id === activeChatId
              ? { ...chat, messages: newMessages, timestamp: new Date() }
              : chat
          )
        );
      }
    } catch (error) {
      console.error('Error generating summary:', error);

      // Create error message
      const errorMessage: MessageType = {
        id: createId(),
        ChatResponse: "Sorry, I encountered an error generating the summary. Please make sure the file is accessible.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages([...updatedMessages, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to generate resume summary",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Box sx={{
        display: 'flex',
        gap: 2,
        height: '100%',
        border: 1,
        borderRadius: 2,
        borderColor: 'divider',
      }}>
        {/* Chat History Sidebar */}
        {showHistory && (
          <Card sx={{ width: '25%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 2, flex: 1, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1">Recent Conversations</Typography>
                <IconButton onClick={() => setShowHistory(false)} size="small">
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ height: 'calc(100vh - 14rem)', overflow: 'auto' }}>
                <List>
                  {chatHistories.map((chat) => (
                    <ListItem
                      key={chat.id}
                      component="button"
                      onClick={() => loadChatHistory(chat.id)}
                      sx={{
                        mb: 1,
                        borderRadius: 1,
                        backgroundColor: activeChatId === chat.id ? 'action.selected' : 'inherit',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemText
                        primary={chat.title}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {chat.preview}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {chat.timestamp.toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Main Chat Area */}
        <Card sx={{
          width: showHistory ? '75%' : '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Message color="primary" sx={{ color: "white" }} />
              <Typography variant="subtitle1">
                {activeChatId
                  ? chatHistories.find(c => c.id === activeChatId)?.title || 'Chat'
                  : 'New Conversation'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => setShowHistory(!showHistory)}
                sx={{ color: "white" }}
                startIcon={<History fontSize="small" sx={{ color: "white" }} />}
              >
                {showHistory ? 'Hide History' : 'History'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={startNewChat}
                sx={{ color: "white" }}
                startIcon={<Message fontSize="small" sx={{ color: "white" }} />}
              >
                New Chat
              </Button>
            </Box>
          </Box>

          <Box
            ref={scrollAreaRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const isSameSenderAsPrev = prevMessage ? prevMessage.isUser === message.isUser : false;
              
              return (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.isUser ? 'flex-end' : 'flex-start',
                    mt: isSameSenderAsPrev ? 0 : 1.5,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      maxWidth: '80%',
                      borderRadius: message.isUser 
                        ? '16px 4px 16px 16px'
                        : '4px 16px 16px 16px',
                      backgroundColor: message.isUser
                        ? theme.palette.primary.main
                        : theme.palette.secondary.main,
                      color: theme.palette.getContrastText(
                        message.isUser ? theme.palette.primary.main : theme.palette.secondary.main
                      ),
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.ChatResponse}
                    </Typography>
                  </Paper>
                  <Typography 
                    variant="caption" 
                    sx={{
                      px: 1,
                      mt: 0.25,
                      opacity: 0.7,
                      display: 'block' 
                    }}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              );
            })}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1.5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    borderRadius: '4px 16px 16px 16px',
                    backgroundColor: theme.palette.secondary.main,
                    color: theme.palette.getContrastText(theme.palette.secondary.main),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" sx={{ animation: 'blink 1.4s infinite both', animationDelay: '0s', fontSize: '1.2em' }}>.</Box>
                    <Box component="span" sx={{ animation: 'blink 1.4s infinite both', animationDelay: '0.2s', fontSize: '1.2em' }}>.</Box>
                    <Box component="span" sx={{ animation: 'blink 1.4s infinite both', animationDelay: '0.4s', fontSize: '1.2em' }}>.</Box>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>

          {activeWorkspace && (
            <Box sx={{ 
              p: 1, 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 1, 
              borderTop: 1, 
              borderColor: 'divider' 
              }}>
              {activeWorkspace.type === 'resume' && (
                <>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleQuickAction('summarize')}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Summarize Resume
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleQuickAction('match')}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Find Job Matches
                  </Button>
                </>
              )}
              {activeWorkspace.type === 'jd' && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => handleQuickAction('match')}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Find Candidate Matches
                </Button>
              )}
            </Box>
          )}

          <Divider /> 
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: '20%', alignSelf: 'stretch' }}>
              <WorkspaceSelector />
            </Box>
            <TextField
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              multiline
              minRows={1}
              maxRows={4}
              fullWidth
              variant="outlined"
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: '12px' 
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <CustomButton
              type="submit"
              variant="primary"
              disabled={isLoading || !input.trim()}
              sx={{ 
                height: 'auto', 
                minWidth: '48px', 
                p: 1.5, 
                alignSelf: 'stretch' 
              }}
            >
              <Send />
            </CustomButton>
          </Box>
        </Card>
      </Box>
      <style>{`
        @keyframes blink {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }
      `}</style>
    </>
  );
};

export default WorkspaceChat;