import {BoundingBox} from "../types/math";
import PhysicObject from "./PhysicObject.ts";

export class QuadTree {
    private readonly boundary: BoundingBox;
    private readonly capacity: number;
    private objects: PhysicObject[] = [];
    private divided: boolean = false;
    private northwest?: QuadTree;
    private northeast?: QuadTree;
    private southwest?: QuadTree;
    private southeast?: QuadTree;

    constructor(boundary: BoundingBox, capacity: number = 4) {
        this.boundary = boundary;
        this.capacity = capacity;
    }

    clear(): void {
        this.objects = [];
        if (this.divided) {
            this.northwest?.clear();
            this.northeast?.clear();
            this.southwest?.clear();
            this.southeast?.clear();
            this.divided = false;
        }
    }

    subdivide(): void {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.width / 2;
        const h = this.boundary.height / 2;

        const nw = { x: x, y: y, width: w, height: h };
        const ne = { x: x + w, y: y, width: w, height: h };
        const sw = { x: x, y: y + h, width: w, height: h };
        const se = { x: x + w, y: y + h, width: w, height: h };

        this.northwest = new QuadTree(nw, this.capacity);
        this.northeast = new QuadTree(ne, this.capacity);
        this.southwest = new QuadTree(sw, this.capacity);
        this.southeast = new QuadTree(se, this.capacity);
        this.divided = true;
    }

    insert(object: PhysicObject): boolean {
        if (!this.boundaryContains(object.collider?.getBoundingBox())) {
            return false;
        }

        if (this.objects.length < this.capacity && !this.divided) {
            this.objects.push(object);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        return (
            this.northwest!.insert(object) ||
            this.northeast!.insert(object) ||
            this.southwest!.insert(object) ||
            this.southeast!.insert(object)
        );
    }

    query(range: BoundingBox): PhysicObject[] {
        const found: PhysicObject[] = [];

        if (!this.boundaryIntersects(range)) {
            return found;
        }

        for (const object of this.objects) {
            if (this.boundaryIntersects(object.collider?.getBoundingBox())) {
                found.push(object);
            }
        }

        if (this.divided) {
            found.push(...this.northwest!.query(range));
            found.push(...this.northeast!.query(range));
            found.push(...this.southwest!.query(range));
            found.push(...this.southeast!.query(range));
        }

        return found;
    }

    private boundaryContains(box?: BoundingBox): boolean {
        if (!box) return false;
        return (
            box.x >= this.boundary.x &&
            box.x + box.width <= this.boundary.x + this.boundary.width &&
            box.y >= this.boundary.y &&
            box.y + box.height <= this.boundary.y + this.boundary.height
        );
    }

    private boundaryIntersects(box?: BoundingBox): boolean {
        if (!box) return false;
        return !(
            box.x > this.boundary.x + this.boundary.width ||
            box.x + box.width < this.boundary.x ||
            box.y > this.boundary.y + this.boundary.height ||
            box.y + box.height < this.boundary.y
        );
    }
}
