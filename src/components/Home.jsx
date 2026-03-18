import { useNavigate } from "react-router-dom";
import heroBg from "../assets/securite.webp.jpg";
import Header from "./Header";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faTwitter, faInstagram, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Header />

      <style>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Hero Section */}
      <section id="home" className="relative bg-cover bg-center h-screen border-[rgba(178, 208, 217, 0.5)] mb-0" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center text-white h-full">
          <h2 className="text-sm uppercase text-red-400 tracking-widest mb-4 animate_animated animate_fadeIn">Free Real-Time Analysis</h2>
          <h1 className="text-5xl font-extrabold mb-6 animate_animated animatefadeIn animate_delay-1s">
            Scan, detect,<br /><span className="text-red-400"> protect</span> your website
          </h1>
          <p className="text-lg mb-8 animate_animated animatefadeIn animate_delay-2s">Smart Web Scanner – Detects XSS, SQL Injection, CSRF, LFI, RCE, and Much More</p>

          <div className="mb-8 animate_animated animatefadeIn animate_delay-2s">
            <input
              type="url"
              className="p-2 rounded text-black w-64 mb-4"
              placeholder="Enter your website URL"
              id="url-input"
            />
            <button
              className="bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-700 text-white px-4 py-2 rounded transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 after:content-[''] after:block after:h-[2px] after:w-0 after:bg-teal-400 after:transition-all after:duration-300 after:mx-auto focus:after:w-full"
              onClick={() => {
                const url = document.getElementById('url-input').value;
                if (url) {
                  navigate("/attaques-page", { state: { url } });
                } else {
                  alert("Please enter a valid URL.");
                }
              }}
            >
              Start Analysis →
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="h-screen bg-gradient-to-b from-[#2F3F4D] to-white flex items-center justify-center animate_animated animatefadeIn animate_delay-4s ">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">Our <span className="text-red-400">Mission</span></h2>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
          We specialize in web cybersecurity. Our automated scanning tool analyzes your application for the most common vulnerabilities:
          <br></br>
          <strong>XSS, SQL Injection, CSRF, RCE, LFI, IDOR</strong>, and many more.
          <br></br><br></br>
          With <strong>S2AL Scanner</strong>, you get a clear, prioritized report to help you fix vulnerabilities before an attacker can exploit them.
          </p>
        </div>
      </section>

      {/* Feedback Section */}
      <section id="feedback" className="h-screen bg-gradient-to-b from-[#dcdcdc] to-[#B2D0D9] flex items-center justify-center animate_animated animatefadeIn animate_delay-4s -mt-32">
        <div className="text-center max-w-lg px-6">
          <h2 className="text-4xl font-bold mb-6">Your <span className="text-red-400">Feedback</span> Matters</h2>
          <p className="text-lg leading-relaxed mb-8">
            Help us improve our scanner. Tell us what you like, what could be better, or suggest new features!
          </p>
          <button
            className="bg-red-400 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-300 transition"
            onClick={() => navigate("/feedback")}
          >
            Give Feedback →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gradient-to-b from-[#B2D0D9] to-[#003D56] flex items-center justify-center animate_animated animatefadeIn animate_delay-4s pb-12">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-36">
            <div>
              <h3 className="font-semibold text-lg mb-6">ABOUT</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-gray-400">Our Vision</a></li>
                <li><a href="#" className="hover:text-gray-400">Partners</a></li>
                <li><a href="#" className="hover:text-gray-400">Press</a></li>
                <li><a href="#" className="hover:text-gray-400">Careers</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-6">SUPPORT</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-gray-400">FAQ</a></li>
                <li><a href="#" className="hover:text-gray-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-400">How the Scanner Works</a></li>
                <li><a href="#" className="hover:text-gray-400">Vulnerability Reports</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-6">CONNECT WITH US</h3>
              <div className="flex space-x-6 mb-6">
                <FontAwesomeIcon icon={faFacebookF} className="text-2xl" />
                <FontAwesomeIcon icon={faTwitter} className="text-2xl" />
                <FontAwesomeIcon icon={faInstagram} className="text-2xl" />
                <FontAwesomeIcon icon={faLinkedinIn} className="text-2xl" />
              </div>
              <p className="text-sm text-gray-400 mt-10">
                &copy; 2024 S2AL Scanner – All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
