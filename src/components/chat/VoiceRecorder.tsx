import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, X, Pause, Play } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface Props {
  onRecordingComplete: (audioBlob: Blob) => void;
  isRecording: boolean;
  onRecordingStateChange: (recording: boolean) => void;
  maxDuration?: number; // in seconds
}

export const VoiceRecorder: React.FC<Props> = ({
  onRecordingComplete,
  isRecording,
  onRecordingStateChange,
  maxDuration = 300, // 5 minutes
}) => {
  const { error } = useToast();
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      
      // Set up audio analysis for waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      onRecordingStateChange(true);
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
      // Start waveform animation
      updateWaveform();
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      error('Recording failed', 'Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    onRecordingStateChange(false);
  };

  const updateWaveform = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Convert to normalized values for visualization
    const normalizedData = Array.from(dataArray)
      .slice(0, 20) // Take first 20 frequency bins
      .map(value => value / 255);
    
    setWaveformData(normalizedData);
    
    if (isRecording) {
      animationRef.current = requestAnimationFrame(updateWaveform);
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPaused) {
        audioRef.current.play();
        setIsPaused(false);
      } else {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const sendRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
      resetRecording();
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    setIsPlaying(false);
    setIsPaused(false);
    setWaveformData([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If we have a recording, show playback interface
  if (audioBlob && audioUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center space-x-2 bg-card-highlight rounded-2xl p-2"
      >
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => {
            setIsPlaying(false);
            setIsPaused(false);
          }}
        />
        
        <button
          onClick={isPlaying ? pauseRecording : playRecording}
          className="p-2 bg-primary rounded-full hover:bg-primary-dark transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </button>
        
        <div className="flex-1 px-2">
          <div className="flex items-center space-x-1 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary/30 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(4, (waveformData[i] || 0) * 24)}px`,
                }}
              />
            ))}
          </div>
          <p className="text-xs text-text-muted mt-1">
            {formatTime(recordingTime)}
          </p>
        </div>
        
        <button
          onClick={resetRecording}
          className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-text-muted" />
        </button>
        
        <button
          onClick={sendRecording}
          className="p-2 bg-gradient-primary rounded-full hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </motion.div>
    );
  }

  // Recording interface
  if (isRecording) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center space-x-2 bg-red-500/10 rounded-2xl p-2"
      >
        <motion.button
          onClick={stopRecording}
          className="p-3 bg-red-500 rounded-full"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <MicOff className="w-5 h-5 text-white" />
        </motion.button>
        
        <div className="flex-1 px-2">
          <div className="flex items-center space-x-1 h-8">
            {waveformData.map((amplitude, i) => (
              <motion.div
                key={i}
                className="w-1 bg-red-500 rounded-full"
                animate={{
                  height: `${Math.max(4, amplitude * 24)}px`,
                }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>
          <p className="text-xs text-red-500 mt-1">
            Recording... {formatTime(recordingTime)}
          </p>
        </div>
        
        <div className="text-xs text-text-muted">
          {formatTime(maxDuration - recordingTime)} left
        </div>
      </motion.div>
    );
  }

  // Default mic button
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={startRecording}
      className="p-3 bg-gradient-secondary rounded-full shadow-lg hover:shadow-xl transition-all"
    >
      <Mic className="w-5 h-5 text-white" />
    </motion.button>
  );
};
