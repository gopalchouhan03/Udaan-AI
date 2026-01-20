import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Smile, BookOpenText, Brain, MessageCircle, User, Menu, X, Briefcase, LogOut } from "lucide-react";
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (!path) return false;
    // exact match or startsWith for nested routes
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`w-full fixed top-0 left-0 z-50 flex justify-between items-center px-6 md:px-10 py-4 transition-all duration-500 ${
        scrolled
          ? "bg-gradient-to-r from-orange-100 via-white to-orange-50 border-b border-orange-200 shadow-md backdrop-blur-md"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
          <img src="/Logo.png" alt="Udaan Logo" className="w-10 rounded-full shadow-sm" />
          <h1 className="text-2xl font-bold text-orange-600 tracking-wide">Udaan</h1>
        </Link>
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium">
        {/* Always visible */}
        <Link to="/career" className={`flex items-center gap-2 transition-all px-3 py-2 rounded-xl ${isActive('/career') ? 'text-orange-600 bg-orange-100' : 'text-gray-700 hover:text-orange-600 hover:bg-orange-100'}`}>
          <Briefcase size={16} /> Career
        </Link>

        {/* Protected Links - Only show when authenticated */}
        {isAuthenticated && (
          <>
            <Link to="/dashboard" className={`flex items-center gap-2 transition-all px-3 py-2 rounded-xl ${isActive('/dashboard') ? 'text-orange-600 bg-orange-100' : 'text-gray-700 hover:text-orange-600 hover:bg-orange-100'}`}>
              <Brain size={16} /> Dashboard
            </Link>
            <Link to="/journal" className={`flex items-center gap-2 transition-all px-3 py-2 rounded-xl ${isActive('/journal') ? 'text-orange-600 bg-orange-100' : 'text-gray-700 hover:text-orange-600 hover:bg-orange-100'}`}>
              <BookOpenText size={16} /> Journal
            </Link>
            <Link to="/mood-chart" className={`flex items-center gap-2 transition-all px-3 py-2 rounded-xl ${isActive('/mood-chart') ? 'text-orange-600 bg-orange-100' : 'text-gray-700 hover:text-orange-600 hover:bg-orange-100'}`}>
              <Smile size={16} /> Insights
            </Link>
            <Link to="/chatbot" className={`flex items-center gap-2 transition-all px-3 py-2 rounded-xl ${isActive('/chatbot') ? 'text-orange-600 bg-orange-100' : 'text-gray-700 hover:text-orange-600 hover:bg-orange-100'}`}>
              <MessageCircle size={16} /> Chatbot
            </Link>
          </>
        )}
      </div>

      {/* Auth Buttons (Desktop) */}
      <div className="hidden md:flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <Link to="/profile" className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full shadow hover:bg-orange-600 transition-all">
              <User size={16} /> {user?.email || 'Profile'}
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-600 rounded-full hover:bg-orange-50 transition-all"
            >
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-full transition-all">
              Login
            </Link>
            <Link to="/register" className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full shadow hover:bg-orange-600 transition-all">
              Register
            </Link>
          </>
        )}
      </div>

      {/* Hamburger Icon (Mobile) */}
      <div className="md:hidden flex items-center">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-orange-600 focus:outline-none"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white/90 backdrop-blur-md border-t border-orange-200 flex flex-col items-center gap-4 py-6 shadow-lg md:hidden transition-all">
          {/* Always visible */}
          <Link
            to="/career"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-2 transition-all ${isActive('/career') ? 'text-orange-600' : 'text-gray-800 hover:text-orange-600'}`}
          >
            <Briefcase size={18} /> Career
          </Link>

          {/* Protected Links - Only show when authenticated */}
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 transition-all ${isActive('/dashboard') ? 'text-orange-600' : 'text-gray-800 hover:text-orange-600'}`}
              >
                <Brain size={18} /> Dashboard
              </Link>
              <Link
                to="/journal"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 transition-all ${isActive('/journal') ? 'text-orange-600' : 'text-gray-800 hover:text-orange-600'}`}
              >
                <BookOpenText size={18} /> Journal
              </Link>
              <Link
                to="/mood-chart"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 transition-all ${isActive('/mood-chart') ? 'text-orange-600' : 'text-gray-800 hover:text-orange-600'}`}
              >
                <Smile size={18} /> Insights
              </Link>
              <Link
                to="/chatbot"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 transition-all ${isActive('/chatbot') ? 'text-orange-600' : 'text-gray-800 hover:text-orange-600'}`}
              >
                <MessageCircle size={18} /> Chatbot
              </Link>

              {/* Profile & Logout for authenticated users */}
              <Link 
                to="/profile" 
                onClick={() => setMenuOpen(false)} 
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full shadow hover:bg-orange-600 transition-all mt-2"
              >
                 <User size={18} /> {user?.email || 'Profile'}
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                  navigate('/');
                }}
                className="flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-600 rounded-full hover:bg-orange-50 transition-all"
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            /* Login/Register buttons for non-authenticated users */
            <>
              <Link 
                to="/login" 
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-full transition-all"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full shadow hover:bg-orange-600 transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
