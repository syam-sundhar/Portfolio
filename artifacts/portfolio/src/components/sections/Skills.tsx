import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, MouseEvent, type ReactNode } from "react";
import { Brain, Database, TrendingUp, BarChart2, Sparkles, MessageSquare, Zap, Bot } from "lucide-react";
import {
  SiPython,
  SiPostgresql,
  SiScikitlearn,
  SiTensorflow,
  SiNumpy,
  SiPandas,
} from "react-icons/si";

/* ─── 3-D tilt card ─────────────────────────────────────────── */
function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rawY, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);
  const shimmerX = useTransform(springX, [-0.5, 0.5], ["0%", "100%"]);
  const shimmerY = useTransform(springY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0f1420] transition-shadow duration-300 hover:shadow-[0_0_30px_-8px_rgba(59,130,246,0.35)] ${className}`}
    >
      {/* shimmer */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${shimmerX} ${shimmerY}, rgba(59,130,246,0.08) 0%, transparent 60%)`,
        }}
      />
      <div style={{ transform: "translateZ(16px)" }} className="relative z-20 h-full">
        {children}
      </div>
    </motion.div>
  );
}

/* ─── floating 3-D icon ─────────────────────────────────────── */
function FloatingIcon({ children }: { children: ReactNode }) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0], rotateZ: [0, 4, -4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="text-primary"
    >
      {children}
    </motion.div>
  );
}

/* ─── skill pill ─────────────────────────────────────────────── */
function Pill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors duration-200 hover:border-primary/50 hover:text-white">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}

