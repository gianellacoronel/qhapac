import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import type { ProjectData } from "@/lib/project/data";

type ProjectHeroProps = {
  project: ProjectData;
  /** Dominant hero moment (e.g. funding %). */
  lead: ReactNode;
  aside?: ReactNode;
};

export function ProjectHero({ project, lead, aside }: ProjectHeroProps) {
  return (
    <section className="relative border-b border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 sm:gap-12 sm:px-8 sm:py-16 lg:gap-14 lg:py-20">
        {lead}

        <div className="grid gap-8 border-t border-border/60 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,26rem)] lg:items-end lg:gap-12 lg:pt-10">
          <div className="min-w-0 space-y-2">
            <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {project.name}
            </h1>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
              <span>
                {project.location}, {project.region}
              </span>
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {project.shortDescription}
            </p>
          </div>

          {aside ? <aside className="min-w-0">{aside}</aside> : null}
        </div>
      </div>
    </section>
  );
}
