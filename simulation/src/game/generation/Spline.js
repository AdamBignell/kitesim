import * as Phaser from 'phaser';

export default class Spline {
    constructor(points) {
        this.curve = new Phaser.Curves.Spline(points);
        this.metadata = new Map();
    }

    getPoint(t) {
        return this.curve.getPoint(t);
    }

    setMetadata(pointIndex, data) {
        this.metadata.set(pointIndex, data);
    }

    getMetadata(pointIndex) {
        return this.metadata.get(pointIndex);
    }

    getInterpolatedMetadata(t) {
        const point = this.curve.getPoint(t);
        const pointIndex = this.curve.getPointIndexes(t);
        const p0 = this.curve.points[pointIndex.p0];
        const p1 = this.curve.points[pointIndex.p1];
        const d0 = Phaser.Math.Distance.Between(point.x, point.y, p0.x, p0.y);
        const d1 = Phaser.Math.Distance.Between(point.x, point.y, p1.x, p1.y);
        const totalDistance = d0 + d1;

        const data0 = this.getMetadata(pointIndex.p0) || {};
        const data1 = this.getMetadata(pointIndex.p1) || {};

        const interpolatedData = {};
        const allKeys = new Set([...Object.keys(data0), ...Object.keys(data1)]);

        for (const key of allKeys) {
            const val0 = data0[key] || 0;
            const val1 = data1[key] || 0;
            interpolatedData[key] = (val0 * d1 + val1 * d0) / totalDistance;
        }

        return interpolatedData;
    }
}
