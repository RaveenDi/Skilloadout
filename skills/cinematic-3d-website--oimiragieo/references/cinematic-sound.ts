/**
 * cinematic-sound.ts — opt-in ambient audio for the 3D cinematic.
 *
 * Fully synthesized (WebAudio brown noise through a lowpass), so there is no
 * audio asset to license or download. Design goals:
 *   - OPT-IN only: nothing is constructed until the user hits the toggle, and
 *     the AudioContext is created inside that gesture (autoplay-policy safe).
 *   - Subtle: a deep server-room rumble whose brightness/level follows the
 *     journey, never foreground music.
 *   - Cheap: one noise buffer, one filter, one gain — no per-frame allocation.
 */

type CinematicSound = {
  /** Toggle on/off. Returns the new enabled state. Call from a user gesture. */
  toggle: () => boolean;
  /** Feed journey progress p in [0,1]; shapes filter brightness + level. */
  setProgress: (p: number) => void;
  enabled: () => boolean;
  dispose: () => void;
};

export function createCinematicSound(): CinematicSound {
  let ctx: AudioContext | null = null;
  let gain: GainNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let source: AudioBufferSourceNode | null = null;
  let on = false;

  const build = () => {
    const Ctor = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      return false;
    }
    ctx = new Ctor();

    // 4s brown-noise loop: integrate white noise, leak to keep it bounded.
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;

    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    filter.Q.value = 0.7;

    gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    return true;
  };

  return {
    toggle() {
      if (!on) {
        if (!ctx && !build()) {
          return false;
        }
        void ctx!.resume();
        gain!.gain.cancelScheduledValues(ctx!.currentTime);
        gain!.gain.setTargetAtTime(0.055, ctx!.currentTime, 0.8);
        on = true;
      } else {
        if (ctx && gain) {
          gain.gain.cancelScheduledValues(ctx.currentTime);
          gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
        }
        on = false;
      }
      return on;
    },
    setProgress(p: number) {
      if (!on || !ctx || !filter || !gain) {
        return;
      }
      const x = Math.min(1, Math.max(0, p));
      // Brighten through the transit legs, settle darker at the payoff.
      const arc = Math.sin(Math.PI * x);
      filter.frequency.setTargetAtTime(180 + arc * 240, ctx.currentTime, 0.25);
      gain.gain.setTargetAtTime(0.045 + arc * 0.02, ctx.currentTime, 0.4);
    },
    enabled() {
      return on;
    },
    dispose() {
      try {
        source?.stop();
      } catch { /* already stopped */ }
      source?.disconnect();
      filter?.disconnect();
      gain?.disconnect();
      void ctx?.close();
      ctx = null;
      source = null;
      filter = null;
      gain = null;
      on = false;
    },
  };
}
