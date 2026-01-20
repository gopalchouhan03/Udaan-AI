import React from "react";

export function Footer() {
  return (
    <footer className="w-full text-center text-sm md:text-base text-gray-600 py-6 bg-gradient-to-r from-orange-100 via-white to-orange-50 backdrop-blur-md border-t border-orange-200 shadow-sm">
      <div className="flex flex-col md:flex-row justify-center items-center gap-2">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-orange-600">Udaan</span>
        </p>
        <span className="hidden md:inline text-gray-400">•</span>
        <p className="italic text-gray-500">Dream. Decide. Do.</p>
      </div>
    </footer>
  );
}
