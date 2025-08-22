import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Birdseye Finance", description: "All accounts, one view." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <Link href="/" className="font-semibold">🐦 Birdseye</Link>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/link-bank" className="hover:underline">Link Bank</Link>
              <Link href="/banks" className="hover:underline">Banks</Link>
              <Link href="/wallets" className="hover:underline">Wallets</Link>
              <Link href="/net-worth" className="hover:underline">Net Worth</Link>
              <Link href="/transactions" className="hover:underline">Transactions</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
