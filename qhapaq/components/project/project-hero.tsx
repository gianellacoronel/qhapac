"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProjectData } from "@/lib/project/data";

type ProjectHeroProps = {
  project: ProjectData;
  progress: ReactNode;
  participation: ReactNode;
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span aria-hidden className="block h-px w-8 shrink-0 bg-border sm:w-10" />
      <span className="text-[0.6875rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {children}
      </span>
    </div>
  );
}

export function ProjectHero({
  project,
  progress,
  participation,
}: ProjectHeroProps) {
  const t = useTranslations("project");

  return (
    <section className="relative">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:gap-12 sm:px-8 sm:py-16 lg:gap-14 lg:py-12">
        <header className="max-w-max space-y-4">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {t.rich("heroTitle", {
              mark: (chunks) => (
                <span className="bg-primary px-1.5 py-0.5 text-primary-foreground">
                  {chunks}
                </span>
              ),
            })}
          </h1>
        </header>

        <div className="relative flex min-h-[22rem] w-full flex-col justify-end overflow-hidden rounded-2xl sm:min-h-[26rem] lg:min-h-[30rem]">
          <Image
            src="/huaral-resort.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 72rem"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10"
            aria-hidden
          />
          <div className="relative z-10 space-y-2 p-5 text-white sm:p-7 lg:max-w-2xl lg:p-9">
            <p className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              {project.name}
            </p>
            <p className="flex items-center gap-2 text-sm text-white/85">
              <MapPin className="size-4 shrink-0 text-white" aria-hidden />
              <span>
                {project.location}, {project.region}
              </span>
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-white/85 sm:text-[0.9375rem]">
              {project.shortDescription}
            </p>
          </div>
        </div>

        <div className="grid gap-10 border-t border-border/60 pt-10 sm:gap-12 lg:grid-cols-2 lg:gap-16 lg:pt-12">
          <div className="min-w-0">{progress}</div>
          <div className="min-w-0 border-t border-border/60 pt-10 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-16">
            {participation}
          </div>
        </div>
      </div>
    </section>
  );
}
