import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { postTtsAudio } from "../services/api.js";

const agentId = import.meta.env.VITE_BEYOND_PRESENCE_AGENT_ID;

function FallbackFace({ speaking }) {
  return (
    <div
      className={`avatar-fallback flex h-[420px] w-full items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-primary-pale)] to-white ${
        speaking ? "ring-4 ring-[var(--color-primary-light)]" : ""
      }`}
      aria-hidden
    >
      <svg
        width="220"
        height="220"
        viewBox="0 0 220 220"
        role="img"
        aria-label="Illustrated friendly face representing Mia"
      >
        <defs>
          <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD8C9" />
            <stop offset="100%" stopColor="#F2B8A7" />
          </linearGradient>
        </defs>
        <circle cx="110" cy="118" r="78" fill="url(#skin)" stroke="#E8A090" strokeWidth="3" />
        <ellipse cx="110" cy="92" rx="64" ry="56" fill="#6E4A42" opacity="0.12" />
        <circle cx="86" cy="112" r="8" fill="#3D2C2C" />
        <circle cx="134" cy="112" r="8" fill="#3D2C2C" />
        <path
          d="M92 142c10 14 26 22 36 22s22-8 32-22"
          stroke="#3D2C2C"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="110" cy="154" rx="18" ry="10" fill="#E8736A" opacity="0.35" />
      </svg>
    </div>
  );
}

const AvatarWidget = forwardRef(function AvatarWidget(
  { onSpeakStart, onSpeakEnd },
  ref
) {
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);

  const cleanupAudio = useCallback(() => {
    try {
      audioRef.current?.pause?.();
    } catch {
      /* ignore */
    }
    audioRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  const speak = useCallback(
    async (text) => {
      const trimmed = String(text || "").trim();
      if (!trimmed) return;

      cleanupAudio();
      onSpeakStart?.();
      setSpeaking(true);

      try {
        const blob = await postTtsAudio(trimmed);
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        await new Promise((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("Audio playback failed"));
          audio.play().catch((err) => reject(err));
        });
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        setSpeaking(false);
        onSpeakEnd?.();
      }
    },
    [cleanupAudio, onSpeakEnd, onSpeakStart]
  );

  useImperativeHandle(ref, () => ({ speak }), [speak]);

  const iframeSrc = agentId
    ? `https://bey.chat/${encodeURIComponent(agentId)}`
    : null;

  return (
    <div className="mx-auto w-full max-w-xl">
      {iframeSrc ? (
        <div
          className={`rounded-[var(--radius-lg)] ${
            speaking ? "ring-4 ring-[var(--color-primary-light)]" : ""
          }`}
        >
          <iframe
            title="Mia — Beyond Presence"
            src={iframeSrc}
            className="h-[420px] w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm"
            allow="camera; microphone; fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <FallbackFace speaking={speaking} />
      )}
      <p className="mt-3 text-center text-base text-[var(--color-text-muted)]">
        Mia&apos;s voice plays from this device so her words match what she wants to say.
      </p>
    </div>
  );
});

export default AvatarWidget;
