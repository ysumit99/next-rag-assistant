"use client";

import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function DocumentUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setIsUploading(true);
    setStatus('idle');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      let data;
      try {
        data = await res.json();
      } catch (err) {
        data = { error: 'Server returned an invalid response (500).' };
      }

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'File uploaded successfully!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage('An unexpected error occurred');
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Clear status message after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt"
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 text-sm text-neutral-200 bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg border border-neutral-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
        ) : (
          <UploadCloud className="w-4 h-4 text-indigo-400" />
        )}
        <span className="font-medium">{isUploading ? 'Ingesting...' : 'Upload Doc'}</span>
      </button>

      {/* Status Tooltip/Toast */}
      {status !== 'idle' && (
        <div className={`absolute top-full mt-2 right-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2 ${
          status === 'success' 
            ? 'bg-emerald-950/80 border-emerald-800/50 text-emerald-400' 
            : 'bg-red-950/80 border-red-800/50 text-red-400'
        }`}>
          {status === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          {message}
        </div>
      )}
    </div>
  );
}
