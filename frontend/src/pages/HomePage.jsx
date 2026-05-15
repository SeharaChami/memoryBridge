import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarWidget from "../components/AvatarWidget.jsx";
import GreetingBubble from "../components/GreetingBubble.jsx";
import MicButton from "../components/MicButton.jsx";
import { useSpeech } from "../hooks/useSpeech.js";
import {
  deleteSetupReset,
  getStatus,
  postConversation,
} from "../services/api.js";

export default function HomePage() {
  const navigate = useNavigate();
  const avatarRef = useRef(null);

  const [preferredName, setPreferredName] = useState("");
  const [miaText, setMiaText] = useState("");
  const [history, setHistory] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [needsTapForAudio, setNeedsTapForAudio] = useState(false);
  const [bannerError, setBannerError] = useState(null);

  const { isListening, error, startListening, stopListening, clearError } =
    useSpeech();

  const speakMia = useCallback(async (text) => {
    setNeedsTapForAudio(false);
    try {
      await avatarRef.current?.speak?.(text);
    } catch {
      setNeedsTapForAudio(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const status = await getStatus();
        if (cancelled) return;

        if (!status.setupComplete) {
          navigate("/setup", { replace: true });
          return;
        }

        setPreferredName(status.preferredName || "");

        const { reply } = await postConversation({
          userMessage: "__GREETING__",
          conversationHistory: [],
        });

        if (cancelled) return;

        setMiaText(reply);
        setHistory([{ role: "mia", content: reply }]);

        try {
          await speakMia(reply);
        } catch {
          /* handled inside speakMia */
        }
      } catch (e) {
        if (!cancelled) {
          setBannerError(
            e?.response?.data?.error ||
              e?.message ||
              "Mia could not start the conversation just now."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, speakMia]);

  const sendUserMessage = async (userText) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    setBannerError(null);
    setProcessing(true);

    const nextHistory = [...history, { role: "user", content: trimmed }];

    try {
      const { reply } = await postConversation({
        userMessage: trimmed,
        conversationHistory: history,
      });

      setMiaText(reply);
      setHistory([...nextHistory, { role: "mia", content: reply }]);
      await speakMia(reply);
    } catch (e) {
      setBannerError(
        e?.response?.data?.error ||
          e?.message ||
          "Mia could not answer just now. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const holdActiveRef = useRef(false);

  const onMicPointerDown = (e) => {
    if (avatarSpeaking || processing) return;
    e.preventDefault();
    clearError();
    holdActiveRef.current = true;
    startListening();
  };

  const onMicPointerUp = async () => {
    if (!holdActiveRef.current) return;
    holdActiveRef.current = false;

    if (!isListening) return;

    const text = await stopListening();
    if (!text?.trim()) return;
    await sendUserMessage(text);
  };

  const onMicPointerLeave = async () => {
    if (!holdActiveRef.current) return;
    if (!isListening) return;
    holdActiveRef.current = false;
    const text = await stopListening();
    if (text?.trim()) await sendUserMessage(text);
  };

  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);

  const onEditSetup = () => {
    closeSettings();
    navigate("/setup", { state: { editSetup: true } });
  };

  const onResetAll = async () => {
    try {
      await deleteSetupReset();
      window.location.assign("/setup");
    } catch (e) {
      setBannerError(
        e?.response?.data?.error ||
          e?.message ||
          "Could not reset MemoryBridge."
      );
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">
            🌸 MemoryBridge
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[var(--color-text)] sm:text-4xl">
            Mia is here with you{preferredName ? `, ${preferredName}` : ""}
          </h1>
        </div>
        <button
          type="button"
          className="min-h-[52px] min-w-[52px] rounded-full border border-[var(--color-border)] bg-white text-2xl text-[var(--color-text-muted)] shadow-sm"
          onClick={openSettings}
          aria-label="Open caregiver settings"
        >
          ⚙️
        </button>
      </header>

      {bannerError ? (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-base text-red-900">
          {bannerError}
        </p>
      ) : null}

      {needsTapForAudio ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="min-h-[52px] rounded-full bg-[var(--color-accent-sage)] px-8 text-lg font-semibold text-[#1f3d33]"
            onClick={() => speakMia(miaText)}
            aria-label="Tap to hear Mia speak the latest message"
          >
            Tap to hear Mia
          </button>
        </div>
      ) : null}

      <AvatarWidget
        ref={avatarRef}
        onSpeakStart={() => setAvatarSpeaking(true)}
        onSpeakEnd={() => setAvatarSpeaking(false)}
      />

      <GreetingBubble text={miaText} />

      <div className="flex flex-col items-center gap-4 pb-10">
        <MicButton
          disabled={avatarSpeaking || processing}
          listening={isListening}
          processing={processing || avatarSpeaking}
          onPointerDown={onMicPointerDown}
          onPointerUp={onMicPointerUp}
          onPointerLeave={onMicPointerLeave}
        />
        {error ? (
          <p className="max-w-xl text-center text-base text-red-800">{error}</p>
        ) : (
          <p className="max-w-xl text-center text-base text-[var(--color-text-muted)]">
            Press and hold the button, speak gently, then release when you are finished.
          </p>
        )}
      </div>

      {settingsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeSettings();
          }}
        >
          <div
            className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="caregiver-settings-title"
          >
            <h2
              id="caregiver-settings-title"
              className="text-2xl font-semibold text-[var(--color-text)]"
            >
              Caregiver settings
            </h2>
            <p className="mt-2 text-base text-[var(--color-text-muted)]">
              Use these tools quietly when you are helping set things up. The person using MemoryBridge
              will not need this menu day to day.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="min-h-[52px] rounded-full bg-[var(--color-primary)] text-lg font-semibold text-white"
                onClick={onEditSetup}
                aria-label="Edit memories and name"
              >
                Edit setup
              </button>
              <button
                type="button"
                className="min-h-[52px] rounded-full border border-[var(--color-border)] bg-white text-lg font-semibold text-[var(--color-text)]"
                onClick={onResetAll}
                aria-label="Reset all MemoryBridge data"
              >
                Reset everything
              </button>
              <button
                type="button"
                className="min-h-[52px] rounded-full border border-transparent text-lg font-semibold text-[var(--color-text-muted)] underline"
                onClick={closeSettings}
                aria-label="Close settings"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
