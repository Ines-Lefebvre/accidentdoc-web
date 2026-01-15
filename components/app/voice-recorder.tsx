"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onTranscription?: (text: string) => void;
  isProcessing?: boolean;
  maxDuration?: number; // en secondes
  disabled?: boolean;
}

export function VoiceRecorder({
  onRecordingComplete,
  onTranscription,
  isProcessing = false,
  maxDuration = 180, // 3 minutes par défaut
  disabled = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Mise à jour du niveau audio
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255);

    if (isRecording) {
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Analyser audio pour le feedback visuel
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(blob);
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
      };

      mediaRecorder.start(1000); // Collecter toutes les secondes
      setIsRecording(true);
      setDuration(0);

      // Timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Feedback audio
      updateAudioLevel();
    } catch (err) {
      console.error("Erreur d'accès au microphone:", err);
      setError(
        "Impossible d'accéder au microphone. Vérifiez les permissions de votre navigateur."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setAudioLevel(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        {/* Bouton d'enregistrement */}
        <div className="relative">
          {/* Cercle de niveau audio */}
          {isRecording && (
            <div
              className="absolute inset-0 rounded-full bg-red-500/20 transition-transform"
              style={{
                transform: `scale(${1 + audioLevel * 0.5})`,
              }}
            />
          )}

          <Button
            size="xl"
            variant={isRecording ? "destructive" : "default"}
            className={cn(
              "relative rounded-full w-20 h-20",
              isRecording && "recording-pulse"
            )}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : isRecording ? (
              <Square className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
        </div>

        {/* Durée */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <span className="recording-indicator" />
            <span className="text-lg font-mono">{formatDuration(duration)}</span>
            <span className="text-sm text-muted-foreground">
              / {formatDuration(maxDuration)}
            </span>
          </div>
        )}

        {/* Instructions */}
        {!isRecording && !isProcessing && (
          <p className="text-sm text-muted-foreground text-center">
            {disabled
              ? "Enregistrement désactivé"
              : "Cliquez pour commencer l'enregistrement"}
          </p>
        )}

        {isProcessing && (
          <p className="text-sm text-muted-foreground text-center">
            Analyse de votre enregistrement en cours...
          </p>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm justify-center">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Guide d'utilisation */}
      {!isRecording && !isProcessing && !disabled && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Volume2 className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                Exprimez vos doutes librement
              </p>
              <p>
                Parlez de ce qui vous semble suspect dans cet accident : les
                circonstances, les horaires, l'absence de témoin, un état
                préexistant... Toutes vos remarques sont importantes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
