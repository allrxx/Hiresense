"use client";
import React, { useState } from 'react';
import { Container, Box, Typography, Divider, Grid, Tabs, Tab } from '@mui/material'; // Import Tabs and Tab
import { Folder as FolderIcon, Chat as ChatIcon } from '@mui/icons-material'; // Import ChatIcon
import WorkspaceUpload from '@/components/molecules/workspace-upload/WorkspaceUpload';
import WorkspaceChat from '@/components/molecules/workspace-chat/WorkspaceChat';
// Removed CustomButton import as it's replaced by Tabs

const MetProAiWorkspacePage = () => {
  const [activeView, setActiveView] = useState<'files' | 'chat'>('files'); // Initial view
  const [aiResponse, setAiResponse] = useState<any>(null); // State for AI response

  const handleDocumentUploadSuccess = (response: any) => {
    setAiResponse(response);
    setActiveView('chat'); // Switch to chat view on successful upload
  };

  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: 'files' | 'chat') => {
    setActiveView(newValue);
  };

  return (
    // Use a Box as the main container to control height and overflow
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', p: 3 }}> {/* Added padding */}
      {/* Workspace Header */}
      <Box sx={{ mb: 2, flexShrink: 0 }}> {/* Added flexShrink */}
        <Typography variant="h5" component="h1" fontWeight="bold"> {/* Adjusted variant */}
          MetProAi Workspace
        </Typography>
      </Box>

      {/* Workspace View Selector using Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, flexShrink: 0 }}>
        <Tabs
          value={activeView}
          onChange={handleTabChange}
          aria-label="Workspace view tabs"
          // Removed textColor prop, will handle color via sx
          indicatorColor="primary" // Keep indicator using primary or hardcode like sx={{ bgcolor: '#1976d2' }}
        >
          <Tab
            icon={<FolderIcon fontSize="small" />}
            iconPosition="start"
            label="Files"
            value="files"
            sx={{
              textTransform: 'none',
              minHeight: '48px',
              // Apply specific color when selected
              '&.Mui-selected': {
                color: '#1976d2', // Hardcoded blue color for selected tab text
                fontWeight: 'medium',
              },
              // Optional: Style for inactive tabs
              color: 'text.secondary', // Make inactive tabs gray for contrast
            }}
          />
          <Tab
            icon={<ChatIcon fontSize="small" />}
            iconPosition="start"
            label="Chat"
            value="chat"
            sx={{
              textTransform: 'none',
              minHeight: '48px',
              // Apply specific color when selected
              '&.Mui-selected': {
                color: '#1976d2', // Hardcoded blue color for selected tab text
                fontWeight: 'medium',
              },
              // Optional: Style for inactive tabs
              color: 'text.secondary', // Make inactive tabs gray for contrast
            }}
          />
        </Tabs>
      </Box>

      {/* Workspace Content - Takes remaining space and scrolls internally */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {activeView === 'files' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}> {/* Use Box for layout */}
            <Typography variant="h6" gutterBottom>
              Upload Documents
            </Typography>
            {/* Pass necessary props to WorkspaceUpload */}
            <WorkspaceUpload
              type="medicalDocument"
              uploadHandler={() => Promise.resolve({})} // Replace with actual handler
              uploadUrlHandler={(url, workspaceName) => Promise.resolve({})} // Replace with actual handler
              onUploadSuccess={handleDocumentUploadSuccess}
            />
            <WorkspaceUpload
              type="patientDocument"
              uploadHandler={() => Promise.resolve({})} // Replace with actual handler
              uploadUrlHandler={(url, workspaceName) => Promise.resolve({})} // Replace with actual handler
              onUploadSuccess={handleDocumentUploadSuccess}
            />
          </Box>
        ) : (
          // Render WorkspaceChat component directly
          <WorkspaceChat aiResponse={aiResponse} />
        )}
      </Box>
    </Box>
  );
};

export default MetProAiWorkspacePage;