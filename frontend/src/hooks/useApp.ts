import { useContext } from 'react';
import { AppContext } from '../App';

/**
 * Hook to use Ant Design App APIs (message, modal, notification)
 * This replaces static methods like message.success() to avoid context warnings
 */
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within AppContext.Provider');
  }

  return context;
};
