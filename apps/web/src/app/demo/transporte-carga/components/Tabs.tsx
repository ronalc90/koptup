'use client';

import React, { useState, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  onTabChange?: (tabId: string) => void;
  controlled?: boolean;
  value?: string;
}

export function Tabs({
  items,
  defaultTab,
  onChange,
  onTabChange,
  controlled = false,
  value,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id || '');
  const currentTab = controlled ? value : activeTab;

  const handleTabClick = (tabId: string) => {
    if (!controlled) {
      setActiveTab(tabId);
    }
    onChange?.(tabId);
    onTabChange?.(tabId);
  };

  const activeItem = items.find((item) => item.id === currentTab);

  return (
    <div className="w-full">
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === currentTab;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              {Icon && <Icon className="w-4 h-4 inline-block mr-2" />}
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4">{activeItem?.content}</div>
    </div>
  );
}
