export interface Sound {
    id: string;
    audio: HTMLAudioElement;
    loop?: boolean;
    volume?: number;
    category: string;
}

export class SoundManager {
    private sounds: Map<string, Sound> = new Map();
    private categoryVolumes: Map<string, number> = new Map();
    private masterVolume: number = 1.0;
    private _muted: boolean = false;
    private _initialized: boolean = false;
    private pendingAutoplay: Set<string> = new Set();

    initialize(): void {
        this._initialized = true;

        for (const soundId of this.pendingAutoplay) {
            const sound = this.sounds.get(soundId);
            if (sound && !this._muted) {
                const categoryVolume = this.categoryVolumes.get(sound.category!) || 1.0;
                sound.audio.volume = this.masterVolume * categoryVolume * (sound.volume || 1.0);
                sound.audio.play().catch(console.error);
            }
        }
        this.pendingAutoplay.clear();
    }

    async loadSound(id: string, url: string, options: Partial<Sound> = {}): Promise<void> {
        const audio = new Audio(url);

        const sound: Sound = {
            id,
            audio,
            loop: options.loop || false,
            volume: options.volume || 1.0,
            category: options.category || 'sfx'
        };

        audio.loop = <boolean>sound.loop;

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

        if (!this._initialized) {
            if (sound.loop) {
                this.pendingAutoplay.add(id);
            }
            return;
        }

        if (!this._muted) {
            sound.audio.currentTime = 0;

            const categoryVolume = this.categoryVolumes.get(sound.category!) || 1.0;
            sound.audio.volume = this.masterVolume * categoryVolume * (sound.volume || 1.0);

            sound.audio.play().catch(error => {
                console.warn(`Nie można odtworzyć dźwięku ${id}:`, error);
            });
        }
    }

    stop(id: string): void {
        const sound = this.sounds.get(id);
        if (!sound) return;

        sound.audio.pause();
        sound.audio.currentTime = 0;
        this.pendingAutoplay.delete(id);
    }

    setCategoryVolume(category: string, volume: number): void {
        this.categoryVolumes.set(category, Math.max(0, Math.min(1, volume)));

        this.sounds.forEach(sound => {
            if (sound.category === category) {
                const categoryVolume = this.categoryVolumes.get(category) || 1.0;
                sound.audio.volume = this.masterVolume * categoryVolume * (sound.volume || 1.0);
            }
        });
    }

    setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));

        this.sounds.forEach(sound => {
            const categoryVolume = this.categoryVolumes.get(sound.category!) || 1.0;
            sound.audio.volume = this.masterVolume * categoryVolume * (sound.volume || 1.0);
        });
    }

    mute(): void {
        this._muted = true;
        this.sounds.forEach(sound => {
            sound.audio.pause();
        });
    }

    unmute(): void {
        this._muted = false;

        this.sounds.forEach(sound => {
            if (sound.loop) {
                sound.audio.play().catch(console.error);
            }
        });
    }

    get muted(): boolean {
        return this._muted;
    }

    dispose(): void {
        this.sounds.forEach(sound => {
            sound.audio.pause();
            sound.audio.src = '';
        });
        this.sounds.clear();
        this.categoryVolumes.clear();
    }
}

export const soundManager = new SoundManager();
