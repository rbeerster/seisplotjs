
import {isDef} from "./util";
import {Duration} from "luxon";

export class AmplitudeScalable {
  middle: number;
  halfWidth: number;

  constructor(middle: number, halfWidth: number) {
    this.middle = middle;
    this.halfWidth = halfWidth;
  }

  getAmplitudeRange(): Array<number> {
    return [-1, 1]; // default
  }

  // eslint-disable-next-line no-unused-vars
  notifyAmplitudeChange(minAmp: number, maxAmp: number) {
    // no-op
  }
}
export class TimeScalable {
  alignmentTimeOffset: Duration;
  duration: Duration;

  constructor(
    alignmentTimeOffset: Duration,
    duration: Duration,
  ) {
    this.alignmentTimeOffset = alignmentTimeOffset;
    this.duration = duration;
  }

  // eslint-disable-next-line no-unused-vars
  notifyTimeRangeChange(
    alignmentTimeOffset: Duration,
    duration: Duration,
  ) {
    // no-op
  }
}

/**
 * Links amplitude scales across multiple seismographs, respecting doRmean.
 *
 * @param graphList optional list of AmplitudeScalable to link
 */
export class LinkedAmpScale {
  /**
   * @private
   */
  _graphSet: Set<AmplitudeScalable>;

  constructor(graphList?: Array<AmplitudeScalable>) {
    const glist = graphList ? graphList : []; // in case null

    this._graphSet = new Set(glist);
  }

  /**
   * Link new Seismograph with this amplitude scale.
   *
   * @param   graph AmplitudeScalable to link
   */
  link(graph: AmplitudeScalable) {
    this._graphSet.add(graph);

    this.recalculate();
  }

  /**
   * Unlink Seismograph with this amplitude scale.
   *
   * @param   graph AmplitudeScalable to unlink
   */
  unlink(graph: AmplitudeScalable) {
    this._graphSet.delete(graph);

    this.recalculate();
  }

  /**
   * Recalculate the best amplitude scale for all Seismographs. Causes a redraw.
   */
  recalculate() {
    const graphList = Array.from(this._graphSet.values());
    const maxHalfRange = graphList.reduce((acc, cur) => {
      return acc > cur.halfWidth ? acc : cur.halfWidth;
    }, 0);
    graphList.forEach(g => {
      g.notifyAmplitudeChange(g.middle - maxHalfRange, g.middle + maxHalfRange);
    });
  }
}

/**
 * Links time scales across multiple seismographs.
 *
 * @param graphList optional list of TimeScalables to link
 */
export class LinkedTimeScale {
  /**
   * @private
   */
  _graphSet: Set<TimeScalable>;
  _originalDuration: Duration;
  _originalStartOffset: Duration;
  _zoomedDuration: null | Duration;
  _zoomedStartOffset: null | Duration;

  constructor(
    graphList?: Array<TimeScalable>,
    originalDuration?: Duration,
    originalStartOffset?: Duration,
  ) {
    const glist = graphList ? graphList : []; // in case null

    this._graphSet = new Set(glist);
    this._zoomedDuration = null;
    this._zoomedStartOffset = null;

    if (originalDuration) {
      this._originalDuration = originalDuration;
      // so know that duration passed in instead of calculated
      // this prevents future links from causeing recalc
      this._zoomedDuration = originalDuration;
    } else {
      this._originalDuration = glist.reduce((acc, cur) => {
        return acc > cur.duration
          ? acc
          : cur.duration;
      }, Duration.fromMillis(0));
    }

    if (originalStartOffset) {
      this._originalStartOffset = originalStartOffset;
    } else {
      this._originalStartOffset = Duration.fromMillis(0);
    }
  }

  /**
   * Link new TimeScalable with this time scale.
   *
   * @param   graph TimeScalable to link
   */
  link(graph: TimeScalable) {
    this._graphSet.add(graph);

    if (!isDef(this._zoomedDuration)) {
      // assume before any zooming, so recalc duration
      if (
        graph.duration >
        this._originalDuration
      ) {
        this._originalDuration = graph.duration;
      }
    }

    this.recalculate();
  }

  /**
   * Unlink TimeScalable with this amplitude scale.
   *
   * @param   graph TimeScalable to unlink
   */
  unlink(graph: TimeScalable) {
    this._graphSet.delete(graph);

    this.recalculate();
  }

  zoom(startOffset: Duration, duration: Duration) {
    this._zoomedDuration = duration;
    this._zoomedStartOffset = startOffset;
    this.recalculate();
  }

  unzoom() {
    this._zoomedDuration = null;
    this._zoomedStartOffset = null;
    this.recalculate();
  }

  get offset(): Duration {
    return this._zoomedStartOffset
      ? this._zoomedStartOffset
      : this._originalStartOffset;
  }

  set offset(offset: Duration) {
    this._originalStartOffset = offset;
    this.recalculate();
  }

  get duration(): Duration {
    return this._zoomedDuration ? this._zoomedDuration : this._originalDuration;
  }

  set duration(duration: Duration) {
    this._originalDuration = duration;
    this.recalculate();
  }

  get origOffset(): Duration {
    return this._originalStartOffset;
  }
  get origDuration(): Duration {
    return this._originalDuration;
  }

  /**
   * Recalculate the best time scale for all Seismographs. Causes a redraw.
   */
  recalculate() {
    const graphList = Array.from(this._graphSet.values());
    graphList.forEach(graph => {
      // run later via event loop
      setTimeout(() => {
        graph.notifyTimeRangeChange(this.offset, this.duration);
      });
    });
  }
}
