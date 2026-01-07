
export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return resolve(new Blob());

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        resolve(audioBlob);
        this.stopStream();
      };

      this.mediaRecorder.stop();
    });
  }

  private stopStream() {
    if (this.mediaRecorder && this.mediaRecorder.stream) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  // Send audio to Python Local AI Server
  async sendToLocalAI(audioBlob: Blob): Promise<{ text: string; intent: string; replyAudio?: string }> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'command.wav');
    
    // Retrieve URL from settings
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const endpoint = user.settings?.aiLocalUrl || 'http://localhost:8000';

    console.log(`🎙️ Sending Voice Command to ${endpoint}/api/voice-command ...`);

    try {
      const response = await fetch(`${endpoint}/api/voice-command`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`AI Server Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to communicate with Local AI:', error);
      throw error; // Throw real error so UI shows "Connection Failed" instead of fake success
    }
  }
}

export const voiceService = new VoiceService();
