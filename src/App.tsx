export function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex items-center justify-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-light-green" />
          <span className="h-2.5 w-2.5 rounded-full bg-watermelon" />
          <span className="h-2.5 w-2.5 rounded-full bg-shadow-grey" />
          <span className="h-2.5 w-2.5 rounded-full bg-brilliant-azure" />
          <span className="h-2.5 w-2.5 rounded-full bg-peach-fuzz" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Arandu · Saber Digital
        </h1>
        <p className="mt-2 text-sm text-muted">
          Design system HeroUI + paleta Coolors adaptados ao Tailwind CSS.
        </p>
      </div>
    </main>
  )
}

export default App
