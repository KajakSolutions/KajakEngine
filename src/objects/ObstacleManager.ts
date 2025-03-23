import {Vec2D} from "../types/math";
import Scene from "../Scene";
import Overlap from "./Overlap";
import BananaPeel from "./BananaPeel";
import CarObject from "./CarObject";
import SpriteManager from "./SpriteManager";
import {vec2D} from "../utils/math";
import {soundManager} from "../SoundManager";

export interface ObstacleConfig {
    maxActiveObstacles?: number;
    bananaPeelLifespan?: number;
}

export class ObstacleManager {
    private scene: Scene;
    private obstacles: BananaPeel[] = [];
    private readonly maxActiveObstacles: number;
    private readonly bananaPeelLifespan: number;
    private itemSoundLoaded: boolean = false;

    constructor(scene: Scene, config: ObstacleConfig = {}) {
        this.scene = scene;
        this.maxActiveObstacles = config.maxActiveObstacles || 10;
        this.bananaPeelLifespan = config.bananaPeelLifespan || 20000;

        this.loadSounds();
    }

    private async loadSounds(): Promise<void> {
        if (this.itemSoundLoaded) return;

        try {
            await soundManager.loadSound('banana_drop', '/sounds/banana_drop.mp3', {
                category: 'sfx'
            });

            await soundManager.loadSound('banana_slip', '/sounds/banana_slip.mp3', {
                category: 'sfx',
                volume: 0.7
            });

            this.itemSoundLoaded = true;
        } catch (error) {
            console.error("Nie udało się załadować dźwięków przeszkód:", error);
        }
    }

    createObstacle(type: 'bananaPeel', position: Vec2D, ownerCarId: number): BananaPeel | null {
        if (this.getActiveObstaclesCount() >= this.maxActiveObstacles) {
            this.removeOldestObstacle();
        }

        if (type === 'bananaPeel') {
            const spriteManager = new SpriteManager({
                imageSrc: "game/banana.png",
                cellSize: vec2D(32, 32),
                count: 4,
                columns: 4
            });

            const bananaPeel = new BananaPeel({
                position,
                size: vec2D(1.5, 1.5),
                spriteManager,
                lifespan: this.bananaPeelLifespan,
                ownerCarId,
                mass: 1
            });

            bananaPeel.id = this.scene.addObject(bananaPeel);
            this.obstacles.push(bananaPeel);

            this.setupObstacleCollisions(bananaPeel);

            if (this.itemSoundLoaded) {
                soundManager.play('banana_drop');
            }

            return bananaPeel;
        }

        return null;
    }

    private setupObstacleCollisions(obstacle: BananaPeel): void {
        const cars = Array.from(this.scene.gameObjects.values())
            .filter(obj => obj instanceof CarObject) as CarObject[];

        for (const car of cars) {
            const overlap = new Overlap(
                car,
                obstacle,
                (vehicle, obs) => {
                    if (obs instanceof BananaPeel && obs.active && vehicle instanceof CarObject) {
                        if (vehicle.id != obs.ownerCarId) {
                            obs.applySlipEffect(vehicle);

                            if (this.itemSoundLoaded) {
                                soundManager.play('banana_slip');
                            }

                            console.log(`Car ${vehicle.playerId} slipped on a banana peel!`);
                        }
                    }
                }
            );

            this.scene.overlapManager.addOverlap(overlap);
        }
    }

    getActiveObstaclesCount(): number {
        return this.obstacles.filter(obs => obs.active).length;
    }

    private removeOldestObstacle(): void {
        const activeObstacles = this.obstacles.filter(obs => obs.active);
        if (activeObstacles.length > 0) {
            const oldest = activeObstacles[0];
            oldest.deactivate();

            if (oldest.id) {
                this.scene.removeObject(oldest.id);
                this.obstacles = this.obstacles.filter(obs => obs.id !== oldest.id);
            }
        }
    }

    removeAllObstacles(): void {
        for (const obstacle of this.obstacles) {
            if (obstacle.id) {
                this.scene.removeObject(obstacle.id);
            }
        }
        this.obstacles = [];
    }

    update(): void {
        const inactiveObstacles = this.obstacles.filter(obs => !obs.active);
        for (const obstacle of inactiveObstacles) {
            if (obstacle.id) {
                this.scene.removeObject(obstacle.id);
                this.obstacles = this.obstacles.filter(obs => obs.id !== obstacle.id);
            }
        }
    }
}
