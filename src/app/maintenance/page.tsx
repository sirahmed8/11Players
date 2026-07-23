"use client";

import { motion } from "framer-motion";

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-6 text-center relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center gap-6 max-w-lg relative z-10"
      >
        {/* Animated football icon */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="text-7xl select-none"
        >
          ⚽
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-emerald-400 to-teal-600 bg-clip-text text-transparent">
          We&apos;ll be right back
        </h1>

        <p className="text-slate-400 text-lg leading-relaxed">
          11Players is currently undergoing scheduled maintenance. We&apos;re upgrading the platform to bring you an even better experience.
        </p>

        <div className="text-slate-500 text-sm">
          🔧 Expected back shortly — thanks for your patience!
        </div>

        <div className="mt-4 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl px-8 py-5 text-sm text-emerald-300 font-medium">
          <div className="text-xs text-emerald-500 uppercase tracking-widest mb-1 font-bold">Arabic</div>
          <p>11Players في وضع الصيانة المجدولة. نحن نحدّث المنصة لتقديم تجربة أفضل لك. نعود قريباً! 🚀</p>
        </div>
      </motion.div>
    </main>
  );
}
