import { ProfilePage } from "@/components/profile/profile-page";

export default function ProfileRoute() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="flex flex-1 flex-col">
        <ProfilePage />
      </main>
    </div>
  );
}
