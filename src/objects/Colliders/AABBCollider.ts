import {BoundingBox, Vec2D} from "../../types/math";
import {add, vec2D} from "../../utils/math.ts";

import Collider, {ColliderInfo} from "./Collider.ts";
import PolygonCollider from "./PolygonCollider.ts";

export class AABBCollider extends Collider {
    private _size: Vec2D;
    private readonly _absolutePosition: Vec2D;
    private _position: Vec2D;

    constructor(absolutePosition: Vec2D, size: Vec2D) {
        super();
        this._absolutePosition = absolutePosition;
        this._position = absolutePosition;
        this._size = size;
    }

    get size(): Vec2D {
        return this._size;
    }

    get position(): Vec2D {
        return this._position;
    }

    updatePosition(position: Vec2D) {
        this._position = add(position,  this._absolutePosition);
    }

    checkCollision(other: Collider): ColliderInfo | null {
        if(other instanceof AABBCollider) {
            return this.checkCollisionAABB(other);
        } else if (other instanceof  PolygonCollider) {
            return  this.checkCollisionWithPolygon(other);
        }

        return null
    }

    private checkCollisionAABB(other: AABBCollider): ColliderInfo | null {
        const isOverlapping =
            this._position.x < other.position.x + other.size.x &&
            this._position.x + this.size.x > other.position.x &&
            this._position.y < other.position.y + other.size.y &&
            this._position.y + this.size.y > other.position.y;

        if(isOverlapping) {
            return {
                objectA: this,
                objectB: other,
                contactPoints: []
            }
        }

        return null;
    }

    private checkCollisionWithPolygon(other: PolygonCollider): ColliderInfo | null {
        const vertices = [
            vec2D(this._position.x, this._position.y),
            vec2D(this._position.x + this._size.x, this._position.y),
            vec2D(this._position.x + this._size.x, this._position.y + this._size.y),
            vec2D(this._position.x, this._position.y + this._size.y)
        ];

        const aabbPolygon = new PolygonCollider(vec2D(0,0), vertices);
        return aabbPolygon.checkCollision(other);
    }

    getBoundingBox(): BoundingBox {
        return {
            x: this._position.x,
            y: this._position.y,
            width: this._size.x,
            height: this._size.y
        };
    }
}
