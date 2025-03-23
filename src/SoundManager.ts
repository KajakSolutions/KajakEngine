export interface Sound {
    id: string;
    audio: HTMLAudioElement;
    loop?: boolean;
    volume?: number;
    category: string;
    virtualSound?: boolean;
}

export class SoundManager {
    private sounds: Map<string, Sound> = new Map();
    private categoryVolumes: Map<string, number> = new Map();
    private masterVolume: number = 1.0;
    private _muted: boolean = false;
    private _initialized: boolean = false;
    private pendingAutoplay: Set<string> = new Set();
    private volumeChangeListeners: Set<() => void> = new Set();

    initialize(): void {
        this._initialized = true;

        for (const soundId of this.pendingAutoplay) {
            const sound = this.sounds.get(soundId);
            if (sound && !this._muted && !sound.virtualSound) {
                const categoryVolume = this.categoryVolumes.get(sound.category) || 1.0;
                sound.audio.volume = this.masterVolume * categoryVolume * (sound.volume || 1.0);
                sound.audio.play().catch(console.error);
            }
        }
        this.pendingAutoplay.clear();

        this.notifyVolumeChangeListeners();
    }

    addVolumeChangeListener(callback: () => void): void {
        this.volumeChangeListeners.add(callback);
    }

    removeVolumeChangeListener(callback: () => void): void {
        this.volumeChangeListeners.delete(callback);
    }

    private notifyVolumeChangeListeners(): void {
        this.volumeChangeListeners.forEach(callback => callback());
    }

    async loadSound(id: string, url: string, options: Partial<Sound> = {}): Promise<void> {
        if (options.virtualSound) {
            const sound: Sound = {
                id,
                audio: new Audio(), // Dummy audio element
                loop: options.loop || false,
                volume: options.volume || 1.0,
                category: options.category || 'sfx',
                virtualSound: true
            };

            this.sounds.set(id, sound);
            return;
        }

        const audio = new Audio(url);

        const sound: Sound = {
            id,
            audio,
            loop: options.loop || false,
            volume: options.volume || 1.0,
            category: options.category || 'sfx'
        };

        audio.loop = sound.loop as boolean;

        const categoryVolume = this.categoryVolumes.get(sound.category) || 1.0;
        audio.volume = this.masterVolume * categoryVolume * (sound.volume || 1.0);

        audio.load();
        this.sounds.set(id, sound);

        if (sound.loop && this._initialized && !this._muted) {
            audio.play().catch(console.error);
        } else if (sound.loop) {
            this.pendingAutoplay.add(id);
        }
    }

    play(id: string): void {
        const sound = this.sounds.get(id);
        if (!sound) return;

        // Skip actual playback for virtual sounds
        if (sound.virtualSound) return;

        if (!this._initialized) {
            if (sound.loop) {
                this.pendingAutoplay.add(id);
            }
            return;
        }

        if (!this._muted) {
            sound.audio.currentTime = 0;

            const categoryVolume = this.categoryVolumes.get(sound.category) || 1.0;
            sound.audio.volume = this.masterVolume * categoryVolume * (sound.volume || 1.0);

            sound.audio.play().catch(error => {
                console.warn(`Cannot play sound ${id}:`, error);
            });
        }
    }

    stop(id: string): void {
        const sound = this.sounds.get(id);
        if (!sound) return;

        if (sound.virtualSound) return;

        sound.audio.pause();
        sound.audio.currentTime = 0;
        this.pendingAutoplay.delete(id);
    }

    setCategoryVolume(category: string, volume: number): void {
        this.categoryVolumes.set(category, Math.max(0, Math.min(1, volume)));

        this.sounds.forEach(sound => {
            if (sound.category === category && !sound.virtualSound) {
                const categoryVolume = this.categoryVolumes.get(category) || 1.0;
                sound.audio.volume = this.masterVolume * categoryVolume * (sound.volume || 1.0);
            }
        });

        this.notifyVolumeChangeListeners();
    }

    setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));

        this.sounds.forEach(sound => {
            if (!sound.virtualSound) {
                const categoryVolume = this.categoryVolumes.get(sound.category) || 1.0;
                sound.audio.volume = this.masterVolume * categoryVolume * (sound.volume || 1.0);
            }
        });

        this.notifyVolumeChangeListeners();
    }

    mute(): void {
        this._muted = true;
        this.sounds.forEach(sound => {
            if (!sound.virtualSound) {
                sound.audio.pause();
            }
        });

        this.notifyVolumeChangeListeners();
    }

    unmute(): void {
        this._muted = false;

        this.sounds.forEach(sound => {
            if (sound.loop && !sound.virtualSound) {
                sound.audio.play().catch(console.error);
            }
        });

        this.notifyVolumeChangeListeners();
    }

    getSound(id: string): Sound | undefined {
        return this.sounds.get(id);
    }

    getCategoryVolume(category: string): number {
        return this.categoryVolumes.get(category) || 1.0;
    }

    getMasterVolume(): number {
        return this.masterVolume;
    }

    removeSound(id: string): void {
        const sound = this.sounds.get(id);
        if (sound) {
            if (!sound.virtualSound) {
                sound.audio.pause();
                sound.audio.src = '';
            }
            this.sounds.delete(id);
            this.pendingAutoplay.delete(id);
        }
    }

    get muted(): boolean {
        return this._muted;
    }

    dispose(): void {
        this.sounds.forEach(sound => {
            if (!sound.virtualSound) {
                sound.audio.pause();
                sound.audio.src = '';
            }
        });
        this.sounds.clear();
        this.categoryVolumes.clear();
        this.volumeChangeListeners.clear();
    }
}

export const soundManager = new SoundManager();