"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Download, Smartphone, Info, Clock, Activity } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function Home() {
  const [status, setStatus] = useState({ isAuthenticated: false, isReady: false, qrCodeData: null });
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobProgress, setJobProgress] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [fakeProgress, setFakeProgress] = useState(0);

  // Poll for WhatsApp status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/whatsapp/status`);
        setStatus(res.data);
      } catch (err) {
        console.error("Error fetching status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fake progress for restoring session
  useEffect(() => {
    if (!status.isReady && status.hasSavedSession && !status.isAuthenticated) {
      setFakeProgress(5); // Start at 5%
      const interval = setInterval(() => {
        setFakeProgress(prev => {
          if (prev < 92) return prev + Math.floor(Math.random() * 4) + 1;
          return prev;
        });
      }, 800);
      return () => clearInterval(interval);
    } else {
      setFakeProgress(0);
    }
  }, [status.isReady, status.hasSavedSession, status.isAuthenticated]);

  // Poll for job progress
  useEffect(() => {
    if (!jobId || (jobProgress && (jobProgress.status === "completed" || jobProgress.status === "failed"))) {
      return;
    }

    const fetchProgress = async () => {
      try {
        const res = await axios.get(`${API_BASE}/jobs/${jobId}`);
        setJobProgress(res.data);
      } catch (err) {
        console.error("Error fetching job progress:", err);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 2000);
    return () => clearInterval(interval);
  }, [jobId, jobProgress]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please upload an Excel file first!");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/jobs`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setJobId(res.data.jobId);
      toast.success("File uploaded successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };


  const calculatePercentage = () => {
    if (!jobProgress || !jobProgress.progress.total) return 0;
    return Math.round((jobProgress.progress.current / jobProgress.progress.total) * 100);
  };

  const calculateTimeRemaining = () => {
    if (!jobProgress || !jobProgress.progress.total || jobProgress.progress.current === 0) return "Calculating...";
    const remainingItems = jobProgress.progress.total - jobProgress.progress.current;
    const timePerItemSec = 3; // 3 seconds delay
    const totalSecs = remainingItems * timePerItemSec;
    if (totalSecs < 60) return `${totalSecs} sec`;
    return `${Math.floor(totalSecs / 60)} min ${totalSecs % 60} sec`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      <Toaster position="top-center" toastOptions={{ style: { background: '#171717', color: '#fff', border: '1px solid #262626' } }} />
      
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navbar */}
      <header className="absolute top-0 left-0 w-full px-4 sm:px-6 md:px-10 py-6 sm:py-8 z-50 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <img src="/nexcore-logo.jpeg" alt="Nexcore Logo" className="h-16 sm:h-20 md:h-24 object-contain rounded-lg" />
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-8 sm:pt-36 sm:pb-12 md:pt-44 md:pb-20 relative z-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl mb-4 border border-emerald-500/20">
            <Smartphone className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            WhatsApp Number Checker
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
            Upload your Excel sheet and filter out numbers that aren't registered on WhatsApp securely and efficiently.
          </p>
        </motion.header>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Authentication */}
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 text-sm font-bold text-neutral-400">1</span>
              Authentication
            </h2>

            {!status.isReady ? (
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-neutral-700 rounded-2xl bg-neutral-950/50">
                {status.qrCodeData ? (
                  <div className="text-center space-y-4">
                    <p className="text-neutral-300 font-medium">Scan this QR Code with WhatsApp</p>
                    <div className="p-4 bg-white rounded-xl inline-block">
                      <img src={status.qrCodeData} alt="QR Code" className="w-full max-w-[256px] h-auto rounded-lg" />
                    </div>
                    <p className="text-sm text-neutral-500 flex items-center gap-2 justify-center mt-4">
                      <Loader2 className="w-4 h-4 animate-spin" /> Waiting for scan...
                    </p>
                  </div>
                ) : status.isAuthenticated ? (
                  <div className="text-center space-y-4 w-full px-4">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                    <p className="text-neutral-400 font-medium">Authenticated. Syncing with WhatsApp...</p>
                    
                    <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden shadow-inner">
                      <div 
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                        style={{ width: `${status.syncPercentage || 0}%` }}
                      ></div>
                    </div>
                    
                    <p className="text-xs text-neutral-500 flex justify-center gap-1">
                      <span className="font-mono text-emerald-500">{status.syncPercentage || 0}%</span> 
                      {status.syncMessage ? `- ${status.syncMessage}` : ''}
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-4 w-full px-4">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                    {status.hasSavedSession ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-emerald-400 font-medium text-lg">Restoring Session...</p>
                          <p className="text-sm text-neutral-500">Connecting to your linked WhatsApp account.</p>
                        </div>
                        
                        <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden shadow-inner mt-2">
                          <div 
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                            style={{ width: `${fakeProgress}%` }}
                          ></div>
                        </div>
                        
                        <p className="text-xs text-neutral-500 flex justify-center gap-1">
                          <span className="font-mono text-emerald-500">{fakeProgress}%</span> 
                          - Launching Browser Instance
                        </p>
                      </div>
                    ) : (
                      <p className="text-neutral-400">Initializing WhatsApp Client...</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-emerald-500/20 bg-emerald-500/5 rounded-2xl min-h-[300px] md:h-[360px] relative"
              >
                <button 
                  onClick={async () => {
                     try {
                       await axios.post(`${API_BASE}/whatsapp/logout`);
                       toast.success("Logged out successfully");
                     } catch (err) {
                       toast.error("Failed to logout");
                     }
                  }}
                  className="absolute top-4 right-4 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                >
                  Logout
                </button>
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Authenticated</h3>
                <p className="text-neutral-400 text-center">Your WhatsApp account is linked and ready to process numbers.</p>
              </motion.div>
            )}

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3 text-yellow-200/80 text-sm">
              <Info className="w-5 h-5 flex-shrink-0" />
              <p>Checking thousands of numbers carries a risk of account ban. We use a 3-second delay between checks for safety, but use a throwaway account if possible.</p>
            </div>
          </motion.section>

          {/* Right Column: Upload and Progress */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative group"
          >
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 text-sm font-bold text-neutral-400">2</span>
              Upload & Process
            </h2>

            {!jobId ? (
              <div className="space-y-6">
                <div className={`transition-opacity duration-500 ${!status.isReady ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <div
                    {...getRootProps()}
                    className={`p-6 sm:p-10 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-200 ${
                      isDragActive ? "border-emerald-500 bg-emerald-500/5" : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800/50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className={`w-8 h-8 ${isDragActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
                    </div>
                    {file ? (
                      <div>
                        <p className="text-emerald-400 font-medium text-lg">{file.name}</p>
                        <p className="text-neutral-500 text-sm mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium text-neutral-300">Drag & drop your Excel file</p>
                        <p className="text-neutral-500 text-sm mt-2">Supports .xlsx and .xls formats</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center mt-2 mb-4">
                  <a href={`${API_BASE}/template`} download className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1.5 transition-colors">
                    <Download className="w-4 h-4" /> Download Sample Template
                  </a>
                </div>

                <div className={`transition-opacity duration-500 ${!status.isReady ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading || !status.isReady}
                    className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-semibold text-base sm:text-lg transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
                      </>
                    ) : (
                      "Start Processing"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div 
                  key="progress"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8 py-4"
                >
                  {/* Progress UI */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                          {jobProgress?.status === "completed" ? "Processing Complete!" : (
                            <>
                              Checking Numbers <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                            </>
                          )}
                        </h3>
                        <p className="text-neutral-400 text-sm">
                          {jobProgress ? `${jobProgress.progress.current} of ${jobProgress.progress.total} checked` : "Starting..."}
                        </p>
                        {jobProgress?.status === "processing" && (
                          <p className="text-cyan-400 text-xs mt-1 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" /> Est. remaining: {calculateTimeRemaining()}
                          </p>
                        )}
                      </div>
                      <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        {calculatePercentage()}%
                      </span>
                    </div>

                    <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden relative shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${calculatePercentage()}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      />
                    </div>
                  </div>

                {jobProgress?.status === "completed" && (
                  <div className="pt-4 border-t border-neutral-800 space-y-3">
                    <button
                      onClick={() => window.location.href = `${API_BASE}/jobs/${jobId}/download/registered`}
                      className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-lg transition-all shadow-lg hover:shadow-emerald-500/25 flex justify-center items-center gap-2"
                    >
                      <Download className="w-5 h-5" /> Download 'On WhatsApp'
                    </button>
                    <button
                      onClick={() => window.location.href = `${API_BASE}/jobs/${jobId}/download/unregistered`}
                      className="w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium text-lg transition-all shadow-lg hover:shadow-cyan-500/25 flex justify-center items-center gap-2"
                    >
                      <Download className="w-5 h-5" /> Download 'Not on WhatsApp'
                    </button>
                    <button 
                      onClick={() => {
                        setJobId(null);
                        setJobProgress(null);
                        setFile(null);
                      }}
                      className="w-full py-3 mt-3 text-neutral-400 hover:text-white transition-colors"
                    >
                      Process Another File
                    </button>
                  </div>
                )}

                {jobProgress?.status === "failed" && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col gap-2 text-red-400">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="font-medium">Job Failed</p>
                    </div>
                    <p className="text-sm pl-8">{jobProgress.error}</p>
                    <button 
                      onClick={() => setJobId(null)}
                      className="mt-2 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm w-fit self-start ml-8"
                    >
                      Try Again
                    </button>
                  </div>
                )}
                </motion.div>
              </AnimatePresence>
            )}
          </motion.section>
        </div>
      </main>
    </div>
  );
}
