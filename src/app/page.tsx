// src/app/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function RootPage() {
  const user = getCurrentUser();
  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/auth/login");
  }
}
