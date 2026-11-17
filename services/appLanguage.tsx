import { createContext, useContext, type ReactNode } from "react";

const AppLanguageContext = createContext("en");

export function AppLanguageProvider({
  language,
  children,
}: {
  language: string;
  children: ReactNode;
}) {
  return (
    <AppLanguageContext.Provider value={language}>
      {children}
    </AppLanguageContext.Provider>
  );
}

export function useAppLanguage() {
  return useContext(AppLanguageContext);
}
