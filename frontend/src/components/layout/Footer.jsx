import React from "react";

export function Footer() {
  return (
    <footer className="w-full text-center text-xs xs:text-sm md:text-base text-gray-600 py-4 xs:py-6 px-3 xs:px-4 bg-gradient-to-r from-orange-100 via-white to-orange-50 backdrop-blur-md border-t border-orange-200 shadow-sm">
      <div className="flex flex-col xs:flex-row justify-center items-center gap-1 xs:gap-2">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-orange-600">Udaan</span>
        </p>
        <span className="hidden xs:inline text-gray-400">•</span>
        <p className="italic text-gray-500 text-xs xs:text-sm">Dream. Decide. Do.</p>
      </div>
    </footer>
  );
}
