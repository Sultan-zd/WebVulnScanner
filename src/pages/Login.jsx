import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // To store error message
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Make the login request to the backend
      const response = await axios.post("http://localhost:5000/api/v1/user/login", { email, password });

      // Check if the response contains the token
      if (response.data.message == "Login successful.") {   // maybe it shouldn't be message :)
        // Store the token in local storage
        localStorage.setItem("token", response.data.token);

        // Store user details for further use
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Navigate to home page
        navigate("/");
      } else {
        // If no token is returned, set an error
        setError("Login failed. Please check your credentials.");
      }
    } catch (error) {
      // Handle errors returned by the backend
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong! Please try again.");
      }
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

        <form className="space-y-6" onSubmit={handleLogin}>
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
              required
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d53933] text-[#333] bg-[#fdfdfb]"
              required
            />
          </div>

          {/* Display error message */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-3 mt-4 text-white bg-red-400 rounded-full font-semibold hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-[#ff4500]"
          >
            Login
          </button>

          {/* Signup Link */}
          <div className="text-center text-sm mt-4">
            <p className="text-[#555]">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="font-medium text-[#d53933] hover:underline">
                Create an Account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
