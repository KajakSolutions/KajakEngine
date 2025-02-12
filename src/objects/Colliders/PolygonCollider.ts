import { BoundingBox, Vec2D } from "../../types/math"
import Collider, { ColliderInfo } from "./Collider.ts"
import { AABBCollider } from "./AABBCollider.ts"
import { add, dotProduct, length, subtract, vec2D } from "../../utils/math.ts"
import { LineCollider } from "./LineCollider.ts"

export default class PolygonCollider extends Collider {
    private _position: Vec2D
    private readonly _absolutePosition: Vec2D
    private _vertices: Vec2D[]
    private _lastRotation: number = 0

    constructor(absolutePosition: Vec2D, vertices: Vec2D[]) {
        super()
        this._absolutePosition = absolutePosition
        this._position = absolutePosition
        this._vertices = vertices
    }

    get position(): Vec2D {
        return add(this._position, this._absolutePosition)
    }

    get vertices(): Vec2D[] {
        return this._vertices
    }

    checkCollision(other: Collider): ColliderInfo | null {
        if (other instanceof AABBCollider) {
            return this.checkCollisionWithAABB(other)
        } else if (other instanceof PolygonCollider) {
            return this.checkCollisionWithPolygon(other)
        } else if (other instanceof LineCollider) {
            return other.checkCollision(this)
        }
        return null
    }

    updatePosition(position: Vec2D, rotation: number): void {
        this._position = add(position, this._absolutePosition)

        const rotationDelta = rotation - this._lastRotation
        this._lastRotation = rotation

        for (let i = 0; i < this._vertices.length; i++) {
            const dx = this._vertices[i].x
            const dy = this._vertices[i].y

            this._vertices[i].x =
                dx * Math.cos(rotationDelta) - dy * Math.sin(rotationDelta)
            this._vertices[i].y =
                dx * Math.sin(rotationDelta) + dy * Math.cos(rotationDelta)
        }
    }

    private checkCollisionWithPolygon(
        other: PolygonCollider
    ): ColliderInfo | null {
        const axes = this.getAxes().concat(other.getAxes())
        let overlap = Infinity
        let smallestAxis = null

        for (const axis of axes) {
            const projection1 = this.project(axis)
            const projection2 = other.project(axis)
            const o = this.getOverlap(projection1, projection2)

            if (o === 0) return null

            if (o < overlap) {
                overlap = o
                smallestAxis = axis
            }
        }

        if (!smallestAxis) {
            return {
                objectA: this,
                objectB: other,
                contactPoints: [],
            }
        }

        const mtv = this.calculateMTV(smallestAxis, overlap, other)

        return {
            objectA: this,
            objectB: other,
            contactPoints: [],
            mtv,
        }
    }

    private checkCollisionWithAABB(other: AABBCollider): ColliderInfo | null {
        const vertices = [
            vec2D(other.position.x, other.position.y),
            vec2D(other.position.x + other.size.x, other.position.y),
            vec2D(
                other.position.x + other.size.x,
                other.position.y + other.size.y
            ),
            vec2D(other.position.x, other.position.y + other.size.y),
        ]
        const aabbPolygon = new PolygonCollider(vec2D(0, 0), vertices)
        return this.checkCollisionWithPolygon(aabbPolygon)
    }

    private getOverlap(
        projectionA: { min: number; max: number },
        projectionB: { min: number; max: number }
    ): number {
        return Math.max(
            0,
            Math.min(projectionA.max, projectionB.max) -
                Math.max(projectionA.min, projectionB.min)
        )
    }

    private calculateMTV(
        smallestAxis: Vec2D,
        minOverlap: number,
        other: Collider
    ): Vec2D {
        const centerA = this.getBoundingBox()
        const centerB = other.getBoundingBox()

        const direction = vec2D(
            centerB.x + centerB.width / 2 - (centerA.x + centerA.width / 2),
            centerB.y + centerB.height / 2 - (centerA.y + centerA.height / 2)
        )

        const sign = Math.sign(dotProduct(direction, smallestAxis))

        return vec2D(
            smallestAxis.x * minOverlap * sign,
            smallestAxis.y * minOverlap * sign
        )
    }

    project(axis: Vec2D): { min: number; max: number } {
        const dots = this.vertices.map(
            (vertex) =>
                (vertex.x + this.position.x) * axis.x +
                (vertex.y + this.position.y) * axis.y
        )

        return {
            min: Math.min(...dots),
            max: Math.max(...dots),
        }
    }

    getAxes(): Vec2D[] {
        const axes: Vec2D[] = []
        const numVertices = this.vertices.length

        for (let i = 0; i < numVertices; i++) {
            const p1 = this.vertices[i]
            const p2 = this.vertices[(i + 1) % numVertices]

            const edge = subtract(p2, p1)

            const axis = vec2D(-edge.y, edge.x)

            const len = length(axis)
            axes.push({ x: axis.x / len, y: axis.y / len })
        }

        return axes
    }

    getBoundingBox(): BoundingBox {
        const xs = this.vertices.map((v) => v.x + this.position.x)
        const ys = this.vertices.map((v) => v.y + this.position.y)
        return {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
        }
    }
}
