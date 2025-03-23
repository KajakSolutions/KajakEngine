import PhysicObject, { PhysicObjectOptions } from "./PhysicObject";
import SpriteManager from "./SpriteManager";
import { vec2D } from "../utils/math";
import { AABBCollider } from "./Colliders/AABBCollider";
import {Vec2D} from "../types/math";

export interface NitroBonusOptions extends Omit<PhysicObjectOptions, "collider"> {
    respawnTime?: number;
}

export default class NitroBonus extends PhysicObject {
    private _active: boolean = true;
    private _respawnTime: number;
    private _respawnTimer: number = 0;

    constructor(options: NitroBonusOptions) {
        const collider = new AABBCollider(
            vec2D(0, 0),
            options.size || vec2D(2, 2)
        );

        super({
            ...options,
            collider,
            movable: false,
            spriteManager: options.spriteManager || new SpriteManager({
                imageSrc: "game/nitro.png",
                cellSize: vec2D(32, 32),
                count: 8,
                columns: 4,
                offset: 0,
            }),
            mass: 0
        });

        this._respawnTime = options.respawnTime || 30000;
    }

    get active(): boolean {
        return this._active;
    }

    deactivate(): void {
        this._active = false;
        this.spriteManager!.hidden = true;
        this._respawnTimer = performance.now();
    }

    // @ts-ignore
    update(deltaTime: number): void {
        if (!this._active && performance.now() - this._respawnTimer > this._respawnTime) {
            this._active = true;
            this.spriteManager!.hidden = false;
        }
    }

    reposition(newPosition: Vec2D): void {
        this.position = newPosition;
    }

    override get aiDetectable(): boolean {
        return false;
    }
}
