import { useTranslations } from "next-intl";
import type { ProjectData } from "@/lib/project/data";

type ProjectOverviewProps = {
  project: ProjectData;
};

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const t = useTranslations("project");

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {t("overviewLabel")}
        </p>
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("overviewTitle")}
        </h2>
      </div>

      <div className="space-y-4">
        {project.overview.map((paragraph) => (
          <p
            key={paragraph}
            className="text-base leading-relaxed text-muted-foreground"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <dl className="grid gap-4 border-t border-border/70 pt-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        <div className="space-y-1">
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">
            {t("location")}
          </dt>
          <dd className="font-medium">
            {project.location}, {project.region}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">
            {t("token")}
          </dt>
          <dd className="font-medium">{project.token}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">
            {t("referenceValue")}
          </dt>
          <dd className="font-medium">
            {t("referenceValueFormula", {
              token: project.token,
              value: project.referenceValueUsd,
            })}
          </dd>
        </div>
      </dl>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {project.disclaimer}
      </p>
    </section>
  );
}
