import { useEffect } from "react";
import { BackgroundGrid } from "@/components/ui/background";
import { CustomCursor } from "@/components/ui/cursor";
import { PaperTear } from "@/components/ui/paper-tear";
import { Texture } from "@/components/ui/texture";
import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Skills } from "@/components/sections/Skills";
import { Education } from "@/components/sections/Education";
import { Experience } from "@/components/sections/Experience";
import { Projects } from "@/components/sections/Projects";
import { Achievements } from "@/components/sections/Achievements";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

function App() {
  useEffect(() => {
    // Bright minimalism — ensure light mode
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CustomCursor />
      <Texture />
      <BackgroundGrid />
      <Nav />
      
      <main className="flex flex-col">
        <Hero />
        <PaperTear />
        <About />
        <PaperTear />
        <Skills />
        <PaperTear />
        <Education />
        <PaperTear />
        <Experience />
        <PaperTear />
        <Projects />
        <PaperTear />
        <Achievements />
        <PaperTear />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}

export default App;