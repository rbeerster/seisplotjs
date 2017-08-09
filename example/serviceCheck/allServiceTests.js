
// big function to corral everything
var allFdsnTests = function() {


// seisplotjs comes from the seisplotjs standalone bundle
var fdsnevent = seisplotjs.fdsnevent;
var fdsnstation = seisplotjs.fdsnstation;
var fdsndataselect = seisplotjs.fdsndataselect;
var RSVP = fdsnstation.RSVP;


var DS = "fdsnws-dataselect";
var EV = "fdsn-event";
var ST = "fdsn-station";



// all tests should be object with testid, testname and test: function(datacenter, d3selector)

var testEventVersion = {
  testname: "Event Version",
  testid: "eventversion",
  description: "Queries the version of the service, success as long as the query returns something",
  webservices: [ EV ],
  severity: 'severe',
  test: function(dc) {
    var host = serviceHost(dc, EV);

    var quakeQuery = new fdsnevent.EventQuery()
      .host(host);
    var url = quakeQuery.formVersionURL();
    return quakeQuery.queryVersion().then(function(version) {
      return {
        text: version,
        output: version,
        url: url
      };
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
  }
};


var testStationVersion = {
  testname: "Station Version",
  testid: "stationversion",
  description: "Queries the version of the service, success as long as the query returns something",
  webservices: [ ST ],
  severity: 'severe',
  test: function(dc) {
    var host = serviceHost(dc, ST);

    var query = new fdsnstation.StationQuery()
      .host(host);
    var url = query.formVersionURL();
    return query.queryVersion().then(function(version) {
      return {
        text: version,
        output: version,
        url: url
      };
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
  }
};

var testDataSelectVersion = {
  testname: "DataSelect Version",
  testid: "dataselectversion",
  description: "Queries the version of the service, success as long as the query returns something",
  webservices: [ DS ],
  severity: 'severe',
  test: function(dc) {
    var host = serviceHost(dc, DS);

    var query = new fdsndataselect.DataSelectQuery()
      .host(host);
    var url = query.formVersionURL();
    return query.queryVersion().then(function(version) {
      return {
        text: version,
        output: version,
        url: url
      };
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
  }
};

var testNoData204Event = {
  testname: "Event 204",
  testid: "nodata204event",  description: "Check that 204 is returned for queries for events that should be valid but return no data without nodata=404. Success if 204 http status is returned. This can also be a check on the CORS header.",
  webservices: [ EV ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, EV) ) {
      reject(new Error(EV+" Unsupported by "+dc.id));
    } else {
      resolve(null);
    }
   }).then(function() {
    var daysAgo = 1;
    var host = serviceHost(dc, EV);
    var quakeQuery = new fdsnevent.EventQuery()
      .host(host)
      .startTime(new Date(new Date().getTime()-86400*daysAgo*1000))
      .endTime(new Date())
      .minMag(99);
    var url = quakeQuery.formURL();
    return new Promise(function(resolve, reject) {
        let client = new XMLHttpRequest();
        client.open("GET", url);
        client.onreadystatechange = handler;
        client.responseType = "document";
        client.setRequestHeader("Accept", "application/xml");
        client.send();

        function handler() {
          if (this.readyState === this.DONE) {
            if (this.status === 200) {
              reject(new Error("Should be no data, but received 200 http status code."));
            } else if (this.status === 404 ) {
              reject(new Error("Should be 204 no data, but received 404 http status code."));
            } else if (this.status === 204 ) {
              // 204 is nodata, so successful but empty
                resolve({
                  text: "204 ",
                  url: url,
                  output: 204
                });
            } else {
              var error = new Error("Unexpected http status code: "+this.status);
              error.status = this.status;
              error.statusText = this.statusText;
              reject(error);
            }
          }
        }
      }).catch(function(err) {
        if (! err.url) {err.url = url;}
        throw err;
      });
    });
  }
};

var testNoDataEvent = {
  testname: "NoData Event",
  testid: "nodataevent",
  description: "Queries for events that should be valid but return no data. Success if nothing is returned. This can also be a check on the CORS header.",
  webservices: [ EV ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, EV) ) {
      reject(new Error(EV+" Unsupported by "+dc.id));
    } else {
      resolve(null);
    }
   }).then(function() {
    var daysAgo = 1;
    var host = serviceHost(dc, EV);
    var quakeQuery = new fdsnevent.EventQuery()
      .host(host)
      .startTime(new Date(new Date().getTime()-86400*daysAgo*1000))
      .endTime(new Date())
      .minMag(99);
    var url = quakeQuery.formURL();
    return quakeQuery.query().then(function(quakes) {
      if (quakes.length > 0) {
        throw new Error("Should be no data, but "+quakes.length+" events.");
      } else {
        return {
          text: "Found "+quakes.length,
          url: url,
          output: quakes
        };
      }
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
    });
  }
};

var testLastDay = {
  testname: "Last Day",
  testid: "lastday",
  description: "Queries for events in the past 24 hours",
  webservices: [ EV ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, EV) ) {
      reject(new Error("Unsupported"));
    } else {
      resolve(null);
    }
   }).then(function() { 
    var daysAgo = 1;
    var host = serviceHost(dc, EV);
    var quakeQuery = new fdsnevent.EventQuery()
      .host(host)
      .startTime(new Date(new Date().getTime()-86400*daysAgo*1000))
      .endTime(new Date());
    var url = quakeQuery.formURL();
    return quakeQuery.query().then(function(quakes) {
      return {
        text: "Found "+quakes.length,
        url: url,
        output: quakes
      };
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
    });
  }
};


