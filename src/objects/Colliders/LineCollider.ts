import { BoundingBox, Vec2D } from "../../types/math"
import Collider, { ColliderInfo } from "./Collider"
import {
    add,
    multiply,
    normalize,
    vec2D,
    length,
    subtract,
} from "../../utils/math"
import PolygonCollider from "./PolygonCollider"

export class LineCollider extends Collider {
    private _start: Vec2D
    private _end: Vec2D
    private readonly _thickness: number

    constructor(start: Vec2D, end: Vec2D, thickness: number = 0.1) {
        super()
        this._start = start
        this._end = end
        this._thickness = thickness
    }

    set start(value: Vec2D) {
        this._start = value
    }

    set end(value: Vec2D) {
        this._end = value
    }

    get start(): Vec2D {
        return this._start
    }

    get end(): Vec2D {
        return this._end
    }

    updatePosition(_: Vec2D, _2: number = 0): void {
        // Line collider position update, mabye in the future
    }

    checkCollision(other: Collider): ColliderInfo | null {
        if (other instanceof PolygonCollider) {
            return this.checkCollisionWithPolygon(other)
        } else if (other instanceof LineCollider) {
            return this.checkCollisionWithLine(other)
        }
        return null
    }

    private checkCollisionWithPolygon(
        polygon: PolygonCollider
    ): ColliderInfo | null {
        const vertices = polygon.vertices
        const position = polygon.position
        let nearestIntersection: Vec2D | null = null
        let minDistance = Infinity

        for (let i = 0; i < vertices.length; i++) {
            const start = vertices[i]
            const end = vertices[(i + 1) % vertices.length]

            const polygonSegmentStart = add(start, position)
            const polygonSegmentEnd = add(end, position)

            const intersection = this.lineIntersection(
                this._start,
                this._end,
                polygonSegmentStart,
                polygonSegmentEnd
            )

            if (intersection) {
                const distanceToStart = length(
                    subtract(intersection, this._start)
                )
                if (distanceToStart < minDistance) {
                    minDistance = distanceToStart
                    nearestIntersection = intersection
                }
            }
        }

        if (nearestIntersection) {
            const dx = this._end.x - this._start.x
            const dy = this._end.y - this._start.y
            let normal = normalize(vec2D(-dy, dx))


            const polygonCenter = polygon.getCenter()
            const vectorToCenter = subtract(polygonCenter, nearestIntersection)
            const dotProduct = normal.x * vectorToCenter.x + normal.y * vectorToCenter.y

            if (dotProduct > 0) {
                normal = multiply(normal, -1)
            }

            return {
                objectA: this,
                objectB: polygon,
                contactPoints: [nearestIntersection],
                mtv: multiply(normal, this._thickness),
            }
        }

        return null
    }

    private checkCollisionWithLine(other: LineCollider): ColliderInfo | null {
        const intersection = this.lineIntersection(
            this._start,
            this._end,
            other.start,
            other.end
        )

        if (intersection) {
            return {
                objectA: this,
                objectB: other,
                contactPoints: [intersection],
            }
        }

        return null
    }

    private lineIntersection(
        a1: Vec2D,
        a2: Vec2D,
        b1: Vec2D,
        b2: Vec2D
    ): Vec2D | null {
        const denominator =
            (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y)

        if (denominator === 0) {
            return null
        }

        const ua =
            ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) /
            denominator
        const ub =
            ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) /
            denominator

        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return null
        }

        return vec2D(a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y))
    }

    getBoundingBox(): BoundingBox {
        const minX = Math.min(this._start.x, this._end.x)
        const maxX = Math.max(this._start.x, this._end.x)
        const minY = Math.min(this._start.y, this._end.y)
        const maxY = Math.max(this._start.y, this._end.y)

        return {
            x: minX - this._thickness,
            y: minY - this._thickness,
            width: maxX - minX + 2 * this._thickness,
            height: maxY - minY + 2 * this._thickness,
        }
    }

    containsPoint(point: Vec2D): boolean {
        const direction: Vec2D = {
            x: this.end.x - this.start.x,
            y: this.end.y - this.start.y
        };
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

        if (length === 0) return false;

        const normalized: Vec2D = {
            x: direction.x / length,
            y: direction.y / length
        };

        const perpendicular: Vec2D = {
            x: -normalized.y,
            y: normalized.x
        };

        const halfThickness = this._thickness / 2;
        const vertices: Vec2D[] = [
            {
                x: this.start.x + perpendicular.x * halfThickness,
                y: this.start.y + perpendicular.y * halfThickness
            },
            {
                x: this.end.x + perpendicular.x * halfThickness,
                y: this.end.y + perpendicular.y * halfThickness
            },
            {
                x: this.end.x - perpendicular.x * halfThickness,
                y: this.end.y - perpendicular.y * halfThickness
            },
            {
                x: this.start.x - perpendicular.x * halfThickness,
                y: this.start.y - perpendicular.y * halfThickness
            }
        ];

        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const vi = vertices[i];
            const vj = vertices[j];

            if (((vi.y > point.y) !== (vj.y > point.y)) &&
                (point.x < (vj.x - vi.x) * (point.y - vi.y) / (vj.y - vi.y) + vi.x)) {
                inside = !inside;
            }
        }

        return inside;
    }

    get thickness(): number {
        return this._thickness
    }
}