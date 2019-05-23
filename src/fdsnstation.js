// @flow

import RSVP from 'rsvp';

RSVP.on('error', function(reason) {
  console.assert(false, reason);
});

import moment from 'moment';
import {Network, Station, Channel, InstrumentSensitivity, Response, Stage, PolesZeros, FIR, CoefficientsFilter, Decimation, Gain} from './stationxml';

// special due to flow
import {checkProtocol, createComplex, toIsoWoZ, hasArgs, hasNoArgs, isStringArg, isNumArg, checkStringOrDate, stringify} from './util';

export const LEVEL_NETWORK = 'network';
export const LEVEL_STATION = 'station';
export const LEVEL_CHANNEL = 'channel';
export const LEVEL_RESPONSE = 'response';

export const LEVELS = [ LEVEL_NETWORK, LEVEL_STATION, LEVEL_CHANNEL, LEVEL_RESPONSE];

export const IRIS_HOST = "service.iris.edu";

/** xml namespace for stationxml */
export const STAML_NS = 'http://www.fdsn.org/xml/station/1';

/** a fake, completely empty stationxml document in case of no data. */
export const FAKE_EMPTY_XML = '<?xml version="1.0" encoding="ISO-8859-1"?> <FDSNStationXML xmlns="http://www.fdsn.org/xml/station/1" schemaVersion="1.0" xsi:schemaLocation="http://www.fdsn.org/xml/station/1 http://www.fdsn.org/xml/station/fdsn-station-1.0.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:iris="http://www.fdsn.org/xml/station/1/iris"> </FDSNStationXML>';


