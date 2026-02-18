"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StoriesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page where stories are displayed
    router.replace("/");
  }, [router]);

  return null;
}
