import type { ProjectData } from "@/lib/project/data";

type ProjectOverviewProps = {
  project: ProjectData;
};

export function ProjectOverview({ project }: ProjectOverviewProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Project information
        </p>
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Built for verifiable participation
        </h2>
      </div>

      <div className="space-y-4">
        {project.overview.map((paragraph) => (
          <p
            key={paragraph}
            className="max-w-2xl text-base leading-relaxed text-muted-foreground"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <dl className="grid gap-4 border-t border-border/70 pt-6 sm:grid-cols-3">
        <div className="space-y-1">
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">
            Location
          </dt>
          <dd className="font-medium">
            {project.location}, {project.region}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">
            Token
          </dt>
          <dd className="font-medium">{project.token}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">
            Reference value
          </dt>
          <dd className="font-medium">
            1 {project.token} = ${project.referenceValueUsd}
          </dd>
        </div>
      </dl>

      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {project.disclaimer}
      </p>
    </section>
  );
}
