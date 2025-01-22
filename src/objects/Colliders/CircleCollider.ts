import {BoundingBox, Vec2D} from "../../types/math";
import {add, dotProduct, length, squaredLength, subtract} from "../../utils/math.ts";
import Collider, {ColliderInfo} from "./Collider.ts";
import {AABBCollider} from "./AABBCollider.ts";
import PolygonCollider from "./PolygonCollider.ts";

export default class CircleCollider extends Collider {
    private _position: Vec2D;
    private readonly _absolutePosition: Vec2D;
    private _radius: number;

    constructor(absolutePosition: Vec2D, radius: number) {
        super();
        this._absolutePosition = absolutePosition;
        this._position = absolutePosition;
        this._radius = radius;
    }

    get position(): Vec2D {
        return this._position;
    }

    get radius(): number {
        return this._radius;
    }

    updatePosition(position: Vec2D) {
        this._position = add(position,  this._absolutePosition);
    }

    checkCollision(other: Collider): ColliderInfo | null {
        if(other instanceof CircleCollider) {
            return this.checkCollisionCircle(other);
        } else if (other instanceof AABBCollider) {
            return other.checkCollision(this);
        } else if (other instanceof  PolygonCollider) {
            return  this.checkCollisionWithPolygon(other);
        }

        return null;
    }

    private checkCollisionCircle(other: CircleCollider):ColliderInfo | null {
        const distance = length(subtract(this._position, other.position));

        if (distance <= this._radius + other.radius) {
            return {
                objectA: this,
                objectB: other,
                contactPoints: []
            }
        }

        return null;
    }

    private checkCollisionWithPolygon(other: PolygonCollider):ColliderInfo | null {
        const nearestVertex = other.vertices.reduce(
            (nearest: Vec2D & { distanceSq: number }, vertex) => {
                const distanceSq = squaredLength(subtract(vertex, this._position));
                return distanceSq < nearest.distanceSq
                    ? { ...vertex, distanceSq }
                    : nearest;
            },
            {
                x: other.vertices[0].x,
                y: other.vertices[0].y,
                distanceSq: Infinity,
            } as Vec2D & { distanceSq: number }
        );

        const  axis = subtract(nearestVertex, this._position);

        const axes = other.getAxes().concat(axis);
        let overlap = Infinity;
        let smallestAxis = null;

        for (const a of axes) {
            const projectionA = other.project(a);
            const projectionB = this.projectCircle(a)

            const o = this.getOverlap(projectionA, projectionB);

            if(o === 0) return null;

            if (o < overlap) {
                overlap = o;
                smallestAxis = a;
            }
        }

        console.log(smallestAxis);

        return {
            objectA: this,
            objectB: other,
            contactPoints: []
        }
    }

    projectCircle(axis: Vec2D): { min: number, max: number } {
        const center = this._position;
        const dotP = dotProduct(center, axis);
        return {
            min: dotP - this._radius,
            max: dotP + this._radius
        }
    }

    private getOverlap(projectionA: { min: number, max: number }, projectionB: { min: number, max: number }): number {
        return Math.max(0, Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min));
    }

    getBoundingBox(): BoundingBox {
        return {
            x: this._position.x - this._radius,
            y: this._position.y - this._radius,
            width: this._radius * 2,
            height: this._radius * 2
        }
    }
}
