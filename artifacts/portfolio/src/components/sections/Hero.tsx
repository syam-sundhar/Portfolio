import React from "react";
import { motion } from "framer-motion";
import { Mail, Github, Download, Linkedin } from "lucide-react";
import { SiKaggle, SiLeetcode, SiHackerrank } from "react-icons/si";
import profilePhoto from "@assets/ChatGPT_Image_Jul_9,_2026,_06_47_36_PM_1783613645015.png";

const socialLinks = [
  { icon: Mail, href: "mailto:syamsundhar@example.com", label: "Email" },
  { icon: Linkedin, href: "https://linkedin.com/in/syamsundhar", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/syamsundhar", label: "GitHub" },
  { icon: SiKaggle, href: "https://kaggle.com/syamsundhar", label: "Kaggle" },
  { icon: SiLeetcode, href: "https://leetcode.com/syamsundhar", label: "LeetCode" },
  { icon: SiHackerrank, href: "https://hackerrank.com/syamsundhar", label: "HackerRank" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50, damping: 20 } },
};

export function Hero() {
  return (
    <section id="hero" className="min-h-[100dvh] flex items-center justify-center pt-24 pb-16">
      <div className="max-w-7xl w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Side: Content */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          <motion.div variants={itemVariants}>
            <span className="text-primary font-medium tracking-wide uppercase text-sm mb-4 block">
              Hello, I am
            </span>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground leading-tight">
              Sirivella Syam Sundhar
            </h1>
          </motion.div>
          
          <motion.h2 
            variants={itemVariants}
            className="text-xl md:text-2xl text-secondary-foreground font-medium"
          >
            Aspiring Data Scientist & AI/ML Engineer
          </motion.h2>
          
          <motion.p 
            variants={itemVariants}
            className="text-muted-foreground text-lg leading-relaxed max-w-xl"
          >
            I build machine learning solutions that transform data into meaningful insights. My focus is on data preprocessing, predictive modeling, deep learning, and deploying AI solutions that solve real-world problems.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4 mt-4">
            <a href="#projects" className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-xl bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02]">
              <span className="relative z-10">View Projects</span>
            </a>
            <a href="mailto:syamsundhar@example.com?subject=Resume%20Request" target="_blank" rel="noreferrer" className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-transparent px-8 font-medium text-foreground transition-all duration-300 hover:border-muted-foreground hover:bg-secondary/50">
              <Download className="mr-2 h-4 w-4" />
              <span>Download Resume</span>
            </a>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4 mt-8">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors duration-300 p-2 border border-transparent hover:border-border rounded-lg bg-transparent hover:bg-secondary/30"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </motion.div>
        </motion.div>
        
        {/* Right Side: Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative group w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-border to-border/30 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-700"></div>
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-card">
            <motion.img 
              src={profilePhoto} 
              alt="Sirivella Syam Sundhar" 
              className="w-full h-full object-cover object-top"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}