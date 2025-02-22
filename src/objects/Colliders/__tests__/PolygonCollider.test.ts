import { describe, expect, test } from '@jest/globals';
import { vec2D } from '../../../utils/math';
import PolygonCollider from "../PolygonCollider";

describe('PolygonCollider', () => {
    describe('initialization', () => {
        test('creates polygon collider with correct vertices', () => {
            const position = vec2D(0, 0);
            const vertices = [
                vec2D(0, 0),
                vec2D(10, 0),
                vec2D(10, 10),
                vec2D(0, 10)
            ];
            const collider = new PolygonCollider(position, vertices);

            expect(collider.position).toEqual(position);
            expect(collider.vertices).toEqual(vertices);
        });
    });

    describe('collision detection', () => {
        test('detects collision between overlapping polygons', () => {
            const poly1 = new PolygonCollider(vec2D(0, 0), [
                vec2D(0, 0),
                vec2D(10, 0),
                vec2D(10, 10),
                vec2D(0, 10)
            ]);

            const poly2 = new PolygonCollider(vec2D(5, 5), [
                vec2D(-5, -5),
                vec2D(5, -5),
                vec2D(5, 5),
                vec2D(-5, 5)
            ]);

            const collision = poly1.checkCollision(poly2);
            expect(collision).not.toBeNull();
        });

        test('detects no collision between separated polygons', () => {
            const poly1 = new PolygonCollider(vec2D(0, 0), [
                vec2D(0, 0),
                vec2D(10, 0),
                vec2D(10, 10),
                vec2D(0, 10)
            ]);

            const poly2 = new PolygonCollider(vec2D(20, 20), [
                vec2D(0, 0),
                vec2D(10, 0),
                vec2D(10, 10),
                vec2D(0, 10)
            ]);

            const collision = poly2.checkCollision(poly1);
            expect(collision).toBeNull();
        });
    });

    describe('rotation and position updates', () => {
        test('correctly rotates vertices', () => {
            const poly = new PolygonCollider(vec2D(0, 0), [
                vec2D(1, 0),
                vec2D(0, 1),
                vec2D(-1, 0),
                vec2D(0, -1)
            ]);

            poly.updatePosition(vec2D(0, 0), Math.PI / 2);

            expect(poly.vertices[0].x).toBeCloseTo(0);
            expect(poly.vertices[0].y).toBeCloseTo(1);
        });
    });

    describe('edge cases', () => {
        test('handles coincident vertices correctly', () => {
            const poly = new PolygonCollider(vec2D(0, 0), [
                vec2D(0, 0),
                vec2D(1, 0),
                vec2D(1, 0),
                vec2D(0, 1)
            ]);

            const axes = poly.getAxes();
            expect(axes.length).toBeGreaterThan(0);
        });

        test('handles single point polygon', () => {
            const poly = new PolygonCollider(vec2D(0, 0), [vec2D(0, 0)]);
            const bbox = poly.getBoundingBox();

            expect(bbox.width).toBe(0);
            expect(bbox.height).toBe(0);
        });
    });

    describe('bounding box and point containment', () => {
        test('correctly calculates bounding box', () => {
            const poly = new PolygonCollider(vec2D(0, 0), [
                vec2D(0, 0),
                vec2D(10, 0),
                vec2D(10, 10),
                vec2D(0, 10)
            ]);

            const bbox = poly.getBoundingBox();
            expect(bbox.x).toBe(0);
            expect(bbox.y).toBe(0);
            expect(bbox.width).toBe(10);
            expect(bbox.height).toBe(10);
        });

        test('correctly detects contained points', () => {
            const poly = new PolygonCollider(vec2D(0, 0), [
                vec2D(0, 0),
                vec2D(10, 0),
                vec2D(10, 10),
                vec2D(0, 10)
            ]);

            expect(poly.containsPoint(vec2D(5, 5))).toBe(true);
            expect(poly.containsPoint(vec2D(15, 15))).toBe(false);
        });
    });
});
