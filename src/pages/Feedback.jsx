import { useState } from "react";

const Feedback = () => {
  const [toastMessage, setToastMessage] = useState(null);
  const [toastColor, setToastColor] = useState("bg-green-500"); // Dynamic color state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feeling, setFeeling] = useState(""); // New state for feedback feeling

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!feeling) {
      setToastMessage("Please select a feeling.");
      setToastColor("bg-yellow-500"); // Warning color for missing feeling
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return;
    }

    setToastMessage("Your feedback has been sent successfully!");
    setToastColor("bg-green-500"); // Success color
    setName("");
    setEmail("");
    setFeedback("");
    setFeeling(""); // Clear feeling after submission

    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleFeelingClick = (selectedFeeling) => {
    let message = "";
    let color = "";

    switch (selectedFeeling) {
      case "😁":
        message = "You're feeling super happy! We're glad to hear that!";
        color = "bg-green-500"; // Green for super happy
        break;
      case "😊":
        message = "You're in a good mood! Thanks for sharing your positive vibes!";
        color = "bg-blue-500"; // Blue for good mood
        break;
      case "😐":
        message = "It looks like you're neutral. We're here to improve your experience!";
        color = "bg-gray-500"; // Gray for neutral
        break;
      case "☹️":
        message = "We're sorry to see that you're not satisfied. We'll work on it!";
        color = "bg-orange-500"; // Orange for sad
        break;
      case "😭":
        message = "Oh no! It seems you're upset. Let us know how we can help!";
        color = "bg-red-500"; // Red for very sad
        break;
      default:
        message = "You selected a feeling.";
        color = "bg-gray-500";
    }

    setFeeling(selectedFeeling);
    setToastMessage(message);
    setToastColor(color);

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#fdf6e4] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {toastMessage && (
        <div
          className={`${toastColor} fixed top-4 right-4 text-white text-sm font-medium px-4 py-2 rounded-md shadow-md`}
        >
          {toastMessage}
        </div>
      )}

      <form
        className="bg-white border border-gray-300 p-8 rounded-lg shadow-[0px_10px_20px_rgba(0,0,0,0.1),0px_20px_40px_rgba(0,0,0,0.1)] w-full max-w-lg space-y-6"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-extrabold text-center text-red-400 uppercase drop-shadow-md">
          Feedback <span className="text-black">Form</span>
        </h1>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="mt-2 block w-full border border-gray-300 rounded-md shadow-md focus:ring-[#d62828] focus:border-[#d62828] px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="mt-2 block w-full border border-gray-300 rounded-md shadow-md focus:ring-[#d62828] focus:border-[#d62828] px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write your feedback here"
            className="mt-2 block w-full border border-gray-300 rounded-md shadow-md focus:ring-[#d62828] focus:border-[#d62828] px-4 py-2"
            rows="4"
            required
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            How do you feel about the service?
          </label>
          <div className="flex justify-start space-x-4 mt-2">
            <button
              type="button"
              onClick={() => handleFeelingClick("😁")}
              className={`text-3xl ${feeling === "😁" ? "text-[#d62828]" : "text-gray-500"}`}
            >
              😁
            </button>
            <button
              type="button"
              onClick={() => handleFeelingClick("😊")}
              className={`text-3xl ${feeling === "😊" ? "text-[#d62828]" : "text-gray-500"}`}
            >
              😊
            </button>
            <button
              type="button"
              onClick={() => handleFeelingClick("😐")}
              className={`text-3xl ${feeling === "😐" ? "text-[#d62828]" : "text-gray-500"}`}
            >
              😐
            </button>
            <button
              type="button"
              onClick={() => handleFeelingClick("☹️")}
              className={`text-3xl ${feeling === "☹️" ? "text-[#d62828]" : "text-gray-500"}`}
            >
              ☹️
            </button>
            <button
              type="button"
              onClick={() => handleFeelingClick("😭")}
              className={`text-3xl ${feeling === "😭" ? "text-[#d62828]" : "text-gray-500"}`}
            >
              😭
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-6 bg-red-400 text-white font-semibold rounded-lg shadow-md transition duration-200"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
};

export default Feedback;
