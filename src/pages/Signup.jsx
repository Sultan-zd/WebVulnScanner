import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios for making requests

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null); // State for error message
  const navigate = useNavigate(); // Hook for navigation

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form behavior
    try {
      const response = await axios.post("http://localhost:5000/api/v1/user/create", {
        name,
        email,
        password,
      });

      // If user is created successfully, navigate to login page
      if (response.status === 201) {
        navigate("/login");
      }
    } catch (err) {
      // Handle error (e.g., invalid password, user already exists)
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#faf3e0]">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-700 uppercase">
        S2al
        <span className="text-5xl text-red-400"> s</span>
        <span className="text-5xl text-[#1e40af]">can</span>
      </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#555]">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d53933] text-[#333] bg-[#fdfdfb]"
            />
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#555]">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d53933] text-[#333] bg-[#fdfdfb]"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#555]">
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d53933] text-[#333] bg-[#fdfdfb]"
            />
          </div>

          {/* Show error message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Sign Up Button */}
          <button
            type="submit"
            className="w-full py-3 mt-4 text-white bg-[#d53933] rounded-md hover:bg-[#b80000] focus:outline-none focus:ring-2 focus:ring-[#ff4500]"
          >
            Sign Up
          </button>

          {/* Login Link */}
          <div className="text-center text-sm mt-4">
            <p className="text-[#555]">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-[#d53933] hover:underline">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
