import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

export const metadata = {
  title: "RAG Chatbot",
  description: "Retrieval-Augmented Generation Chatbot powered by Claude",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
