import { CarObject, length } from "../../index.ts";
import { soundManager } from "../../SoundManager.ts";
import { EngineSoundGenerator } from "./EngineSoundGenerator.ts";

export class CarSoundSystem {
    private readonly car: CarObject;
    private readonly engineSound: EngineSoundGenerator;
    // private readonly collisionSoundId: string;
    private readonly nitroSoundId: string;
    private lastSpeed: number = 0;
    private volumeChangeListener: () => void;

    constructor(car: CarObject) {
        this.car = car;
        this.engineSound = new EngineSoundGenerator();
        this.nitroSoundId = `nitro_${car.id}`;

        this.volumeChangeListener = this.onVolumeChange.bind(this);
    }

    async initialize(): Promise<void> {
        soundManager.addVolumeChangeListener(this.volumeChangeListener);

        await this.engineSound.initialize();

        // await soundManager.loadSound(this.collisionSoundId, '/sounds/collision.mp3', {
        //     category: 'sfx'
        // });

        await soundManager.loadSound(this.nitroSoundId, '/sounds/nitro.mp3', {
            category: 'sfx',
            volume: 0.7
        });
    }

    private onVolumeChange(): void {
        if (soundManager.muted) {
            this.engineSound.updateEngine(0, 0);
        } else {
            const currentSpeed = length(this.car.velocity);
            const maxSpeed = 183.91;
            const normalizedSpeed = Math.min(currentSpeed / maxSpeed, 1);
            const acceleration = (currentSpeed - this.lastSpeed) / maxSpeed;
            this.engineSound.updateEngine(normalizedSpeed, acceleration);
        }
    }

    update(): void {
        const currentSpeed = length(this.car.velocity);
        const maxSpeed = 183.91;

        const normalizedSpeed = Math.min(currentSpeed / maxSpeed, 1);
        const acceleration = (currentSpeed - this.lastSpeed) / maxSpeed;

        this.engineSound.updateEngine(normalizedSpeed, acceleration);

        // const speedDelta = Math.abs(currentSpeed - this.lastSpeed);
        // if (speedDelta > 1) {
        //     soundManager.play(this.collisionSoundId);
        // }

        this.lastSpeed = currentSpeed;
    }

    playNitroSound(): void {
        soundManager.play(this.nitroSoundId);
    }

    dispose(): void {
        soundManager.removeVolumeChangeListener(this.volumeChangeListener);

        this.engineSound.dispose();

        soundManager.stop(this.nitroSoundId);
    }
}
