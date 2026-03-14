import React from 'react';
import { Sidebar } from './Sidebar';
import { ProgressToast } from '@/components/ui/ProgressToast';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const handleSwitchToAIDP = () => {
    window.location.href = 'http://7.250.75.172:5173';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="absolute top-4 right-4 z-50">
          <button
            onClick={handleSwitchToAIDP}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md text-sm font-medium"
          >
            切换到 AIDP
          </button>
        </header>
        {children}
      </main>
      <ProgressToast />
    </div>
  );
};
