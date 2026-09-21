"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  huaralResort,
  type ProjectBenefit,
  type ProjectData,
} from "@/lib/project/data";

/** Localized Huaral Resort copy for UI; structural fields stay from data. */
export function useLocalizedProject(): ProjectData {
  const t = useTranslations("project");
  const locale = useLocale();

  return useMemo(() => {
    const benefits: ProjectBenefit[] = huaralResort.benefits.map((benefit) => ({
      id: benefit.id,
      title: t(`benefits.${benefit.id}.title`),
      description: t(`benefits.${benefit.id}.description`),
      highlight: t(`benefits.${benefit.id}.highlight`),
    }));

    return {
      ...huaralResort,
      shortDescription: t("shortDescription"),
      overview: [t("overview.p1"), t("overview.p2"), t("overview.p3")],
      mainBenefit: t("mainBenefit"),
      benefits,
      disclaimer: t("disclaimer"),
    };
    // locale ensures refresh when language changes
  }, [t, locale]);
}
