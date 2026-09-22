import type { ProjectBenefit } from "@/lib/project/data";

type BenefitCardProps = {
  benefit: ProjectBenefit;
};

export function BenefitCard({ benefit }: BenefitCardProps) {
  return (
    <article className="space-y-2 border-t border-border/70 pt-5">
      {benefit.highlight ? (
        <p className="font-heading text-3xl font-semibold tracking-tight text-primary">
          {benefit.highlight}
        </p>
      ) : null}
      <h3 className="font-heading text-lg font-semibold tracking-tight">
        {benefit.title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {benefit.description}
      </p>
    </article>
  );
}