var testLastDayQueryWithZ = {
  testname: "Last Day Query With Z",
  testid: "eventqueryZ",
  description: "Queries for events in the past 24 hours using a time that ends with Z",
  webservices: [ EV ],
  severity: 'opinion',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, EV) ) {
      reject(new Error("Unsupported"));
    } else {
      resolve(null);
    }
   }).then(function() {
    var daysAgo = 1;
    var host = serviceHost(dc, EV);
    var quakeQuery = new fdsnevent.EventQuery()
      .host(host)
      .startTime(new Date(Date.parse('2017-01-01T12:34:56.789')))
      .endTime(new Date(Date.parse('2017-01-05T00:00:00.000')));
    var url = quakeQuery.formURL().replace('.789', '.789Z').replace('.000', '.000Z');
    return new Promise(function(resolve, reject) {
        let client = new XMLHttpRequest();
        client.open("GET", url);
        client.onreadystatechange = handler;
        client.responseType = "document";
        client.setRequestHeader("Accept", "application/xml");
        client.send();

        function handler() {
          if (this.readyState === this.DONE) {
            if (this.status === 200) {
              resolve( {
                text: "Response OK ",
                url: url,
                output: this.responseXML
              });
            } else if (this.status === 404 || this.status === 204) {
              reject(new Error("Should be 200 , but received no data, "+this.status));
            } else if (this.status === 400 ) {
              reject(new Error("Bad request, "+this.status));
            } else {
              var error = new Error("Unexpected http status code: "+this.status);
              error.status = this.status;
              error.statusText = this.statusText;
              reject(error);
            }
          }
        }
      }).catch(function(err) {
        if (! err.url) {err.url = url;}
        throw err;
      });
    });
  }
};

var testEventCrossDateLine = {
  testname: "Cross Date Line",
  testid: "eventcrossdate",
  description: "Queries for events in a region that crosses the date line, ie minlon > maxlon",
  webservices: [ EV ],
  severity: 'opinion',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, EV) ) {
      reject(new Error("Unsupported"));
    } else {
      resolve(null);
    }
   }).then(function() {
    var daysAgo = 1;
    var host = serviceHost(dc, EV);
    var quakeQuery = new fdsnevent.EventQuery()
      .host(host)
      .startTime(new Date(Date.parse('2017-01-01T12:34:56.789')))
      .endTime(new Date(Date.parse('2017-01-05T00:00:00.000')))
      .minLat(-20)
      .maxLat(20)
      .minLon(170)
      .maxLon(-170);
    var url = quakeQuery.formURL();
    return new Promise(function(resolve, reject) {
        let client = new XMLHttpRequest();
        client.open("GET", url);
        client.onreadystatechange = handler;
        client.responseType = "document";
        client.setRequestHeader("Accept", "application/xml");
        client.send();

        function handler() {
          if (this.readyState === this.DONE) {
            // ok even if no data returned
            if (this.status === 200 || this.status === 404 || this.status === 204) {
              resolve( {
                text: "Response OK ",
                url: url,
                output: this.responseXML
              });
            } else if (this.status === 400 ) {
              reject(new Error("Bad request, "+this.status));
            } else {
              var error = new Error("Unexpected http status code: "+this.status);
              error.status = this.status;
              error.statusText = this.statusText;
              reject(error);
            }
          }
        }
      }).catch(function(err) {
        if (! err.url) {err.url = url;}
        throw err;
      });
    });
  }
};


var testDateIncludeZ = {
  testname: "Date Ends w/ Z",
  testid: "eventdataZ",
  description: "Queries for events in the past 24 hours and checks that the origin time string ends with a Z for UTC timezone.",
  webservices: [ EV ],
  severity: 'opinion',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
      if ( ! doesSupport(dc, EV) ) {
        reject(new Error("Unsupported"));
      } else {
        resolve(null);
      }
    }).then(function() {
      var daysAgo = 1;
      var host = serviceHost(dc, EV);
      var quakeQuery = new fdsnevent.EventQuery()
        .host(host)
        .startTime(new Date(new Date().getTime()-86400*daysAgo*1000))
        .endTime(new Date());
      var url = quakeQuery.formURL();
      return quakeQuery.queryRawXml().then(function(qml) {
        let top = qml.documentElement;
        let eventArray = Array.prototype.slice.call(top.getElementsByTagName("event"));
        if (eventArray.length === 0) {
          throw new Error("No events returned");
        }
        var failureEvent = null;
        let otimeStr = null;
        if (eventArray.every(function(q, i) {
          otimeStr = quakeQuery._grabFirstElText(quakeQuery._grabFirstEl(quakeQuery._grabFirstEl(qml, 'origin'), 'time'),'value');
          if (otimeStr ) {
            if (otimeStr.charAt(otimeStr.length-1) === 'Z') {
              return true;
            } else {
              failureEvent = q;
              return false;
            }
          } else {
            var err = new Error("origintime is missing for "+i+"th event: "+q.getAttribute("publicID"));
            err.url = url;
            throw err;
          }
        })) {
          return {
            text: "Found "+eventArray.length,
            url: url,
            output: qml
          };
        } else {
          throw new Error("Check for Z failed for "+otimeStr+", event: "+failureEvent.getAttribute("publicID"));
        }
      
      }).catch(function(err) {
        if (! err.url) {err.url = url;}
        throw err;
      });
    });
  }
};


