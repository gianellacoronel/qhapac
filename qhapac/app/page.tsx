import { PortfolioHome } from "@/components/portfolio/portfolio-home";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-[radial-gradient(ellipse_at_top,_oklch(0.97_0.02_95)_0%,_var(--background)_55%)]">
      <main className="flex flex-1 flex-col">
        <PortfolioHome />
      </main>
    </div>
  );
}
