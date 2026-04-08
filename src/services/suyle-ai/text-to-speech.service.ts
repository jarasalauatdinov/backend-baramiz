import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import type { TextToSpeechProvider, TTSRequest, TTSResponse } from "../../types/suyle-ai.types";
import { isMockAiEnabled, requireSuyleAIClient, withTimeout } from "./provider-client";

function createWaveHeader(dataLength: number, sampleRate: number) {
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);

  return header;
}

function createMockAudioBuffer(durationMs = 900) {
  const sampleRate = 22050;
  const sampleCount = Math.floor(sampleRate * (durationMs / 1000));
  const pcmBuffer = Buffer.alloc(sampleCount * 2);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const amplitude = Math.sin(2 * Math.PI * 440 * time) * 0.18;
    const sample = Math.max(-1, Math.min(1, amplitude));
    pcmBuffer.writeInt16LE(Math.round(sample * 32767), index * 2);
  }

  return Buffer.concat([createWaveHeader(pcmBuffer.length, sampleRate), pcmBuffer]);
}

function resolveVoice() {
  return "alloy";
}

class MockTextToSpeechProvider implements TextToSpeechProvider {
  async synthesize(_request: TTSRequest): Promise<TTSResponse> {
    return {
      audioBuffer: createMockAudioBuffer(),
      fileName: "suyle-ai-mock.wav",
      mimeType: "audio/wav",
    };
  }
}

class OpenAiTextToSpeechProvider implements TextToSpeechProvider {
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    const client = requireSuyleAIClient("text-to-speech");

    const response = await withTimeout(
      client.audio.speech.create({
        input: request.text,
        model: env.SUYLE_AI_TTS_MODEL,
        voice: resolveVoice(),
      }),
      "Text-to-speech service timed out.",
    );

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    if (audioBuffer.length === 0) {
      throw new AppError(502, "Text-to-speech provider returned an empty audio stream.");
    }

    return {
      audioBuffer,
      fileName: "suyle-ai-tts.mp3",
      mimeType: "audio/mpeg",
    };
  }
}

function createTextToSpeechProvider() {
  return isMockAiEnabled() ? new MockTextToSpeechProvider() : new OpenAiTextToSpeechProvider();
}

export async function textToSpeech(request: TTSRequest) {
  return createTextToSpeechProvider().synthesize(request);
}