var testEventFromPublicID = {
  testname: "eventid=publicID",
  testid: "eventid_publicid",
  description: "Queries events in the past 24 hours, then tries to make an eventid= query for the first event using its entire publicID with no modification. This allows a client to do a general then specific query style. Because the spec is ambiguous on the relationship between piblicID and eventid, this may be an unfair test, but I feel it is useful for the service to accept as eventid whatever it outputs as publicID.",
  webservices: [ EV ],
  severity: 'opinion',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
      if ( ! doesSupport(dc, EV) ) {
        reject(new Error("Unsupported"));
      } else {
        resolve(null);
      }
   }).then(function() {
    var daysAgo = .5;
    var host = serviceHost(dc, EV);
    var quakeQuery = new fdsnevent.EventQuery()
      .host(host)
      .startTime(new Date(new Date().getTime()-86400*daysAgo*1000))
      .endTime(new Date());
    var url = quakeQuery.formURL();
    return quakeQuery.query().then(function(quakes) {
        if (quakes.length == 0) {
          throw new Error("No quakes returned");
        }
        var singleQuakeQuery = new fdsnevent.EventQuery()
          .host(host)
          .eventid(encodeURIComponent(quakes[0].publicID));
        url = singleQuakeQuery.formURL();
        return singleQuakeQuery.query();
      }).then(function(singleQuake) {
        if (singleQuake.length === 1) {
          return {
            text: "Found "+singleQuake[0].time(),
            url: url,
            output: singleQuake
          };
        } else {
          throw new Error("Expect 1 event, received "+singleQuake.length);
        }
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
    });
  }
};

var testEventFromBestGuessEventId = {
  testname: "Best Guess EventId",
  testid: "guesseventid",
  description: "Queries events in the past 24 hours, then tries to make an eventid= query for the first event using a huristic to determine the eventid. This allows a client to do a general then specific query style, but with more effort than eventid=publicID as the client must guess the value for eventid in the specific query. This is also fragile as the huristic must be updated for each new server.",
  webservices: [ EV ],
  severity: 'severe',
  test: function(dc) {
    var url = "none";
    var daysAgo = .5;
    var host = serviceHost(dc, EV);
    return new RSVP.Promise(function(resolve, reject) {
      if ( ! doesSupport(dc, EV) ) {
        reject(new Error("Unsupported"));
      } else {
        host = serviceHost(dc, EV);
        resolve(host);
      }
    }).then(function(host) {
      var quakeQuery = new fdsnevent.EventQuery()
        .host(host)
        .startTime(new Date(new Date().getTime()-86400*daysAgo*1000))
        .endTime(new Date());
      url = quakeQuery.formURL();
      return quakeQuery.query();
    }).then(function(quakes) {
        if (quakes.length == 0) {
          throw new Error("No quakes returned");
        }
        var singleQuakeQuery = new fdsnevent.EventQuery()
          .host(host)
          .eventid(encodeURIComponent(quakes[0].eventid()));
        url = singleQuakeQuery.formURL();
        return singleQuakeQuery.query();
    }).then(function(quakes) {
      return {
        text: "Found "+quakes.length,
        url: url,
        output: quakes
      };
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
  }
};

var testCatalogs = {
  testname: "Catalogs",
  testid: "catalogs",
  description: "Queries the list of catalogs of the event service, success as long as the query returns something",
  webservices: [ EV ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, EV) ) {
      reject(new Error("Unsupported"));
    } else {
      resolve(null);
    }
   }).then(function() {
    var host = serviceHost(dc, EV);
    var quakeQuery = new fdsnevent.EventQuery()
      .host(host);
    var url = quakeQuery.formCatalogsURL();
    return quakeQuery.queryCatalogs().then(function(catalogs) {
      return {
        text: "Found "+catalogs.length,
        url: url,
        output: catalogs
      };
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
    });
  }
};

