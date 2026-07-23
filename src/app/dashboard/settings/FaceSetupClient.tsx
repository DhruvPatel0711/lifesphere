"use client";

import { useState, useRef } from "react";
import { setupFaceLogin } from "./actions";

export default function FaceSetupClient() {
  const [setupMode, setSetupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [useImageFallback, setUseImageFallback] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setUseImageFallback(true);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  };

  const startSetup = async () => {
    setSetupMode(true);
    setError("");
    
    // Load models
    if (!modelsLoaded && window.faceapi) {
      try {
        await window.faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
        await window.faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
        await window.faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
        setModelsLoaded(true);
      } catch {
        setError("Failed to load AI models.");
        return;
      }
    }

    // Start video
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Camera access denied.");
    }
  };

  const cancelSetup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setSetupMode(false);
    setError("");
  };

  const captureAndSave = async () => {
    if (!window.faceapi || !modelsLoaded) {
      setError("Please wait for AI models to load.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const detection = await window.faceapi
        .detectSingleFace(useImageFallback ? imgRef.current : videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (!detection) {
        throw new Error("No face detected. Please ensure you are looking at the camera in good lighting.");
      }

      const descriptorArray = Array.from(detection.descriptor);
      await setupFaceLogin(JSON.stringify(descriptorArray));
      cancelSetup(); // Stop video and close setup view
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to capture face data.");
    } finally {
      setLoading(false);
    }
  };

  if (!setupMode) {
    return (
      <button onClick={startSetup} className="bg-black text-white px-5 py-2.5 rounded-md font-medium text-sm hover:bg-gray-800 transition-colors flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
        Set up Face Login
      </button>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-4">
      <h4 className="font-semibold mb-4 text-center">Look directly into the camera (or upload a photo)</h4>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded-md text-center">
          {error}
        </div>
      )}

      <div className="relative w-full max-w-sm mx-auto h-64 bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center mb-6 shadow-inner">
        {!useImageFallback && (
          <video ref={videoRef} autoPlay muted playsInline className="h-full object-cover" />
        )}
        {useImageFallback && imageSrc && (
          <img ref={imgRef} src={imageSrc} alt="Fallback face" className="h-full object-cover" />
        )}
        {!modelsLoaded && (
          <div className="absolute text-white text-sm animate-pulse">Loading AI Models...</div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex justify-center gap-4">
          <button onClick={cancelSetup} disabled={loading} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={captureAndSave} disabled={loading || !modelsLoaded} className="px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
            {loading ? "Scanning..." : "Capture & Enable"}
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t w-full text-center">
          <p className="text-xs text-gray-500 mb-2">No webcam? Upload a clear photo of your face.</p>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
