import { Noise } from 'noisejs';

export default class NoiseGenerator {
  constructor(seed) {
    this.noise = new Noise(seed);
  }

  simplex2(x, y) {
    return this.noise.simplex2(x, y);
  }

  // Fractional Brownian Motion
  fBm(x, y, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.simplex2(x * frequency / scale, y * frequency / scale) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}