var testContributors = {
  testname: "Contributors",
  testid: "contributors",
  description: "Queries the list of contributors of the event service, success as long as the query returns something",
  webservices: [ EV ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, EV) ) {
      reject(new Error("Unsupported"));
    } else {
      resolve(null);
    }
   }).then(function() {
    var host = serviceHost(dc, EV);
    var quakeQuery = new fdsnevent.EventQuery()
      .host(host);
    var url = quakeQuery.formContributorsURL();
    return quakeQuery.queryContributors().then(function(contributors) {
      return {
        text: "Found "+contributors.length,
        url: url,
        output: contributors
      };
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
    });
  }
};

var testNoData204Station = {
  testname: "Station 204",
  testid: "nodata204Station",  description: "Check that 204 is returned for queries for networks that should be valid but return no data, without nodata=404. Success if 204 http status is returned. This can also be a check on the CORS header.",
  webservices: [ ST ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, ST) ) {
      reject(new Error(ST+" Unsupported by "+dc.id));
    } else {
      resolve(null);
    }
   }).then(function() {
    var host = serviceHost(dc, ST);
    var query = new fdsnstation.StationQuery()
      .host(host)
      .networkCode("xx");
    var url = query.formURL(fdsnstation.LEVEL_NETWORK);
    return new Promise(function(resolve, reject) {
        let client = new XMLHttpRequest();
        client.open("GET", url);
        client.onreadystatechange = handler;
        client.responseType = "document";
        client.setRequestHeader("Accept", "application/xml");
        client.send();

        function handler() {
          if (this.readyState === this.DONE) {
            if (this.status === 200) {
              reject(new Error("Should be no data, but got 200 http status code"));
            } else if (this.status === 404 ) {
              reject(new Error("Should be 204 no data, but received 404."));
            } else if (this.status === 204 ) {
              // 204 is nodata, so successful but empty
                resolve({
                  text: "204 ",
                  url: url,
                  output: 204
                });
            } else {
              var error = new Error("Unexpected http status code: "+this.status);
              error.status = this.status;
              error.statusText = this.statusText;
              reject(error);
            }
          }
        }
      }).catch(function(err) {
        if (! err.url) {err.url = url;}
        throw err;
      });
    });
  }
};

var testNoDataNetwork = {
  testname: "NoData Networks",
  testid: "nodatanetworks",
  description: "Queries for networks that should be well formed but return no networks, success as long as the query returns something, even an empty result. This can also be a check on the CORS header.",
  webservices: [ ST ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, ST) ) {
      reject(new Error("Unsupported"));
    } else {
      resolve(null);
    }
   }).then(function() {
    var host = serviceHost(dc, ST);
  
    var query = new fdsnstation.StationQuery()
      .host(host)
      .networkCode("xx");
    var url = query.formURL(fdsnstation.LEVEL_NETWORK);
    return query.queryNetworks().then(function(networks) {
      if (networks.length > 0) {
        throw new Error("Should be no data, but "+networks.length+" networks.");
      } else {
        return {
          text: "Found "+networks.length,
          url: url,
          output: networks
        };
      }
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
    });
  }
};

var testNetworks = {
  testname: "Networks",
  testid: "networks",
  description: "Queries for all networks, success as long as the query returns something, even an empty result.",
  webservices: [ ST ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, ST) ) {
      reject(new Error("Unsupported"));
    } else {
      resolve(null);
    }
   }).then(function() { 
    var host = serviceHost(dc, ST);
    var query = new fdsnstation.StationQuery()
      .host(host);
    var url = query.formURL(fdsnstation.LEVEL_NETWORK);
    return query.queryNetworks().then(function(networks) {
      return {
        text: "Found "+networks.length,
        url: url,
        output: networks
      };
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
    });
  }
};

function randomNetwork(dc, startTime) {
  var host = serviceHost(dc, ST);
  var query = new fdsnstation.StationQuery()
      .host(host);
  if (startTime) {
    query.startTime(startTime);
  }
  var url = query.formURL(fdsnstation.LEVEL_NETWORK);
  return query.queryNetworks().then(function(networks) {
    if (networks.length == 0) {
      var err = new Error("No networks");
      err.url = url;
      throw err;
    }
    // got some nets
    var permNetRE = /[A-W][A-Z0-9]/;
    var unrestricted = networks.filter(function(net) {
      return  (( ! net.restrictedStatus()) || net.restrictedStatus() == "open")
             && permNetRE.test(net.networkCode());
    });
    if (unrestricted.length == 0) {
      var errRestricted = new Error("No unrestricted networks");
      errRestricted.url = url;
      throw errRestricted;
    }
    var withStations = unrestricted.filter(function(net) {
             return ( typeof net.totalNumberStations === "undefined" 
                || !net.totalNumberStations
                ||  net.totalNumberStations > 1);
    });
    if (withStations.length == 0) {
      var errNoSta = new Error("No networks with stations");
      errNoSta.url = url;
      throw errNoSta;
    }
    var i = Math.floor(Math.random()*withStations.length);
    var net = withStations[i];
    net.url = url;
    return net;
  }).catch(function(err) {
    if (! err.url) {err.url = url;}
    throw err;
  });
}