/* ─── main section ───────────────────────────────────────────── */
export function Skills() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  };

  return (
    <section id="skills" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
            Capabilities
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            Tools and technologies I work with across the data science stack.
          </p>
        </motion.div>

        {/* bento grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-4 grid-rows-[auto_auto_auto] gap-4"
        >
          {/* ── Python ── wide (col-span-2) */}
          <motion.div variants={cardVariants} className="group col-span-2">
            <TiltCard className="p-7 h-full flex flex-col justify-between min-h-[180px]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
                    Programming
                  </p>
                  <h3 className="text-2xl font-semibold text-white">Python</h3>
                  <p className="text-xs text-slate-400 mt-1">Primary language</p>
                </div>
                <FloatingIcon>
                  <SiPython size={52} />
                </FloatingIcon>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Pill icon={<SiPython size={12} />} label="Python 3" />
                <Pill icon={<Zap size={12} />} label="OOP" />
                <Pill icon={<Zap size={12} />} label="Data Structures" />
              </div>
            </TiltCard>
          </motion.div>

          {/* ── SQL ── (col-span-1) */}
          <motion.div variants={cardVariants} className="group col-span-1">
            <TiltCard className="p-6 h-full flex flex-col justify-between min-h-[180px]">
              <div>
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
                  Database
                </p>
                <h3 className="text-xl font-semibold text-white">SQL</h3>
              </div>
              <FloatingIcon>
                <SiPostgresql size={44} />
              </FloatingIcon>
              <div className="flex flex-wrap gap-2 mt-2">
                <Pill icon={<Database size={11} />} label="Queries" />
                <Pill icon={<Database size={11} />} label="Joins" />
              </div>
            </TiltCard>
          </motion.div>

          {/* ── ML ── tall (col-span-1, row-span-2) */}
          <motion.div variants={cardVariants} className="group col-span-1 row-span-2">
            <TiltCard className="p-6 h-full flex flex-col gap-5 min-h-[380px]">
              <div>
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
                  Machine Learning
                </p>
              </div>

              {/* TensorFlow */}
              <div className="flex-1 flex flex-col justify-center items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
                <FloatingIcon>
                  <SiTensorflow size={40} className="text-orange-400" />
                </FloatingIcon>
                <span className="text-sm font-medium text-white">TensorFlow</span>
                <span className="text-[10px] text-slate-400">Deep Learning</span>
              </div>

              {/* Scikit-learn */}
              <div className="flex-1 flex flex-col justify-center items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
                <FloatingIcon>
                  <SiScikitlearn size={40} className="text-yellow-400" />
                </FloatingIcon>
                <span className="text-sm font-medium text-white">Scikit-learn</span>
                <span className="text-[10px] text-slate-400">Classical ML</span>
              </div>
            </TiltCard>
          </motion.div>

          {/* ── NumPy ── (col-span-1) */}
          <motion.div variants={cardVariants} className="group col-span-1">
            <TiltCard className="p-6 h-full flex flex-col justify-between min-h-[180px]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">
                    Analysis
                  </p>
                  <h3 className="text-xl font-semibold text-white">NumPy</h3>
                </div>
                <FloatingIcon>
                  <SiNumpy size={38} className="text-sky-400" />
                </FloatingIcon>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Pill icon={<BarChart2 size={11} />} label="Arrays" />
                <Pill icon={<BarChart2 size={11} />} label="Linear Algebra" />
              </div>
            </TiltCard>
          </motion.div>

          {/* ── Pandas ── (col-span-2) */}
          <motion.div variants={cardVariants} className="group col-span-2">
            <TiltCard className="p-6 h-full flex items-center gap-6 min-h-[180px]">
              <FloatingIcon>
                <SiPandas size={54} className="text-purple-400" />
              </FloatingIcon>
              <div>
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">
                  Data Analysis
                </p>
                <h3 className="text-2xl font-semibold text-white">Pandas</h3>
                <p className="text-xs text-slate-400 mt-1 mb-3">Wrangling &amp; Feature Engineering</p>
                <div className="flex flex-wrap gap-2">
                  <Pill icon={<TrendingUp size={11} />} label="DataFrames" />
                  <Pill icon={<TrendingUp size={11} />} label="Aggregations" />
                  <Pill icon={<TrendingUp size={11} />} label="Merging" />
                </div>
              </div>
            </TiltCard>
          </motion.div>

          {/* ── Matplotlib ── (col-span-1) */}
          <motion.div variants={cardVariants} className="group col-span-1">
            <TiltCard className="p-6 h-full flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center gap-3">
                <FloatingIcon>
                  <BarChart2 size={34} className="text-blue-400" />
                </FloatingIcon>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Visualization
                  </p>
                  <h3 className="text-lg font-semibold text-white">Matplotlib</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Pill icon={<BarChart2 size={11} />} label="Charts" />
                <Pill icon={<BarChart2 size={11} />} label="Subplots" />
              </div>
            </TiltCard>
          </motion.div>

          {/* ── Seaborn ── (col-span-1) */}
          <motion.div variants={cardVariants} className="group col-span-1">
            <TiltCard className="p-6 h-full flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center gap-3">
                <FloatingIcon>
                  <TrendingUp size={34} className="text-teal-400" />
                </FloatingIcon>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Visualization
                  </p>
                  <h3 className="text-lg font-semibold text-white">Seaborn</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Pill icon={<TrendingUp size={11} />} label="Heatmaps" />
                <Pill icon={<TrendingUp size={11} />} label="Distributions" />
              </div>
            </TiltCard>
          </motion.div>

          {/* ── Future Learning ── full width (col-span-4) */}
          <motion.div variants={cardVariants} className="group col-span-4">
            <TiltCard className="p-7">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="shrink-0">
                  <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">
                    Future Learning
                  </p>
                  <h3 className="text-2xl font-semibold text-white">Next Frontiers</h3>
                  <p className="text-xs text-slate-400 mt-1">Currently exploring &amp; deepening</p>
                </div>

                <div className="flex flex-wrap gap-5 md:ml-auto">
                  {[
                    { icon: <Brain size={28} />, label: "Deep Learning", color: "text-violet-400" },
                    { icon: <MessageSquare size={28} />, label: "NLP", color: "text-emerald-400" },
                    { icon: <Bot size={28} />, label: "Generative AI", color: "text-sky-400" },
                    { icon: <Sparkles size={28} />, label: "LLMs", color: "text-amber-400" },
                  ].map(({ icon, label, color }) => (
                    <motion.div
                      key={label}
                      whileHover={{ scale: 1.08, y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 18 }}
                      className="flex flex-col items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-6 py-4 hover:border-primary/50 transition-colors duration-200 cursor-default"
                    >
                      <span className={color}>{icon}</span>
                      <span className="text-xs font-medium text-slate-300">{label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
