import type { Metadata } from "next";

const TITLE = "RevinHi PDF - Edit, sign and convert PDFs on Windows";
const DESCRIPTION =
  "RevinHi PDF is a fast, offline PDF editor for Windows 10/11: edit existing text, sign, fill forms, merge, split, compress and password-protect. Free to download - Pro is $9.99 once, free updates forever.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "https://revinhi.com/pdf", siteName: "RevinHi", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function PdfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
