//@flow

/*
 * Philip Crotwell
 * University of South Carolina, 2019
 * http://www.seis.sc.edu
 */

import { SeismogramDisplayData, Seismogram } from './seismogram.js';
import {StartEndDuration, isDef } from './util.js';
import moment from 'moment';
import * as d3 from 'd3';
import Handlebars from 'handlebars';

export type MarginType = {
  top: number,
  right: number,
  bottom: number,
  left: number
};

/** Constant for drawing seismogram using svg. */
export const DRAW_SVG = "svg";
/** Constant for drawing seismogram using canvas, axies are still svg. */
export const DRAW_CANVAS = "canvas";
/** Constant for drawing seismogram using both canvas and svg, for testing. */
export const DRAW_BOTH = "both"; // for testing
/** Constant for drawing seismogram using both canvas and svg plus alignment markers, for testing. */
export const DRAW_BOTH_ALIGN = "alignment"; // for testing

export const DEFAULT_TITLE = "{{#each seisDataList}}<tspan>{{onlyChangesChannel ../seisDataList @index}}</tspan> {{else}}No Data{{/each}}";

/**
 * Configuration object for Seismograph display.
 *
 */
export class SeismographConfig {
  drawingType: string; // canvas or svg
  xScaleFormat: (date: Date) => string;
  yScaleFormat: string | (value: number) => string;
  /** @private */
  _title: Array<string>;
  /** @private */
  _handlebarsCompiled: null | ({},{}) => string;
  isXAxis: boolean;
  isXAxisTop: boolean;
  xLabel: string;
  xLabelOrientation: string;
  xSublabel: string;
  isYAxis: boolean;
  isYAxisRight: boolean;
  isYAxisNice: boolean;
  yLabel: string;
  yLabelRight: string;
  yLabelOrientation: string;
  ySublabel: string;
  ySublabelTrans: number;
  ySublabelIsUnits: boolean;
  doMarkers: boolean;
  markerTextOffset: number;
  markerTextAngle: number;
  markerFlagpoleBase: string;
  minHeight: number;
  maxHeight: number;
  margin: MarginType;
  segmentDrawCompressedCutoff: number;//below this draw all points, above draw minmax
  maxZoomPixelPerSample: number; // no zoom in past point of sample
                                 // separated by pixels

  connectSegments: boolean;
  lineColors: Array<string>;
  lineWidth: number;
  wheelZoom: boolean;
  doRMean: boolean;
  doGain: boolean;
  windowAmp: boolean;
  fixedYScale: null | Array<number>;
  /** @private */
  _fixedTimeScale: null | StartEndDuration;
  linkedAmplitudeScale: null | LinkedAmpScale;
  /** @private */
  _linkedTimeScale: null | LinkedTimeScale;
  timeAlignmentStyle: string;
  isRelativeTime: boolean;

  constructor() {
    this.drawingType = DRAW_CANVAS;
    this.isXAxis = true;
    this.isXAxisTop = false;
    this.isYAxisNice = true;
    this.isYAxis = true;
    this.isYAxisRight = false;
    this.xScaleFormat = multiFormatHour;
    this.yScaleFormat = formatCountOrAmp;
    this._title = [DEFAULT_TITLE];
    this.xLabel = "Time";
    this.xLabelOrientation = "horizontal";
    this.xSublabel = "";
    this.yLabel = "Amplitude";
    this.yLabelRight = "";
    this.yLabelOrientation = "vertical";
    this.ySublabel = "";
    this.ySublabelTrans = 15;
    this.ySublabelIsUnits = true;
    this.doRMean = true;
    this.doGain = true;
    this.windowAmp = true;
    this.fixedYScale = null;
    this._fixedTimeScale = null;
    this.linkedAmplitudeScale = null;
    this._linkedTimeScale = new LinkedTimeScale();
    this.timeAlignmentStyle = 'start';
    this.isRelativeTime = false;
    this.doMarkers = true;
    this.markerTextOffset = .85;
    this.markerTextAngle = 45;
    this.markerFlagpoleBase = "bottom"; // bottom or center
    this.minHeight=0;
    this.margin = {top: 20, right: 20, bottom: 42, left: 85, toString: function() {return "t:"+this.top+" l:"+this.left+" b:"+this.bottom+" r:"+this.right;}};
    this.segmentDrawCompressedCutoff=10;//below this draw all points, above draw minmax
    this.maxZoomPixelPerSample = 20; // no zoom in past point of sample
                                     // separated by pixels

    this.wheelZoom = true;
    this.connectSegments = false;
    this.lineColors = [
       "skyblue",
       "olivedrab",
       "goldenrod",
       "firebrick",
       "darkcyan",
       "orange",
       "darkmagenta",
       "mediumvioletred",
       "sienna",
       "black"];
    this.lineWidth = 1;
  }

