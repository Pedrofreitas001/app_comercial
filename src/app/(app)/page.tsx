import { redirect } from "next/navigation";

// Nesta versão resumida a base de clientes é o hub do app.
export default function HomePage() {
  redirect("/clientes");
}
