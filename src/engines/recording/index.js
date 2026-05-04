/**
 * Wave AI — Recording Engine Index
 * Unified entry point for all recording capabilities.
 */

export { AudioRecorder, audioRecorder } from "./audioRecorder.js";
export { VideoRecorder, videoRecorder, VIDEO_QUALITIES } from "./videoRecorder.js";
export { RealTimeTranscriber, realTimeTranscriber, transcribeWithWhisper, detectLanguageFromText } from "./transcriber.js";
export { WaveformVisualizer, createMiniWaveform } from "./waveformVisualizer.js";
export { RecordingStorageManager, recordingStorage } from "./storageManager.js";
export { NoiseReducer, noiseReducer, createNoiseGate, calculateSNR } from "./noiseReducer.js";
export { ChunkProcessor, StreamingBuffer, chunkProcessor, mergeAudioChunks, calculateChunkStats } from "./chunkProcessor.js";
export { RecordingTimer, recordingTimer, formatDuration, estimateFileSizeKB } from "./recordingTimer.js";
export { ExportManager, exportManager, EXPORT_FORMATS } from "./exportManager.js";
export { PermissionManager, permissionManager, enumerateDevices } from "./permissionManager.js";
export { RecordingScheduler, RecordingCountdown, recordingScheduler } from "./recordingScheduler.js";
export { AudioAnalyzer, detectSilenceGaps, estimateSpeechSegments } from "./audioAnalyzer.js";
export { RecordingCore, recordingCore, getSupportedMimeType, RECORDING_FORMATS } from "./core.js";

export async function quickRecord(durationMs = 10000) {
  const { audioRecorder } = await import("./audioRecorder.js");
  return new Promise(async (resolve, reject) => {
    const result = await audioRecorder.startAudio();
    if (!result.success) { reject(new Error(result.error)); return; }
    audioRecorder.on("stop", ({ blob, duration }) => resolve({ blob, duration }));
    setTimeout(() => audioRecorder.stop(), durationMs);
  });
}

export async function recordAndTranscribe(durationMs = 10000, apiKey = null) {
  const { audioRecorder } = await import("./audioRecorder.js");
  const { transcribeWithWhisper } = await import("./transcriber.js");
  const { blob, duration } = await quickRecord(durationMs);
  const transcription = apiKey
    ? await transcribeWithWhisper(blob, apiKey)
    : { success: false, text: "", error: "No API key" };
  return { blob, duration, transcription };
}
