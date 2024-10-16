import React, { useState, useRef, useCallback, useEffect } from "react";
import { blobToBase64 } from "./lib";
import axios from "axios";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

const Modal = ({ isOpen, onClose, predictionResult, message }: any) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
          {(message && !predictionResult) && (
            <>
              <h2 className="text-2xl font-bold mb-4">Information</h2>
              <p>{message}</p>
            </>
          )}
          {predictionResult && (
            <>
              <h2 className="text-2xl font-bold mb-4">ผลการทำนายคราบ Plaque</h2>
              <div className="flex justify-center">
                <img
                  src={predictionResult}
                  alt="Prediction Result"
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>
            </>
          )}
          <button
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            onClick={onClose}
          >
            ปิด
          </button>
        </div>
      </div>
    </>
  );
};

const App = () => {
  const webcamRef = useRef(null);
  const [image, setImage] = useState<string>(""); // To store the uploaded or captured image
  const [base64Image, setBase64Image] = useState<string | ArrayBuffer | null>(
    ""
  ); // To store base64 representation
  const [predictionResult, setPredictionResult] = useState<string>("");
  const [loading, setLoading] = useState(false); // Add loading state
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [isFlashVisible, setIsFlashVisible] = useState(false); // Flash animation state
  const [modalMessage, setModalMessage] = useState(""); // Modal message

  // Check camera availability and WebView
  const checkCameraPermission = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((device) => device.kind === "videoinput");

      // If no camera is found, show modal
      if (!hasCamera) {
        setModalMessage(
          "ไม่พบกล้องในอุปกรณ์ของคุณ กรุณาเปิดแอปในเบราว์เซอร์ที่รองรับเพื่อใช้ฟังก์ชันกล้อง"
        );
        setIsModalOpen(true);
      } else {
        // Check for camera permissions
        await navigator.mediaDevices.getUserMedia({ video: true });
      }
    } catch (error) {
      // Show modal if permission denied or camera is not accessible
      setModalMessage(
        "แอปนี้ต้องการการเข้าถึงกล้อง กรุณาอนุญาตการเข้าถึง หรือเปิดแอปนี้ในเบราว์เซอร์เพื่อประสบการณ์ที่ดีที่สุด"
      );
      setIsModalOpen(true);
    }
  }, []);

  const detectWebView = () => {
    const userAgent = navigator.userAgent;
    if (
      /FBAN|FBAV|Instagram|Line|Twitter|Snapchat/.test(userAgent) ||
      /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(userAgent) ||
      /\bwv\b/.test(userAgent)
    ) {
      setModalMessage(
        "คุณกำลังเปิดแอปผ่าน WebView ซึ่งอาจไม่สามารถใช้งานกล้องได้เต็มประสิทธิภาพ กรุณาใช้เบราว์เซอร์เพื่อให้ฟังก์ชันการทำงานเต็มรูปแบบ"
      );
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    detectWebView();
    checkCameraPermission();
  }, [checkCameraPermission]);

  const capture = useCallback(() => {
    setPredictionResult("");

    // Trigger flash animation
    setIsFlashVisible(true);
    setTimeout(() => setIsFlashVisible(false), 300); // Hide flash after 300ms

    // @ts-expect-error maybe null
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
    convertToBase64(imageSrc);
  }, [webcamRef]);

  // Convert file to Base64
  const convertToBase64 = (file: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setBase64Image(reader.result);
    };
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPredictionResult("");
    // @ts-expect-error maybe null
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
        confidence: 10,
        stroke: 2,
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
        setIsModalOpen(true); // Open modal when prediction is ready
      })
      .catch(function (error) {
        console.log(error.message);
        setLoading(false);
      });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-100 p-4 body relative">
      <img src="./logo.png" className="max-h-32" alt="โลโก้สำนักทันตะ" />
      <h1 className="text-2xl font-bold mb-4">ตรวจจับคราบ Plaque ด้วย AI</h1>

      <div className="w-full max-w-md bg-white p-4 rounded-lg shadow-lg">
        {/* Camera Capture */}
        <label className="block mb-2 text-sm font-medium text-gray-700">
          ถ่ายภาพจากกล้อง
        </label>
        <div>
          <Webcam
            audio={false}
            height={720}
            screenshotFormat="image/jpeg"
            width={1280}
            ref={webcamRef}
            videoConstraints={videoConstraints}
          />
          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            onClick={capture}
          >
            ถ่ายรูป
          </button>
        </div>

        {/* Flash animation */}
        {isFlashVisible && (
          <div className="absolute inset-0 bg-white opacity-75 z-30 animate-flash"></div>
        )}

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
              src={image}
              alt="Selected"
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

      {/* Prediction Result Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        predictionResult={predictionResult}
        message={modalMessage}
      />
    </div>
  );
};

export default App;
