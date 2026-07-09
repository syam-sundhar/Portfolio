import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export function BackgroundGrid() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 200]);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX,
        y: e.clientY
      });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-background">
      {/* Dynamic Cursor Glow */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] bg-primary/5"
        animate={{
          x: mousePos.x - 400,
          y: mousePos.y - 400,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 1 }}
      />
      
      {/* Animated Grid */}
      <motion.div 
        style={{ y }}
        className="absolute inset-[-100%] h-[300%] w-[300%] opacity-[0.03]"
        initial={{ backgroundPosition: "0 0" }}
        animate={{ backgroundPosition: "100px 100px" }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </motion.div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_100%)] opacity-80" />
    </div>
  );
}