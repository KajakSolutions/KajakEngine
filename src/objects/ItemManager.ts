import {Vec2D} from "../types/math";
import Scene from "../Scene";
import Overlap from "./Overlap";
import ItemPickup, {ItemType} from "./ItemPickup";
import CarObject from "./CarObject";
import SpriteManager from "./SpriteManager";
import {vec2D} from "../utils/math";
import CheckpointObject from "./CheckpointObject";

export interface ItemSpawnPoint {
    position: Vec2D;
    respawnTime?: number;
    itemTypes: ItemType[];
    spawnChance: number;
}

export interface ItemManagerConfig {
    maxItems?: number;
    itemRespawnTime?: number;
    spawnInterval?: number;
    spawnPoints?: ItemSpawnPoint[];
}

export class ItemManager {
    private scene: Scene;
    private items: ItemPickup[] = [];
    private readonly maxItems: number;
    private readonly itemRespawnTime: number;
    private readonly spawnInterval: number;
    private spawnPoints: ItemSpawnPoint[] = [];
    private spawnTimer: number | null = null;

    constructor(scene: Scene, config: ItemManagerConfig = {}) {
        this.scene = scene;
        this.maxItems = config.maxItems || 5;
        this.itemRespawnTime = config.itemRespawnTime || 15000;
        this.spawnInterval = config.spawnInterval || 10000;

        if (config.spawnPoints && config.spawnPoints.length > 0) {
            this.spawnPoints = config.spawnPoints;
        }
    }

    startItemSpawning(): void {
        if (this.spawnTimer !== null) return;

        for (let i = 0; i < Math.min(3, this.maxItems); i++) {
            this.spawnRandomItem();
        }

        this.spawnTimer = window.setInterval(() => {
            this.spawnRandomItem();
        }, this.spawnInterval);
    }

    stopItemSpawning(): void {
        if (this.spawnTimer !== null) {
            clearInterval(this.spawnTimer);
            this.spawnTimer = null;
        }
    }

    spawnRandomItem(): boolean {
        if (this.getActiveItemsCount() >= this.maxItems) {
            return false;
        }

        const spawnPoint = this.getRandomSpawnPoint();
        if (!spawnPoint) return false;

        const itemType = this.getRandomItemType(spawnPoint);
        if (!itemType) return false;

        const item = this.createItem(itemType, spawnPoint.position);
        return item !== null;
    }

    private getRandomSpawnPoint(): ItemSpawnPoint | null {
        if (this.spawnPoints.length === 0) {
            return this.generateSpawnPointFromCheckpoints();
        }

        const availablePoints = this.spawnPoints.filter(point =>
            Math.random() <= point.spawnChance);

        if (availablePoints.length === 0) return null;

        return availablePoints[Math.floor(Math.random() * availablePoints.length)];
    }

    private generateSpawnPointFromCheckpoints(): ItemSpawnPoint | null {
        const checkpoints = Array.from(this.scene.gameObjects.values())
            .filter(obj => obj instanceof CheckpointObject) as CheckpointObject[];

        if (checkpoints.length === 0) return null;

        const checkpoint = checkpoints[Math.floor(Math.random() * checkpoints.length)];

        const offsetX = (Math.random() - 0.5) * 6;
        const offsetY = (Math.random() - 0.5) * 6;

        return {
            position: {
                x: checkpoint.position.x + offsetX,
                y: checkpoint.position.y + offsetY
            },
            itemTypes: ['bananaPeel'],
            spawnChance: 1.0
        };
    }

    private getRandomItemType(spawnPoint: ItemSpawnPoint): ItemType | null {
        if (!spawnPoint.itemTypes || spawnPoint.itemTypes.length === 0) {
            return 'bananaPeel';
        }

        return spawnPoint.itemTypes[Math.floor(Math.random() * spawnPoint.itemTypes.length)];
    }

    createItem(type: ItemType, position: Vec2D): ItemPickup | null {
        let spriteManager: SpriteManager;

        if (type === 'bananaPeel') {
            spriteManager = new SpriteManager({
                imageSrc: "game/luckybox.png",
                cellSize: vec2D(32, 32),
                count: 8,
                columns: 4
            });
        } else {
            return null;
        }

        const item = new ItemPickup({
            position,
            size: vec2D(2, 2),
            spriteManager,
            itemType: type,
            respawnTime: this.itemRespawnTime,
            mass: 0
        });

        item.id = this.scene.addObject(item);
        this.items.push(item);

        this.setupItemCollisions(item);

        return item;
    }

    private setupItemCollisions(item: ItemPickup): void {
        const cars = Array.from(this.scene.gameObjects.values())
            .filter(obj => obj instanceof CarObject) as CarObject[];

        for (const car of cars) {
            const overlap = new Overlap(
                car,
                item,
                (vehicle, pickup) => {
                    if (pickup instanceof ItemPickup && pickup.active && vehicle instanceof CarObject) {
                        pickup.onPickup(vehicle);
                    }
                }
            );

            this.scene.overlapManager.addOverlap(overlap);
        }
    }

    getActiveItemsCount(): number {
        return this.items.filter(item => item.active).length;
    }

    removeAllItems(): void {
        for (const item of this.items) {
            if (item.id) {
                this.scene.removeObject(item.id);
            }
        }
        this.items = [];
    }

    update(): void {
        const inactiveItems = this.items.filter(item => !item.active &&
            performance.now() - item.respawnTimer > item.respawnTime * 1.5);

        for (const item of inactiveItems) {
            if (item.id) {
                this.scene.removeObject(item.id);
                this.items = this.items.filter(i => i.id !== item.id);
            }
        }
    }
}
