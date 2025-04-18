"use client";
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, IconButton, Divider, Box, Typography, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import {
  Menu as MenuIcon,
  ArrowLeft as ArrowLeftIcon,
  FileText as DashboardIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  PanelLeft as CategoryIcon,
  User as PersonIcon,
  Briefcase as WorkIcon,
  MessageCircle as ChatIcon,
  Settings as SettingsIcon,
  Home as HomeIcon
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useRouter, usePathname } from 'next/navigation';
import CustomButton from '@/components/atoms/button/CustomButton';
import Image from 'next/image';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useState } from 'react';
import { Add, Folder, KeyboardArrowDown } from '@mui/icons-material';
import { useToast } from '@/lib/hooks/useToast';

const navItems = [
  { title: 'Home', icon: <HomeIcon size={18} />, path: '/' }, 
  { title: 'Dashboard', icon: <DashboardIcon size={18} />, path: '/dashboard' },
];

const Sidebar = () => {
  const router = useRouter();
  const { isOpen, toggleSidebar } = useSidebar();
  const { workspaces, activeWorkspace, setActiveWorkspace, addWorkspace } = useWorkspace();
  const [isWorkspacesExpanded, setIsWorkspacesExpanded] = useState(true);
  const pathname = usePathname();
  const [isNewWorkspaceDialogOpen, setIsNewWorkspaceDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const { toast } = useToast();

  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim() === '') {
      toast({
        title: "Error",
        description: "Workspace name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    const newWorkspace = {
      id: `ws-${Date.now()}`,
      name: newWorkspaceName,
      folders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      collaborators: []
    };

    addWorkspace(newWorkspace);
    setActiveWorkspace(newWorkspace);
    setNewWorkspaceName('');
    setIsNewWorkspaceDialogOpen(false);

    toast({
      title: "Success",
      description: `Workspace "${newWorkspaceName}" created successfully`,
    });
  };

  return (
    <>
      {/* Overlay when sidebar is open on mobile */}
      {isOpen && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            bgcolor: "BlackPearl.main", // Background with opacity
            backdropFilter: "blur(5px)", // Blur effect
            display: { md: "none" }, // Hide on larger screens
          }}
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        open={isOpen}
        sx={{
          // Ensure Drawer container width matches paper width when open
          width: isOpen ? 200 : 80, // Changed 220 to 200
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: isOpen ? 200 : 80, // This remains 200 when open
            transition: "width 0.3s ease-in-out",
            overflowX: "hidden",
            display: 'flex', // Ensure flex layout for the drawer paper
            flexDirection: 'column', // Stack children vertically
          },
        }}
      >
        {/* Sidebar Header */}
        <Box sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          flexShrink: 0, // Prevent header from shrinking
        }}>
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>

            {isOpen ? (
              <Typography variant="h6" color='DodgerBlue.main' sx={{ fontWeight: "bold" }}>
                MetProAi
              </Typography>
            ) : (
              <Box
                onClick={toggleSidebar}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "DodgerBlue.main",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                MP
              </Box>
            )}
          </Box>

          <CustomButton variant='link' onClick={toggleSidebar} sx={{ minWidth: 0, p: 1, display: { md: "flex" } }}>
            {isOpen ? <ArrowLeftIcon size={20} /> : <MenuIcon />}
          </CustomButton>
        </Box>

        {/* Navigation Menu (Moved Here) */}
        <List sx={{ flexShrink: 0, py: 1 }}> {/* Add padding */}
          {navItems.map((item) => (
            <ListItemButton
              key={item.title}
              selected={pathname === item.path}
              sx={{
                justifyContent: isOpen ? "flex-start" : "center",
                px: isOpen ? 2 : 1,
                transition: "all 0.3s",
              }}
              onClick={() => {
                if (pathname !== item.path) {
                  router.replace(item.path); // Replace the current URL
                }
              }}
            >
              {item.icon}
              {isOpen && <Typography sx={{ ml: 2, fontSize: '0.875rem' }}>{item.title}</Typography>}
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ flexShrink: 0 }} />

        {/* Workspaces Section */}
        <Box sx={{ px: 1.5, py: 2, flexShrink: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              cursor: 'pointer'
            }}
            onClick={() => setIsWorkspacesExpanded(!isWorkspacesExpanded)}
          >
            <Typography
              variant="caption"
              sx={{
                textTransform: 'uppercase',
                color: 'text.secondary',
                fontWeight: 'medium',
                ...(!isOpen && {
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  borderWidth: 0,
                })
              }}
            >
              Workspaces
            </Typography>
            {isOpen && (
              <KeyboardArrowDown
                sx={{
                  color: 'text.secondary',
                  transition: 'transform 0.2s',
                  ...(isWorkspacesExpanded && {
                    transform: 'rotate(180deg)'
                  })
                }}
              />
            )}
          </Box>

          {/* Render individual workspaces ONLY if expanded AND sidebar is open */}
          {isWorkspacesExpanded && isOpen && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {workspaces.map((workspace) => (
                <CustomButton
                  key={workspace.id}
                  variant={workspace.id === activeWorkspace?.id ? "primary" : "ghost"}
                  sx={{
                    width: '100%',
                    justifyContent: 'flex-start', // Keep left alignment
                    gap: 2,
                    height: 36,
                    px: 2,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    overflow: 'hidden', // Prevent content overflow
                  }}
                  onClick={() => {
                    setActiveWorkspace(workspace);
                    router.push('/dashboard/workspace');
                  }}
                >
                  {/* Ensure circle doesn't shrink */}
                  <Box sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.main',
                    fontSize: '0.75rem',
                    flexShrink: 0, // Prevent shrinking
                  }}>
                    {workspace.name.charAt(0)}
                  </Box>
                  {/* Text only visible when open */}
                  <Typography noWrap sx={{ flex: 1, textAlign: 'left' }}>
                    {workspace.name}
                  </Typography>
                </CustomButton>
              ))}

              {/* "New Workspace" Button - Text hidden when collapsed */}
              <CustomButton
                variant="ghost"
                size="small"
                sx={{
                  width: '100%',
                  justifyContent: 'flex-start', // Keep left alignment
                  color: 'text.secondary',
                  mt: 1,
                  textTransform: 'none',
                  px: 2, // Match padding
                  gap: 2, // Match gap
                }}
                onClick={() => setIsNewWorkspaceDialogOpen(true)}
              >
                <Add sx={{ fontSize: 20, flexShrink: 0 }} /> {/* Icon always visible */}
                {/* Text only visible when open */}
                <Typography sx={{ fontSize: '0.875rem' }}>
                  New Workspace
                </Typography>
              </CustomButton>
            </Box>
          )}

          {/* For collapsed sidebar - Show Folder Icon OR Individual Workspace Icons */}
          {!isOpen && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
              {/* Show individual workspace icons when collapsed */}
              {workspaces.map((workspace) => (
                 <CustomButton
                  key={workspace.id}
                  variant={workspace.id === activeWorkspace?.id ? "primary" : "ghost"}
                  sx={{
                    width: 40, // Fixed width for collapsed button
                    height: 40, // Fixed height
                    minWidth: 'auto',
                    p: 0, // Remove padding
                    borderRadius: '50%', // Make button circular
                  }}
                  onClick={() => {
                    setActiveWorkspace(workspace);
                    router.push('/dashboard/workspace');
                  }}
                  title={workspace.name} // Add tooltip for collapsed state
                >
                  {/* Circle takes full button space */}
                  <Box sx={{
                    width: 20, // Keep icon size consistent
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.main',
                    fontSize: '0.75rem',
                  }}>
                    {workspace.name.charAt(0)}
                  </Box>
                </CustomButton>
              ))}
               {/* Collapsed "New Workspace" Button */}
               <CustomButton
                variant="ghost"
                size="small"
                sx={{
                  width: 40, // Fixed width
                  height: 40, // Fixed height
                  minWidth: 'auto',
                  p: 0, // Remove padding
                  borderRadius: '50%', // Make button circular
                  mt: 1, // Add margin top
                }}
                onClick={() => setIsNewWorkspaceDialogOpen(true)}
                title="New Workspace" // Add tooltip
              >
                <Add sx={{ fontSize: 20 }} />
              </CustomButton>
            </Box>
          )}
        </Box>

        {/* Spacer to push the image to the bottom */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Image at the bottom */}
        <Divider sx={{ flexShrink: 0 }} />
        <Box sx={{
          display: "flex", // Changed from diaply
          justifyContent: "center", // Center the image
          alignItems: "center", // Center vertically if needed
          p: 2, // Add some padding
          flexShrink: 0, // Prevent shrinking
        }}>
          <Image
            src="/Caze MeTPro AI.png" // Path to the image
            alt="MetProAi Logo"
            width={isOpen ? 150 : 50} // Adjust width based on sidebar state
            height={isOpen ? 150 : 50} // Adjust height based on sidebar state
            priority // Loads image immediately
            style={{
              filter: `drop-shadow(5px 5px 5px #000000)`, // Adjusted shadow
              transition: 'width 0.3s ease-in-out, height 0.3s ease-in-out', // Smooth transition
            }}
          />
        </Box>

        {/* Settings Button - Future Implementation (Removed from here) */}
      </Drawer>

      {/* Floating Button to Toggle Sidebar (Mobile Only) */}
      <CustomButton
        variant="outline"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 40,
          display: { md: "none" },
        }}
        onClick={toggleSidebar}
      >
        <MenuIcon />
      </CustomButton>

      {/* New Workspace Dialog */}
      <Dialog open={isNewWorkspaceDialogOpen} onClose={() => setIsNewWorkspaceDialogOpen(false)}>
        <DialogTitle>Create New Workspace</DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Workspace Name
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter workspace name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <CustomButton variant="outline" onClick={() => setIsNewWorkspaceDialogOpen(false)}>
            Cancel
          </CustomButton>
          <CustomButton variant="primary" onClick={handleCreateWorkspace}>
            Create Workspace
          </CustomButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar;