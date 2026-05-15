import { useCallback, useEffect, useRef, useState } from "react";

function getRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeech() {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError(
        "This browser does not support speech recognition. Try Chrome on a desktop or Android device."
      );
      return;
    }

    setError(null);
    finalTranscriptRef.current = "";

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      finalTranscriptRef.current = (text || "").trim();
    };

    recognition.onerror = (event) => {
      setError(event.error || "Speech recognition error");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      setError(e?.message || "Could not start listening");
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    return new Promise((resolve) => {
      const recognition = recognitionRef.current;
      if (!recognition) {
        resolve(finalTranscriptRef.current);
        return;
      }

      recognition.onend = () => {
        setIsListening(false);
        resolve(finalTranscriptRef.current);
      };

      try {
        recognition.stop();
      } catch {
        setIsListening(false);
        resolve(finalTranscriptRef.current);
      }
    });
  }, []);

  return {
    isListening,
    error,
    startListening,
    stopListening,
    clearError: () => setError(null),
  };
}
