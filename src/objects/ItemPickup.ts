import PhysicObject, { PhysicObjectOptions } from "./PhysicObject";
import { Vec2D } from "../types/math";
import { vec2D } from "../utils/math";
import { AABBCollider } from "./Colliders/AABBCollider";
import SpriteManager from "./SpriteManager";
import CarObject from "./CarObject";
import {soundManager} from "../SoundManager";

export type ItemType = 'bananaPeel';

export interface ItemPickupOptions extends Omit<PhysicObjectOptions, "collider"> {
    itemType: ItemType;
    respawnTime?: number;
}

export default class ItemPickup extends PhysicObject {
    private _active: boolean = true;
    private _respawnTime: number;
    private _respawnTimer: number = 0;
    private readonly _itemType: ItemType;
    private _animationFrame: number = 0;
    private _animationTimer: number = 0;
    private readonly ANIMATION_FRAME_DURATION: number = 150;
    private readonly FLOATING_AMPLITUDE: number = 0.3;
    private readonly ROTATION_SPEED: number = 1.0;
    private _originalY: number;
    private _floatingOffset: number = 0;
    private _soundLoaded: boolean = false;

    constructor(options: ItemPickupOptions) {
        const collider = new AABBCollider(
            vec2D(-1, -1),
            options.size || vec2D(2, 2)
        );

        let spriteManager: SpriteManager;

        if (options.itemType === 'bananaPeel') {
            spriteManager = options.spriteManager || new SpriteManager({
                imageSrc: "game/car3.png",
                cellSize: vec2D(32, 32),
                count: 8,
                columns: 4
            });
        } else {
            spriteManager = options.spriteManager || new SpriteManager({
                imageSrc: "game/car4.png",
                cellSize: vec2D(32, 32),
                count: 8,
                columns: 4
            });
        }

        super({
            ...options,
            collider,
            movable: false,
            spriteManager,
            mass: 0
        });

        this._itemType = options.itemType;
        this._respawnTime = options.respawnTime || 15000;
        this._originalY = options.position.y;

        this.loadSounds();
    }

    private async loadSounds(): Promise<void> {
        if (this._soundLoaded) return;

        try {
            await soundManager.loadSound('item_pickup', '/sounds/item_pickup.mp3', {
                category: 'sfx',
                volume: 0.5
            });

            this._soundLoaded = true;
        } catch (error) {
            console.error("Nie udało się załadować dźwięku przedmiotu:", error);
        }
    }

    get active(): boolean {
        return this._active;
    }

    get itemType(): ItemType {
        return this._itemType;
    }

    deactivate(): void {
        this._active = false;
        this.spriteManager!.hidden = true;
        this._respawnTimer = performance.now();
    }

    update(deltaTime: number): void {
        super.update(deltaTime);

        if (!this._active && performance.now() - this._respawnTimer > this._respawnTime) {
            this._active = true;
            this.spriteManager!.hidden = false;
        }

        if (this._active) {
            this._animationTimer += deltaTime * 1000;
            if (this._animationTimer >= this.ANIMATION_FRAME_DURATION) {
                this._animationFrame = (this._animationFrame + 1) % this.spriteManager!.count;
                this._animationTimer = 0;
            }

            this._floatingOffset = Math.sin(performance.now() / 700) * this.FLOATING_AMPLITUDE;
            this.position.y = this._originalY + this._floatingOffset;

            this.rotation += this.ROTATION_SPEED * deltaTime;
        }
    }

    onPickup(car: CarObject): void {
        if (!this._active) return;

        let itemCollected = false;

        if (this._itemType === 'bananaPeel') {
            itemCollected = car.collectBananaPeel();
        }

        if (itemCollected) {
            if (this._soundLoaded) {
                soundManager.play('item_pickup');
            }

            this.deactivate();
        }
    }

    reposition(newPosition: Vec2D): void {
        this.position = newPosition;
        this._originalY = newPosition.y;
    }

    get respawnTime(): number {
        return this._respawnTime;
    }

    get respawnTimer(): number {
        return this._respawnTimer;
    }

    override get aiDetectable(): boolean {
        return false;
    }
}
