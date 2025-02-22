import {CarObject,  length} from "../../index.ts";
import {soundManager} from "../../SoundManager.ts";

// @ts-ignore
import skidSound from '../../assets/sounds/skid.mp3';
// @ts-ignore
import collisionSound from '../../assets/sounds/collision.mp3';
import {EngineSoundGenerator} from "./EngineSoundGenerator.ts";


export class CarSoundSystem {
    private readonly car: CarObject;
    private readonly engineSound: EngineSoundGenerator;
    private readonly skidSoundId: string;
    private readonly collisionSoundId: string;
    private lastSpeed: number = 0;

    constructor(car: CarObject) {
        this.car = car;
        this.engineSound = new EngineSoundGenerator();
        this.skidSoundId = `skid_${car.id}`;
        this.collisionSoundId = `collision_${car.id}`;
    }

    async initialize(): Promise<void> {
        await this.engineSound.initialize();

        await soundManager.loadSound(this.collisionSoundId, collisionSound, {
            category: 'sfx'
        });
    }

    update(): void {
        const currentSpeed = length(this.car.velocity);
        const maxSpeed = 183.91;

        const normalizedSpeed = Math.min(currentSpeed / maxSpeed, 1);

        const acceleration = (currentSpeed - this.lastSpeed) / maxSpeed;

        this.engineSound.updateEngine(normalizedSpeed, acceleration);


        const speedDelta = Math.abs(currentSpeed - this.lastSpeed);
        if (speedDelta > 1) {
            console.log('speedDelta', speedDelta);
            soundManager.play(this.collisionSoundId);
        }

        this.lastSpeed = currentSpeed;
    }

    dispose(): void {
        this.engineSound.dispose();
        soundManager.stop(this.skidSoundId);
    }
}
