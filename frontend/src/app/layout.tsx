import type { Metadata } from "next";
import ThemeProvider from "@/components/ThemeProvider";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: "Task Management",
  description: "Task Management Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
