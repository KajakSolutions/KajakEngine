import { BoundingBox } from "../types/math"
import PhysicObject from "./PhysicObject"

export class QuadTree {
    private readonly boundary: BoundingBox
    private readonly capacity: number
    private readonly maxDepth: number
    private readonly currentDepth: number
    private objects: PhysicObject[] = []
    private divided: boolean = false
    private northwest?: QuadTree
    private northeast?: QuadTree
    private southwest?: QuadTree
    private southeast?: QuadTree

    private static readonly MIN_SIZE = 1.0
    private queryCache: Map<string, PhysicObject[]> = new Map()
    private lastUpdateTime: number = 0
    private static readonly CACHE_LIFETIME = 16

    constructor(
        boundary: BoundingBox,
        capacity: number = 4,
        maxDepth: number = 8,
        currentDepth: number = 0
    ) {
        this.boundary = boundary
        this.capacity = capacity
        this.maxDepth = maxDepth
        this.currentDepth = currentDepth
    }

    clear(): void {
        this.objects = []
        this.queryCache.clear()
        if (this.divided) {
            this.northwest?.clear()
            this.northeast?.clear()
            this.southwest?.clear()
            this.southeast?.clear()
            this.divided = false
        }
    }

    private shouldSubdivide(): boolean {
        return (
            this.currentDepth < this.maxDepth &&
            this.boundary.width > QuadTree.MIN_SIZE &&
            this.boundary.height > QuadTree.MIN_SIZE
        )
    }

    subdivide(): void {
        if (!this.shouldSubdivide()) return

        const x = this.boundary.x
        const y = this.boundary.y
        const w = this.boundary.width / 2
        const h = this.boundary.height / 2

        const nextDepth = this.currentDepth + 1

        this.northwest = new QuadTree(
            { x, y, width: w, height: h },
            this.capacity,
            this.maxDepth,
            nextDepth
        )
        this.northeast = new QuadTree(
            { x: x + w, y, width: w, height: h },
            this.capacity,
            this.maxDepth,
            nextDepth
        )
        this.southwest = new QuadTree(
            { x, y: y + h, width: w, height: h },
            this.capacity,
            this.maxDepth,
            nextDepth
        )
        this.southeast = new QuadTree(
            { x: x + w, y: y + h, width: w, height: h },
            this.capacity,
            this.maxDepth,
            nextDepth
        )
        this.divided = true
    }

    insert(object: PhysicObject): boolean {
        if (!this.boundaryContains(object.collider?.getBoundingBox())) {
            return false
        }

        if (this.objects.length < this.capacity || !this.shouldSubdivide()) {
            this.objects.push(object)
            this.queryCache.clear()
            return true
        }

        if (!this.divided) {
            this.subdivide()
        }

        return (
            this.northwest!.insert(object) ||
            this.northeast!.insert(object) ||
            this.southwest!.insert(object) ||
            this.southeast!.insert(object)
        )
    }

    query(range: BoundingBox): PhysicObject[] {
        const currentTime = performance.now()
        const cacheKey = this.getCacheKey(range)

        const cachedResult = this.queryCache.get(cacheKey)
        if (
            cachedResult &&
            currentTime - this.lastUpdateTime < QuadTree.CACHE_LIFETIME
        ) {
            return cachedResult
        }

        const found = this.queryInternal(range)

        this.queryCache.set(cacheKey, found)
        this.lastUpdateTime = currentTime

        return found
    }

    private queryInternal(range: BoundingBox): PhysicObject[] {
        const found: PhysicObject[] = []

        if (!this.boundaryIntersects(range)) {
            return found
        }

        for (const object of this.objects) {
            if (this.boundaryIntersects(object.collider?.getBoundingBox())) {
                found.push(object)
            }
        }

        if (this.divided) {
            found.push(
                ...this.northwest!.queryInternal(range),
                ...this.northeast!.queryInternal(range),
                ...this.southwest!.queryInternal(range),
                ...this.southeast!.queryInternal(range)
            )
        }

        return found
    }

    private getCacheKey(range: BoundingBox): string {
        return `${range.x},${range.y},${range.width},${range.height}`
    }

    private boundaryContains(box?: BoundingBox): boolean {
        if (!box) return false
        return (
            box.x >= this.boundary.x &&
            box.x + box.width <= this.boundary.x + this.boundary.width &&
            box.y >= this.boundary.y &&
            box.y + box.height <= this.boundary.y + this.boundary.height
        )
    }

    private boundaryIntersects(box?: BoundingBox): boolean {
        if (!box) return false
        return !(
            box.x > this.boundary.x + this.boundary.width ||
            box.x + box.width < this.boundary.x ||
            box.y > this.boundary.y + this.boundary.height ||
            box.y + box.height < this.boundary.y
        )
    }
}
