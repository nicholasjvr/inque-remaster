import FloatingOrb from './components/FloatingOrb';

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-16 px-6 py-24 sm:px-10">
        <header className="flex flex-col items-center gap-6 text-center">
          <span className="text-sm uppercase tracking-[0.8em] text-[#4ff1ff]">inq social</span>
          <h1 className="font-orbitron text-4xl text-[#66faff] sm:text-5xl md:text-6xl">
            creatives platform
          </h1>
          <p className="max-w-xl text-balance text-base text-[#bdefff]/80 sm:text-lg">
            showcase, communicate, create your way. the orb is our navigation pulse.
          </p>
        </header>

        <FloatingOrb />

        <section className="grid gap-4 text-center text-sm uppercase tracking-[0.32em] text-[#6cdfff]">
          <p>scroll or drag to rotate • release to snap</p>
          <p>enter to jump • arrow keys to explore</p>
        </section>
      </main>
    </div>
  );
}
