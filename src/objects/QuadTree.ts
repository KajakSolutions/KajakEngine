import PhysicObject from "./PhysicObject.ts";

interface QuadTreeNode {
    objects: PhysicObject[];
    bounds: { x: number; y: number; width: number; height: number };
    children: QuadTreeNode[];
}

export default class QuadTree {
    private root: QuadTreeNode;
    private capacity: number;

    constructor(bounds: { x: number; y: number; width: number; height: number }, capacity: number) {
        this.root = { objects: [], bounds, children: [] };
        this.capacity = capacity;
    }

    insert(object: PhysicObject): void {
        this.insertNode(this.root, object);
    }

    private insertNode(node: QuadTreeNode, object: PhysicObject): void {
        if (!this.intersects(node.bounds, object.collider.getBoundingBox())) {
            return;
        }

        if (node.objects.length < this.capacity && node.children.length === 0) {
            node.objects.push(object);
            return;
        }

        if (node.children.length === 0) {
            this.subdivide(node);
        }

        for (const child of node.children) {
            this.insertNode(child, object);
        }
    }

    queryRange(range: { x: number; y: number; width: number; height: number }): PhysicObject[] {
        return this.queryRangeNode(this.root, range);
    }

    private queryRangeNode(node: QuadTreeNode, range: { x: number; y: number; width: number; height: number }): PhysicObject[] {
        if (!this.intersects(node.bounds, range)) {
            return [];
        }

        const found = [...node.objects];

        for (const child of node.children) {
            found.push(...this.queryRangeNode(child, range));
        }

        return found;
    }

    private intersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
        return !(a.x + a.width < b.x || a.x > b.x + b.width || a.y + a.height < b.y || a.y > b.y + b.height);
    }

    private subdivide(node: QuadTreeNode): void {
        const { x, y, width, height } = node.bounds;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        node.children.push(
            { objects: [], bounds: { x, y, width: halfWidth, height: halfHeight }, children: [] },
            { objects: [], bounds: { x: x + halfWidth, y, width: halfWidth, height: halfHeight }, children: [] },
            { objects: [], bounds: { x, y: y + halfHeight, width: halfWidth, height: halfHeight }, children: [] },
            { objects: [], bounds: { x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight }, children: [] }
        );
    }
}