  get fixedTimeScale(): null | StartEndDuration {
    return this._fixedTimeScale;
  }
  set fixedTimeScale(ts: StartEndDuration) {
    this._fixedTimeScale = ts;
    this._linkedTimeScale = null;
  }

  get linkedTimeScale(): null | LinkedTimeScale {
    return this._linkedTimeScale;
  }
  set linkedTimeScale(ts: LinkedTimeScale) {
    this._linkedTimeScale = ts;
    this._fixedTimeScale = null;
  }

/**
 * gets the current title
 *
 * @returns        title as an array of strings
 */
  get title(): Array<string> {
    return this._title;
  }
  /**
   * Sets the title as simple string or array of strings or a
   * handlebars template. If an array
   * then each item will be in a separate tspan for easier formatting.
   *
   * @param value string or array of strings to be the title
   */
  set title(value: null | string | Array<string>) {
    if (! isDef(value)) {
      this._title = [ "" ];
    } else if (Array.isArray(value)) {
      this._title = value;
    } else {
      this._title = [ value ];
    }
    this._handlebarsCompiled = null;
  }

  handlebarsTitle(context: {}, runtimeOptions: {}): string {
    if (  ! isDef(this._handlebarsCompiled)) {
      if ( ! isDef(this._title) || this._title.length === 0 || ! isDef(this._title[0])) {
        // empty title
        return "";
      } else if (this._title.length === 1) {
        this._handlebarsCompiled = Handlebars.compile(this._title[0]);
      } else {
        this._handlebarsCompiled = Handlebars.compile(""+this._title.join(" "));
      }
    }
    return this._handlebarsCompiled(context, runtimeOptions);
  }

  /** Fake data to use to test alignment of seismograph axis and between canvas
   *  and svg drawing.
   *
   * @param   timeWindow start and end of fake data
   * @param   min        min amplitude for fake data, default is -100
   * @param   max        max amplitude for fake data, default is 100
   * @returns             fake data
   */
  createAlignmentData(timeWindow: StartEndDuration,
        min: number = -100,
        max: number = 100): SeismogramDisplayData {
    const mid = (max+min)/2;
    const fakeData = Float32Array.from([max, min, max, min, mid, mid, max, mid, mid, min]);

    const fakeSampleRate = 1/(timeWindow.duration.asSeconds()/(fakeData.length-1));
    const fakeSeis = Seismogram.createFromContiguousData(fakeData,
                                          fakeSampleRate,
                                          timeWindow.startTime );
    const fakeSDD = SeismogramDisplayData.fromSeismogram(fakeSeis);
    return fakeSDD;
  }

  getColorForIndex(i: number): string {
    if (isDef(this.lineColors) && this.lineColors.length > 0) {
      return this.lineColors[i%this.lineColors.length];
    } else {
        return "black";
    }
  }

  createCSSForLineColors() {
    console.log("createCSSForLineColors")
    let cssText = "";
    let numColors = this.lineColors.length;
    this.lineColors.forEach((color, index) => {
        cssText = cssText+`
        svg.seismograph g.title  text tspan:nth-child(${numColors}n+${index+1})  {
          stroke: ${color};
          fill: ${color};
          color: ${color};
        }
        `;
        if (this.drawingType !== DRAW_CANVAS) {
          // only needed if doing waveform as SVG, default is canvas
          cssText += `
          svg.seismograph g.allseismograms g:nth-child(${numColors}n+${index+1}) path.seispath {
            stroke: ${color};
          }
          `;
        }
      });
    return cssText;
  }

