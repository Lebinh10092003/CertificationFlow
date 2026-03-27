import { RouterProvider } from "react-router";
import { router } from "./routes";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppDataProvider } from "./contexts/AppDataContext";

export default function App() {
  return (
    <LanguageProvider>
      <AppDataProvider>
        <RouterProvider router={router} />
      </AppDataProvider>
    </LanguageProvider>
  );
}
