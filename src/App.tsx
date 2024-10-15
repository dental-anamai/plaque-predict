import { useState, useRef } from "react";
import { blobToBase64 } from "./lib";
import { Camera } from "react-camera-pro";
import axios from "axios";

const App = () => {
  const camera = useRef(null);
  const [image, setImage] = useState(undefined); // To store the uploaded or captured image
  const [base64Image, setBase64Image] = useState(""); // To store base64 representation
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state

  // Convert file to Base64
  const convertToBase64 = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setBase64Image(reader.result);
    };
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(URL.createObjectURL(file));
    convertToBase64(file);
  };

  // Handle image capture via camera
  const handleCapture = (e) => {
    const file = e.target.files[0];
    setImage(URL.createObjectURL(file));
    convertToBase64(file);
  };

  // Submit to Roboflow inference server
  const handleSubmit = () => {
    setLoading(true); // Show loading spinner
    axios({
      method: "POST",
      url: "https://detect.roboflow.com/oral-plaque-segmentations/2",
      params: {
        api_key: import.meta.env.VITE_ROBOFLOW_API_KEY,
        format: "image",
      },
      responseType: "blob",
      data: base64Image,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then(async function (response) {
        const blob = new Blob([response.data], { type: "image/jpeg" });
        const Resbase64Image = await blobToBase64(blob);

        setPredictionResult(Resbase64Image);
        setLoading(false); // Hide loading spinner
      })
      .catch(function (error) {
        console.log(error.message);
        setLoading(false);
      });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-100 p-4 body">
      <img src="/logo.png" className="max-h-32" alt="โลโก้สำนักทันตะ" />
      <h1 className="text-2xl font-bold mb-4">ตรวจจับคราบ Plaque ด้วย AI</h1>

      <div className="w-full max-w-md bg-white p-4 rounded-lg shadow-lg">
        {/* Camera Capture */}
        <label className="block mb-2 text-sm font-medium text-gray-700">
          ถ่ายภาพจากกล้อง
        </label>
        <div>
          <Camera facingMode="user" ref={camera} />
          <button onClick={() => setImage(camera.current.takePhoto())}>
            ถ่ายรูป
          </button>
        </div>

        {/* Image Upload */}
        <label className="block mb-2 text-sm font-medium text-gray-700">
          อัปโหลดรูปฟัน
        </label>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer focus:outline-none mb-4"
          onChange={handleFileChange}
        />

        {/* Display Uploaded or Captured Image */}
        {image && (
          <div className="relative mb-4">
            <img
              src={predictionResult || image}
              alt="Selected or Prediction"
              className="w-full h-auto rounded-lg shadow-md"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <span className="text-white">กำลังประมวลผล...</span>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg ${
            loading ? "cursor-not-allowed opacity-50" : ""
          }`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "กำลังประมวลผล..." : "Predict"}
        </button>
      </div>
    </div>
  );
};

export default App;
