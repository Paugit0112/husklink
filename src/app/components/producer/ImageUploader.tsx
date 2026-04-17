import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Camera, MapPin, X, Loader2, StopCircle } from "lucide-react";

interface ImageUploaderProps {
  onImageUpload: (file: File, location: { lat: number; lng: number } | null) => void;
  isProcessing?: boolean;
}

export function ImageUploader({ onImageUpload, isProcessing = false }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const extractGPSData = (file: File): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      // In production, use exif-js or similar library
      // For MVP, simulate GPS extraction
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => resolve(null)
        );
      } else {
        resolve(null);
      }
    });
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera
          width: { ideal: 1920 },
          height: { ideal: 1440 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Unable to access camera. Please check permissions.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const context = canvasRef.current.getContext('2d');
      if (!context) return;

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      // Convert canvas to blob and create file
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        await handleFile(file);
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Capture error:', error);
      setCameraError('Failed to capture photo');
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Extract GPS
    const gpsData = await extractGPSData(file);
    setLocation(gpsData);

    // Upload
    onImageUpload(file, gpsData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setPreview(null);
    setLocation(null);
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 transition-all
              ${isDragging
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-border hover:border-primary/50 bg-card'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="image-upload"
            />

            <canvas ref={canvasRef} className="hidden" />
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="hidden"
            />

            <label
              htmlFor="image-upload"
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-forest-medium to-leaf-green rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-forest-medium to-leaf-green rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <Upload className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
              </div>

              <h3 className="text-xl mb-2">Upload Husk Pile Photo</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                Drag and drop your photo here, or click to browse. Our AI will analyze condition and suggest pricing.
              </p>

              <div className="flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Choose File
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startCamera}
                  className="px-6 py-3 bg-accent text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </motion.button>
              </div>
            </label>
          </motion.div>
        ) : isCameraActive ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden bg-black border border-border"
          >
            <div className="relative w-full bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-96 object-cover"
              />
              
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center text-white">
                    <p className="text-lg font-medium mb-2">Camera Error</p>
                    <p className="text-sm text-red-400 mb-4">{cameraError}</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={stopCamera}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-medium"
                    >
                      Close Camera
                    </motion.button>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={capturePhoto}
                  disabled={!!cameraError}
                  className="flex-1 py-3 bg-gradient-to-r from-forest-medium to-leaf-green text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  Capture
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopCamera}
                  className="px-6 py-3 bg-destructive text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <StopCircle className="w-5 h-5" />
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden bg-card border border-border"
          >
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-96 object-cover"
              />
              <button
                onClick={reset}
                disabled={isProcessing}
                className="absolute top-4 right-4 p-2 bg-destructive text-white rounded-full hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>

              {location && (
                <div className="absolute bottom-4 left-4 px-4 py-2 bg-forest-dark/90 backdrop-blur-sm text-white rounded-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-mono">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="p-6 bg-primary/5 border-t border-primary/20">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">AI Processing...</p>
                    <p className="text-xs text-muted-foreground">
                      Analyzing condition, moisture, and estimating value
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
