import { PortfolioHome } from "@/components/portfolio/portfolio-home";

export default function PortfolioRoute() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="flex flex-1 flex-col">
        <PortfolioHome />
      </main>
    </div>
  );
}
