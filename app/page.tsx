import { redirect } from "next/navigation";

export default function Home() {
  // proxy.ts routes unauthenticated users to /login.
  redirect("/dashboard");
}
