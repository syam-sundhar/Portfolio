import { motion } from "framer-motion";
import { achievements } from "@/constants/data";
import { Award } from "lucide-react";

export function Achievements() {
  return (
    <section id="achievements" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
            Milestones
          </h2>
        </motion.div>

        <div className="flex flex-col gap-4">
          {achievements.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-center gap-6 p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors duration-300 group"
            >
              <div className="h-12 w-12 shrink-0 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex-grow flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {item.role}
                  </p>
                </div>
                <div className="text-sm font-mono text-primary/80 bg-primary/10 px-3 py-1 rounded-full w-fit">
                  {item.year}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}