/**
 * Query to a FDSN Station web service.
 * @see http://www.fdsn.org/webservices/
*/
export class StationQuery {
  /** @private */
  _specVersion: number;
  /** @private */
  _protocol: string;
  /** @private */
  _host: string;
  /** @private */
  _port: number;
  /** @private */
  _nodata: number;
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
  _startBefore: moment;
  /** @private */
  _endBefore: moment;
  /** @private */
  _startAfter: moment;
  /** @private */
  _endAfter: moment;
  /** @private */
  _minLat: number;
  /** @private */
  _maxLat: number;
  /** @private */
  _minLon: number;
  /** @private */
  _maxLon: number;
  /** @private */
  _latitude: number;
  /** @private */
  _longitude: number;
  /** @private */
  _minRadius: number;
  /** @private */
  _maxRadius: number;
  /** @private */
  _includeRestricted: boolean;
  /** @private */
  _includeAvailability: boolean;
  /** @private */
  _format: string;
  /** @private */
  _updatedAfter: moment;
  /** @private */
  _matchTimeseries: boolean;
  /** Construct a query
   * @param host the host to connect to , defaults to service.iris.edu
   */
  constructor(host?: string) {
    this._specVersion = 1;
    this._protocol = checkProtocol();
    this.host(host);
    if (! host) {
      this._host = IRIS_HOST;
    }
    this._port = 80;
  }
  /** Gets/Sets the version of the fdsnws spec, 1 is currently the only value.
   *  Setting this is probably a bad idea as the code may not be compatible with
   *  the web service.
  */
  specVersion(value?: number): number | StationQuery {
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
  protocol(value?: string): string | StationQuery {
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
  host(value?: string): string | StationQuery {
    if (isStringArg(value)) {
      this._host = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._host;
    } else {
      throw new Error('value argument is optional or string, but was '+typeof value);
    }
  }
  /** Gets/Sets the remote port to connect to.
  */
  port(value?: number): number | StationQuery {
    if (hasNoArgs(value)) {
      return this._port;
    } else if (hasArgs(value)) {
      this._port = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Gets/Sets the nodata parameter, usually 404 or 204 (default), controlling
   * the status code when no matching data is found by the service.
   */
  nodata(value?: number): number | StationQuery {
    if (hasNoArgs(value)) {
      return this._nodata;
    } else if (hasArgs(value)) {
      this._nodata = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Get/Set the network query parameter.
  */
  networkCode(value?: string): string | StationQuery {
    if (isStringArg(value)) {
      this._networkCode = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._networkCode;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  /** Get/Set the station query parameter.
  */
  stationCode(value?: string): string | StationQuery {
    if (isStringArg(value)) {
      this._stationCode = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._stationCode;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  /** Get/Set the location query parameter.
  */
  locationCode(value?: string): string | StationQuery {
    if (isStringArg(value)) {
      this._locationCode = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._locationCode;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  /** Get/Set the channel query parameter.
  */
  channelCode(value?: string): string | StationQuery {
    if (isStringArg(value)) {
      this._channelCode = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._channelCode;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  /** Get/Set the starttime query parameter.
  */
  startTime(value?: moment): moment | StationQuery {
    if (hasNoArgs(value)) {
      return this._startTime;
    } else if (hasArgs(value)) {
      this._startTime = checkStringOrDate(value);
      return this;
    } else {
      throw new Error('value argument is optional or moment or string, but was '+typeof value);
    }
  }
  /** Get/Set the endtime query parameter.
  */
  endTime(value?: moment): moment | StationQuery {
    if (hasNoArgs(value)) {
      return this._endTime;
    } else if (hasArgs(value)) {
      this._endTime = checkStringOrDate(value);
      return this;
    } else {
      throw new Error('value argument is optional or moment or string, but was '+typeof value);
    }
  }
  /** Get/Set the startbefore query parameter.
  */
  startBefore(value?: moment): moment | StationQuery {
    if (hasNoArgs(value)) {
      return this._startBefore;
    } else if (hasArgs(value)) {
      this._startBefore = checkStringOrDate(value);
      return this;
    } else {
      throw new Error('value argument is optional or moment or string, but was '+typeof value);
    }
  }
  /** Get/Set the endbefore query parameter.
  */
  endBefore(value?: moment): moment | StationQuery {
    if (hasNoArgs(value)) {
      return this._endBefore;
    } else if (hasArgs(value)) {
      this._endBefore = checkStringOrDate(value);
      return this;
    } else {
      throw new Error('value argument is optional or moment or string, but was '+typeof value);
    }
  }
  /** Get/Set the startafter query parameter.
  */
  startAfter(value?: moment): moment | StationQuery {
    if (hasNoArgs(value)) {
      return this._startAfter;
    } else if (hasArgs(value)) {
      this._startAfter = checkStringOrDate(value);
      return this;
    } else {
      throw new Error('value argument is optional or moment or string, but was '+typeof value);
    }
  }
  /** Get/Set the endafter query parameter.
  */
  endAfter(value?: moment): moment | StationQuery {
    if (hasNoArgs(value)) {
      return this._endAfter;
    } else if (hasArgs(value)) {
      this._endAfter = checkStringOrDate(value);
      return this;
    } else {
      throw new Error('value argument is optional or moment or string, but was '+typeof value);
    }
  }
  /** Get/Set the minlat query parameter.
  */
  minLat(value?: number): number | StationQuery {
    if (hasNoArgs(value)) {
      return this._minLat;
    } else if (isNumArg(value)) {
      this._minLat = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Get/Set the maxlon query parameter.
  */
  maxLat(value?: number): number | StationQuery {
    if (hasNoArgs(value)) {
      return this._maxLat;
    } else if (isNumArg(value)) {
      this._maxLat = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Get/Set the minlon query parameter.
  */
  minLon(value?: number): number | StationQuery {
    if (hasNoArgs(value)) {
      return this._minLon;
    } else if (isNumArg(value)) {
      this._minLon = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Get/Set the maxlon query parameter.
  */
  maxLon(value?: number): number | StationQuery {
    if (hasNoArgs(value)) {
      return this._maxLon;
    } else if (isNumArg(value)) {
      this._maxLon = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Get/Set the latitude query parameter.
  */
  latitude(value?: number): number | StationQuery {
    if (hasNoArgs(value)) {
      return this._latitude;
    } else if (isNumArg(value)) {
      this._latitude = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Get/Set the longitude query parameter.
  */
  longitude(value?: number): number | StationQuery {
    if (hasNoArgs(value)) {
      return this._longitude;
    } else if (isNumArg(value)) {
      this._longitude = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Get/Set the minradius query parameter.
  */
  minRadius(value?: number): number | StationQuery {
    if (hasNoArgs(value)) {
      return this._minRadius;
    } else if (isNumArg(value)) {
      this._minRadius = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Get/Set the maxradius query parameter.
  */
  maxRadius(value?: number): number | StationQuery {
    if (hasNoArgs(value)) {
      return this._maxRadius;
    } else if (isNumArg(value)) {
      this._maxRadius = value;
      return this;
    } else {
      throw new Error('value argument is optional or number, but was '+typeof value);
    }
  }
  /** Get/Set the includerestricted query parameter.
  */
  includeRestricted(value?: boolean): boolean | StationQuery {
    if (hasNoArgs(value)) {
      return this._includeRestricted;
    } else if (hasArgs(value)) {
      this._includeRestricted = value;
      return this;
    } else {
      throw new Error('value argument is optional or boolean, but was '+typeof value);
    }
  }
  /** Get/Set the includeavailability query parameter.
  */
  includeAvailability(value?: boolean): boolean | StationQuery {
    if (hasNoArgs(value)) {
      return this._includeAvailability;
    } else if (hasArgs(value)) {
      this._includeAvailability = value;
      return this;
    } else {
      throw new Error('value argument is optional or boolean, but was '+typeof value);
    }
  }
  /** Get/Set the format query parameter.
  */
  format(value?: string): string | StationQuery {
    if (isStringArg(value)) {
      this._format = value;
      return this;
    } else if (hasNoArgs(value)) {
      return this._format;
    } else {
      throw new Error('value argument is optional or string, but was '+value);
    }
  }
  /** Get/Set the updatedafter query parameter.
  */
  updatedAfter(value?: moment): moment | StationQuery {
    if (hasNoArgs(value)) {
      return this._updatedAfter;
    } else if (hasArgs(value)) {
      this._updatedAfter = checkStringOrDate(value);
      return this;
    } else {
      throw new Error('value argument is optional or moment or string, but was '+typeof value);
    }
  }
  /** Get/Set the matchtimeseries query parameter.
  */
  matchTimeseries(value?: boolean): boolean | StationQuery {
    if (hasNoArgs(value)) {
      return this._matchTimeseries;
    } else if (hasArgs(value)) {
      this._matchTimeseries = value;
      return this;
    } else {
      throw new Error('value argument is optional or boolean, but was '+typeof value);
    }
  }

  /** Checks to see if any parameter that would limit the data
    * returned is set. This is a crude, coarse check to make sure
    * the client doesn't ask for EVERYTHING the server has. */
  isSomeParameterSet(): boolean {
    return _isDef(this._networkCode) ||
    _isDef(this._stationCode) ||
    _isDef(this._locationCode) ||
    _isDef(this._channelCode) ||
    _isDef(this._startTime) ||
    _isDef(this._endTime) ||
    _isDef(this._startBefore) ||
    _isDef(this._endBefore) ||
    _isDef(this._startAfter) ||
    _isDef(this._endAfter) ||
    _isDef(this._minLat) ||
    _isDef(this._maxLat) ||
    _isDef(this._minLon) ||
    _isDef(this._maxLon) ||
    _isDef(this._latitude) ||
    _isDef(this._longitude) ||
    _isDef(this._minRadius) ||
    _isDef(this._maxRadius) ||
    _isDef(this._updatedAfter);
  }

  /** Parses a FDSNStationXML Network xml element into a Network object.
   * @param xml the network xml Element
  */
  convertToNetwork(xml: Element): Network {
    let out = new Network(_grabAttribute(xml, "code"));
    out.startDate = _grabAttribute(xml, "startDate");
    const rs = _grabAttribute(xml, "restrictedStatus");
    if (rs) { out.restrictedStatus = rs; }
    const desc = _grabFirstElText(xml, 'Description');
    if (desc) {out.description = desc;}
    if (_grabAttribute(xml, "endDate")) {
      out.endDate = _grabAttribute(xml, "endDate");
    }
    let totSta = xml.getElementsByTagNameNS(STAML_NS, "TotalNumberStations");
    if (totSta && totSta.length >0) {
      out.totalNumberStations = parseInt(_grabFirstElText(xml, "TotalNumberStations"));
    }
    let staArray = xml.getElementsByTagNameNS(STAML_NS, "Station");
    let stations = [];
    for (let i=0; i<staArray.length; i++) {
      stations.push(this.convertToStation(out, staArray.item(i)));
    }
    out.stations = stations;
    return out;
  }
  /** Parses a FDSNStationXML Station xml element into a Station object.
   * @param network the containing network
   * @param xml the station xml Element
  */
  convertToStation(network: Network, xml: Element): Station {
    let out = new Station(network, _grabAttribute(xml, "code"));
    out.startDate = _grabAttribute(xml, "startDate");
    const rs = _grabAttribute(xml, "restrictedStatus");
    if (rs) { out.restrictedStatus = rs; }
    out.latitude = _grabFirstElFloat(xml, 'Latitude');
    out.longitude = _grabFirstElFloat(xml, 'Longitude');
    out.elevation = _grabFirstElFloat(xml, 'Elevation');
    out.name = _grabFirstElText(_grabFirstEl(xml, 'Site'), 'Name');
    if (_grabAttribute(xml, "endDate")) {
      out.endDate = _grabAttribute(xml, "endDate");
    }
    let chanArray = xml.getElementsByTagNameNS(STAML_NS, "Channel");
    let channels = [];
    for (let i=0; i<chanArray.length; i++) {
      channels.push(this.convertToChannel(out, chanArray.item(i)));
    }
    out.channels = channels;
    return out;
  }
  /** Parses a FDSNStationXML Channel xml element into a Channel object.
   * @param station the containing staton
   * @param xml the channel xml Element
  */
  convertToChannel(station: Station, xml: Element): Channel {
    let out = new Channel(station, _grabAttribute(xml, "code"), _grabAttribute(xml, "locationCode"));
    out.startDate = _grabAttribute(xml, "startDate");
    const rs = _grabAttribute(xml, "restrictedStatus");
    if (rs) { out.restrictedStatus = rs; }
    out.latitude = _grabFirstElFloat(xml, 'Latitude');
    out.longitude = _grabFirstElFloat(xml, 'Longitude');
    out.elevation = _grabFirstElFloat(xml, 'Elevation');
    out.depth = _grabFirstElFloat(xml, 'Depth');
    out.azimuth = _grabFirstElFloat(xml, 'Azimuth');
    out.dip = _grabFirstElFloat(xml, 'Dip');
    out.sampleRate = _grabFirstElFloat(xml, 'SampleRate');
    if (_grabAttribute(xml, "endDate")) {
      out.endDate = _grabAttribute(xml, "endDate");
    }
    let responseXml = xml.getElementsByTagNameNS(STAML_NS, 'Response');
    if (responseXml && responseXml.length > 0 ) {
      out.response = this.convertToResponse(responseXml.item(0));
    }
    return out;
  }

  /** Parses a FDSNStationXML Response xml element into a Response object.
   * @param responseXml the response xml Element
  */
  convertToResponse(responseXml: Element): Response {
    let mythis = this;
    let out;
    let inst = responseXml.getElementsByTagNameNS(STAML_NS, 'InstrumentSensitivity');
    if (inst && inst.item(0)) {
      out = new Response(this.convertToInstrumentSensitivity(inst.item(0)));
    } else {
      // DMC returns empty response element when they know nothing (instead
      // of just leaving it out). Return empty object in this case
      out = new Response();
    }
    let xmlStages = responseXml.getElementsByTagNameNS(STAML_NS, 'Stage');
    if (xmlStages && xmlStages.length > 0) {
      let jsStages = Array.from(xmlStages).map(function(stageXml) {
        return mythis.convertToStage(stageXml);
      });
      out.stages = jsStages;
    }
    return out;
  }

  /** Parses a FDSNStationXML InstrumentSensitivity xml element into a InstrumentSensitivity object.
   * @param xml the InstrumentSensitivity xml Element
  */
  convertToInstrumentSensitivity(xml: Element): InstrumentSensitivity {
    let sensitivity: number = _grabFirstElFloat(xml, 'Value');
    let frequency = _grabFirstElFloat(xml, 'Frequency');
    let inputUnits = _grabFirstElText(_grabFirstEl(xml, 'InputUnits'), 'Name');
    let outputUnits = _grabFirstElText(_grabFirstEl(xml, 'OutputUnits'), 'Name');
    return new InstrumentSensitivity(sensitivity, frequency, inputUnits, outputUnits);
  }

  /** Parses a FDSNStationXML Stage xml element into a Stage object.
   * @param xml the Stage xml Element
  */
  convertToStage(stageXml: Element): Stage {
    let subEl = stageXml.firstElementChild;
    if (! subEl) {
      throw new Error("Stage element has no child elements");
    }
    let filter: AbstractFilterType | null = null;
    let inputUnits = _grabFirstElText(_grabFirstEl(stageXml, 'InputUnits'), 'Name');
    let outputUnits = _grabFirstElText(_grabFirstEl(stageXml, 'OutputUnits'), 'Name');
    if (subEl.localName == 'PolesZeros') {
      filter = new PolesZeros(inputUnits, outputUnits);
      filter.pzTransferFunctionType = _grabFirstElText(stageXml, 'PzTransferFunctionType');
      filter.normalizationFactor = _grabFirstElFloat(stageXml, 'NormalizationFactor');
      filter.normalizationFrequency = _grabFirstElFloat(stageXml, 'NormalizationFrequency');
      let zeros = Array.from(stageXml.getElementsByTagNameNS(STAML_NS, 'Zero'))
          .map(function(zeroEl) {
            return createComplex(_grabFirstElFloat(zeroEl, 'Real'),
                               _grabFirstElFloat(zeroEl, 'Imaginary'));
          });
      let poles = Array.from(stageXml.getElementsByTagNameNS(STAML_NS, 'Pole'))
          .map(function(poleEl) {
            return createComplex(_grabFirstElFloat(poleEl, 'Real'),
                               _grabFirstElFloat(poleEl, 'Imaginary'));
          });
      filter.zeros = zeros;
      filter.poles = poles;
    } else if (subEl.localName == 'Coefficients') {
      let coeffXml = subEl;
      filter = new CoefficientsFilter(inputUnits, outputUnits);
      filter.cfTransferFunction = _grabFirstElText(coeffXml, 'CfTransferFunctionType');
      filter.numerator = Array.from(coeffXml.getElementsByTagNameNS(STAML_NS, 'Numerator'))
          .map(function(numerEl) {
            return parseFloat(numerEl.textContent);
          });
      filter.denominator = Array.from(coeffXml.getElementsByTagNameNS(STAML_NS, 'Denominator'))
          .map(function(denomEl) {
            return parseFloat(denomEl.textContent);
          });
    } else if (subEl.localName == 'ResponseList') {
      throw new Error("ResponseList not supported: ");
    } else if (subEl.localName == 'FIR') {
      let firXml = subEl;
      filter = new FIR(inputUnits, outputUnits);
      filter.symmetry = _grabFirstElText(firXml, 'Symmetry');
      filter.numerator = Array.from(firXml.getElementsByTagNameNS(STAML_NS, 'NumeratorCoefficient'))
          .map(function(numerEl) {
            return parseFloat(numerEl.textContent);
          });
    } else if (subEl.localName == 'Polynomial') {
      throw new Error("Polynomial not supported: ");
    } else if (subEl.localName == 'StageGain') {
      // gain only stage, pick it up below
    } else {
      throw new Error("Unknown Stage type: "+ subEl.localName);
    }

    if (filter) {
      // add description and name if it was there
      let description = _grabFirstElText(subEl, 'Description');
      if (description) {
        filter.description = description;
      }
      if (subEl.hasAttribute('name')) {
        filter.name = _grabAttribute(subEl, 'name');
      }
    }
    let decimationXml = _grabFirstEl(stageXml, 'Decimation');
    let decimation: Decimation | null = null;
    if (decimationXml) {
      decimation = this.convertToDecimation(decimationXml);
    }
    let gainXml = _grabFirstEl(stageXml, 'StageGain');
    let gain = null;
    if (gainXml) {
      gain = this.convertToGain(gainXml);
    } else {
      throw new Error("Did not find Gain in stage number "+stringify(_grabAttribute(stageXml, "number")));
    }
    let out = new Stage(filter, decimation, gain);

    return out;
  }

  /** Parses a FDSNStationXML Decimation xml element into a Decimation object.
   * @param xml the Decimation xml Element
  */
  convertToDecimation(decXml: Element): Decimation {
    let out = new Decimation();
    out.inputSampleRate = _grabFirstElFloat(decXml, 'InputSampleRate');
    out.factor = _grabFirstElInt(decXml, 'Factor');
    out.offset = _grabFirstElInt(decXml, 'Offset');
    out.delay = _grabFirstElFloat(decXml, 'Delay');
    out.correction = _grabFirstElFloat(decXml, 'Correction');
    return out;
  }

  /** Parses a FDSNStationXML Gain xml element into a Gain object.
   * @param xml the Gain xml Element
  */
  convertToGain(gainXml: Element): Gain {
    let out = new Gain();
    out.value = _grabFirstElFloat(gainXml, 'Value');
    out.frequency = _grabFirstElFloat(gainXml, 'Frequency');
    return out;
  }

  /** Queries the remote web service for networks.
   * @returns a Promise to an Array of Network objects.
   */
  queryNetworks(): Promise<Array<Network>> {
    return this.query(LEVEL_NETWORK);
  }
  /** Queries the remote web service for stations. The stations
   * are contained within their respective Networks.
   * @returns a Promise to an Array of Network objects.
   */
  queryStations(): Promise<Array<Network>> {
    return this.query(LEVEL_STATION);
  }
  /** Queries the remote web service for channels. The Channels
   * are contained within their respective Stations which are in Networks.
   * @returns a Promise to an Array of Network objects.
   */
  queryChannels(): Promise<Array<Network>> {
    return this.query(LEVEL_CHANNEL);
  }
  /** Queries the remote web service for responses. The Responses
   * are contained within their respective Channels,
   * which are in Stations which are in Networks.
   * @returns a Promise to an Array of Network objects.
   */
  queryResponse(): Promise<Array<Network>> {
    return this.query(LEVEL_RESPONSE);
  }

  /** Queries the remote web service at the given level.
   * @param level the level to query at, networ, station, channel or response.
   * @returns a Promise to an Array of Network objects.
   */
  query(level: string): Promise<Array<Network>> {
    if (! LEVELS.includes(level)) {throw new Error("Unknown level: '"+level+"'");}
    let mythis = this;
    return this.queryRawXml(level).then(function(rawXml) {
        return mythis.parseRawXml(rawXml);
    });
  }

  /** Parses the FDSN StationXML returned from a query.
   * @returns an Array of Network objects.
   */
  parseRawXml(rawXml: Document): Array<Network> {
    let top = rawXml.documentElement;
    if (! top) {throw new Error("No documentElement in XML");}
    let netArray = top.getElementsByTagNameNS(STAML_NS, "Network");
    let out = [];
    for (let i=0; i<netArray.length; i++) {
      out[i] = this.convertToNetwork(netArray.item(i));
    }
    return out;
  }
  /** Queries the remote web service at the given level for raw xml.
   * @param level the level to query at, network, station, channel or response.
   * @returns a Promise to an xml Document.
   */
  queryRawXml(level: string): Promise<Document> {
    let mythis = this;
    let mylevel = level;
    let promise = new RSVP.Promise(function(resolve, reject) {
      let client = new XMLHttpRequest();
      let url = mythis.formURL(mylevel);
      client.open("GET", url);
      client.ontimeout = function() {
        this.statusText = "Timeout "+this.statusText;
        reject(this);
      };
      client.onreadystatechange = handler;
      client.responseType = "text"; // use text so error isn't parsed as xml
      client.setRequestHeader("Accept", "application/xml");
      client.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
              let out = new DOMParser().parseFromString(this.response, "text/xml");
              resolve(out);
//            resolve(this.responseXML);
          } else if (this.status === 204 || (mythis.nodata() && this.status === mythis.nodata())) {

            // 204 is nodata, so successful but empty
            if (DOMParser) {
console.log("204 nodata so return empty xml");
              resolve(new DOMParser().parseFromString(FAKE_EMPTY_XML, "text/xml"));
            } else {
              throw new Error("Got 204 but can't find DOMParser to generate empty xml");
            }
          } else {
            reject(this);
          }
        }
      }
    });
    return promise;
  }
  /** Forms the URL to get version from the web service, without any query paramters
   * @return the url
  */
  formVersionURL() {
      return this.formBaseURL()+"/version";
  }


  /** Queries the remote web service to get its version
   * @return Promise to version string
  */
  queryVersion() {
    let mythis = this;
    let promise = new RSVP.Promise(function(resolve, reject) {
      let url = mythis.formVersionURL();
      let client = new XMLHttpRequest();
      client.open("GET", url);
      client.onreadystatechange = handler;
      client.responseType = "text";
      client.setRequestHeader("Accept", "text/plain");
      client.send();

      function handler() {
        if (this.readyState === this.DONE) {
          console.log("handle version: "+stringify(mythis.host())+" "+this.status);
          if (this.status === 200) {
            resolve(this.response);
          } else {
            console.log("Reject version: "+stringify(mythis.host())+" "+this.status);
            reject(this);
          }
        }
      }
    });
    return promise;
  }
  /**
  * Create a name=value parameter to add to a URL, including trailing ampersand
  */
  makeParam(name: string, val: mixed) {
    return name+"="+encodeURIComponent(stringify(val))+"&";
  }
  /** Forms the basic URL to contact the web service, without any query paramters
   * @return the url
  */
  formBaseURL() {
    let colon = ":";
    if (this._protocol.endsWith(colon)) {
      colon = "";
    }
    return this._protocol+colon+"//"+this._host+(this._port==80?"":(":"+this._port))+"/fdsnws/station/"+this._specVersion;
  }
  /** Form URL to query the remote web service, encoding the query parameters.
  */
  formURL(level: string) {
    let url = this.formBaseURL()+"/query?";
    if (! level) {throw new Error("level not specified, should be one of network, station, channel, response.");}
    url = url+this.makeParam("level", level);
    if (this._networkCode) { url = url+this.makeParam("net", this.networkCode());}
    if (this._stationCode) { url = url+this.makeParam("sta", this.stationCode());}
    if (this._locationCode) { url = url+this.makeParam("loc", this.locationCode());}
    if (this._channelCode) { url = url+this.makeParam("cha", this.channelCode());}
    if (this._startTime) { url = url+this.makeParam("starttime", toIsoWoZ(this.startTime()));}
    if (this._endTime) { url = url+this.makeParam("endtime", toIsoWoZ(this.endTime()));}
    if (this._startBefore) { url = url+this.makeParam("startbefore", toIsoWoZ(this.startBefore()));}
    if (this._startAfter) { url = url+this.makeParam("startafter", toIsoWoZ(this.startAfter()));}
    if (this._endBefore) { url = url+this.makeParam("endbefore", toIsoWoZ(this.endBefore()));}
    if (this._endAfter) { url = url+this.makeParam("endafter", toIsoWoZ(this.endAfter()));}
    if (this._minLat) { url = url+this.makeParam("minlat", this.minLat());}
    if (this._maxLat) { url = url+this.makeParam("maxlat", this.maxLat());}
    if (this._minLon) { url = url+this.makeParam("minlon", this.minLon());}
    if (this._maxLon) { url = url+this.makeParam("maxlon", this.maxLon());}
    if (this._latitude) { url = url+this.makeParam("lat", this.latitude());}
    if (this._longitude) { url = url+this.makeParam("lon", this.longitude());}
    if (this._minRadius) { url = url+this.makeParam("minradius", this.minRadius());}
    if (this._maxRadius) { url = url+this.makeParam("maxradius", this.maxRadius());}
    if (this._includeRestricted) { url = url+this.makeParam("includerestricted", this.includeRestricted());}
    if (this._includeAvailability) { url = url+this.makeParam("includeavailability", this.includeAvailability());}
    if (this._updatedAfter) { url = url+this.makeParam("updatedafter", toIsoWoZ(this.updatedAfter()));}
    if (this._matchTimeseries) { url = url+this.makeParam("matchtimeseries", this.matchTimeseries());}
    if (this._format) { url = url+this.makeParam("format", this.format());}
    if (this._nodata) { url = url+this.makeParam("nodata", this.nodata());}
    if (url.endsWith('&') || url.endsWith('?')) {
      url = url.substr(0, url.length-1); // zap last & or ?
    }
    return url;
  }

}


// these are similar methods as in seisplotjs-fdsnstation
// duplicate here to avoid dependency and diff NS, yes that is dumb...

const _isDef = function(v: mixed): boolean  %checks {
  return typeof v !== 'undefined' && v !== null;
};

const _grabFirstEl = function(xml: Element | null | void, tagName: string): Element | void {
  let out = undefined;
  if (_isDef(xml)) {
    let el = xml.getElementsByTagName(tagName);
    if (_isDef(el) && el.length > 0) {
      out = el.item(0);
    }
  }
  return out;
};

const _grabFirstElText = function _grabFirstElText(xml: Element | null | void, tagName: string): string | void {
  let out = undefined;
  let el = _grabFirstEl(xml, tagName);
  if (_isDef(el)) {
    out = el.textContent;
  }
  return out;
};

const _grabFirstElFloat = function _grabFirstElFloat(xml: Element | null | void, tagName: string): number | void {
  let out = undefined;
  let elText = _grabFirstElText(xml, tagName);
  if (_isDef(elText)) {
    out = parseFloat(elText);
  }
  return out;
};

const _grabFirstElInt = function _grabFirstElInt(xml: Element | null | void, tagName: string): number | void {
  let out = undefined;
  let elText = _grabFirstElText(xml, tagName);
  if (_isDef(elText)) {
    out = parseInt(elText);
  }
  return out;
};

const _grabAttribute = function _grabAttribute(xml: Element | null | void, tagName: string): string | void {
  let out = undefined;
  if (_isDef(xml)) {
    let a = xml.getAttribute(tagName);
    if (_isDef(a)) {
      out = a;
    }
  }
  return out;
};

const _grabAttributeNS = function(xml: Element | null | void, namespace: string, tagName: string): string | void {
  let out = undefined;
  if (_isDef(xml)) {
    let a = xml.getAttributeNS(namespace, tagName);
    if (_isDef(a)) {
      out = a;
    }
  }
  return out;
};

export const util = {
  "_grabFirstEl": _grabFirstEl,
  "_grabFirstElText": _grabFirstElText,
  "_grabFirstElFloat": _grabFirstElFloat,
  "_grabFirstElInt": _grabFirstElInt,
  "_grabAttribute": _grabAttribute,
  "_grabAttributeNS": _grabAttributeNS
};