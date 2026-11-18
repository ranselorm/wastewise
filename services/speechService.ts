import * as Speech from "expo-speech";
import { AccessibilityInfo } from "react-native";

/**
 * WasteWise speech service.
 *
 * Picks the most natural-sounding English voice installed on the phone
 * (preferring British English and "Enhanced" quality voices) and uses it
 * for everything the app reads aloud.
 */

// To force one specific voice, paste its identifier here
// (they are printed in the Expo terminal as "[Speech] voices").
// Leave as null to let the app choose automatically.
const VOICE_OVERRIDE: string | null = null;

const SPEECH_RATE = 0.95; // 1.0 = normal speed
const SPEECH_PITCH = 1.0; // 1.0 = normal pitch

let lastSpokenText = "";
let chosenVoice: string | undefined;
let voiceLookupDone = false;
let speechRequestId = 0;

// Voice guidance on/off. When off, the app stays silent (for sighted users).
let voiceGuidanceEnabled = false;

export const setVoiceGuidanceEnabled = (enabled: boolean): void => {
  voiceGuidanceEnabled = enabled;
  if (!enabled) stopSpeech();
};

// When TalkBack (the Android screen reader) is on, send messages through
// TalkBack instead of expo-speech, so two voices never talk over each other.
let screenReaderOn = false;

AccessibilityInfo.isScreenReaderEnabled()
  .then((enabled) => {
    screenReaderOn = enabled;
  })
  .catch(() => {});

AccessibilityInfo.addEventListener("screenReaderChanged", (enabled) => {
  screenReaderOn = enabled;
  if (enabled) void Speech.stop();
});

export const isScreenReaderOn = (): boolean => screenReaderOn;

// ---------- Knowing when the app is talking ----------
// Hands-free mode uses these so the microphone only listens when the app
// is quiet, and never hears the app's own voice.

type SpeechListener = () => void;

let speaking = false;
const startedListeners = new Set<SpeechListener>();
const finishedListeners = new Set<SpeechListener>();

export const isSpeaking = (): boolean => speaking;

export const onSpeechStarted = (listener: SpeechListener) => {
  startedListeners.add(listener);
  return () => {
    startedListeners.delete(listener);
  };
};

export const onSpeechFinished = (listener: SpeechListener) => {
  finishedListeners.add(listener);
  return () => {
    finishedListeners.delete(listener);
  };
};

const markStarted = () => {
  speaking = true;
  startedListeners.forEach((listener) => listener());
};

// Only the newest message counts: an older one that was cut off does not
// report "finished".
const markFinished = (requestId: number) => {
  if (requestId !== speechRequestId) return;
  speaking = false;
  finishedListeners.forEach((listener) => listener());
};

// TalkBack does not report when it finishes, so estimate it
// (about 15 characters per second, plus a short start-up delay).
const estimateTalkBackMs = (text: string) => 1200 + text.length * 70;

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// Higher score = better voice.
const scoreVoice = (voice: Speech.Voice): number => {
  const language = voice.language.toLowerCase().replace("_", "-");
  const id = voice.identifier.toLowerCase();

  if (!language.startsWith("en")) return -1;

  let score = 0;
  if (language.startsWith("en-gb")) score += 100;
  else if (language.startsWith("en-us")) score += 60;
  else score += 40;

  if (voice.quality === Speech.VoiceQuality.Enhanced) score += 30;

  // Google's on-device voices work offline, which matters for blind users.
  if (id.includes("local")) score += 10;
  if (id.includes("network")) score += 5;

  // Older, robotic engines.
  if (id.includes("pico") || id.includes("espeak")) score -= 80;

  return score;
};

const ensureVoice = async (): Promise<void> => {
  if (voiceLookupDone) return;

  if (VOICE_OVERRIDE) {
    chosenVoice = VOICE_OVERRIDE;
    voiceLookupDone = true;
    return;
  }

  // Android's speech engine can take a moment to start, so retry a few times.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const voices = await Speech.getAvailableVoicesAsync();

      if (voices.length > 0) {
        const english = voices
          .filter((voice) => scoreVoice(voice) >= 0)
          .sort((a, b) => scoreVoice(b) - scoreVoice(a));

        console.log(
          "[Speech] voices:",
          english
            .slice(0, 15)
            .map((v) => `${v.identifier} (${v.language}, ${v.quality})`),
        );

        chosenVoice = english[0]?.identifier;
        console.log("[Speech] using voice:", chosenVoice ?? "system default");
        voiceLookupDone = true;
        return;
      }
    } catch (error) {
      console.warn("[Speech] could not list voices:", error);
    }

    await wait(500);
  }
  // No voices found yet: fall back to the default voice and try again next time.
};

// `force` speaks even when voice guidance is off (used only for the
// one-time "would you like voice guidance?" question).
export const speak = (text: string, options?: { force?: boolean }): void => {
  if (!text || !text.trim()) return;
  if (!voiceGuidanceEnabled && !options?.force) return;

  lastSpokenText = text;
  const requestId = ++speechRequestId;
  markStarted();

  if (screenReaderOn) {
    void Speech.stop();
    // A short delay lets TalkBack finish reading the newly focused item first.
    setTimeout(() => {
      if (requestId === speechRequestId) {
        AccessibilityInfo.announceForAccessibility(text);
        setTimeout(() => markFinished(requestId), estimateTalkBackMs(text));
      }
    }, 600);
    return;
  }

  void (async () => {
    await ensureVoice();

    // A newer speak() call was made while we were waiting; let that one win.
    if (requestId !== speechRequestId) return;

    await Speech.stop();

    Speech.speak(text, {
      language: "en-GB",
      voice: chosenVoice,
      rate: SPEECH_RATE,
      pitch: SPEECH_PITCH,
      onDone: () => markFinished(requestId),
      onError: () => markFinished(requestId),
    });

    // Safety net: if the voice engine never reports "done", carry on anyway
    // so hands-free mode does not wait forever.
    setTimeout(() => {
      if (speaking) markFinished(requestId);
    }, 3000 + text.length * 110);
  })();
};

export const repeatSpeech = (): void => {
  if (lastSpokenText) {
    speak(lastSpokenText);
  }
};

export function stopSpeech(): void {
  const requestId = ++speechRequestId;
  void Speech.stop();
  markFinished(requestId);
}

// Start finding a voice as soon as the app opens, so the first message
// already uses the better voice.
void ensureVoice();
