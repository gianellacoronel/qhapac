import { useTranslations } from "next-intl";
import { QrpLabel } from "@/components/qrp-help";
import type { ProjectData } from "@/lib/project/data";

type ProjectOverviewProps = {
  project: ProjectData;
};

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const t = useTranslations("project");

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-14">
      <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("overviewTitle")}
      </h2>

      <div className="space-y-8">
        <div className="space-y-4">
          {project.overview.map((paragraph) => (
            <p
              key={paragraph}
              className="max-w-prose text-base leading-relaxed text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <dl className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">{t("location")}</dt>
            <dd className="font-medium">
              {project.location}, {project.region}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">{t("token")}</dt>
            <dd className="font-medium">
              <QrpLabel brief={false} />
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">
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

        <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
          {project.disclaimer}
        </p>
      </div>
    </section>
  );
}
