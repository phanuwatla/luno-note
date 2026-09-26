import { describe, it, expect, beforeEach } from "vitest";
import {
  isKnownWebmAudioName,
  isKnownWebmVideoName,
  isAudioMedia,
  isVideoMedia,
  normalizeMediaKey,
  webmMediaKindCache,
} from "./webmClassifier";

describe("webmClassifier", () => {
  beforeEach(() => {
    webmMediaKindCache.clear();
  });

  describe("normalizeMediaKey", () => {
    it("strips queries, hashes, and folder paths", () => {
      expect(normalizeMediaKey("attachments/voice.webm?v=123#t=10")).toBe("voice.webm");
      expect(normalizeMediaKey("C:\\notes\\attachments\\clip.webm")).toBe("clip.webm");
      expect(normalizeMediaKey("attachments/Voice%20Note.webm")).toBe("voice note.webm");
    });
  });

  describe("isKnownWebmAudioName", () => {
    it("identifies voice notes and audio recordings", () => {
      expect(isKnownWebmAudioName("Voice Note - 2026-09-11 20_49.webm")).toBe(true);
      expect(isKnownWebmAudioName("recording_1.webm")).toBe(true);
      expect(isKnownWebmAudioName("audio_clip.webm")).toBe(true);
      expect(isKnownWebmAudioName("microphone_memo.webm")).toBe(true);
      expect(isKnownWebmAudioName("speech_test.webm")).toBe(true);
      expect(isKnownWebmAudioName("podcast_ep1.webm")).toBe(true);
      expect(isKnownWebmAudioName("voice-memo.weba")).toBe(true);
    });

    it("returns false for video names", () => {
      expect(isKnownWebmAudioName("screen_recording.webm")).toBe(false);
      expect(isKnownWebmAudioName("movie_trailer.webm")).toBe(false);
      expect(isKnownWebmAudioName("camera_capture.webm")).toBe(false);
    });
  });

  describe("isKnownWebmVideoName", () => {
    it("identifies screen recordings and video clips", () => {
      expect(isKnownWebmVideoName("screen_recording.webm")).toBe(true);
      expect(isKnownWebmVideoName("screencast_demo.webm")).toBe(true);
      expect(isKnownWebmVideoName("video_clip.webm")).toBe(true);
      expect(isKnownWebmVideoName("gameplay_stream.webm")).toBe(true);
      expect(isKnownWebmVideoName("film_trailer.webm")).toBe(true);
      expect(isKnownWebmVideoName("camera_test.webm")).toBe(true);
    });

    it("returns false for audio names", () => {
      expect(isKnownWebmVideoName("Voice Note - 2026-09-11 20_49.webm")).toBe(false);
      expect(isKnownWebmVideoName("audio_track.webm")).toBe(false);
    });
  });

  describe("isAudioMedia and isVideoMedia", () => {
    it("correctly classifies standard audio extensions", () => {
      expect(isAudioMedia("song.mp3")).toBe(true);
      expect(isVideoMedia("song.mp3")).toBe(false);

      expect(isAudioMedia("sound.wav")).toBe(true);
      expect(isVideoMedia("sound.wav")).toBe(false);

      expect(isAudioMedia("music.flac")).toBe(true);
      expect(isVideoMedia("music.flac")).toBe(false);

      expect(isAudioMedia("clip.m4a")).toBe(true);
      expect(isVideoMedia("clip.m4a")).toBe(false);
    });

    it("correctly classifies standard video extensions", () => {
      expect(isVideoMedia("movie.mp4")).toBe(true);
      expect(isAudioMedia("movie.mp4")).toBe(false);

      expect(isVideoMedia("record.mov")).toBe(true);
      expect(isAudioMedia("record.mov")).toBe(false);

      expect(isVideoMedia("clip.mkv")).toBe(true);
      expect(isAudioMedia("clip.mkv")).toBe(false);
    });

    it("correctly classifies WebM voice notes as audio", () => {
      expect(isAudioMedia("attachments/Voice Note - 2026-09-11 20_49.webm")).toBe(true);
      expect(isVideoMedia("attachments/Voice Note - 2026-09-11 20_49.webm")).toBe(false);

      expect(isAudioMedia("audio_memo.webm")).toBe(true);
      expect(isVideoMedia("audio_memo.webm")).toBe(false);
    });

    it("correctly classifies WebM screen recordings as video", () => {
      expect(isVideoMedia("attachments/screen_recording_1.webm")).toBe(true);
      expect(isAudioMedia("attachments/screen_recording_1.webm")).toBe(false);

      expect(isVideoMedia("screencast.webm")).toBe(true);
      expect(isAudioMedia("screencast.webm")).toBe(false);
    });

    it("respects explicit width parameter in wikilinks as video", () => {
      expect(isVideoMedia("attachments/sample.webm|600")).toBe(true);
      expect(isAudioMedia("attachments/sample.webm|600")).toBe(false);
    });

    it("respects webmMediaKindCache when runtime probe has executed", () => {
      webmMediaKindCache.set("ambiguous.webm", "video");
      expect(isVideoMedia("ambiguous.webm")).toBe(true);
      expect(isAudioMedia("ambiguous.webm")).toBe(false);

      webmMediaKindCache.set("ambiguous.webm", "audio");
      expect(isAudioMedia("ambiguous.webm")).toBe(true);
      expect(isVideoMedia("ambiguous.webm")).toBe(false);
    });

    it("respects note metadata (fileType, mimeType, data URL)", () => {
      expect(isAudioMedia("sample.webm", { fileType: "audio" })).toBe(true);
      expect(isVideoMedia("sample.webm", { fileType: "audio" })).toBe(false);

      expect(isVideoMedia("sample.webm", { fileType: "video" })).toBe(true);
      expect(isAudioMedia("sample.webm", { fileType: "video" })).toBe(false);

      expect(isAudioMedia("sample.webm", { mimeType: "audio/webm" })).toBe(true);
      expect(isVideoMedia("sample.webm", { mimeType: "audio/webm" })).toBe(false);

      expect(isAudioMedia("sample.webm", { content: "data:audio/webm;base64,GkXf..." })).toBe(true);
      expect(isVideoMedia("sample.webm", { content: "data:audio/webm;base64,GkXf..." })).toBe(false);
    });
  });
});
