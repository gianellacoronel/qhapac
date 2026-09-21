import { BenefitsPage } from "@/components/benefits/benefits-page";

export default function BenefitsRoute() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="flex flex-1 flex-col">
        <BenefitsPage />
      </main>
    </div>
  );
}