  clone(): SeismographConfig {
    let out = new SeismographConfig();
    Object.getOwnPropertyNames(this).forEach( name => {
      // $FlowFixMe
      if (this[name] instanceof moment) {
        // $FlowFixMe
        out[name] = moment.utc(this[name]);
        // $FlowFixMe
      } else if ( Array.isArray(this[name]) ) {
        // $FlowFixMe
        out[name] = this[name].slice();
      } else {
        // $FlowFixMe
        out[name] = this[name];
      }
      // handle margin separately
      out.margin = {
        top: this.margin.top,
        right: this.margin.right,
        bottom: this.margin.bottom,
        left: this.margin.left,
        toString: function() {return "t:"+this.top+" l:"+this.left+" b:"+this.bottom+" r:"+this.right;}
      };
    });
    return out;
  }
  toString(): string {
    let outS = "";
    Object.getOwnPropertyNames(this).forEach( name => {
      // $FlowFixMe
      outS += `  seisConfig.${name} = ${JSON.stringify(this[name])}\n`;
    });
    return outS;
  }
}

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
  alignmentTimeOffset: moment$MomentDuration;
  duration: moment$MomentDuration;
  constructor(alignmentTimeOffset: moment$MomentDuration, duration: moment$MomentDuration) {
    this.alignmentTimeOffset = alignmentTimeOffset;
    this.duration = duration;
  }
  // eslint-disable-next-line no-unused-vars
  notifyTimeRangeChange(alignmentTimeOffset: moment$MomentDuration, duration: moment$MomentDuration) {
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
  constructor(graphList: ?Array<AmplitudeScalable>) {
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
    const maxHalfRange  = graphList.reduce((acc, cur) => {
      return acc >  cur.halfWidth ? acc : cur.halfWidth;
    }, 0);
    graphList.forEach(g => {
      g.notifyAmplitudeChange(g.middle-maxHalfRange, g.middle+maxHalfRange);
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
  _originalDuration: moment$MomentDuration;
  _originalStartOffset: moment$MomentDuration;
  _zoomedDuration: null | moment$MomentDuration;
  _zoomedStartOffset: null | moment$MomentDuration;
  constructor(graphList: ?Array<TimeScalable>, originalDuration?: moment$MomentDuration, originalStartOffset?: moment$MomentDuration) {
    const glist = graphList ? graphList : []; // in case null
    this._graphSet = new Set(glist);
    this._zoomedDuration = null;
    this._zoomedStartOffset = null;

    if ( originalDuration) {
      this._originalDuration = originalDuration;
      // so know that duration passed in instead of calculated
      // this prevents future links from causeing recalc
      this._zoomedDuration = originalDuration;
    } else {
      this._originalDuration = glist.reduce((acc, cur) => {
        return acc.asMilliseconds() > cur.duration.asMilliseconds() ? acc : cur.duration;
      }, moment.duration(0));
    }
    if (originalStartOffset) {
      this._originalStartOffset = originalStartOffset;
    } else {
      this._originalStartOffset = moment.duration(0, 'seconds');
    }
  }
  /**
   * Link new TimeScalable with this time scale.
   *
   * @param   graph TimeScalable to link
   */
  link(graph: TimeScalable) {
    this._graphSet.add(graph);
    if ( ! isDef(this._zoomedDuration)) {
      // assume before any zooming, so recalc duration
      if (graph.duration.asMilliseconds() > this._originalDuration.asMilliseconds()) {
        this._originalDuration = moment.duration(graph.duration);
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
  zoom(startOffset: moment$MomentDuration, duration: moment$MomentDuration) {
    this._zoomedDuration = duration;
    this._zoomedStartOffset = startOffset;
    this.recalculate();
  }
  unzoom() {
    this._zoomedDuration = null;
    this._zoomedStartOffset = null;
    this.recalculate();
  }
  get offset(): moment$MomentDuration {
    return this._zoomedStartOffset ? this._zoomedStartOffset : this._originalStartOffset;
  }
  set offset(offset: moment$MomentDuration) {
    this._originalStartOffset = offset;
    this.recalculate();
  }
  get duration(): moment$MomentDuration{
    return this._zoomedDuration ? this._zoomedDuration : this._originalDuration;
  }
  set duration(duration: moment$MomentDuration) {
    this._originalDuration = duration;
    this.recalculate();
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


export const formatCount: (number)=>string  = d3.format('~s');
export const formatExp: (number)=>string  = d3.format('.2e');
export const formatCountOrAmp = function(v: number): string {
  return -1<v && v<1 && v !== 0 ? formatExp(v) : formatCount(v);
};

export const formatMillisecond: (Date)=>string  = d3.utcFormat(".%L");
export const formatSecond: (Date)=>string  = d3.utcFormat(":%S");
export const formatMinute: (Date)=>string  = d3.utcFormat("%H:%M");
export const formatHour: (Date)=>string  = d3.utcFormat("%H:%M");
export const formatDay: (Date)=>string  = d3.utcFormat("%m/%d");
export const formatMonth: (Date)=>string  = d3.utcFormat("%Y/%m");
export const formatYear: (Date)=>string  = d3.utcFormat("%Y");

export const multiFormatHour = function(date: Date): string {
  return (d3.utcSecond(date) < date ? formatMillisecond
      : d3.utcMinute(date) < date ? formatSecond
      : d3.utcHour(date) < date ? formatMinute
      : d3.utcDay(date) < date ? formatHour
      : d3.utcMonth(date) < date ?  formatDay
      : d3.utcYear(date) < date ? formatMonth
      : formatYear)(date);
};
