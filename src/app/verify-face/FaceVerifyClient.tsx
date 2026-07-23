"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faceapi: any;
  }
}

export default function FaceVerifyClient({ userName }: { userName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [livenessPrompt, setLivenessPrompt] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [useImageFallback, setUseImageFallback] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Load face-api models on mount
  useEffect(() => {
    const loadModels = async () => {
      const waitForFaceApi = () =>
        new Promise<void>((resolve) => {
          if (window.faceapi) return resolve();
          const interval = setInterval(() => {
            if (window.faceapi) {
              clearInterval(interval);
              resolve();
            }
          }, 200);
        });

      await waitForFaceApi();

      try {
        await window.faceapi.nets.ssdMobilenetv1.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
        await window.faceapi.nets.faceLandmark68Net.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
        await window.faceapi.nets.faceRecognitionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
        setModelsLoaded(true);
      } catch {
        setError("Failed to load AI models. Please refresh.");
      }
    };

    loadModels();
    startVideo();

    return () => stopVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      // Camera not available — user can use image fallback
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setUseImageFallback(true);
      stopVideo();
    }
  };

  const handleVerify = async () => {
    if (!window.faceapi || !modelsLoaded) {
      setError("Please wait for AI models to load.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const source = useImageFallback ? imgRef.current : videoRef.current;

      // --- 1. Frame 1: Baseline Detection ---
      setLivenessPrompt("Step 1/2: Looking straight at camera...");
      const detection1 = await window.faceapi
        .detectSingleFace(source)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection1) {
        throw new Error("No face detected in initial frame. Look directly at camera.");
      }

      // If user uploaded a static photo fallback, reject immediately due to lack of multi-frame motion
      if (useImageFallback) {
        throw new Error("Anti-Spoofing Alert: Static uploaded photos cannot pass live motion verification.");
      }

      // --- 2. Frame 2: Liveness Motion Challenge ---
      setLivenessPrompt("Step 2/2: Please SLIGHTLY TURN YOUR HEAD or BLINK now...");
      await new Promise((r) => setTimeout(r, 800));

      const detection2 = await window.faceapi
        .detectSingleFace(source)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection2) {
        throw new Error("Face lost during motion verification. Please stay in frame.");
      }

      // --- 3. Anti-Spoofing Motion Delta Check ---
      // Compare landmark positions (Nose bridge point [27]) between Frame 1 and Frame 2
      const pt1 = detection1.landmarks.positions[27];
      const pt2 = detection2.landmarks.positions[27];
      const motionDelta = Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));

      console.log(`[Liveness Verification] Landmark motion delta: ${motionDelta.toFixed(2)}px`);

      if (motionDelta < 5.0) {
        throw new Error("Anti-Spoofing Alert: Liveness verification failed — static photo detected (insufficient motion delta).");
      }

      setLivenessPrompt("Liveness verified! Matching identity...");

      const descriptorArray = Array.from(detection2.descriptor);

      const res = await fetch("/api/verify-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descriptor: descriptorArray,
          livenessVerified: true,
        }),
      });

      const data = await res.json();

      if (data.verified) {
        stopVideo();
        router.push("/dashboard");
        router.refresh();
      } else {
        throw new Error(data.message || data.error || "Face does not match.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
      setLivenessPrompt(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border p-8 w-full max-w-md text-center">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-3xl">face</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">Face Verification</h1>
      <p className="text-slate-500 text-sm mt-1 mb-6">
        Welcome back, <span className="font-semibold text-slate-800">{userName}</span>. Verify your identity with multi-frame liveness detection.
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 text-xs p-3 rounded-xl mb-6 font-medium">
          {error}
        </div>
      )}

      {livenessPrompt && (
        <div className="bg-blue-50 text-blue-700 border border-blue-200 text-xs p-3 rounded-xl mb-6 font-semibold animate-pulse">
          {livenessPrompt}
        </div>
      )}

      <div className="relative mb-6 bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-800">
        {!useImageFallback ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          imageSrc && <img ref={imgRef} src={imageSrc} alt="Preview" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={handleVerify}
          disabled={loading || !modelsLoaded}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
        >
          {loading ? "Verifying Liveness..." : "Verify Identity & Enter"}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center text-xs text-slate-400 uppercase"><span className="bg-white px-2">or fallback</span></div>
        </div>

        <label className="block w-full cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors">
          Upload Static Photo (Will trigger anti-spoof rejection)
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-6 text-xs font-semibold text-slate-400 hover:text-slate-600 underline"
      >
        Sign out and log in as another user
      </button>
    </div>
  );
}
