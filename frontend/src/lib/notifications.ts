"use client";

class NotificationSystem {
  private audioContext: AudioContext | null = null;
  public initialized: boolean = false;

  public async initialize() {
    if (typeof window === 'undefined') return;

    // 1. Initialize Audio Context
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && !this.audioContext) {
        this.audioContext = new AudioContextClass();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.initialized = true;
    } catch (e) {
      console.error("Audio init failed", e);
    }

    // 2. Request Push Notification Permission
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        await Notification.requestPermission();
      }
    }
  }

  // Soft, pleasant double-ding for POS waitstaff
  public playPOSChime() {
    this.playTonalChime([
      { freq: 880, start: 0, duration: 0.15, vol: 0.3 }, // A5
      { freq: 1108.73, start: 0.2, duration: 0.4, vol: 0.3 }  // C#6
    ]);
  }

  // Louder, sharp bell for Kitchen
  public playKDSBell() {
    this.playTonalChime([
      { freq: 1046.50, start: 0, duration: 0.1, vol: 0.5 }, // C6
      { freq: 1318.51, start: 0.05, duration: 0.6, vol: 0.5 } // E6
    ]);
  }

  private async playTonalChime(notes: { freq: number, start: number, duration: number, vol: number }[]) {
    if (!this.audioContext) return;
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const now = this.audioContext.currentTime;

    notes.forEach(note => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, now + note.start);
      
      osc.connect(gain);
      gain.connect(this.audioContext!.destination);

      gain.gain.setValueAtTime(0, now + note.start);
      gain.gain.linearRampToValueAtTime(note.vol, now + note.start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.start + note.duration);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration);
    });
  }

  public sendPushNotification(title: string, body: string) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/globe.svg' // We use a generic icon available in Next.js public by default
      });
    }
  }
}

export const notifier = new NotificationSystem();
