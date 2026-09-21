import { Suspense } from "react";
import { VerifyBenefitPage } from "@/components/benefits/verify-benefit-page";
import { Skeleton } from "@/components/ui/skeleton";

function VerifyFallback() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12 sm:px-8 sm:py-16">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-64 w-full max-w-md" />
    </div>
  );
}

export default function VerifyBenefitRoute() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<VerifyFallback />}>
          <VerifyBenefitPage />
        </Suspense>
      </main>
    </div>
  );
}
