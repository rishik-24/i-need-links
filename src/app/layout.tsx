import Header from "@/components/Header/Header";
import Footer from "@/components/Home/Footer";
import ThemeProvider from "@/components/Providers/ThemeProvider";
import { notoSansBengali, outfit } from "@/lib/fonts";
import { ReactNode } from "react";
import "./globals.css";

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: Readonly<RootLayoutProps>) => {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={`${outfit.variable} ${notoSansBengali.variable} antialiased`}
    >
      <body className="overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <Header />

          <main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </main>

          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
