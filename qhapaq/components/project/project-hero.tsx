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
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,20rem)] lg:items-start lg:gap-14 lg:py-20">
        <div className="flex min-w-0 flex-col gap-8">
          {lead}

          <div className="space-y-2 border-t border-border/60 pt-6">
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
        </div>

        {aside ? (
          <aside className="min-w-0 lg:sticky lg:top-24 lg:justify-self-end">
            {aside}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
