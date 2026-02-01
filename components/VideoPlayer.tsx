'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Download } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  allowDownload?: boolean;
  onEnded?: () => void;
  className?: string;
}

export function VideoPlayer({
  src,
  poster,
  title,
  allowDownload = false,
  onEnded,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = title || 'video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={showControlsTemporarily}
      onTouchMove={showControlsTemporarily}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-auto cursor-pointer"
        onClick={togglePlay}
      />

      {/* Overlay gradient for better control visibility */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-3 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer appearance-none"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                duration ? (currentTime / duration) * 100 : 0
              }%, rgb(75, 85, 99) ${duration ? (currentTime / duration) * 100 : 0}%, rgb(75, 85, 99) 100%)`,
            }}
          />
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors p-1"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors p-1"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-600 rounded-full cursor-pointer appearance-none"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                    (isMuted ? 0 : volume) * 100
                  }%, rgb(75, 85, 99) ${(isMuted ? 0 : volume) * 100}%, rgb(75, 85, 99) 100%)`,
                }}
              />
            </div>

            {/* Time Display */}
            <span className="text-white text-sm ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Download Button */}
            {allowDownload && (
              <button
                onClick={handleDownload}
                className="text-white hover:text-blue-400 transition-colors p-1"
                title="Download"
              >
                <Download size={20} />
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors p-1"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>

        {/* Title */}
        {title && <div className="text-white text-sm mt-2 truncate">{title}</div>}
      </div>

      {/* Play Button Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/20 transition-colors cursor-pointer">
          <button
            onClick={togglePlay}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 transition-all transform hover:scale-110"
          >
            <Play size={32} className="fill-current" />
          </button>
        </div>
      )}
    </div>
  );
}
