// File: frontend/src/components/MoodLegend.jsx
import React from "react";
import { Smile, Meh, Frown } from "lucide-react";
import { motion } from "framer-motion";

const moodMap = [
  { value: 1, label: "Very Low", color: "text-red-500", icon: <Frown /> },
  { value: 2, label: "Low", color: "text-orange-500", icon: <Frown /> },
  { value: 3, label: "Neutral", color: "text-yellow-500", icon: <Meh /> },
  { value: 4, label: "Good", color: "text-green-500", icon: <Smile /> },
  { value: 5, label: "Great", color: "text-emerald-600", icon: <Smile /> },
];

const MoodLegend = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5"
    >
      {moodMap.map(({ value, label, color, icon }, index) => (
        <motion.div
          key={value}
          whileHover={{ scale: 1.05, rotate: [-1, 0, 1, 0] }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: index * 0.1 }}
          className="rounded-xl p-4 text-center shadow-lg border border-orange-200 bg-gradient-to-br from-white via-orange-50 to-white backdrop-blur-md"
        >
          <div className={`w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-orange-100 shadow-inner ${color}`}>
            {icon}
          </div>
          <h4 className="text-base font-semibold text-gray-700 mb-1">{label}</h4>
          <p className="text-xs text-gray-500 italic">Mood Level {value}</p>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default MoodLegend;
