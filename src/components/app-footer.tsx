export function AppFooter() {
  return (
    <footer className="mt-auto border-t px-6 py-5">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Sales Brain. Plataforma interna de inteligência comercial.</p>
        <p>v0.1 · ambiente de demonstração</p>
      </div>
    </footer>
  );
}
