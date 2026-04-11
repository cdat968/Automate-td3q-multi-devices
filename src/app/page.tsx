import { redirect } from "next/navigation";

// Root "/" redirects to the login page
export default function RootPage() {
  redirect("/login");
}