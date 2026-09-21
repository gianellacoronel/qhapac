import { BenefitCard } from "@/components/benefits/benefit-card";
import { Badge } from "@/components/ui/badge";
import { huaralResort } from "@/lib/project/data";

export function BenefitsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-8 sm:py-16">
      <header className="max-w-2xl space-y-4">
        <Badge
          variant="secondary"
          className="bg-accent text-accent-foreground"
        >
          {huaralResort.name}
        </Badge>
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Benefits
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Tangible rewards for participation
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Holding {huaralResort.token} for {huaralResort.name} unlocks guest
            benefits — starting with {huaralResort.mainBenefit.toLowerCase()}.
          </p>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {huaralResort.benefits.map((benefit) => (
          <BenefitCard key={benefit.id} benefit={benefit} />
        ))}
      </div>

      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {huaralResort.disclaimer}
      </p>
    </div>
  );
}
