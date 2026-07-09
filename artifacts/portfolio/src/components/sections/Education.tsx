import { motion } from "framer-motion";
import { education } from "@/constants/data";

export function Education() {
  return (
    <section id="education" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
            Education
          </h2>
        </motion.div>

        <div className="relative pl-8 md:pl-0">
          {/* Animated timeline line */}
          <motion.div 
            className="absolute left-[7px] md:left-[50%] top-0 bottom-0 w-[1px] bg-border origin-top"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          <div className="space-y-12 md:space-y-24">
            {education.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={index} className="relative flex flex-col md:flex-row items-start md:items-center w-full group">
                  {/* Timeline dot */}
                  <div className="absolute left-0 md:left-1/2 w-4 h-4 rounded-full bg-background border-2 border-primary -translate-x-[7px] md:-translate-x-1/2 mt-1.5 md:mt-0 z-10 transition-transform duration-300 group-hover:scale-125 group-hover:bg-primary" />
                  
                  {/* Content Container */}
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`w-full md:w-1/2 flex flex-col ${isEven ? 'md:pr-16 md:items-end md:text-right' : 'md:pl-16 md:ml-auto md:items-start md:text-left'}`}
                  >
                    <span className="text-sm font-medium text-primary mb-2 bg-primary/10 px-3 py-1 rounded-full w-fit">
                      {item.period}
                    </span>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {item.degree}
                    </h3>
                    <p className="text-muted-foreground font-medium">
                      {item.institution}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}