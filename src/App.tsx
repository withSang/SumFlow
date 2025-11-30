import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SheetEditor } from './components/SheetEditor';
import { MenuOutlined, UndoOutlined, RedoOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { Button, Tooltip, ConfigProvider, theme as antTheme } from 'antd';
import { useSheetStore } from './store/useSheetStore';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { 
      activeSheetId, 
      sheets, 
      updateSheetName,
      undo,
      redo,
      history,
      theme,
      toggleTheme
  } = useSheetStore();
  
  const activeSheet = sheets.find(s => s.id === activeSheetId);
  const sheetHistory = history[activeSheetId] || { past: [], future: [] };
  
  const canUndo = sheetHistory.past.length > 0;
  const canRedo = sheetHistory.future.length > 0;

  // Sync theme to document
  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <ConfigProvider
        theme={{
            algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
            token: {
                colorPrimary: '#0f62fe',
            }
        }}
    >
        <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#141414] transition-colors duration-300">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* Top Bar */}
            <div className="h-12 border-b border-gray-200 dark:border-[#303030] bg-white dark:bg-[#141414] flex items-center px-4 justify-between flex-shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {!sidebarOpen && (
                <Button 
                    type="text" 
                    icon={<MenuOutlined className="text-gray-500 dark:text-gray-400" />} 
                    onClick={() => setSidebarOpen(true)}
                    className="hover:bg-gray-100 dark:hover:bg-[#262626]"
                />
                )}
                
                {activeSheet && (
                <input
                    value={activeSheet.name}
                    onChange={(e) => updateSheetName(activeSheetId, e.target.value)}
                    className="bg-transparent border-none focus:ring-0 font-bold text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 w-full outline-none min-w-0 transition-colors duration-300"
                    placeholder="Untitled Sheet"
                />
                )}
            </div>
            
            <div className="flex items-center gap-1 pl-2">
                <Tooltip title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
                    <Button
                        type="text"
                        icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                        onClick={toggleTheme}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262626]"
                    />
                </Tooltip>
            </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 min-h-0 relative">
            <SheetEditor />
            </div>
        </div>
        </div>
    </ConfigProvider>
  );
}

export default App;
