// @flow

import moment from 'moment';
import RSVP from 'rsvp';

RSVP.on('error', function(reason: string) {
  console.assert(false, reason);
});

// special due to flow
import {checkProtocol, toIsoWoZ, hasArgs, hasNoArgs, isStringArg, isNumArg, checkStringOrDate, stringify} from './util';

import * as miniseed from './miniseed';
import { Channel } from './stationxml';
import { Seismogram, SeismogramDisplayData } from './seismogram';
import {XML_MIME, TEXT_MIME, StartEndDuration, calcClockOffset, doFetchWithTimeout, defaultFetchInitObj, isDef} from './util.js';

export const FORMAT_MINISEED = 'mseed';

/**
 * Major version of the FDSN spec supported here.
 * Currently is 1.
 */
export const SERVICE_VERSION = 1;
/**
 * Service name as used in the FDSN DataCenters registry,
 * http://www.fdsn.org/datacenters
 */
export const SERVICE_NAME = `fdsnws-dataselect-${SERVICE_VERSION}`;

export const IRIS_HOST = "service.iris.edu";

/**
 * Query to a FDSN Dataselect web service.
 * @see http://www.fdsn.org/webservices/
*/
export class DataSelectQuery {
  /** @private */
  _specVersion: number;
  /** @private */
  _protocol: string;
  /** @private */
  _host: string;
  /** @private */
  _nodata: number;
  /** @private */
  _port: number;
  /** @private */
  _networkCode: string;
  /** @private */
  _stationCode: string;
  /** @private */
  _locationCode: string;
  /** @private */
  _channelCode: string;
  /** @private */
  _startTime: moment;
  /** @private */
  _endTime: moment;
  /** @private */
  _quality: string;
  /** @private */
  _minimumLength: number;
  /** @private */
  _longestOnly: boolean;
  /** @private */
  _repository: string;
  /** @private */
  _format: string;
  /** @private */
  _timeoutSec: number;
  constructor(host?: string) {
    this._specVersion = 1;
    this._protocol = checkProtocol();
    if (host) {
      this._host = host;
    } else {
      this._host = IRIS_HOST;
    }
    this._port = 80;
    this._timeoutSec = 30;
  }
  /** Gets/Sets the version of the fdsnws spec, 1 is currently the only value.
   *  Setting this is probably a bad idea as the code may not be compatible with
   *  the web service.
  */
  specVersion(value?: number): number | DataSelectQuery {
    if (hasArgs(value)) {
      this._specVersion = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._specVersion;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Gets/Sets the protocol, http or https. This should match the protocol
   *  of the page loaded, but is autocalculated and generally need not be set.
  */
  protocol(value?: string): string | DataSelectQuery {
    if (isStringArg(value)) {
      this._protocol = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._protocol;
    } else {
      throw new Error('value argument is optional or string, but was '+typeof value);
    }
  }
  /** Gets/Sets the remote host to connect to.
  */
  host(value?: string): string | DataSelectQuery {
    if (isStringArg(value)) {
      this._host = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._host;
    } else {
      throw new Error('value argument is optional or string, but was '+typeof value);
    }
  }
  /** Gets/Sets the nodata parameter, usually 404 or 204 (default), controlling
   * the status code when no matching data is found by the service.
   */
  nodata(value?: number): number | DataSelectQuery {
    if (hasNoArgs(value)) {
      return this._nodata;
    } else if (hasArgs(value)) {
      this._nodata = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Gets/Sets the remote port to connect to.
  */
  port(value?: number): number | DataSelectQuery {
    if (hasNoArgs(value)) {
      return this._port;
    } else if (isNumArg(value)) {
      this._port = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  networkCode(value?: string): string | DataSelectQuery {
    if (isStringArg(value)) {
      this._networkCode = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._networkCode;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  stationCode(value?: string): string | DataSelectQuery {
    if (isStringArg(value)) {
      this._stationCode = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._stationCode;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  locationCode(value?: string): string | DataSelectQuery {
    if (isStringArg(value)) {
      this._locationCode = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._locationCode;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  channelCode(value?: string): string | DataSelectQuery {
    if (isStringArg(value)) {
      this._channelCode = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._channelCode;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  startTime(value?: moment): moment | DataSelectQuery {
    if (hasNoArgs(value)) {
      return this._startTime;
    } else if (hasArgs(value)) {
      this._startTime = checkStringOrDate(value);
      return this;
    } else {
      throw new Error('value argument is optional or moment or string, but was '+typeof value);
    }
  }
  endTime(value?: moment): moment | DataSelectQuery {
    if (hasNoArgs(value)) {
      return this._endTime;
    } else if (hasArgs(value)) {
      this._endTime = checkStringOrDate(value);
      return this;
    } else {
      throw new Error('value argument is optional or moment or string, but was '+typeof value);
    }
  }
  /**
   * Sets startTime and endTime using the given time window
   * @param   se time window
   * @return     this
   */
  timeWindow(se: StartEndDuration) {
    this.startTime(se.startTime);
    this.endTime(se.endTime);
    return this;
  }
  quality(value?: string): string | DataSelectQuery {
    if (isStringArg(value)) {
      this._quality = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._quality;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  minimumLength(value?: number): number | DataSelectQuery {
    if (hasNoArgs(value)) {
      return this._minimumLength;
    } else if (hasArgs(value)) {
      this._minimumLength = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  longestOnly(value?: boolean): boolean | DataSelectQuery {
    if (hasNoArgs(value)) {
      return this._longestOnly;
    } else if (hasArgs(value)) {
      this._longestOnly = value;
      return this;
    } else {
      throw new Error('value argument is optional or boolean, but was '+typeof value);
    }
  }

  /** set or get the repository paramter. This is an IRIS-specific
  * parameter that will not work with other dataselect web services.
  */
  repository(value?: string): string | DataSelectQuery {
    if (isStringArg(value)) {
      this._repository = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._repository;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  format(value?: string): string | DataSelectQuery {
    if (isStringArg(value)) {
      this._format = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._format;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  /** Get/Set the timeout in seconds for the request. Default is 30.
  */
  timeout(value?: number): number | DataSelectQuery {
    if (hasNoArgs(value)) {
      return this._timeoutSec;
    } else if (isNumArg(value)) {
      this._timeoutSec = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }

  queryDataRecords(): Promise<Array<miniseed.DataRecord>> {
    const mythis = this;
    const url = this.formURL();
    const fetchInit = defaultFetchInitObj(miniseed.MINISEED_MIME);
    return doFetchWithTimeout(url, fetchInit, this._timeoutSec * 1000 )
      .then(function(response) {
        if (response.status === 204 || (mythis.nodata() && response.status === mythis.nodata())) {
          // no data
          return new ArrayBuffer(0);
        } else {
          return response.arrayBuffer();
        }
      }).then(function(rawBuffer) {
        let dataRecords = miniseed.parseDataRecords(rawBuffer);
        return dataRecords;
    });
  }
  querySeismograms(): Promise<Map<string, Seismogram>> {
    return this.queryDataRecords().then(dataRecords => {
      return miniseed.seismogramPerChannel(dataRecords);
    });
  }

  postQueryDataRecords(channelTimeList: Array<SeismogramDisplayData>): Promise<Array<miniseed.DataRecord>> {
    return this.postQueryRaw(channelTimeList)
    .then( fetchResponse => {
      if(fetchResponse.ok) {
        return fetchResponse.arrayBuffer().then(ab => {
          return miniseed.parseDataRecords(ab);
        });
      } else {
        console.log("fetchRespone not ok");
        return [];
      }
    });
  }
  /**
   * query the dataselect server using post, which allows for multiple
   * channel-timeranges at once. This assumes that there are not multiple
   * time ranges for the same channel as the results are returned one seismogram
   * per channels, which may contain gaps. The original channel timerange is
   * also populated with the resulting seismogram.
   * @param  {[type]} channelTimeList [description]
   * @return {[type]}                 [description]
   */
  postQuerySeismograms(channelTimeList: Array<SeismogramDisplayData>): Promise<Array<SeismogramDisplayData>> {
    return this.postQueryDataRecords(channelTimeList).then(dataRecords => {
      return miniseed.seismogramPerChannel(dataRecords);
    }).then(seisMap => {
      for (let ct of channelTimeList) {
        if (isDef(ct.channel)) {
          let channel = ct.channel;
          let codes = channel.codes();
          if (seisMap.has(codes)) {
            // odd, but keeps flow happy
            let seis = seisMap.get(channel.codes());
            if (seis) {
              ct.seismogram = seis;
            }
          }
        } else {
          throw new Error("Channel in missing in postQuerySeismograms");
        }
      }
      return channelTimeList;
    });
  }
  postQueryRaw(channelTimeList: Array<SeismogramDisplayData>): Promise<Response> {
    if (channelTimeList.length === 0) {
      // return promise faking an not ok fetch response
      return RSVP.hash({
        ok: false
      });
    } else {
      const fetchInit = defaultFetchInitObj(miniseed.MINISEED_MIME);
      fetchInit.method = "POST";
      fetchInit.body = this.createPostBody(channelTimeList);
      return doFetchWithTimeout(this.formURL(), fetchInit, this._timeoutSec * 1000 );
    }
  }

  createPostBody(channelTimeList: Array<SeismogramDisplayData>): string {
    let out = "";
    for (let ct of channelTimeList) {
      if (isDef(ct.channel)) {
        let channel = ct.channel;
        let sta = channel.station;
        let net = sta.network;
        out += `${net.networkCode} ${sta.stationCode} ${channel.locationCode} ${channel.channelCode} ${ct.startTime.toISOString()} ${ct.endTime.toISOString()}`;
        out += '\n';
      } else {
        throw new Error("Channel in missing in createPostBody");
      }
    }
    return out;
  }

  formBaseURL(): string {
      let colon = ":";
      if (this._protocol.endsWith(colon)) {
        colon = "";
      }
      return this._protocol+colon+"//"+this._host+(this._port===80?"":(":"+this._port))+"/fdsnws/dataselect/"+this._specVersion;
  }

  formVersionURL(): string {
    return this.formBaseURL()+"/version";
  }

  /** Queries the remote web service to get its version
   * @return Promise to version string
  */
  queryVersion(): Promise<string> {
    let url = this.formVersionURL();
    const fetchInit = defaultFetchInitObj(TEXT_MIME);
    return doFetchWithTimeout(url, fetchInit, this._timeoutSec * 1000 )
      .then(response => {
          if (response.status === 200) {
            return response.text();
          } else {
            throw new Error(`Status not 200: ${response.status}`);
          }
      });
  }

  makeParam(name: string, val: mixed): string {
    return name+"="+encodeURIComponent(stringify(val))+"&";
  }

  formURL(): string {
    let url = this.formBaseURL()+"/query?";
    if (this._networkCode) { url = url+this.makeParam("net", this.networkCode());}
    if (this._stationCode) { url = url+this.makeParam("sta", this.stationCode());}
    if (this._locationCode) { url = url+this.makeParam("loc", this.locationCode());}
    if (this._channelCode) { url = url+this.makeParam("cha", this.channelCode());}
    if (this._startTime) { url = url+this.makeParam("starttime", toIsoWoZ(this.startTime()));}
    if (this._endTime) { url = url+this.makeParam("endtime", toIsoWoZ(this.endTime()));}
    if (this._quality) { url = url+this.makeParam("quality", this.quality());}
    if (this._minimumLength) { url = url+this.makeParam("minimumlength", this.minimumLength());}
    if (this._repository) { url = url+this.makeParam("repository", this.repository());}
    if (this._longestOnly) { url = url+this.makeParam("longestonly", this.longestOnly());}
    if (this._format) { url = url+this.makeParam("format", this.format());}
    if (this._nodata) { url = url+this.makeParam("nodata", this.nodata());}

    if (url.endsWith('&') || url.endsWith('?')) {
      url = url.substr(0, url.length-1); // zap last & or ?
    }
    return url;
  }
}


export function createDataSelectQuery(params: Object): DataSelectQuery {
  if ( ! params || typeof params !== 'object' ) {
    throw new Error("params null or not an object");
  }
  let out = new DataSelectQuery();
  if (params.net) { out.networkCode(params.net); }
  if (params.network) { out.networkCode(params.network); }
  if (params.networkCode) { out.networkCode(params.networkCode); }
  if (params.sta) { out.stationCode(params.sta); }
  if (params.station) { out.stationCode(params.station); }
  if (params.stationCode) { out.stationCode(params.stationCode); }
  if (params.loc) { out.locationCode(params.loc); }
  if (params.location) { out.locationCode(params.location); }
  if (params.locationCode) { out.locationCode(params.locationCode); }
  if (params.chan) { out.channelCode(params.chan); }
  if (params.channel) { out.channelCode(params.channel); }
  if (params.channelCode) { out.channelCode(params.channelCode); }
  if (params.start) { out.startTime(params.start); }
  if (params.starttime) { out.startTime(params.starttime); }
  if (params.end) { out.endTime(params.end); }
  if (params.endtime) { out.endTime(params.endtime); }
  if (params.quality) { out.quality(params.quality); }
  if (params.minimumlength) { out.minimumLength(params.minimumlength); }
  if (params.repository) { out.repository(params.repository); }
  if (params.longestonly) { out.longestOnly(params.longestonly); }
  if (params.format) { out.format(params.format); }
  if (params.nodata) { out.nodata(params.nodata); }
  if (params.host) { out.host(params.host); }
  if (params.port) { out.port(params.port); }
  if (params.specVersion) { out.specVersion(params.specVersion); }
  return out;
}