function randomStation(dc, netCode, startTime) {
  var host = serviceHost(dc, ST);
  var query = new fdsnstation.StationQuery()
      .host(host)
      .networkCode(netCode);
  if (startTime) {
    query.startTime(startTime);
  }
  var url = query.formURL(fdsnstation.LEVEL_STATION);
  return query.queryStations().then(function(networks) {
    if (networks.length == 0) {
      var err = new Error("No networks");
      err.url = url;
      throw err;
    }
    if (networks[0].stations().length == 0) {
      var errNoSta = new Error("No stations in network "+networks[0].networkCode());
      errNoSta.url = url;
      throw errNoSta;
    }
    // got some stations in first net
    var unrestricted = networks[0].stations().filter(function(net) {
      return ( ! net.restrictedStatus()) || net.restrictedStatus() == "open";
    });
    if (unrestricted.length == 0) {
      var errRestricted = new Error("No unrestricted stations in "+networks[0].networkCode());
      errRestricted.url = url;
      throw errRestricted;
    }
    var i = Math.floor(Math.random()*unrestricted.length);
    var sta = unrestricted[i];
    sta.url = url;
    return sta;
  }).catch(function(err) {
    if (! err.url) {err.url = url;}
    throw err;
  });
}



var testStations = {
  testname: "Stations",
  testid: "stations",
  description: "Queries for stations within a random unrestricted network returned from all networks, success as long as the query returns something, even an empty result.",
  webservices: [ ST ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
      if ( ! doesSupport(dc, ST) ) {
        reject(new Error("Unsupported"));
      } else {
        resolve(null);
      }
    }).then(function() {
      return randomNetwork(dc);
    }).then(function(net) {
      return randomStation(dc, net.networkCode());
    }).then(function(sta) {
      return {
        text: "Found "+sta.codes(),
        url: sta.url,
        output: sta
      };
    });
  }
};

var testCommaStations = {
  testname: "Comma Stations",
  testid: "commastations",
  description: "Queries for two station codes separated by comma from within a random unrestricted network returned from all networks, success as long as the query returns at least two stations.",
  webservices: [ ST ],
  severity: 'severe',
  test: function(dc) {
    var host = serviceHost(dc, ST);
    return new RSVP.Promise(function(resolve, reject) {
      if ( ! doesSupport(dc, ST) ) {
        reject(new Error("Unsupported"));
      } else {
        resolve(null);
      }
    }).then(function() {
      return randomNetwork(dc);
    }).then(function(net) {
      var query = new fdsnstation.StationQuery()
        .host(host)
        .networkCode(net.networkCode());   
      var url = query.formURL(fdsnstation.LEVEL_STATION);
      return query.queryStations().then(function(networks) {
        if (networks.length === 0) {
          var noNetErr = new Error("No networks returned");
          noNetErr.url = url;
          throw noNetErr;
        }
        if (networks[0].stations().length < 2) {
          var notTwoStaErr = new Error("can't test as not at least two stations returned: "+networks[0].stations().length);
          notTwoStaErr.url = url;
          throw notTwoStaErr;
        }
        // looks ok for starting testing
        return networks[0];
      });
    }).then(function(net) {
      var firstCode = net.stations()[0].stationCode();
      var secondCode = firstCode;
      for (var i=0; i<net.stations().length; i++) {
        if (net.stations()[i].stationCode() != firstCode) {
          secondCode = net.stations()[i].stationCode();
          break;
        }
      }
      var query = new fdsnstation.StationQuery()
        .host(host)
        .networkCode(net.networkCode())
        .stationCode(firstCode+","+secondCode);
      var url = query.formURL(fdsnstation.LEVEL_STATION);
      return query.queryStations().then(function(networks) {
        if (networks.length === 0) {
          var noNetErr = new Error("No networks returned");
          noNetErr.url = url;
          throw noNetErr;
        }
        if (networks[0].stations().length < 2) {
          var notTwoStaErr = new Error("Not at least two stations returned for "+net.networkCode+": "+networks[0].stations().length);
          notTwoStaErr.url = url;
          throw notTwoStaErr;
        }
        // looks ok
        return {
          text: "Found "+networks[0].stations().length,
          url: url,
          output: networks[0].stations()
        };
      });
    });
  }
};

function dateStrEndsZ(s) {
  return s.charAt(s.length-1) === 'Z';
}

