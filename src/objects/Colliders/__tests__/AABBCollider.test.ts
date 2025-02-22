import { vec2D } from "../../../utils/math";
import { AABBCollider } from "../AABBCollider";
import { describe, expect, test } from '@jest/globals';
import PolygonCollider from "../PolygonCollider";

describe('AABBCollider', () => {
    describe('initialization and properties', () => {
        test('creates collider with correct properties', () => {
            const position = vec2D(1, 2);
            const size = vec2D(3, 4);
            const collider = new AABBCollider(position, size);

            expect(collider.position).toEqual(position);
            expect(collider.size).toEqual(size);
        });
    });

    describe('position updates', () => {
        test('updates position correctly', () => {
            const collider = new AABBCollider(vec2D(0, 0), vec2D(1, 1));
            const newPosition = vec2D(5, 5);

            collider.updatePosition(newPosition);
            expect(collider.position).toEqual(newPosition);
        });
    });

    describe('collision detection', () => {
        test('detects collision between overlapping boxes', () => {
            const box1 = new AABBCollider(vec2D(0, 0), vec2D(10, 10));
            const box2 = new AABBCollider(vec2D(5, 5), vec2D(10, 10));

            const collision = box1.checkCollision(box2);
            expect(collision).not.toBeNull();
        });

        test('no collision between separated boxes', () => {
            const box1 = new AABBCollider(vec2D(0, 0), vec2D(10, 10));
            const box2 = new AABBCollider(vec2D(20, 20), vec2D(10, 10));

            const collision = box1.checkCollision(box2);
            expect(collision).toBeNull();
        });

        test('collision with polygon', () => {
            const aabb = new AABBCollider(vec2D(0, 0), vec2D(10, 10));
            const polygon = new PolygonCollider(vec2D(4, 4), [
                vec2D(0, 0),
                vec2D(10, 0),
                vec2D(10, 10),
                vec2D(0, 10)
            ]);

            const collision = polygon.checkCollision(aabb);
            expect(collision).not.toBeNull();
        });
    });

    describe('bounding box and point containment', () => {
        test('returns correct bounding box', () => {
            const position = vec2D(1, 2);
            const size = vec2D(3, 4);
            const collider = new AABBCollider(position, size);

            expect(collider.getBoundingBox()).toEqual({
                x: position.x,
                y: position.y,
                width: size.x,
                height: size.y
            });
        });

        test('correctly detects contained points', () => {
            const collider = new AABBCollider(vec2D(0, 0), vec2D(10, 10));

            expect(collider.containsPoint(vec2D(5, 5))).toBe(true);
            expect(collider.containsPoint(vec2D(15, 15))).toBe(false);
            expect(collider.containsPoint(vec2D(0, 0))).toBe(true);
            expect(collider.containsPoint(vec2D(10, 10))).toBe(true);
        });
    });
});
