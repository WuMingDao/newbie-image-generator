import { ImageGenerator } from "@/components/ImageGenerator";
import { ThemeToggle } from "@/components/ThemeToggle";

function App() {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">ComfyUI NewBie-Image AI</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-4 flex-1 overflow-hidden">
        <ImageGenerator />
      </main>
    </div>
  );
}

export default App;
