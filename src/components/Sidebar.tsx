import React, { useRef } from 'react';
import { useSheetStore, Sheet } from '../store/useSheetStore';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  UploadOutlined, 
  DownloadOutlined,
  MenuOutlined,
  CalculatorOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { Button, Tooltip, Popconfirm } from 'antd';
import clsx from 'clsx';

export const Sidebar: React.FC<{ isOpen: boolean; setIsOpen: (v: boolean) => void }> = ({ isOpen, setIsOpen }) => {
  const { 
    sheets, 
    activeSheetId, 
    addSheet, 
    addWelcomeSheet,
    deleteSheet, 
    setActiveSheet, 
    importSheets 
  } = useSheetStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(sheets, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sumflow_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
           // Basic validation could go here
           importSheets(imported as Sheet[]);
        } else {
            alert("Invalid JSON format: Expected an array of sheets.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className={clsx(
      "flex flex-col bg-gray-50 dark:bg-[#262626] border-r border-gray-200 dark:border-[#303030] transition-all duration-300 h-full",
      isOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
    )}>
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-[#303030] flex-shrink-0">
        <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
          <CalculatorOutlined className="text-[#0f62fe]" />
          <span className="tracking-tight">SumFlow</span>
        </div>
      </div>

      {/* Sheet List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            onClick={() => setActiveSheet(sheet.id)}
            className={clsx(
              "group flex items-center justify-between px-3 py-2 rounded cursor-pointer text-sm transition-colors",
              sheet.id === activeSheetId
                ? "bg-gray-200 dark:bg-[#393939] text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#353535] hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            <span className="truncate pr-2">{sheet.name}</span>
            
            <Popconfirm
              title="Delete this sheet?"
              onConfirm={(e) => {
                e?.stopPropagation();
                deleteSheet(sheet.id);
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="Yes"
              cancelText="No"
            >
              <button 
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <DeleteOutlined />
              </button>
            </Popconfirm>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-200 dark:border-[#303030] flex-shrink-0 space-y-2">
        <Button 
          type="primary" 
          block 
          icon={<PlusOutlined />} 
          onClick={addSheet}
          className="bg-[#0f62fe]"
        >
          New Sheet
        </Button>
        
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleImport}
          />
          <Tooltip title="Import JSON">
            <Button 
              className="flex-1 bg-white dark:bg-[#393939] border-gray-300 dark:border-none text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#4c4c4c]" 
              icon={<UploadOutlined />} 
              onClick={() => fileInputRef.current?.click()}
            />
          </Tooltip>
          
          <Tooltip title="Export JSON">
            <Button 
              className="flex-1 bg-white dark:bg-[#393939] border-gray-300 dark:border-none text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#4c4c4c]" 
              icon={<DownloadOutlined />} 
              onClick={handleExport}
            />
          </Tooltip>

          <Tooltip title="Help / Examples">
            <Button 
              className="flex-none px-3 bg-white dark:bg-[#393939] border-gray-300 dark:border-none text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#4c4c4c]" 
              icon={<QuestionCircleOutlined />} 
              onClick={addWelcomeSheet}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
