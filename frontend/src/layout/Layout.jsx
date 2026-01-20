import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import ErrorBoundary from "../components/shared/ErrorBoundary";
import Loading from "../components/shared/Loading";

export default function Layout() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Suspense fallback={<Loading fullScreen />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
