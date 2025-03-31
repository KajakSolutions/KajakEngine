import {soundManager} from "../../SoundManager.ts";

export class EngineSoundGenerator {
    private audioContext!: AudioContext;
    private masterGain!: GainNode;
    private engineOsc!: OscillatorNode;
    private engineLFO!: OscillatorNode;
    private modulationGain!: GainNode;
    private initialized: boolean = false;
    private analyser!: AnalyserNode;
    private animationFrameId: number | null = null;
    private readonly carId: string;
    private baseVolume: number = 1.0;

    constructor(carId: string = 'default') {
        this.carId = carId;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext)();

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.masterGain = this.audioContext.createGain();
            this.engineOsc = this.audioContext.createOscillator();
            this.engineLFO = this.audioContext.createOscillator();
            this.modulationGain = this.audioContext.createGain();

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            this.engineOsc.frequency.setValueAtTime(200, 0);
            this.engineOsc.connect(this.masterGain);

            this.engineLFO.type = 'square';
            this.engineLFO.frequency.setValueAtTime(30, 0);
            this.modulationGain.gain.value = 20;
            this.engineLFO.connect(this.modulationGain);
            this.modulationGain.connect(this.engineOsc.frequency);

            this.masterGain.gain.value = 0;
            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.engineOsc.start();
            this.engineLFO.start();

            await soundManager.loadSound(`engine_${this.carId}`, '', {
                category: 'sfx',
                volume: 0.8,
                virtualSound: true
            });

            this.initialized = true;
            this.updateVolumeFromSoundManager();

            this.audioContext.onstatechange = async () => {
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
            };
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    private updateVolumeFromSoundManager(): void {
        if (!this.initialized) return;

        const soundId = `engine_${this.carId}`;
        const sound = soundManager.getSound(soundId);

        if (sound) {
            if (soundManager.muted) {
                this.masterGain.gain.value = 0;
                return;
            }

            const categoryVolume = soundManager.getCategoryVolume(sound.category) || 1.0;

            this.masterGain.gain.value = soundManager.getMasterVolume() * categoryVolume * (sound.volume || 1.0) * this.baseVolume;
        }
    }

    async resume(): Promise<void> {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            this.updateVolumeFromSoundManager();
        }
    }

    updateEngine(speed: number, acceleration: number): void {
        if (!this.initialized || this.audioContext.state === 'suspended') return;

        const baseFreq = 150 + (speed * 250);
        const accelBonus = Math.max(0, acceleration) * 100;
        this.engineOsc.frequency.setValueAtTime(baseFreq + accelBonus, 0);

        this.modulationGain.gain.value = 30 - (speed * 10);

        this.baseVolume = Math.min(1.3, 0.1 + (speed * 0.8) + Math.max(0, acceleration) * 0.4);

        this.updateVolumeFromSoundManager();
    }

    dispose(): void {
        if (!this.initialized) return;

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }

        this.engineOsc.stop();
        this.engineLFO.stop();
        this.masterGain.disconnect();
        if (this.audioContext) {
            this.audioContext.close();
        }

        soundManager.removeSound(`engine_${this.carId}`);

        this.initialized = false;
    }
}
