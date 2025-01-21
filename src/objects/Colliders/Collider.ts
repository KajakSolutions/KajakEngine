import {BoundingBox, Vec2D} from "../../types/math";

export interface ColliderInfo {
    objectA: Collider;
    objectB: Collider;
    contactPoints: Vec2D[];
}

export default abstract class Collider {
    abstract checkCollision(other: Collider): ColliderInfo | null;
    abstract updatePosition(position: Vec2D, rotation?: number): void;
    abstract getBoundingBox(): BoundingBox;
}
