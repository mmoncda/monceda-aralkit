import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const aralkitPreviousMetadata: Metadata = {
  title: "AralKit PH | Free School Tools",
  description:
    "Free learning tools for Filipino students, parents, and teachers.",
};

/* ARALKIT_PHASE8A_BRANDING */

export const metadata: Metadata = {
  ...aralkitPreviousMetadata,

  metadataBase: new URL("https://aralkit.moncedalabs.com"),

  title: "AralKit PH | Learn. Practice. Achieve.",

  description: "Free school tools for students, parents, and teachers in the Philippines: calculate grades, practice for Grade 7 admission, generate math worksheets, and create school cover pages.",

  applicationName: "AralKit PH",

  openGraph: {
    ...aralkitPreviousMetadata.openGraph,
    title: "AralKit PH | Learn. Practice. Achieve.",
    description: "Free school tools for students, parents, and teachers in the Philippines: calculate grades, practice for Grade 7 admission, generate math worksheets, and create school cover pages.",
    siteName: "AralKit PH",
    url: "/",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "AralKit PH school tools by Monceda Labs",
      },
    ],
  },

  twitter: {
    ...aralkitPreviousMetadata.twitter,
    card: "summary_large_image",
    title: "AralKit PH | Learn. Practice. Achieve.",
    description: "Free school tools for students, parents, and teachers in the Philippines: calculate grades, practice for Grade 7 admission, generate math worksheets, and create school cover pages.",
    images: ["/twitter-image.png"],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="navigation">
            <Link className="brand" href="/">
              🎓 AralKit PH
            </Link>
            <div className="nav-links desktop-nav">

              <Link href="/">Home</Link>
              <Link href="/tools/grade-calculator/">
                Grades
              </Link>
              <Link href="/reviewer/">
                Reviewer
              </Link>
              <Link href="/tools/worksheet-generator/">
                Worksheets
              </Link>
              <Link href="/tools/cover-maker/">
                Covers
              </Link>
            
</div>

<details className="mobile-nav">
  <summary aria-label="Toggle navigation menu">
    ☰ Menu
  </summary>

  <div className="mobile-nav-links">

              <Link href="/">Home</Link>
              <Link href="/tools/grade-calculator/">
                Grades
              </Link>
              <Link href="/reviewer/">
                Reviewer
              </Link>
              <Link href="/tools/worksheet-generator/">
                Worksheets
              </Link>
              <Link href="/tools/cover-maker/">
                Covers
              </Link>
            
  </div>
</details>
          </nav>
        </header>

        <main className="main-content">
          {children}
        </main>

        <footer className="footer">
  <nav
    className="footer-links"
    aria-label="Footer navigation"
  >
    <Link href="/about/">
      About
    </Link>

    <Link href="/privacy/">
      Privacy Policy
    </Link>

    <Link href="/contact/">
      Contact
    </Link>
  </nav>
          AralKit PH · by Monceda Labs ⭐
        </footer>
      </body>
    </html>
  );
}
