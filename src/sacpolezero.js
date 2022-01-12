// @flow

/*
 * Philip Crotwell
 * University of South Carolina, 2019
 * http://www.seis.sc.edu
 */

 import { createComplex} from './oregondsputil.js';
 import type {Complex} from './oregondsputil.js';
 import { isNumArg , stringify} from './util.js';

/**
 * SAC style response file. This contains poles and zeros to represent the
 * analog stage, plus a constant for the overall gain. See
 * seisplotjs.transfer.convertToSacPoleZero() for conversion from a
 * StationXML response to SacPoleZero.
 */
export class SacPoleZero {
  /**
   * Complex poles
   */
  poles: Array<Complex>;
  /**
   * Complex zeros
   */
  zeros: Array<Complex>;
  /**
   * Scalar overall gain
   */
  constant: number;
  /** number of zeros added to convert to displacement, for debugging */
  gamma: number;
  /** hertz/radian factor, for debugging */
  mulFactor: number;
  /** sensitivity accounting for gamma, for debugging */
  sd: number;
  /** normalization factor for poles and zeros accounting for gamma, for debugging */
  A0: number;
  constructor(poles: Array<Complex>, zeros: Array<Complex>, constant: number) {
    this.poles = poles;
    this.zeros = zeros;
    this.constant = constant;
  }
  toString(): string {
    let s = ["sacPoleZero:"];
    s.push("ZEROS "+this.zeros.length);
    for(let i=0; i<this.zeros.length; i++ ) {
      s.push("    "+this.zeros[i].real()+" "+this.zeros[i].imag());
    }
    s.push("POLES "+this.poles.length);
    for(let i=0; i<this.poles.length; i++ ) {
      s.push("    "+this.poles[i].real()+" "+this.poles[i].imag());
    }
    s.push("CONSTANT "+this.constant);
    if (isNumArg(this.gamma) && isNumArg(this.mulFactor) && isNumArg(this.sd) && isNumArg(this.A0)) {
      s.push("*    gamma: "+this.gamma);
      s.push("*    mulFactor: "+this.mulFactor);
      s.push("*    sd: "+this.sd);
      s.push("*    A0: "+this.A0);
    }
    return s.join('\n');
  }
  evalPoleZeroInverse(freq: number): Complex {
    const s = createComplex(0, 2 * Math.PI * freq);
    let zeroOut = createComplex(1, 0);
    let poleOut = createComplex(1, 0);
    for(let i = 0; i < this.poles.length; i++) {
        poleOut = poleOut.timesComplex( s.minusComplex(this.poles[i]) );
    }
    for(let i = 0; i < this.zeros.length; i++) {
        if(s.real() === this.zeros[i].real()
                && s.imag() === this.zeros[i].imag()) {
            return createComplex(0,0);
        }
        zeroOut = zeroOut.timesComplex( s.minusComplex(this.zeros[i]) );
    }
    let out = poleOut.overComplex(zeroOut);
    return out.overReal( this.constant);
  }
  trimZeros(gamma: number) {
    const sacPoleZero = this;
    for(let i=0; i<gamma; i++) {
      let z = sacPoleZero.zeros[sacPoleZero.zeros.length-1-i];
      if (z.real() !== 0 || z.imag() !== 0) {
        throw new Error(`Attempt to trim ${gamma} zeros from SacPoleZero, but zero isn't 0+i0: ${stringify(z)}`);
      }
    }
    // subtract gama zeros, ex 1 to get
    let trimmedZeros = sacPoleZero.zeros.slice().reverse();
    for(let i=0; i<gamma; i++) {
      let idx = trimmedZeros.findIndex((d) => d.real() === 0 && d.imag() === 0);
      trimmedZeros.splice(idx, 1);
    }
    trimmedZeros = trimmedZeros.reverse();
    sacPoleZero.zeros = trimmedZeros;
  }
  toText(): string {
    let s = [];
    s.push("ZEROS "+this.zeros.length);
    for(let i=0; i<this.zeros.length; i++ ) {
      s.push("    "+this.zeros[i].real()+" "+this.zeros[i].imag());
    }
    s.push("POLES "+this.poles.length);
    for(let i=0; i<this.poles.length; i++ ) {
      s.push("    "+this.poles[i].real()+" "+this.poles[i].imag());
    }
    s.push("CONSTANT "+this.constant);
    return s.join('\n');
  }

  /**
   * Caclulates the frequency response from the given poles and zeros.
   *
   * @param   sacPoleZero poles and zeros
   * @param   numPoints   number of points in the output fft
   * @param   sampleRate  sample rate to compute at
   * @returns             frequency response
   */
  calcForDisplay(freqs: Array<number>): Array<Complex> {
    let out = freqs.map(freq => {
        let respAtS = this.evalPoleZeroInverse(freq);
        respAtS = createComplex(1, 0).overComplex(respAtS);
        return respAtS;
    });
    return out;
  }
  /**
   * Parses a string in sac polezero format into a SacPoleZero.
   *
   * @param data string to parse
   * @returns SacPoleZero instance
   */
  static parse(data: string): SacPoleZero {
      let pz = {
        zeros: [],
        poles: [],
        constant: 1
      };
      let lines = data.split('\n');
      let numZeros = 0;
      let numPoles = 0;
      let i=0;
      while (i < lines.length) {
        let l = lines[i];
        let items = l.trim().split(/ +/);
        if (items[0] === 'ZEROS') {
          numZeros = parseInt(items[1]);
          i++;
          l = lines[i];
          items = l.trim().split(/ +/);
          while (i < lines.length && pz.zeros.length < numZeros) {
            if (items[0] === 'POLES') {
              // no more zeros, fill array with 0
              for(let z = pz.zeros.length; z < numZeros; z++) {
                pz.zeros.push(createComplex(0,0));
              }
              break;
            } else {
              let real = parseFloat(items[0]);
              let imag = parseFloat(items[1]);
              pz.zeros.push(createComplex(real, imag));
            }
            i++;
            l = lines[i];
            items = l.trim().split(/ +/);
          }
        }
        if (items[0] === 'POLES') {
          numPoles = parseInt(items[1]);
          i++;
          l = lines[i];
          items = l.trim().split(/ +/);
          while (i < lines.length && pz.poles.length < numPoles) {
            if (items[0] === 'CONSTANT') {
              // no more poles, fill array with 0
              for(let z = pz.poles.length; z < numPoles; z++) {
                pz.poles.push(createComplex(0,0));
              }
              break;
            } else {
              let real = parseFloat(items[0]);
              let imag = parseFloat(items[1]);
              pz.poles.push(createComplex(real, imag));
            }
            i++;
            l = lines[i];
            items = l.trim().split(/ +/);
          }
        }
        if (items[0] === 'CONSTANT') {
          pz.constant = parseFloat(items[1]);
        }
        i++;
      }
      return new SacPoleZero(pz.poles, pz.zeros, pz.constant);
  }
}

export function geomspace(start: number, stop: number, num: number): Array<number> {
  let log_start = Math.log(start);
  let log_stop = Math.log(stop);
  return logspace(log_start, log_stop, num);
}
export function logspace(start: number, stop: number, num: number): Array<number> {
  return linspace(start, stop, num).map(n => Math.pow(10, n));
}
export function linspace(start: number, stop: number, num: number): Array<number> {
  let delta = (stop-start)/(num-1);
  let out = [];
  for (let i=0;i<num;i++) {
    out.push(start+i*delta);
  }
  return out;
}
