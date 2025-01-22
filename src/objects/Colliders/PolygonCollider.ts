import {BoundingBox, Vec2D} from "../../types/math";
import Collider, {ColliderInfo} from "./Collider.ts";
import {AABBCollider} from "./AABBCollider.ts";
import CircleCollider from "./CircleCollider.ts";
import {length, squaredLength, subtract, vec2D} from "../../utils/math.ts";

export default class PolygonCollider extends Collider {
    private _position: Vec2D;
    private _vertices: Vec2D[];
    private _lastRotation: number = 0;

    constructor(position: Vec2D, vertices: Vec2D[]) {
        super();
        this._position = position;
        this._vertices = vertices;
    }

    get position(): Vec2D {
        return this._position;
    }

    get vertices(): Vec2D[] {
        return this._vertices;
    }

    checkCollision(other: Collider): ColliderInfo | null {
        if (other instanceof AABBCollider) {
            return this.checkCollisionWithAABB(other);
        } else if (other instanceof CircleCollider) {
            return this.checkCollisionWithCircle(other);
        } else if (other instanceof PolygonCollider) {
            return this.checkCollisionWithPolygon(other);
        }
        return null;
    }

    updatePosition(position: Vec2D, rotation: number): void {
        this._position = position;

        const rotationDelta = rotation - this._lastRotation;
        this._lastRotation = rotation;

        for (let i = 0; i < this._vertices.length; i++) {

            const dx = this._vertices[i].x;
            const dy = this._vertices[i].y;

            this._vertices[i].x = dx * Math.cos(rotationDelta) - dy * Math.sin(rotationDelta);
            this._vertices[i].y = dx * Math.sin(rotationDelta) + dy * Math.cos(rotationDelta);
        }
    }

    private checkCollisionWithCircle(other: CircleCollider): ColliderInfo | null  {
        const nearestVertex = this.vertices.reduce(
            (nearest: Vec2D & { distanceSq: number }, vertex) => {
                const distanceSq = squaredLength(subtract(vertex, this._position));
                return distanceSq < nearest.distanceSq
                    ? { ...vertex, distanceSq }
                    : nearest;
            },
            {
                x: this.vertices[0].x,
                y: this.vertices[0].y,
                distanceSq: Infinity,
            } as Vec2D & { distanceSq: number }
        );

        const  axis = vec2D(
            nearestVertex.x + this.position.x - other.position.x,
            nearestVertex.y + this.position.y - other.position.y,
        )

        const axes = this.getAxes().concat(axis);
        let overlap = Infinity;
        let smallestAxis = null;

        for (const a of axes) {
            const projectionA = this.project(a);
            const projectionB = other.projectCircle(a)

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

    private checkCollisionWithPolygon(other: PolygonCollider): ColliderInfo | null  {
        const axes = this.getAxes().concat(other.getAxes());
        let overlap = Infinity;
        let smallestAxis = null;

        for (const axis of axes) {
            const projection1 = this.project(axis);
            const projection2 = other.project(axis);
            const o = this.getOverlap(projection1, projection2);

            if (o === 0) return null;

            if (o < overlap) {
                overlap = o;
                smallestAxis = axis;
            }
        }

        console.log(smallestAxis);

        return {
            objectA: this,
            objectB: other,
            contactPoints: [],
        };
    }

    private checkCollisionWithAABB(other: AABBCollider): ColliderInfo | null  {
        const vertices = [
            vec2D(other.position.x, other.position.y),
            vec2D(other.position.x + other.size.x, other.position.y),
            vec2D(other.position.x + other.size.x, other.position.y + other.size.y),
            vec2D(other.position.x, other.position.y + other.size.y),
        ];
        const aabbPolygon = new PolygonCollider(vec2D(0,0), vertices);
        return this.checkCollisionWithPolygon(aabbPolygon);
    }

    private getOverlap(projectionA: { min: number, max: number }, projectionB: { min: number, max: number }): number {
        return Math.max(0, Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min));
    }

    project(axis: Vec2D): { min: number, max: number } {
        const dots = this.vertices.map(
            (vertex) =>
                (vertex.x + this.position.x) * axis.x + (vertex.y + this.position.y) * axis.y
        );

        return {
            min: Math.min(...dots),
            max: Math.max(...dots)
        };
    }

    getAxes(): Vec2D[] {
        const axes: Vec2D[] = [];
        const numVertices = this.vertices.length;

        for (let i = 0; i < numVertices; i++) {
            const p1 = this.vertices[i];
            const p2 = this.vertices[(i + 1) % numVertices];

            const edge = subtract(p2, p1);

            const axis = vec2D(-edge.y, edge.x);

            const len = length(axis);
            axes.push({ x: axis.x / len, y: axis.y / len });
        }

        return axes;
    }

    getBoundingBox(): BoundingBox {
        const xs = this.vertices.map((v) => v.x + this.position.x);
        const ys = this.vertices.map((v) => v.y + this.position.y);
        return {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
        };
    }
}
