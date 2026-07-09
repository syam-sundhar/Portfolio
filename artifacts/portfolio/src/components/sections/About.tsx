import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function About() {
  const text = "Aspiring Data Scientist with practical experience in developing machine learning and deep learning models, performing data preprocessing, feature engineering, and evaluating model performance. Passionate about building intelligent systems using Python, TensorFlow, SQL, and Scikit-learn while continuously learning modern AI technologies.";
  
  const words = text.split(" ");
  
  return (
    <section id="about" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="md:col-span-4"
        >
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
            About
          </h2>
          <div className="h-1 w-12 bg-primary mt-6 rounded-full" />
        </motion.div>
        
        <div className="md:col-span-8 flex flex-wrap gap-x-2 gap-y-3">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.02, ease: "easeOut" }}
              className="text-sm md:text-base text-secondary-foreground leading-relaxed font-medium"
            >
              {word}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}