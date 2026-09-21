import { ProjectPage } from "@/components/project/project-page";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="flex flex-1 flex-col">
        <ProjectPage />
      </main>
    </div>
  );
}
