import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProjectData } from "@/lib/project/data";

type ProjectHeroProps = {
  project: ProjectData;
};

export function ProjectHero({ project }: ProjectHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        className="absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(165deg, oklch(0.94 0.03 276) 0%, oklch(0.98 0.01 95) 42%, oklch(0.96 0.04 92) 100%)",
        }}
      />
      <div
        className="absolute inset-y-0 right-0 -z-10 w-full max-w-xl opacity-40 md:opacity-55"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 70% 40%, oklch(0.852 0.199 91.936 / 0.35), transparent 60%), radial-gradient(ellipse at 90% 80%, oklch(0.511 0.262 276.966 / 0.18), transparent 55%)",
        }}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-accent text-accent-foreground"
          >
            {project.token}
          </Badge>
          <Badge variant="outline">Stellar Testnet</Badge>
        </div>

        <div className="max-w-2xl space-y-5">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {project.name}
          </h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
            <span>
              {project.location}, {project.region}
            </span>
          </p>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {project.shortDescription}
          </p>
        </div>
      </div>
    </section>
  );
}
