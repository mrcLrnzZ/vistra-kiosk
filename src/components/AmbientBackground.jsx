import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Large teal glow — upper left */}
      <div
        className="absolute -top-32 -left-32
          w-[650px] h-[650px] rounded-full
          bg-teal-300/50 blur-[100px]"
      />

      {/* Blue glow — upper right */}
      <div
        className="absolute top-10 -right-32
          w-[550px] h-[550px] rounded-full
          bg-sky-300/45 blur-[100px]"
      />

      {/* Emerald glow — bottom center */}
      <div
        className="absolute -bottom-64 left-[20%]
          w-[700px] h-[550px] rounded-full
          bg-emerald-300/40 blur-[110px]"
      />

      {/* Subtle central tint */}
      <div
        className="absolute inset-0
          bg-gradient-to-b from-white/10
          via-transparent to-teal-50/60"
      />
    </div>
  );
}