var testStationQueryWithZ = {
  testname: "Starttime Query With Z",
  testid: "stationqueryZ",
  description: "Queries for stations with starttime of 2016-01-01 using a time that ends with Z",
  webservices: [ ST ],
  severity: 'opinion',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, ST) ) {
      reject(new Error("Unsupported"));
    } else {
      resolve(null);
    }
   }).then(function() {
    var host = serviceHost(dc, ST);
    var query = new fdsnstation.StationQuery()
      .host(host)
      .startTime(new Date(Date.parse('2016-01-01T12:34:56.789')))
      .endTime(new Date(Date.parse('2016-02-01T00:00:00.000')));
    var url = query.formURL(fdsnstation.LEVEL_STATION).replace('.789', '.789Z').replace('.000', '.000Z');
    return new Promise(function(resolve, reject) {
        let client = new XMLHttpRequest();
        client.open("GET", url);
        client.onreadystatechange = handler;
        client.responseType = "document";
        client.setRequestHeader("Accept", "application/xml");
        client.send();

        function handler() {
          if (this.readyState === this.DONE) {
            if (this.status === 200) {
                resolve(this.responseXML);
            } else if (this.status === 404 || this.status === 204) {
              reject(new Error("Should be 200 , but received no data, "+this.status));
            } else if (this.status === 400 ) {
              reject(new Error("Bad request, "+this.status));
            } else {
              var error = new Error("Unexpected http status code: "+this.status);
              error.status = this.status;
              error.statusText = this.statusText;
              reject(error);
            }
          }
        }
      }).then(function(responseXML) {
        return {
          text: "Response OK ",
          url: url,
          output: responseXML
        };
      }).catch(function(err) {
        if (! err.url) {err.url = url;}
        throw err;
      });
    });
  }
};


var testStationDateIncludeZ = {
  testname: "Station Date Ends w/ Z",
  testid: "stationdataZ",
  description: "Queries for stations in random network and checks that the start and end time string ends with a Z for UTC timezone.",
  webservices: [ ST ],
  severity: 'opinion',
  test: function(dc) {
    var host = serviceHost(dc, ST);
    return new RSVP.Promise(function(resolve, reject) {
      if ( ! doesSupport(dc, ST) ) {
        reject(new Error("Unsupported"));
      } else {
        resolve(null);
      }
    }).then(function() {
      return randomNetwork(dc);
    }).then(function(net) {
      var query = new fdsnstation.StationQuery()
        .host(host)
        .networkCode(net.networkCode());
      return query.queryRawXml(fdsnstation.LEVEL_STATION);
    }).then(function(staml) {
      let top = staml.documentElement;
      let netArray = top.getElementsByTagNameNS(fdsnstation.STAML_NS, "Network");
      netArray.url = top.url;
      for (let i=0; i<netArray.length; i++) {
        let netStart = netArray.item(i).getAttribute("startDate");
        if ( ! dateStrEndsZ(netStart)) {
          let err = new Error("network "+netArray.item(i).getAttribute("code")+" start date does not end with Z: "+netStart);
          err.url = staml.url;
          throw err;
        }
        let staArray = netArray.item(i).getElementsByTagNameNS(fdsnstation.STAML_NS, "Station");
        for (let i=0; i<staArray.length; i++) {
          let staStart = staArray.item(i).getAttribute("startDate");
          if ( ! dateStrEndsZ(staStart)) {
            let err = new Error("station "+staArray.item(i).getAttribute("code")+" start date does not end with Z: "+staStart);
            err.url = staml.url;
            throw err;
          }
        } 
      } 
      return netArray;
    }).then(function(netArray) {
      return {
        text: "Found "+netArray.length,
        url: netArray.url,
        output: netArray
      };
    });
  }
};

var testStationCrossDateLine = {
  testname: "Station Cross Date Line",
  testid: "stationcrossdate",
  description: "Queries for stations in a region that crosses the date line, ie minlon > maxlon",
  webservices: [ ST ],
  severity: 'opinion',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, ST) ) {
      reject(new Error("Unsupported"));
    } else {
      resolve(null);
    }
    }).then(function() {
      return randomNetwork(dc);
    }).then(function(net) {
      return randomStation(dc, net.networkCode());
   }).then(function(randomStation) {
    var host = serviceHost(dc, ST);
      var query = new fdsnstation.StationQuery()
    var stationQuery = new fdsnstation.StationQuery();
      stationQuery.host(host)
      .networkCode(randomStation.network().networkCode())
      .minLat(randomStation.latitude()-1)
      .maxLat(randomStation.latitude()+1)
      .minLon(randomStation.longitude()-1)
      .maxLon(-179);
    var url = stationQuery.formURL(fdsnstation.LEVEL_STATION);
    return new Promise(function(resolve, reject) {
        let client = new XMLHttpRequest();
        client.open("GET", url);
        client.onreadystatechange = handler;
        client.responseType = "document";
        client.setRequestHeader("Accept", "application/xml");
        client.send();

        function handler() {
          if (this.readyState === this.DONE) {
            // ok even if no data returned
            if (this.status === 200) {
              resolve( {
                text: "Response OK ",
                url: url,
                output: this.responseXML
              });
            } else if (this.status === 404 || this.status === 204) {
              reject(new Error("Should be 200 , but received no data, "+this.status));
            } else if (this.status === 400 ) {
              reject(new Error("Bad request, "+this.status));
            } else {
              var error = new Error("Unexpected http status code: "+this.status);
              error.status = this.status;
              error.statusText = this.statusText;
              reject(error);
            }
          }
        }
      }).catch(function(err) {
        if (! err.url) {err.url = url;}
        throw err;
      });
    });
  }
};

