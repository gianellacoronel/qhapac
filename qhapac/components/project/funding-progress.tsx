import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import {
  formatQrp,
  getFundingPercent,
  type ProjectData,
} from "@/lib/project/data";

type FundingProgressProps = {
  project: ProjectData;
};

export function FundingProgress({ project }: FundingProgressProps) {
  const percent = getFundingPercent(project);

  return (
    <section className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Funding progress
          </p>
          <p className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {formatQrp(project.fundingCurrent)}{" "}
            <span className="text-lg font-normal text-muted-foreground">
              / {formatQrp(project.fundingTarget)} {project.token}
            </span>
          </p>
        </div>
        <p className="font-heading text-3xl font-semibold tabular-nums text-primary">
          {percent}%
        </p>
      </div>

      <Progress value={percent} className="w-full">
        <ProgressLabel className="sr-only">Funding completion</ProgressLabel>
        <ProgressValue />
      </Progress>

      <p className="text-sm text-muted-foreground">
        Static hackathon figures for {project.name}. Your wallet {project.token}{" "}
        balance is read live from Stellar Testnet.
      </p>
    </section>
  );
}
