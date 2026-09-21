import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProjectBenefit } from "@/lib/project/data";

type BenefitCardProps = {
  benefit: ProjectBenefit;
};

export function BenefitCard({ benefit }: BenefitCardProps) {
  return (
    <Card className="h-full shadow-none">
      <CardHeader>
        {benefit.highlight ? (
          <Badge
            variant="secondary"
            className="mb-2 w-fit bg-accent/80 text-accent-foreground"
          >
            {benefit.highlight}
          </Badge>
        ) : null}
        <CardTitle className="font-heading text-lg">{benefit.title}</CardTitle>
        <CardDescription className="leading-relaxed">
          {benefit.description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
