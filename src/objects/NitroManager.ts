import NitroBonus from "./NitroBonus";
import CarObject from "./CarObject";
import Scene from "../Scene";
import Overlap from "./Overlap";
import { Vec2D } from "../types/math";
import SpriteManager from "./SpriteManager";
import { vec2D } from "../utils/math";

export interface NitroSpawnConfig {
    position: Vec2D;
    respawnTime?: number;
    size?: Vec2D;
    spriteSrc?: string;
}

export class NitroManager {
    private scene: Scene;
    private nitroBonuses: NitroBonus[] = [];
    private spawnPoints: NitroSpawnConfig[] = [];
    private readonly defaultRespawnTime: number;

    constructor(scene: Scene, options: {
        defaultRespawnTime?: number;
    } = {}) {
        this.scene = scene;
        this.defaultRespawnTime = options.defaultRespawnTime || 30000;
    }

    initialize(spawnPoints: NitroSpawnConfig[]): void {
        this.spawnPoints = spawnPoints;

        for (const spawnPoint of this.spawnPoints) {
            this.createNitroBonus(spawnPoint);
        }
    }

    private createNitroBonus(spawnConfig: NitroSpawnConfig): void {
        const spriteManager = new SpriteManager({
            imageSrc: spawnConfig.spriteSrc || "game/nitro.png",
            cellSize: vec2D(32, 32),
            count: 8,
            columns: 4,
            offset: 0,
        });

        const nitroBonus = new NitroBonus({
            position: spawnConfig.position,
            size: spawnConfig.size || vec2D(2, 2),
            spriteManager: spriteManager,
            respawnTime: spawnConfig.respawnTime || this.defaultRespawnTime,
            mass: 0
        });

        this.scene.addObject(nitroBonus);
        this.nitroBonuses.push(nitroBonus);

        const cars = Array.from(this.scene.gameObjects.values())
            .filter(obj => obj instanceof CarObject) as CarObject[];

        for (const car of cars) {
            const overlap = new Overlap(
                car,
                nitroBonus,
                (vehicle, bonus) => {
                    if (bonus instanceof NitroBonus && bonus.active && vehicle instanceof CarObject) {
                        vehicle.refillNitro();
                        if(vehicle.playerId === 0) {
                            bonus.deactivate();
                        }
                    }
                }
            );
            this.scene.overlapManager.addOverlap(overlap);
        }
    }

    dispose(): void {
        for (const nitroBonus of this.nitroBonuses) {
            if (nitroBonus.id) {
                this.scene.removeObject(nitroBonus.id);
            }
        }
        this.nitroBonuses = [];
    }
}
