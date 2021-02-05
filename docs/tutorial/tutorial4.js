let queryTimeWindow = new seisplotjs.util.StartEndDuration('2019-07-01', '2019-07-31');
let eventQuery = new seisplotjs.fdsnevent.EventQuery()
  .timeWindow(queryTimeWindow)
  .minMag(7)
  .latitude(35).longitude(-118)
  .maxRadius(3);
let stationQuery = new seisplotjs.fdsnstation.StationQuery()
  .networkCode('CO')
  .stationCode('HODGE')
  .locationCode('00')
  .channelCode('LH?')
  .timeWindow(queryTimeWindow);
// snip start traveltime
Promise.all( [ eventQuery.query(), stationQuery.queryChannels() ] )
  .then( ( [ quakeList, networks ] ) => {
    let taupQuery = new seisplotjs.traveltime.TraveltimeQuery()
      .latLonFromStation(networks[0].stations[0])
      .latLonFromQuake(quakeList[0])
      .phases("P,S");
    return Promise.all( [ quakeList, networks, taupQuery.queryJson() ] );
// snip start markers
  }).then( ( [ quakeList, networks, ttimes ] ) => {
    let phaseMarkers = seisplotjs.seismograph.createMarkersForTravelTimes(quakeList[0], ttimes);
    phaseMarkers.push({
      markertype: 'predicted',
      name: "origin",
      time: seisplotjs.moment.utc(quakeList[0].time)
    });
    let allChannels = Array.from(seisplotjs.stationxml.allChannels(networks));
    let firstP = ttimes.arrivals.find(a => a.phase.startsWith('P'));
    let startTime = seisplotjs.moment.utc(quakeList[0].time)
      .add(firstP.time, 'seconds').subtract(30, 'seconds');
    let timeWindow = new seisplotjs.util.StartEndDuration(startTime, null, 1800);
    let seismogramDataList = allChannels.map(c => {
      let sdd = seisplotjs.seismogram.SeismogramDisplayData.fromChannelAndTimeWindow(c, timeWindow);
      sdd.addQuake(quakeList);
      sdd.addMarkers(phaseMarkers);
      return sdd;
    });
    let dsQuery = new seisplotjs.fdsndataselect.DataSelectQuery();
    return Promise.all( [ quakeList, networks, ttimes, dsQuery.postQuerySeismograms(seismogramDataList) ] );
// snip start seismograph
  }).then( ( [ quakeList, networks, ttimes, seismogramDataList ] ) => {
    let div = seisplotjs.d3.select('div#myseismograph');
    let graphList = [];
    let commonSeisConfig = new seisplotjs.seismographconfig.SeismographConfig();
    commonSeisConfig.linkedAmpScale = new seisplotjs.seismographconfig.LinkedAmpScale();
    commonSeisConfig.linkedTimeScale = new seisplotjs.seismographconfig.LinkedTimeScale();
    commonSeisConfig.wheelZoom = false;
    commonSeisConfig.doGain = true;
    for( let sdd of seismogramDataList) {
      let seisConfig = commonSeisConfig.clone();
      let subdiv = div.append('div').classed('seismograph', true);
      let graph = new seisplotjs.seismograph.Seismograph(subdiv,
                                                         seisConfig,
                                                         seismogramDataList);
      //graphList.forEach(g => graph.linkXScaleTo(g));
      graphList.push(graph);
      graph.draw();
    }
    seisplotjs.d3.select('span#stationCode').text(networks[0].stations[0].codes());
    seisplotjs.d3.select('span#earthquakeDescription').text(quakeList[0].description);
    return Promise.all([ quakeList, networks, ttimes, seismogramDataList, graphList ]);
// snip start particlemotion
  }).then( ( [ quakeList, networks, ttimes, seismogramDataList, graphList ] ) => {
    let div = seisplotjs.d3.select('div#particlemotion');
    let firstS = ttimes.arrivals.find(a => a.phase.startsWith('S'));
    let windowDuration = 60;
    let firstSTimeWindow = new seisplotjs.util.StartEndDuration(
      seisplotjs.moment.utc(quakeList[0].time).add(firstS.time, 'seconds').subtract(windowDuration/4, 'seconds'),
      null,
      windowDuration);
    seismogramDataList.forEach(sdd => sdd.addMarkers({
      name: "pm start",
      time: firstSTimeWindow.startTime,
      type: "other",
      description: "pm start"}));
    seismogramDataList.forEach(sdd => sdd.addMarkers({
      name: "pm end",
      time: firstSTimeWindow.endTime,
      type: "other",
      description: "pm end"}));
    graphList.forEach(g => g.drawMarkers());
    let xSeisData = seismogramDataList[0].cut(firstSTimeWindow);
    let ySeisData = seismogramDataList[1].cut(firstSTimeWindow);
    let zSeisData = seismogramDataList[2].cut(firstSTimeWindow);
    let spanA = div.append('div').classed('particlemotionContainer', true);
    let spanB = div.append('div').classed('particlemotionContainer', true);
    let spanC = div.append('div').classed('particlemotionContainer', true);

    let minMax = seisplotjs.seismogram.findMinMax([ xSeisData, ySeisData, zSeisData]);

    let seismographConfig = new seisplotjs.seismographconfig.SeismographConfig();
    seismographConfig.margin.left = 60;
    seismographConfig.margin.top = seismographConfig.margin.bottom;
    seismographConfig.margin.right = seismographConfig.margin.left;
    seismographConfig.fixedTimeScale = firstSTimeWindow;
    seismographConfig.fixedYScale = minMax;

    let seisConfigA = seismographConfig.clone();
    seisConfigA.title = xSeisData.channelCode+" "+ySeisData.channelCode;
    seisConfigA.xLabel = xSeisData.channelCode;
    seisConfigA.yLabel = ySeisData.channelCode;
    let pmpA = new seisplotjs.particlemotion.ParticleMotion(spanA, seisConfigA, xSeisData, ySeisData);
    pmpA.draw();

    let seisConfigB = seismographConfig.clone();
    seisConfigB.title = xSeisData.channelCode+" "+zSeisData.channelCode;
    seisConfigB.xLabel = xSeisData.channelCode;
    seisConfigB.yLabel = zSeisData.channelCode;
    let pmpB = new seisplotjs.particlemotion.ParticleMotion(spanB, seisConfigB, xSeisData, zSeisData);
    pmpB.draw();

    let seisConfigC = seismographConfig.clone();
    seisConfigC.title = ySeisData.channelCode+" "+zSeisData.channelCode;
    seisConfigC.xLabel = ySeisData.channelCode;
    seisConfigC.yLabel = zSeisData.channelCode;
    let pmpC = new seisplotjs.particlemotion.ParticleMotion(spanC, seisConfigC, ySeisData, zSeisData);
    pmpC.draw();

    return Promise.all([ quakeList, networks, ttimes, seismogramDataList ]);
  }).catch( function(error) {
    seisplotjs.d3.select("div#myseismograph").append('p').html("Error loading data." +error);
    console.assert(false, error);
  });