import { motion } from "framer-motion";
import { Mail, Github, Linkedin } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground mb-6">
            Let's Build Something Great
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            I'm always open to internships, collaborations, and exciting AI opportunities. My inbox is always open.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6">
            <a 
              href="mailto:syamsundhar@example.com"
              className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium transition-transform duration-300 hover:scale-105"
            >
              <Mail className="w-5 h-5" />
              <span>Email Me</span>
            </a>
            
            <a 
              href="https://linkedin.com/in/syamsundhar"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 px-8 py-4 rounded-xl border border-border bg-card text-foreground font-medium transition-all duration-300 hover:border-muted-foreground hover:bg-secondary/50"
            >
              <Linkedin className="w-5 h-5" />
              <span>LinkedIn</span>
            </a>
            
            <a 
              href="https://github.com/syamsundhar"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 px-8 py-4 rounded-xl border border-border bg-card text-foreground font-medium transition-all duration-300 hover:border-muted-foreground hover:bg-secondary/50"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}