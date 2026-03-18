import { useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const categories = ["Electronics", "Cars", "Clothing", "Home"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      images: [...formData.images, ...files].slice(0, 5),
    });
  };

  const handleRemoveImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updatedImages });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("category", formData.category);
    formData.images.forEach((image) => {
      formDataToSend.append("pictures", image);
    });

    // try {
    const response = await fetch(
      "http://localhost:5000/api/v1/product/create",
      {
        method: "POST",
        body: formDataToSend,
      }
    );

    const data = await response.json();

    if (response.ok) {
      toast.success("Product created successfully!");
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        images: [],
      });
    } else {
      toast.error(data.message || "Error creating product.");
    }
    // } catch (error) {
    //   toast.error("An unexpected error occurred.");
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#faf3e0]">
      <form
        className="bg-white border border-gray-200 p-8 rounded-lg shadow-lg w-full max-w-lg space-y-6 relative"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-extrabold text-center text-[#000000] uppercase drop-shadow-md">
          Add
          <span className="text-[#d62828]"> Product</span>
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-2 block w-full border border-gray-300 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-[#D10000] focus:border-transparent px-4 py-2"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="mt-2 block w-full border border-gray-300 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-[#D10000] focus:border-transparent px-4 py-2"
            required
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            className="mt-2 block w-full border border-gray-300 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-[#D10000] focus:border-transparent px-4 py-2"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="mt-2 block w-full border border-gray-300 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-[#D10000] focus:border-transparent px-4 py-2"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Upload Images
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            multiple
            ref={fileInputRef}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 px-4 py-2 bg-[#D10000] text-white rounded-md hover:bg-[#b80000] transition"
          >
            Choose Files
          </button>
        </div>

        {formData.images.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Image Previews
            </h3>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {formData.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`preview-${index}`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 text-[#D10000] hover:text-[#b80000]"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 px-6 bg-[#D10000] text-white font-semibold rounded-md hover:bg-[#b80000] transition duration-300 ease-in-out"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      <ToastContainer />
    </div>
  );
};

export default AddProduct;
