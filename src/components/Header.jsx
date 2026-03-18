import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navigate = useNavigate();

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/50 backdrop-blur-lg shadow-md"
          : "bg-amber-50 shadow-md"
      }`}
    >
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-5xl font-extrabold uppercase drop-shadow-md">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-700">
              S2al
            </span>
            <span className="text-5xl text-red-400"> S</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-800">
              can
            </span>
          </h1>
        </div>




        <nav className="flex items-center space-x-6 mr-8">
          <a
            href="#home"
            className="text-gray-700 hover:font-semibold hover:underline hover:text-gray-800"
          >
            Home
          </a>
          <a
            href="#about"
            className="text-gray-700 hover:font-semibold hover:underline hover:text-gray-800"
          >
            About
          </a>
          <a
            href="#feedback"
            className="text-gray-700 hover:font-semibold hover:underline hover:text-gray-800"
          >
            Feedback
          </a>
          <a
            href="#contact"
            className="text-gray-700 hover:font-semibold hover:underline hover:text-gray-800"
          >
            Contact
          </a>
          <button
            className="bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-700 text-white px-4 py-2 rounded transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 after:content-[''] after:block after:h-[2px] after:w-0 after:bg-teal-400 after:transition-all after:duration-300 after:mx-auto focus:after:w-full"
            onClick={() => {
              navigate("/login");
            }}
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