var testChannels = {
  testname: "Channels",
  testid: "channels",
  description: "Queries for channels from a random unrestricted station within a random network returned from all networks, success as long as the query returns something, even an empty result.",
  webservices: [ ST ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
      if ( ! doesSupport(dc, ST) ) {
        reject(new Error("Unsupported"));
      } else {
        resolve(null);
      }
    }).then(function() {
      return randomNetwork(dc);
    }).then(function(net) {
      return randomStation(dc, net.networkCode());
    }).then(function(sta) {
      var chanQuery = new fdsnstation.StationQuery()
        .host(serviceHost(dc, ST))
        .networkCode(sta.network().networkCode())
        .stationCode(sta.stationCode());
      return chanQuery.queryChannels()
        .then(function(channels) {
          channels.url = chanQuery.formURL(fdsnstation.LEVEL_CHANNEL);
          return channels;
        });
    }).then(function(channels) {
      return {
        text: "Found "+channels.length,
        url: channels.url,
        output: channels
      };
    });
  }
};


var testSensitivityUnit = {
  testname: "Sensitvity units valid SI",
  testid: "sensitivityUnits",
  description: "Checks the units in the instrumentSensitivity against the validation list at https://github.com/iris-edu/StationXML-Validator/wiki/Unit-name-overview-for-IRIS-StationXML-validator",
  webservices: [ ST ],
  severity: 'opinion',
  test: function(dc) {
    var host = serviceHost(dc, ST);
    return new RSVP.Promise(function(resolve, reject) {
      if ( ! doesSupport(dc, ST) ) {
        reject(new Error("Unsupported"));
      } else {
        resolve(null);
      }
    }).then(function() {
      return randomNetwork(dc, new Date());
    }).then(function(net) {
      return randomStation(dc, net.networkCode(), new Date());
    }).then(function(station) {
      var query = new fdsnstation.StationQuery()
        .host(host)
        .networkCode(station.network().networkCode())
        .stationCode(station.stationCode()) ;
      return query.queryChannels()
        .then(function(nets) {
          nets.url = query.formURL(fdsnstation.LEVEL_CHANNEL);
          return nets;
        });
    }).then(function(nets) {
      return new Promise(function(resolve, reject){
        d3.json('knownUnits.json', function(error, knownUnits) {
          error ? reject(error) : resolve(knownUnits);
        });
      }).then(function(knownUnits) {
console.log("Units: "+knownUnits.units);
        return knownUnits.units;
      }).then(function(knownUnits) {
        for (let n of nets) {
          for (let s of n.stations()) {
console.log("Station: "+s.codes());
            for (let c of s.channels()) {
              let cu = c.instrumentSensitivity().inputUnits();
              let found = false;
              for (let u of knownUnits) {
                if (cu === u) {
                  found = true;
                  break;
                }
              }
              if (! found) {
                let foundLower = false;
                let cuLower = cu.toLowerCase();
                for (let u of knownUnits) {
                  if (cuLower === u.toLowerCase()) {
                    foundLower = true;
                    break;
                  }
                }
                let err = new Error("Unit "+cu+" not SI for "+c.codes());
                if (foundLower) {
                  err = new Error("Unit "+cu+" wrong case for SI in "+c.codes());
                }
                err.url = nets.url;
                throw err;
              }

              cu = c.instrumentSensitivity().outputUnits();
              found = false;
              for (let u of knownUnits) {
                if (cu === u) {
                  found = true;
                  break;
                }
              }
              if (! found) {
                throw new Error("Unit "+cu+" not well known for "+c.codes());
              }
            }
          }
        }
        return {
          text: "Units ok for channels from "+station.codes(),
          url: channels.url,
          output: channels
        };
      });
    });
  }
};



var testNoData204DataSelect = {
  testname: "DataSelect 204",
  testid: "nodata204DataSelect",  
  description: "Check that 204 is returned for queries for dataselect that should be valid but return no data without nodata=404. Success if 204 http status is returned. This can also be a check on the CORS header.",
  webservices: [ DS ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, DS) ) {
      reject(new Error(DS+" Unsupported by "+dc.id));
    } else {
      resolve(null);
    }
   }).then(function() {
    var host = serviceHost(dc, DS);
    var query = new fdsndataselect.DataSelectQuery()
      .host(host);
    var url = query
      .networkCode("XX")
      .stationCode("ABC")
      .locationCode("99")
      .channelCode("XXX")
      .computeStartEnd(new Date(Date.UTC(1980,1,1,0,0,0)), null, 300, 0)
      .formURL();
    return new Promise(function(resolve, reject) {
        let client = new XMLHttpRequest();
        client.open("GET", url);
        client.onreadystatechange = handler;
        client.responseType = "arraybuffer";
        client.setRequestHeader("Accept", "application/vnd.fdsn.mseed");
        client.send();

        function handler() {
          if (this.readyState === this.DONE) {
            if (this.status === 200) {
              reject(new Error("Should be no data, but received 200 http status code."));
            } else if (this.status === 404 ) {
              reject(new Error("Should be 204 no data, but received 404 http status code."));
            } else if (this.status === 204 ) {
              // 204 is nodata, so successful but empty
                resolve({
                  text: "204 ",
                  url: url,
                  output: 204
                });
            } else {
              var error = new Error("Unexpected http status code: "+this.status);
              error.status = this.status;
              error.statusText = this.statusText;
              reject(error);
            }
          }
        }
      }).catch(function(err) {
        if (! err.url) {err.url = url;}
        throw err;
      });
    });
  }
};

