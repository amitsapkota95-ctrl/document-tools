"use client";

import { useEffect, useRef, useState } from "react";
import { extractWords, fuzzyMatchWord } from "./script-parser";
import type { VoiceStatus } from "./types";

const PAUSE_TIMEOUT_MS = 4000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const Win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return Win.SpeechRecognition ?? Win.webkitSpeechRecognition ?? null;
}

interface UseVoiceTrackerOptions {
  /** Mic stays open in fullscreen while voice track is enabled */
  listening: boolean;
  /** Smooth scroll follows speech only while the prompter is playing */
  scrolling: boolean;
  script: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  voiceTargetWordRef: React.MutableRefObject<number>;
  voiceScrollActiveRef: React.MutableRefObject<boolean>;
  onError?: (message: string) => void;
}

export interface VoiceTrackerState {
  status: VoiceStatus;
  activeWordIndex: number;
  currentPhrase: string;
  interimText: string;
  speechAvailable: boolean;
  hearingAudio: boolean;
}

export function useVoiceTracker({
  listening,
  scrolling,
  script,
  contentRef,
  voiceModeActiveRef,
  voiceTargetWordRef,
  voiceScrollActiveRef,
  onError,
}: UseVoiceTrackerOptions): VoiceTrackerState {
  const [liveStatus, setLiveStatus] = useState<VoiceStatus>("idle");
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [interimText, setInterimText] = useState("");
  const [hearingAudio, setHearingAudio] = useState(false);

  const wordIndexRef = useRef(0);
  const wordsRef = useRef<string[]>([]);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onErrorRef = useRef(onError);

  const speechCtor = getSpeechRecognitionCtor();
  const speechAvailable = Boolean(speechCtor);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    voiceScrollActiveRef.current = scrolling && activeWordIndex > 0;
  }, [scrolling, activeWordIndex, voiceScrollActiveRef]);

  useEffect(() => {
    voiceTargetWordRef.current = activeWordIndex;
  }, [activeWordIndex, voiceTargetWordRef]);

  useEffect(() => {
    if (!listening) {
      voiceModeActiveRef.current = false;
      voiceScrollActiveRef.current = false;
      return;
    }

    if (!speechCtor) {
      voiceModeActiveRef.current = false;
      onErrorRef.current?.("Voice tracking requires Chrome or Edge with Speech Recognition support.");
      return;
    }

    wordsRef.current = extractWords(script);
    wordIndexRef.current = 0;
    voiceModeActiveRef.current = true;
    voiceTargetWordRef.current = 0;

    const recognition = new speechCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    const clearPauseTimer = () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    };

    const resetPauseTimer = () => {
      clearPauseTimer();
      setLiveStatus("listening");
      pauseTimerRef.current = setTimeout(() => {
        setLiveStatus("paused");
        setHearingAudio(false);
      }, PAUSE_TIMEOUT_MS);
    };

    const advanceToWord = (spoken: string) => {
      const words = wordsRef.current;
      let idx = wordIndexRef.current;

      while (idx < words.length && !fuzzyMatchWord(spoken, words[idx])) {
        idx++;
      }

      if (idx >= words.length) return false;

      idx++;
      wordIndexRef.current = idx;
      voiceTargetWordRef.current = idx;
      setActiveWordIndex(idx);

      const phraseStart = Math.max(0, idx - 4);
      setCurrentPhrase(words.slice(phraseStart, idx).join(" "));
      return true;
    };

    recognition.onstart = () => {
      setLiveStatus("listening");
      resetPauseTimer();
    };

    recognition.onaudiostart = () => {
      setHearingAudio(true);
      resetPauseTimer();
    };

    recognition.onsoundstart = () => {
      setHearingAudio(true);
      resetPauseTimer();
    };

    recognition.onspeechstart = () => {
      setHearingAudio(true);
      resetPauseTimer();
    };

    recognition.onspeechend = () => {
      resetPauseTimer();
    };

    recognition.onsoundend = () => {
      resetPauseTimer();
    };

    recognition.onresult = (event: { resultIndex: number; results: SpeechRecognitionResultList }) => {
      resetPauseTimer();
      setHearingAudio(true);

      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        if (!text) continue;

        if (!result.isFinal) {
          interim = `${interim}${text} `.trim();
          continue;
        }

        const spokenWords = text.toLowerCase().split(/\s+/).filter(Boolean);
        for (const word of spokenWords) {
          advanceToWord(word);
        }
      }

      setInterimText(interim);

      if (wordIndexRef.current > 0) {
        const words = wordsRef.current;
        const idx = wordIndexRef.current;
        const phraseStart = Math.max(0, idx - 4);
        setCurrentPhrase(words.slice(phraseStart, idx).join(" "));
      }
    };

    recognition.onerror = (event: { error?: string }) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setLiveStatus("error");
      voiceModeActiveRef.current = false;
      onErrorRef.current?.(`Speech recognition error: ${event.error ?? "unknown"}`);
    };

    recognition.onend = () => {
      if (listening) {
        try {
          recognition.start();
        } catch {
          // ignore restart failures
        }
      }
    };

    try {
      recognition.start();
    } catch {
      voiceModeActiveRef.current = false;
      queueMicrotask(() => setLiveStatus("error"));
    }

    return () => {
      clearPauseTimer();
      voiceModeActiveRef.current = false;
      voiceScrollActiveRef.current = false;
      recognition.stop();
      queueMicrotask(() => {
        setLiveStatus("idle");
        setHearingAudio(false);
        setInterimText("");
      });
    };
  }, [
    listening,
    script,
    speechCtor,
    contentRef,
    voiceModeActiveRef,
    voiceTargetWordRef,
    voiceScrollActiveRef,
  ]);

  const status: VoiceStatus = !listening
    ? "idle"
    : !speechAvailable
      ? "unavailable"
      : liveStatus;

  return {
    status,
    activeWordIndex,
    currentPhrase,
    interimText,
    speechAvailable,
    hearingAudio,
  };
}
