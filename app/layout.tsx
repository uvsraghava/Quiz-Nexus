// app/layout.tsx
import './globals.css';
import AuthProvider from './components/AuthProvider';

export const metadata = {
  title: 'Quiz Nexus',
  description: 'AI-Powered Exam Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}