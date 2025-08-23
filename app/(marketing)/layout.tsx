import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {" "}
      {/* full height flex column */}
      <Navbar />
      <main className="flex-1">{children}</main> {/* grows to fill space */}
      <Footer />
    </div>
  );
}
