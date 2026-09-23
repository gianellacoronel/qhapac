import type { ReactNode } from "react";
import Image from "next/image";
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
    <section className="relative">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 sm:gap-12 sm:px-8 sm:py-16 lg:gap-14 lg:py-20">
        {lead}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,26rem)] lg:items-stretch lg:gap-12">
          <div className="relative flex min-h-48 min-w-0 flex-col justify-end overflow-hidden rounded-2xl sm:min-h-56 lg:min-h-0 lg:h-full">
            <Image
              src="/huaral-resort.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/15"
              aria-hidden
            />
            <div className="relative z-10 space-y-2 p-5 text-white sm:p-6 lg:p-7">
              <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                {project.name}
              </h1>
              <p className="flex items-center gap-2 text-sm text-white/85">
                <MapPin className="size-4 shrink-0 text-white" aria-hidden />
                <span>
                  {project.location}, {project.region}
                </span>
              </p>
              <p className="max-w-xl text-sm leading-relaxed text-white/85">
                {project.shortDescription}
              </p>
            </div>
          </div>

          {aside ? <aside className="min-w-0 lg:h-full">{aside}</aside> : null}
        </div>
      </div>
    </section>
  );
}
