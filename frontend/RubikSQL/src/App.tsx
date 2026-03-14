import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import { ChatArea } from "@/features/chat/ChatArea";
import { DatabaseSettings } from "@/features/database/DatabaseSettings";
import { useAppStore } from "@/stores/useAppStore";
import { api } from "@/lib/api";

function App() {
  const { activeTab } = useAppStore();
  const { i18n } = useTranslation();

  // Load language setting from backend config on startup
  useEffect(() => {
    const loadLanguageSetting = async () => {
      try {
        const config = await api.getConfig();
        const configuredLang = config.language?.app || "en";
        // Only change if different from current
        if (i18n.language !== configuredLang) {
          i18n.changeLanguage(configuredLang);
        }
      } catch (err) {
        // Silently fail - keep current/default language
        console.warn("Failed to load language setting from config:", err);
      }
    };
    loadLanguageSetting();
  }, [i18n]);

  return (
    <AppShell>
      {activeTab === "chat" && <ChatArea />}

      {activeTab === "database" && <DatabaseSettings />}
    </AppShell>
  );
}

export default App;