var testDataSelectNoData = {
  testname: "No Data",
  testid: "dsnodata",
  description: "Attempts to make a dataselect query that should be correctly formed but should not return data. Success as long as the query returns, even with an empty result. This can also be a check on the CORS header.",
  webservices: [ DS ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, DS) || ! doesSupport(dc, ST) ) {
      reject(new Error("Unsupported"));
    } else {
      resolve(null);
    }
   }).then(function() {
    var host = serviceHost(dc, DS);

    var query = new fdsndataselect.DataSelectQuery()
      .host(host);
    var url = query
      .networkCode("XX")
      .stationCode("ABC")
      .locationCode("99")
      .channelCode("XXX")
      .computeStartEnd(new Date(Date.UTC(1980,1,1,0,0,0)), null, 300, 0)
      .formURL();
    return query.query().then(function(miniseed) {
      if (miniseed.length > 0) {
        throw new Error("Should be no data, but "+miniseed.length+" miniseed records.");
      } else {
        return {
          text: "Found "+miniseed.length,
          url: url,
          output: miniseed
        };
      }
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
    });
  }
};

var testDataSelectRecent = {
  testname: "Recent Data",
  testid: "recentData",
  description: "Attempts to make a dataselect query by first querying for networks, then stations within the a random network and then using a random station to request the last 300 seconds for a SHZ,BHZ channel. Success as long as the query returns, even with an empty result.",
  webservices: [ ST, DS ],
  severity: 'severe',
  test: function(dc) {
    return new RSVP.Promise(function(resolve, reject) {
    if ( ! doesSupport(dc, DS) || ! doesSupport(dc, ST) ) {
      reject(new Error("Unsupported"));
    } else {
      resolve(null);
    }
   }).then(function() {
    return randomNetwork(dc, new Date());
   }).then(function(net) {
     return randomStation(dc, net.networkCode(), new Date());
   }).then(function(station) {
    var host = serviceHost(dc, DS);

    var query = new fdsndataselect.DataSelectQuery()
      .host(host);
    var url = query
      .networkCode(station.network().networkCode())
      .stationCode(station.stationCode())
      .channelCode("SHZ,BHZ")
      .computeStartEnd(null, new Date(), 300, 0)
      .formURL();
    return query.query().then(function(miniseed) {
      return {
        text: "Found "+miniseed.length,
        url: url,
        output: miniseed
      };
    }).catch(function(err) {
      if (! err.url) {err.url = url;}
      throw err;
    });
    });
  }
};
// end test defs


function doesSupport(dc, type) {
  var out = dc.supports.find(function(s) { return s.type === type;});
//  if (! out) {
//    var dcws = dc.supports.map(function(d) { return d.type; }).join(',');
//    console.log("not doesSupport "+dc.id+" "+dcws+" "+type+" undef");
//  }
  return typeof out != 'undefined';
}

function serviceHost(dc, type) {
  var does = doesSupport(dc, type);
  if (does) {
    return does.host ? does.host : dc.host;
  }
  return null;
}

var tests = {
     fdsnEventTests: [ testEventVersion, testNoData204Event, testNoDataEvent, testLastDay, testCatalogs, testContributors, testEventFromBestGuessEventId, testLastDayQueryWithZ, testDateIncludeZ, testEventCrossDateLine, testEventFromPublicID  ],
     fdsnStationTests: [ testStationVersion, testNoData204Station, testNoDataNetwork, testNetworks, testStations, testChannels, testCommaStations, testStationQueryWithZ, testStationDateIncludeZ, testStationCrossDateLine, testSensitivityUnit ],
     fdsnDataTests: [ testDataSelectVersion, testNoData204DataSelect, testDataSelectNoData, testDataSelectRecent ]
 };

var notVersionTest = {
     fdsnEventTests: tests.fdsnEventTests.filter(function(d) {
         return d.testid.indexOf("version") === -1;
     }),
     fdsnStationTests: tests.fdsnStationTests.filter(function(d) {
         return d.testid.indexOf("version") === -1;
     }),
     fdsnDataTests: tests.fdsnDataTests.filter(function(d) {
         return d.testid.indexOf("version") === -1;
     })
 };
var justOneTest = {
     fdsnEventTests: [ testEventFromBestGuessEventId,  testEventCrossDateLine],
     fdsnStationTests: [ testStationCrossDateLine ],
     fdsnDataTests: [ ]
};
var justVersionTest = {
     fdsnEventTests: [ testEventVersion ],
     fdsnStationTests: [ testStationVersion ],
     fdsnDataTests: [ testDataSelectVersion ]
};

//var out = notVersionTest;
//var out = justVersionTest;
//var out = justOneTest;
var out = tests;
// util functions
out.serviceHost = serviceHost;
out.doesSupport = doesSupport;
return out;
}();
