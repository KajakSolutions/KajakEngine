import PhysicObject from "./PhysicObject.ts";
import {Vec2D} from "../types/math";
import {AABBCollider} from "./Colliders/AABBCollider.ts";
import {vec2D} from "../utils/math.ts";
import SpriteManager from "./SpriteManager.ts";
import CarObject from "./CarObject.ts";

export class PuddleObject extends PhysicObject {
    private readonly puddleType: 'puddle' | 'ice';
    private readonly effectCooldown: Map<number, number> = new Map();
    private static readonly COOLDOWN_TIME = 500;

    constructor(options: {
        position: Vec2D,
        size: Vec2D,
        type: 'puddle' | 'ice',
        mass: number
    }) {
        const collider = new AABBCollider(
            vec2D(-options.size.x / 2, -options.size.y / 2),
            options.size
        );

        const spriteManager = new SpriteManager({
            imageSrc: options.type === 'puddle' ? "game/car1.png" : "game/car1.png",
            cellSize: vec2D(32, 32),
            count: 1,
            columns: 1
        });

        super({
            position: options.position,
            size: options.size,
            collider,
            movable: false,
            spriteManager,
            mass: options.mass || 1
        });

        this.puddleType = options.type;
    }

    applyEffect(car: CarObject): void {
        if (this.effectCooldown.has(car.id)) {
            const lastApplied = this.effectCooldown.get(car.id) || 0;
            if (performance.now() - lastApplied < PuddleObject.COOLDOWN_TIME) {
                return;
            }
        }

        if (this.puddleType === 'puddle') {
            car.applyTemporarySurfaceEffect({
                gripMultiplier: 0.7,
                dragMultiplier: 1.2
            });
        } else if (this.puddleType === 'ice') {
            car.applyTemporarySurfaceEffect({
                gripMultiplier: 0.4,
                dragMultiplier: 1.1
            });
        }

        this.effectCooldown.set(car.id, performance.now());
    }

    override get aiDetectable(): boolean {
        return false;
    }
}
