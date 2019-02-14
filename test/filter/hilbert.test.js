import * as filter from '../../src/filter/index.js';
import {readSac, readSacPoleZero} from './sacfile';
let moment = filter.model.moment;

test("simple hilbert", () => {
    return readSac("./test/filter/data/IU.HRV.__.BHE.SAC")
      .then( orig => {
        const origseis = new filter.model.Seismogram(orig.y, 1/orig.delta, moment.utc());

        let hilbertSeismogram = filter.hilbert(origseis);
        expect(hilbertSeismogram.y.length).toBe(origseis.y.length+200);
      });
});


test("simple envelope", () => {
    return readSac("./test/filter/data/IU.HRV.__.BHE.SAC")
      .then( orig => {
        const origseis = new filter.model.Seismogram(orig.y, 1/orig.delta, moment.utc());

        let envelopeSeis = filter.envelope(origseis);
        expect(envelopeSeis.y.length).toBe(origseis.y.length+200);
        for(let i=0; i<envelopeSeis.y.length; i++) {
          expect(envelopeSeis.y[i]).toBeGreaterThanOrEqual(0);
        }
      });
});