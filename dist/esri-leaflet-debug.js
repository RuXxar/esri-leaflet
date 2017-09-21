/* esri-leaflet - v2.1.1 - Thu Sep 21 2017 14:40:25 GMT+0200 (W. Europe Summer Time)
 * Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('leaflet')) :
	typeof define === 'function' && define.amd ? define(['exports', 'leaflet'], factory) :
	(factory((global.L = global.L || {}, global.L.esri = global.L.esri || {}),global.L));
}(this, function (exports,L$1) { 'use strict';

	var L$1__default = 'default' in L$1 ? L$1['default'] : L$1;

	var version = "2.1.1";

	var cors = ((window.XMLHttpRequest && 'withCredentials' in new window.XMLHttpRequest()));
	var pointerEvents = document.documentElement.style.pointerEvents === '';

	var Support = {
	  cors: cors,
	  pointerEvents: pointerEvents
	};

	var options = {
	  attributionWidthOffset: 55
	};

	var callbacks = 0;

	function serialize (params) {
	  var data = '';

	  params.f = params.f || 'json';

	  for (var key in params) {
	    if (params.hasOwnProperty(key)) {
	      var param = params[key];
	      var type = Object.prototype.toString.call(param);
	      var value;

	      if (data.length) {
	        data += '&';
	      }

	      if (type === '[object Array]') {
	        value = (Object.prototype.toString.call(param[0]) === '[object Object]') ? JSON.stringify(param) : param.join(',');
	      } else if (type === '[object Object]') {
	        value = JSON.stringify(param);
	      } else if (type === '[object Date]') {
	        value = param.valueOf();
	      } else {
	        value = param;
	      }

	      data += encodeURIComponent(key) + '=' + encodeURIComponent(value);
	    }
	  }

	  return data;
	}

	function createRequest (callback, context) {
	  var httpRequest = new window.XMLHttpRequest();

	  httpRequest.onerror = function (e) {
	    httpRequest.onreadystatechange = L$1.Util.falseFn;

	    callback.call(context, {
	      error: {
	        code: 500,
	        message: 'XMLHttpRequest error'
	      }
	    }, null);
	  };

	  httpRequest.onreadystatechange = function () {
	    var response;
	    var error;

	    if (httpRequest.readyState === 4) {
	      try {
	        response = JSON.parse(httpRequest.responseText);
	      } catch (e) {
	        response = null;
	        error = {
	          code: 500,
	          message: 'Could not parse response as JSON. This could also be caused by a CORS or XMLHttpRequest error.'
	        };
	      }

	      if (!error && response.error) {
	        error = response.error;
	        response = null;
	      }

	      httpRequest.onerror = L$1.Util.falseFn;

	      callback.call(context, error, response);
	    }
	  };

	  httpRequest.ontimeout = function () {
	    this.onerror();
	  };

	  return httpRequest;
	}

	function xmlHttpPost (url, params, callback, context) {
	  var httpRequest = createRequest(callback, context);
	  httpRequest.open('POST', url);

	  if (typeof context !== 'undefined' && context !== null) {
	    if (typeof context.options !== 'undefined') {
	      httpRequest.timeout = context.options.timeout;
	    }
	  }
	  httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	  httpRequest.send(serialize(params));

	  return httpRequest;
	}

	function xmlHttpGet (url, params, callback, context) {
	  console.log('xmlhttpget', url);
	  var httpRequest = createRequest(callback, context);
	  httpRequest.open('GET', url + '?' + serialize(params), true);

	  if (typeof context !== 'undefined' && context !== null) {
	    if (typeof context.options !== 'undefined') {
	      httpRequest.timeout = context.options.timeout;
	    }
	  }
	  httpRequest.send(null);

	  return httpRequest;
	}

	// AJAX handlers for CORS (modern browsers) or JSONP (older browsers)
	function request (url, params, callback, context) {
	  console.log('real request', url);
	  var paramString = serialize(params);
	  var httpRequest = createRequest(callback, context);
	  var requestLength = (url + '?' + paramString).length;

	  // ie10/11 require the request be opened before a timeout is applied
	  if (requestLength <= 2000 && Support.cors) {
	    httpRequest.open('GET', url + '?' + paramString);
	  } else if (requestLength > 2000 && Support.cors) {
	    httpRequest.open('POST', url);
	    httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	  }

	  if (typeof context !== 'undefined' && context !== null) {
	    if (typeof context.options !== 'undefined') {
	      httpRequest.timeout = context.options.timeout;
	    }
	  }

	  // request is less than 2000 characters and the browser supports CORS, make GET request with XMLHttpRequest
	  if (requestLength <= 2000 && Support.cors) {
	    httpRequest.send(null);

	  // request is more than 2000 characters and the browser supports CORS, make POST request with XMLHttpRequest
	  } else if (requestLength > 2000 && Support.cors) {
	    httpRequest.send(paramString);

	  // request is less  than 2000 characters and the browser does not support CORS, make a JSONP request
	  } else if (requestLength <= 2000 && !Support.cors) {
	    return jsonp(url, params, callback, context);

	  // request is longer then 2000 characters and the browser does not support CORS, log a warning
	  } else {
	    warn('a request to ' + url + ' was longer then 2000 characters and this browser cannot make a cross-domain post request. Please use a proxy http://esri.github.io/esri-leaflet/api-reference/request.html');
	    return;
	  }

	  return httpRequest;
	}

	function jsonp (url, params, callback, context) {
	  window._EsriLeafletCallbacks = window._EsriLeafletCallbacks || {};
	  var callbackId = 'c' + callbacks;
	  params.callback = 'window._EsriLeafletCallbacks.' + callbackId;

	  window._EsriLeafletCallbacks[callbackId] = function (response) {
	    if (window._EsriLeafletCallbacks[callbackId] !== true) {
	      var error;
	      var responseType = Object.prototype.toString.call(response);

	      if (!(responseType === '[object Object]' || responseType === '[object Array]')) {
	        error = {
	          error: {
	            code: 500,
	            message: 'Expected array or object as JSONP response'
	          }
	        };
	        response = null;
	      }

	      if (!error && response.error) {
	        error = response;
	        response = null;
	      }

	      callback.call(context, error, response);
	      window._EsriLeafletCallbacks[callbackId] = true;
	    }
	  };

	  var script = L$1.DomUtil.create('script', null, document.body);
	  script.type = 'text/javascript';
	  script.src = url + '?' + serialize(params);
	  script.id = callbackId;

	  callbacks++;

	  return {
	    id: callbackId,
	    url: script.src,
	    abort: function () {
	      window._EsriLeafletCallbacks._callback[callbackId]({
	        code: 0,
	        message: 'Request aborted.'
	      });
	    }
	  };
	}

	var get = ((Support.cors) ? xmlHttpGet : jsonp);
	get.CORS = xmlHttpGet;
	get.JSONP = jsonp;

	// export the Request object to call the different handlers for debugging
	var Request = {
	  request: request,
	  get: get,
	  post: xmlHttpPost
	};

	/*
	 * Copyright 2017 Esri
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	// checks if 2 x,y points are equal
	function pointsEqual (a, b) {
	  for (var i = 0; i < a.length; i++) {
	    if (a[i] !== b[i]) {
	      return false;
	    }
	  }
	  return true;
	}

	// checks if the first and last points of a ring are equal and closes the ring
	function closeRing (coordinates) {
	  if (!pointsEqual(coordinates[0], coordinates[coordinates.length - 1])) {
	    coordinates.push(coordinates[0]);
	  }
	  return coordinates;
	}

	// determine if polygon ring coordinates are clockwise. clockwise signifies outer ring, counter-clockwise an inner ring
	// or hole. this logic was found at http://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-
	// points-are-in-clockwise-order
	function ringIsClockwise (ringToTest) {
	  var total = 0;
	  var i = 0;
	  var rLength = ringToTest.length;
	  var pt1 = ringToTest[i];
	  var pt2;
	  for (i; i < rLength - 1; i++) {
	    pt2 = ringToTest[i + 1];
	    total += (pt2[0] - pt1[0]) * (pt2[1] + pt1[1]);
	    pt1 = pt2;
	  }
	  return (total >= 0);
	}

	// ported from terraformer.js https://github.com/Esri/Terraformer/blob/master/terraformer.js#L504-L519
	function vertexIntersectsVertex (a1, a2, b1, b2) {
	  var uaT = ((b2[0] - b1[0]) * (a1[1] - b1[1])) - ((b2[1] - b1[1]) * (a1[0] - b1[0]));
	  var ubT = ((a2[0] - a1[0]) * (a1[1] - b1[1])) - ((a2[1] - a1[1]) * (a1[0] - b1[0]));
	  var uB = ((b2[1] - b1[1]) * (a2[0] - a1[0])) - ((b2[0] - b1[0]) * (a2[1] - a1[1]));

	  if (uB !== 0) {
	    var ua = uaT / uB;
	    var ub = ubT / uB;

	    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
	      return true;
	    }
	  }

	  return false;
	}

	// ported from terraformer.js https://github.com/Esri/Terraformer/blob/master/terraformer.js#L521-L531
	function arrayIntersectsArray (a, b) {
	  for (var i = 0; i < a.length - 1; i++) {
	    for (var j = 0; j < b.length - 1; j++) {
	      if (vertexIntersectsVertex(a[i], a[i + 1], b[j], b[j + 1])) {
	        return true;
	      }
	    }
	  }

	  return false;
	}

	// ported from terraformer.js https://github.com/Esri/Terraformer/blob/master/terraformer.js#L470-L480
	function coordinatesContainPoint (coordinates, point) {
	  var contains = false;
	  for (var i = -1, l = coordinates.length, j = l - 1; ++i < l; j = i) {
	    if (((coordinates[i][1] <= point[1] && point[1] < coordinates[j][1]) ||
	         (coordinates[j][1] <= point[1] && point[1] < coordinates[i][1])) &&
	        (point[0] < (((coordinates[j][0] - coordinates[i][0]) * (point[1] - coordinates[i][1])) / (coordinates[j][1] - coordinates[i][1])) + coordinates[i][0])) {
	      contains = !contains;
	    }
	  }
	  return contains;
	}

	// ported from terraformer-arcgis-parser.js https://github.com/Esri/terraformer-arcgis-parser/blob/master/terraformer-arcgis-parser.js#L106-L113
	function coordinatesContainCoordinates (outer, inner) {
	  var intersects = arrayIntersectsArray(outer, inner);
	  var contains = coordinatesContainPoint(outer, inner[0]);
	  if (!intersects && contains) {
	    return true;
	  }
	  return false;
	}

	// do any polygons in this array contain any other polygons in this array?
	// used for checking for holes in arcgis rings
	// ported from terraformer-arcgis-parser.js https://github.com/Esri/terraformer-arcgis-parser/blob/master/terraformer-arcgis-parser.js#L117-L172
	function convertRingsToGeoJSON (rings) {
	  var outerRings = [];
	  var holes = [];
	  var x; // iterator
	  var outerRing; // current outer ring being evaluated
	  var hole; // current hole being evaluated

	  // for each ring
	  for (var r = 0; r < rings.length; r++) {
	    var ring = closeRing(rings[r].slice(0));
	    if (ring.length < 4) {
	      continue;
	    }
	    // is this ring an outer ring? is it clockwise?
	    if (ringIsClockwise(ring)) {
	      var polygon = [ ring ];
	      outerRings.push(polygon); // push to outer rings
	    } else {
	      holes.push(ring); // counterclockwise push to holes
	    }
	  }

	  var uncontainedHoles = [];

	  // while there are holes left...
	  while (holes.length) {
	    // pop a hole off out stack
	    hole = holes.pop();

	    // loop over all outer rings and see if they contain our hole.
	    var contained = false;
	    for (x = outerRings.length - 1; x >= 0; x--) {
	      outerRing = outerRings[x][0];
	      if (coordinatesContainCoordinates(outerRing, hole)) {
	        // the hole is contained push it into our polygon
	        outerRings[x].push(hole);
	        contained = true;
	        break;
	      }
	    }

	    // ring is not contained in any outer ring
	    // sometimes this happens https://github.com/Esri/esri-leaflet/issues/320
	    if (!contained) {
	      uncontainedHoles.push(hole);
	    }
	  }

	  // if we couldn't match any holes using contains we can try intersects...
	  while (uncontainedHoles.length) {
	    // pop a hole off out stack
	    hole = uncontainedHoles.pop();

	    // loop over all outer rings and see if any intersect our hole.
	    var intersects = false;

	    for (x = outerRings.length - 1; x >= 0; x--) {
	      outerRing = outerRings[x][0];
	      if (arrayIntersectsArray(outerRing, hole)) {
	        // the hole is contained push it into our polygon
	        outerRings[x].push(hole);
	        intersects = true;
	        break;
	      }
	    }

	    if (!intersects) {
	      outerRings.push([hole.reverse()]);
	    }
	  }

	  if (outerRings.length === 1) {
	    return {
	      type: 'Polygon',
	      coordinates: outerRings[0]
	    };
	  } else {
	    return {
	      type: 'MultiPolygon',
	      coordinates: outerRings
	    };
	  }
	}

	// This function ensures that rings are oriented in the right directions
	// outer rings are clockwise, holes are counterclockwise
	// used for converting GeoJSON Polygons to ArcGIS Polygons
	function orientRings (poly) {
	  var output = [];
	  var polygon = poly.slice(0);
	  var outerRing = closeRing(polygon.shift().slice(0));
	  if (outerRing.length >= 4) {
	    if (!ringIsClockwise(outerRing)) {
	      outerRing.reverse();
	    }

	    output.push(outerRing);

	    for (var i = 0; i < polygon.length; i++) {
	      var hole = closeRing(polygon[i].slice(0));
	      if (hole.length >= 4) {
	        if (ringIsClockwise(hole)) {
	          hole.reverse();
	        }
	        output.push(hole);
	      }
	    }
	  }

	  return output;
	}

	// This function flattens holes in multipolygons to one array of polygons
	// used for converting GeoJSON Polygons to ArcGIS Polygons
	function flattenMultiPolygonRings (rings) {
	  var output = [];
	  for (var i = 0; i < rings.length; i++) {
	    var polygon = orientRings(rings[i]);
	    for (var x = polygon.length - 1; x >= 0; x--) {
	      var ring = polygon[x].slice(0);
	      output.push(ring);
	    }
	  }
	  return output;
	}

	// shallow object clone for feature properties and attributes
	// from http://jsperf.com/cloning-an-object/2
	function shallowClone$1 (obj) {
	  var target = {};
	  for (var i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      target[i] = obj[i];
	    }
	  }
	  return target;
	}

	function arcgisToGeoJSON$1 (arcgis, idAttribute) {
	  var geojson = {};

	  if (typeof arcgis.x === 'number' && typeof arcgis.y === 'number') {
	    geojson.type = 'Point';
	    geojson.coordinates = [arcgis.x, arcgis.y];
	  }

	  if (arcgis.points) {
	    geojson.type = 'MultiPoint';
	    geojson.coordinates = arcgis.points.slice(0);
	  }

	  if (arcgis.paths) {
	    if (arcgis.paths.length === 1) {
	      geojson.type = 'LineString';
	      geojson.coordinates = arcgis.paths[0].slice(0);
	    } else {
	      geojson.type = 'MultiLineString';
	      geojson.coordinates = arcgis.paths.slice(0);
	    }
	  }

	  if (arcgis.rings) {
	    geojson = convertRingsToGeoJSON(arcgis.rings.slice(0));
	  }

	  if (arcgis.geometry || arcgis.attributes) {
	    geojson.type = 'Feature';
	    geojson.geometry = (arcgis.geometry) ? arcgisToGeoJSON$1(arcgis.geometry) : null;
	    geojson.properties = (arcgis.attributes) ? shallowClone$1(arcgis.attributes) : null;
	    if (arcgis.attributes) {
	      geojson.id = arcgis.attributes[idAttribute] || arcgis.attributes.OBJECTID || arcgis.attributes.FID;
	    }
	  }

	  // if no valid geometry was encountered
	  if (JSON.stringify(geojson.geometry) === JSON.stringify({})) {
	    geojson.geometry = null;
	  }

	  return geojson;
	}

	function geojsonToArcGIS$1 (geojson, idAttribute) {
	  idAttribute = idAttribute || 'OBJECTID';
	  var spatialReference = { wkid: 4326 };
	  var result = {};
	  var i;

	  switch (geojson.type) {
	    case 'Point':
	      result.x = geojson.coordinates[0];
	      result.y = geojson.coordinates[1];
	      result.spatialReference = spatialReference;
	      break;
	    case 'MultiPoint':
	      result.points = geojson.coordinates.slice(0);
	      result.spatialReference = spatialReference;
	      break;
	    case 'LineString':
	      result.paths = [geojson.coordinates.slice(0)];
	      result.spatialReference = spatialReference;
	      break;
	    case 'MultiLineString':
	      result.paths = geojson.coordinates.slice(0);
	      result.spatialReference = spatialReference;
	      break;
	    case 'Polygon':
	      result.rings = orientRings(geojson.coordinates.slice(0));
	      result.spatialReference = spatialReference;
	      break;
	    case 'MultiPolygon':
	      result.rings = flattenMultiPolygonRings(geojson.coordinates.slice(0));
	      result.spatialReference = spatialReference;
	      break;
	    case 'Feature':
	      if (geojson.geometry) {
	        result.geometry = geojsonToArcGIS$1(geojson.geometry, idAttribute);
	      }
	      result.attributes = (geojson.properties) ? shallowClone$1(geojson.properties) : {};
	      if (geojson.id) {
	        result.attributes[idAttribute] = geojson.id;
	      }
	      break;
	    case 'FeatureCollection':
	      result = [];
	      for (i = 0; i < geojson.features.length; i++) {
	        result.push(geojsonToArcGIS$1(geojson.features[i], idAttribute));
	      }
	      break;
	    case 'GeometryCollection':
	      result = [];
	      for (i = 0; i < geojson.geometries.length; i++) {
	        result.push(geojsonToArcGIS$1(geojson.geometries[i], idAttribute));
	      }
	      break;
	  }

	  return result;
	}

	function geojsonToArcGIS (geojson, idAttr) {
	  return geojsonToArcGIS$1(geojson, idAttr);
	}

	function arcgisToGeoJSON (arcgis, idAttr) {
	  return arcgisToGeoJSON$1(arcgis, idAttr);
	}

	// shallow object clone for feature properties and attributes
	// from http://jsperf.com/cloning-an-object/2
	function shallowClone (obj) {
	  var target = {};
	  for (var i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      target[i] = obj[i];
	    }
	  }
	  return target;
	}

	// convert an extent (ArcGIS) to LatLngBounds (Leaflet)
	function extentToBounds (extent) {
	  // "NaN" coordinates from ArcGIS Server indicate a null geometry
	  if (extent.xmin !== 'NaN' && extent.ymin !== 'NaN' && extent.xmax !== 'NaN' && extent.ymax !== 'NaN') {
	    var sw = L$1.latLng(extent.ymin, extent.xmin);
	    var ne = L$1.latLng(extent.ymax, extent.xmax);
	    return L$1.latLngBounds(sw, ne);
	  } else {
	    return null;
	  }
	}

	// convert an LatLngBounds (Leaflet) to extent (ArcGIS)
	function boundsToExtent (bounds) {
	  bounds = L$1.latLngBounds(bounds);
	  return {
	    'xmin': bounds.getSouthWest().lng,
	    'ymin': bounds.getSouthWest().lat,
	    'xmax': bounds.getNorthEast().lng,
	    'ymax': bounds.getNorthEast().lat,
	    'spatialReference': {
	      'wkid': 4326
	    }
	  };
	}

	function responseToFeatureCollection (response, idAttribute) {
	  var objectIdField;
	  var features = response.features || response.results;
	  var count = features.length;

	  if (idAttribute) {
	    objectIdField = idAttribute;
	  } else if (response.objectIdFieldName) {
	    objectIdField = response.objectIdFieldName;
	  } else if (response.fields) {
	    for (var j = 0; j <= response.fields.length - 1; j++) {
	      if (response.fields[j].type === 'esriFieldTypeOID') {
	        objectIdField = response.fields[j].name;
	        break;
	      }
	    }
	  } else if (count) {
	    /* as a last resort, check for common ID fieldnames in the first feature returned
	    not foolproof. identifyFeatures can returned a mixed array of features. */
	    for (var key in features[0].attributes) {
	      if (key.match(/^(OBJECTID|FID|OID|ID)$/i)) {
	        objectIdField = key;
	        break;
	      }
	    }
	  }

	  var featureCollection = {
	    type: 'FeatureCollection',
	    features: []
	  };

	  if (count) {
	    for (var i = features.length - 1; i >= 0; i--) {
	      var feature = arcgisToGeoJSON(features[i], objectIdField);
	      featureCollection.features.push(feature);
	    }
	  }

	  return featureCollection;
	}

	  // trim url whitespace and add a trailing slash if needed
	function cleanUrl (url) {
	  // trim leading and trailing spaces, but not spaces inside the url
	  url = L$1.Util.trim(url);

	  // add a trailing slash to the url if the user omitted it
	  if (url[url.length - 1] !== '/') {
	    url += '/';
	  }

	  return url;
	}

	function isArcgisOnline (url) {
	  /* hosted feature services support geojson as an output format
	  utility.arcgis.com services are proxied from a variety of ArcGIS Server vintages, and may not */
	  return (/^(?!.*utility\.arcgis\.com).*\.arcgis\.com.*FeatureServer/i).test(url);
	}

	function geojsonTypeToArcGIS (geoJsonType) {
	  var arcgisGeometryType;
	  switch (geoJsonType) {
	    case 'Point':
	      arcgisGeometryType = 'esriGeometryPoint';
	      break;
	    case 'MultiPoint':
	      arcgisGeometryType = 'esriGeometryMultipoint';
	      break;
	    case 'LineString':
	      arcgisGeometryType = 'esriGeometryPolyline';
	      break;
	    case 'MultiLineString':
	      arcgisGeometryType = 'esriGeometryPolyline';
	      break;
	    case 'Polygon':
	      arcgisGeometryType = 'esriGeometryPolygon';
	      break;
	    case 'MultiPolygon':
	      arcgisGeometryType = 'esriGeometryPolygon';
	      break;
	  }

	  return arcgisGeometryType;
	}

	function warn () {
	  if (console && console.warn) {
	    console.warn.apply(console, arguments);
	  }
	}

	function calcAttributionWidth (map) {
	  // either crop at 55px or user defined buffer
	  return (map.getSize().x - options.attributionWidthOffset) + 'px';
	}

	function setEsriAttribution (map) {
	  if (map.attributionControl && !map.attributionControl._esriAttributionAdded) {
	    map.attributionControl.setPrefix('<a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a> | Powered by <a href="https://www.esri.com">Esri</a>');

	    var hoverAttributionStyle = document.createElement('style');
	    hoverAttributionStyle.type = 'text/css';
	    hoverAttributionStyle.innerHTML = '.esri-truncated-attribution:hover {' +
	      'white-space: normal;' +
	    '}';

	    document.getElementsByTagName('head')[0].appendChild(hoverAttributionStyle);
	    L$1.DomUtil.addClass(map.attributionControl._container, 'esri-truncated-attribution:hover');

	    // define a new css class in JS to trim attribution into a single line
	    var attributionStyle = document.createElement('style');
	    attributionStyle.type = 'text/css';
	    attributionStyle.innerHTML = '.esri-truncated-attribution {' +
	      'vertical-align: -3px;' +
	      'white-space: nowrap;' +
	      'overflow: hidden;' +
	      'text-overflow: ellipsis;' +
	      'display: inline-block;' +
	      'transition: 0s white-space;' +
	      'transition-delay: 1s;' +
	      'max-width: ' + calcAttributionWidth(map) + ';' +
	    '}';

	    document.getElementsByTagName('head')[0].appendChild(attributionStyle);
	    L$1.DomUtil.addClass(map.attributionControl._container, 'esri-truncated-attribution');

	    // update the width used to truncate when the map itself is resized
	    map.on('resize', function (e) {
	      map.attributionControl._container.style.maxWidth = calcAttributionWidth(e.target);
	    });

	    map.attributionControl._esriAttributionAdded = true;
	  }
	}

	function _setGeometry (geometry) {
	  var params = {
	    geometry: null,
	    geometryType: null
	  };

	  // convert bounds to extent and finish
	  if (geometry instanceof L$1.LatLngBounds) {
	    // set geometry + geometryType
	    params.geometry = boundsToExtent(geometry);
	    params.geometryType = 'esriGeometryEnvelope';
	    return params;
	  }

	  // convert L.Marker > L.LatLng
	  if (geometry.getLatLng) {
	    geometry = geometry.getLatLng();
	  }

	  // convert L.LatLng to a geojson point and continue;
	  if (geometry instanceof L$1.LatLng) {
	    geometry = {
	      type: 'Point',
	      coordinates: [geometry.lng, geometry.lat]
	    };
	  }

	  // handle L.GeoJSON, pull out the first geometry
	  if (geometry instanceof L$1.GeoJSON) {
	    // reassign geometry to the GeoJSON value  (we are assuming that only one feature is present)
	    geometry = geometry.getLayers()[0].feature.geometry;
	    params.geometry = geojsonToArcGIS(geometry);
	    params.geometryType = geojsonTypeToArcGIS(geometry.type);
	  }

	  // Handle L.Polyline and L.Polygon
	  if (geometry.toGeoJSON) {
	    geometry = geometry.toGeoJSON();
	  }

	  // handle GeoJSON feature by pulling out the geometry
	  if (geometry.type === 'Feature') {
	    // get the geometry of the geojson feature
	    geometry = geometry.geometry;
	  }

	  // confirm that our GeoJSON is a point, line or polygon
	  if (geometry.type === 'Point' || geometry.type === 'LineString' || geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
	    params.geometry = geojsonToArcGIS(geometry);
	    params.geometryType = geojsonTypeToArcGIS(geometry.type);
	    return params;
	  }

	  // warn the user if we havn't found an appropriate object
	  warn('invalid geometry passed to spatial query. Should be L.LatLng, L.LatLngBounds, L.Marker or a GeoJSON Point, Line, Polygon or MultiPolygon object');

	  return;
	}

	function _getAttributionData (url, map) {
	  jsonp(url, {}, L$1.Util.bind(function (error, attributions) {
	    if (error) { return; }
	    map._esriAttributions = [];
	    for (var c = 0; c < attributions.contributors.length; c++) {
	      var contributor = attributions.contributors[c];

	      for (var i = 0; i < contributor.coverageAreas.length; i++) {
	        var coverageArea = contributor.coverageAreas[i];
	        var southWest = L$1.latLng(coverageArea.bbox[0], coverageArea.bbox[1]);
	        var northEast = L$1.latLng(coverageArea.bbox[2], coverageArea.bbox[3]);
	        map._esriAttributions.push({
	          attribution: contributor.attribution,
	          score: coverageArea.score,
	          bounds: L$1.latLngBounds(southWest, northEast),
	          minZoom: coverageArea.zoomMin,
	          maxZoom: coverageArea.zoomMax
	        });
	      }
	    }

	    map._esriAttributions.sort(function (a, b) {
	      return b.score - a.score;
	    });

	    // pass the same argument as the map's 'moveend' event
	    var obj = { target: map };
	    _updateMapAttribution(obj);
	  }, this));
	}

	function _updateMapAttribution (evt) {
	  var map = evt.target;
	  var oldAttributions = map._esriAttributions;

	  if (map && map.attributionControl && oldAttributions) {
	    var newAttributions = '';
	    var bounds = map.getBounds();
	    var wrappedBounds = L$1.latLngBounds(
	      bounds.getSouthWest().wrap(),
	      bounds.getNorthEast().wrap()
	    );
	    var zoom = map.getZoom();

	    for (var i = 0; i < oldAttributions.length; i++) {
	      var attribution = oldAttributions[i];
	      var text = attribution.attribution;

	      if (!newAttributions.match(text) && attribution.bounds.intersects(wrappedBounds) && zoom >= attribution.minZoom && zoom <= attribution.maxZoom) {
	        newAttributions += (', ' + text);
	      }
	    }

	    newAttributions = newAttributions.substr(2);
	    var attributionElement = map.attributionControl._container.querySelector('.esri-dynamic-attribution');

	    attributionElement.innerHTML = newAttributions;
	    attributionElement.style.maxWidth = calcAttributionWidth(map);

	    map.fire('attributionupdated', {
	      attribution: newAttributions
	    });
	  }
	}

	var EsriUtil = {
	  shallowClone: shallowClone,
	  warn: warn,
	  cleanUrl: cleanUrl,
	  isArcgisOnline: isArcgisOnline,
	  geojsonTypeToArcGIS: geojsonTypeToArcGIS,
	  responseToFeatureCollection: responseToFeatureCollection,
	  geojsonToArcGIS: geojsonToArcGIS,
	  arcgisToGeoJSON: arcgisToGeoJSON,
	  boundsToExtent: boundsToExtent,
	  extentToBounds: extentToBounds,
	  calcAttributionWidth: calcAttributionWidth,
	  setEsriAttribution: setEsriAttribution,
	  _setGeometry: _setGeometry,
	  _getAttributionData: _getAttributionData,
	  _updateMapAttribution: _updateMapAttribution
	};

	var Task = L$1.Class.extend({

	  options: {
	    proxy: false,
	    useCors: cors
	  },

	  // Generate a method for each methodName:paramName in the setters for this task.
	  generateSetter: function (param, context) {
	    return L$1.Util.bind(function (value) {
	      this.params[param] = value;
	      return this;
	    }, context);
	  },

	  initialize: function (endpoint) {
	    console.log('initializing with endpoint', endpoint);

	    // endpoint can be either a url (and options) for an ArcGIS Rest Service or an instance of EsriLeaflet.Service
	    if (endpoint.request && endpoint.options) {
	      this._service = endpoint;
	      L$1.Util.setOptions(this, endpoint.options);
	    } else {
	      L$1.Util.setOptions(this, endpoint);
	      this.options.url = cleanUrl(endpoint.url);
	    }

	    // clone default params into this object
	    this.params = L$1.Util.extend({}, this.params || {});

	    // generate setter methods based on the setters object implimented a child class
	    if (this.setters) {
	      for (var setter in this.setters) {
	        var param = this.setters[setter];
	        this[setter] = this.generateSetter(param, this);
	      }
	    }

	    console.log('initialize', this);
	  },

	  token: function (token) {
	    if (this._service) {
	      this._service.authenticate(token);
	    } else {
	      this.params.token = token;
	    }
	    return this;
	  },

	  // ArcGIS Server Find/Identify 10.5+
	  format: function (boolean) {
	    // use double negative to expose a more intuitive positive method name
	    this.params.returnUnformattedValues = !boolean;
	    return this;
	  },

	  request: function (callback, context) {
	    console.log('request callback', callback);
	    console.log('request context', callback);
	    console.log('request this', this);
	    if (this._service) {
	      console.log('has service', this._service);
	      return this._service.request(this.path, this.params, callback, context);
	    }

	    console.log('no service');
	    return this._request('request', this.path, this.params, callback, context);
	  },

	  _request: function (method, path, params, callback, context) {
	    console.log('using internal request!');
	    var url = (this.options.proxy) ? this.options.proxy + '?' + this.options.url + path : this.options.url + path;

	    console.log('this is the url!', url);

	    if ((method === 'get' || method === 'request') && !this.options.useCors) {
	      return Request.get.JSONP(url, params, callback, context);
	    }

	    return Request[method](url, params, callback, context);
	  }
	});

	function task (options) {
	  return new Task(options);
	}

	var Query = Task.extend({
	  setters: {
	    'offset': 'resultOffset',
	    'limit': 'resultRecordCount',
	    'fields': 'outFields',
	    'precision': 'geometryPrecision',
	    'featureIds': 'objectIds',
	    'returnGeometry': 'returnGeometry',
	    'returnM': 'returnM',
	    'transform': 'datumTransformation',
	    'token': 'token'
	  },

	  path: 'query',

	  params: {
	    returnGeometry: true,
	    where: '1=1',
	    outSr: 4326,
	    outFields: '*'
	  },

	  // Returns a feature if its shape is wholly contained within the search geometry. Valid for all shape type combinations.
	  within: function (geometry) {
	    this._setGeometryParams(geometry);
	    this.params.spatialRel = 'esriSpatialRelContains'; // to the REST api this reads geometry **contains** layer
	    return this;
	  },

	  // Returns a feature if any spatial relationship is found. Applies to all shape type combinations.
	  intersects: function (geometry) {
	    this._setGeometryParams(geometry);
	    this.params.spatialRel = 'esriSpatialRelIntersects';
	    return this;
	  },

	  // Returns a feature if its shape wholly contains the search geometry. Valid for all shape type combinations.
	  contains: function (geometry) {
	    this._setGeometryParams(geometry);
	    this.params.spatialRel = 'esriSpatialRelWithin'; // to the REST api this reads geometry **within** layer
	    return this;
	  },

	  // Returns a feature if the intersection of the interiors of the two shapes is not empty and has a lower dimension than the maximum dimension of the two shapes. Two lines that share an endpoint in common do not cross. Valid for Line/Line, Line/Area, Multi-point/Area, and Multi-point/Line shape type combinations.
	  crosses: function (geometry) {
	    this._setGeometryParams(geometry);
	    this.params.spatialRel = 'esriSpatialRelCrosses';
	    return this;
	  },

	  // Returns a feature if the two shapes share a common boundary. However, the intersection of the interiors of the two shapes must be empty. In the Point/Line case, the point may touch an endpoint only of the line. Applies to all combinations except Point/Point.
	  touches: function (geometry) {
	    this._setGeometryParams(geometry);
	    this.params.spatialRel = 'esriSpatialRelTouches';
	    return this;
	  },

	  // Returns a feature if the intersection of the two shapes results in an object of the same dimension, but different from both of the shapes. Applies to Area/Area, Line/Line, and Multi-point/Multi-point shape type combinations.
	  overlaps: function (geometry) {
	    this._setGeometryParams(geometry);
	    this.params.spatialRel = 'esriSpatialRelOverlaps';
	    return this;
	  },

	  // Returns a feature if the envelope of the two shapes intersects.
	  bboxIntersects: function (geometry) {
	    this._setGeometryParams(geometry);
	    this.params.spatialRel = 'esriSpatialRelEnvelopeIntersects';
	    return this;
	  },

	  // if someone can help decipher the ArcObjects explanation and translate to plain speak, we should mention this method in the doc
	  indexIntersects: function (geometry) {
	    this._setGeometryParams(geometry);
	    this.params.spatialRel = 'esriSpatialRelIndexIntersects'; // Returns a feature if the envelope of the query geometry intersects the index entry for the target geometry
	    return this;
	  },

	  // only valid for Feature Services running on ArcGIS Server 10.3+ or ArcGIS Online
	  nearby: function (latlng, radius) {
	    latlng = L$1.latLng(latlng);
	    this.params.geometry = [latlng.lng, latlng.lat];
	    this.params.geometryType = 'esriGeometryPoint';
	    this.params.spatialRel = 'esriSpatialRelIntersects';
	    this.params.units = 'esriSRUnit_Meter';
	    this.params.distance = radius;
	    this.params.inSr = 4326;
	    return this;
	  },

	  where: function (string) {
	    // instead of converting double-quotes to single quotes, pass as is, and provide a more informative message if a 400 is encountered
	    this.params.where = string;
	    return this;
	  },

	  between: function (start, end) {
	    this.params.time = [start.valueOf(), end.valueOf()];
	    return this;
	  },

	  simplify: function (map, factor) {
	    var mapWidth = Math.abs(map.getBounds().getWest() - map.getBounds().getEast());
	    this.params.maxAllowableOffset = (mapWidth / map.getSize().y) * factor;
	    return this;
	  },

	  orderBy: function (fieldName, order) {
	    order = order || 'ASC';
	    this.params.orderByFields = (this.params.orderByFields) ? this.params.orderByFields + ',' : '';
	    this.params.orderByFields += ([fieldName, order]).join(' ');
	    return this;
	  },

	  run: function (callback, context) {
	    console.log('run some stuff');
	    console.log(this);
	    console.log(this.options);
	    console.log(this.params);
	    this._cleanParams();

	    // services hosted on ArcGIS Online and ArcGIS Server 10.3.1+ support requesting geojson directly
	    if (this.options.isModern || isArcgisOnline(this.options.url)) {
	      console.log('yes its modern');
	      this.params.f = 'geojson';

	      return this.request(function (error, response) {
	        console.log('request is complete');
	        console.log(error);
	        console.log(response);
	        this._trapSQLerrors(error);
	        callback.call(context, error, response, response);
	      }, this);

	    // otherwise convert it in the callback then pass it on
	    } else {
	      console.log('no its not modern');
	      return this.request(function (error, response) {
	        console.log('request is complete');
	        console.log(error);
	        console.log(response);
	        this._trapSQLerrors(error);
	        callback.call(context, error, (response && responseToFeatureCollection(response)), response);
	      }, this);
	    }
	  },

	  count: function (callback, context) {
	    this._cleanParams();
	    this.params.returnCountOnly = true;
	    return this.request(function (error, response) {
	      callback.call(this, error, (response && response.count), response);
	    }, context);
	  },

	  ids: function (callback, context) {
	    this._cleanParams();
	    this.params.returnIdsOnly = true;
	    return this.request(function (error, response) {
	      callback.call(this, error, (response && response.objectIds), response);
	    }, context);
	  },

	  // only valid for Feature Services running on ArcGIS Server 10.3+ or ArcGIS Online
	  bounds: function (callback, context) {
	    this._cleanParams();
	    this.params.returnExtentOnly = true;
	    return this.request(function (error, response) {
	      if (response && response.extent && extentToBounds(response.extent)) {
	        callback.call(context, error, extentToBounds(response.extent), response);
	      } else {
	        error = {
	          message: 'Invalid Bounds'
	        };
	        callback.call(context, error, null, response);
	      }
	    }, context);
	  },

	  // only valid for image services
	  pixelSize: function (rawPoint) {
	    var castPoint = L$1.point(rawPoint);
	    this.params.pixelSize = [castPoint.x, castPoint.y];
	    return this;
	  },

	  // only valid for map services
	  layer: function (layer) {
	    this.path = layer + '/query';
	    return this;
	  },

	  _trapSQLerrors: function (error) {
	    if (error) {
	      if (error.code === '400') {
	        warn('one common syntax error in query requests is encasing string values in double quotes instead of single quotes');
	      }
	    }
	  },

	  _cleanParams: function () {
	    delete this.params.returnIdsOnly;
	    delete this.params.returnExtentOnly;
	    delete this.params.returnCountOnly;
	  },

	  _setGeometryParams: function (geometry) {
	    this.params.inSr = 4326;
	    var converted = _setGeometry(geometry);
	    this.params.geometry = converted.geometry;
	    this.params.geometryType = converted.geometryType;
	  }

	});

	function query (options) {
	  return new Query(options);
	}

	var Find = Task.extend({
	  setters: {
	    // method name > param name
	    'contains': 'contains',
	    'text': 'searchText',
	    'fields': 'searchFields', // denote an array or single string
	    'spatialReference': 'sr',
	    'sr': 'sr',
	    'layers': 'layers',
	    'returnGeometry': 'returnGeometry',
	    'maxAllowableOffset': 'maxAllowableOffset',
	    'precision': 'geometryPrecision',
	    'dynamicLayers': 'dynamicLayers',
	    'returnZ': 'returnZ',
	    'returnM': 'returnM',
	    'gdbVersion': 'gdbVersion',
	    // skipped implementing this (for now) because the REST service implementation isnt consistent between operations
	    // 'transform': 'datumTransformations',
	    'token': 'token'
	  },

	  path: 'find',

	  params: {
	    sr: 4326,
	    contains: true,
	    returnGeometry: true,
	    returnZ: true,
	    returnM: false
	  },

	  layerDefs: function (id, where) {
	    this.params.layerDefs = (this.params.layerDefs) ? this.params.layerDefs + ';' : '';
	    this.params.layerDefs += ([id, where]).join(':');
	    return this;
	  },

	  simplify: function (map, factor) {
	    var mapWidth = Math.abs(map.getBounds().getWest() - map.getBounds().getEast());
	    this.params.maxAllowableOffset = (mapWidth / map.getSize().y) * factor;
	    return this;
	  },

	  run: function (callback, context) {
	    return this.request(function (error, response) {
	      callback.call(context, error, (response && responseToFeatureCollection(response)), response);
	    }, context);
	  }
	});

	function find (options) {
	  return new Find(options);
	}

	var Identify = Task.extend({
	  path: 'identify',

	  between: function (start, end) {
	    this.params.time = [start.valueOf(), end.valueOf()];
	    return this;
	  }
	});

	function identify (options) {
	  return new Identify(options);
	}

	var IdentifyFeatures = Identify.extend({
	  setters: {
	    'layers': 'layers',
	    'precision': 'geometryPrecision',
	    'tolerance': 'tolerance',
	    // skipped implementing this (for now) because the REST service implementation isnt consistent between operations.
	    // 'transform': 'datumTransformations'
	    'returnGeometry': 'returnGeometry'
	  },

	  params: {
	    sr: 4326,
	    layers: 'all',
	    tolerance: 3,
	    returnGeometry: true
	  },

	  on: function (map) {
	    var extent = boundsToExtent(map.getBounds());
	    var size = map.getSize();
	    this.params.imageDisplay = [size.x, size.y, 96];
	    this.params.mapExtent = [extent.xmin, extent.ymin, extent.xmax, extent.ymax];
	    return this;
	  },

	  at: function (geometry) {
	    // cast lat, long pairs in raw array form manually
	    if (geometry.length === 2) {
	      geometry = L$1.latLng(geometry);
	    }
	    this._setGeometryParams(geometry);
	    return this;
	  },

	  layerDef: function (id, where) {
	    this.params.layerDefs = (this.params.layerDefs) ? this.params.layerDefs + ';' : '';
	    this.params.layerDefs += ([id, where]).join(':');
	    return this;
	  },

	  simplify: function (map, factor) {
	    var mapWidth = Math.abs(map.getBounds().getWest() - map.getBounds().getEast());
	    this.params.maxAllowableOffset = (mapWidth / map.getSize().y) * factor;
	    return this;
	  },

	  run: function (callback, context) {
	    return this.request(function (error, response) {
	      // immediately invoke with an error
	      if (error) {
	        callback.call(context, error, undefined, response);
	        return;

	      // ok no error lets just assume we have features...
	      } else {
	        var featureCollection = responseToFeatureCollection(response);
	        response.results = response.results.reverse();
	        for (var i = 0; i < featureCollection.features.length; i++) {
	          var feature = featureCollection.features[i];
	          feature.layerId = response.results[i].layerId;
	        }
	        callback.call(context, undefined, featureCollection, response);
	      }
	    });
	  },

	  _setGeometryParams: function (geometry) {
	    var converted = _setGeometry(geometry);
	    this.params.geometry = converted.geometry;
	    this.params.geometryType = converted.geometryType;
	  }
	});

	function identifyFeatures (options) {
	  return new IdentifyFeatures(options);
	}

	var IdentifyImage = Identify.extend({
	  setters: {
	    'setMosaicRule': 'mosaicRule',
	    'setRenderingRule': 'renderingRule',
	    'setPixelSize': 'pixelSize',
	    'returnCatalogItems': 'returnCatalogItems',
	    'returnGeometry': 'returnGeometry'
	  },

	  params: {
	    returnGeometry: false
	  },

	  at: function (latlng) {
	    latlng = L$1.latLng(latlng);
	    this.params.geometry = JSON.stringify({
	      x: latlng.lng,
	      y: latlng.lat,
	      spatialReference: {
	        wkid: 4326
	      }
	    });
	    this.params.geometryType = 'esriGeometryPoint';
	    return this;
	  },

	  getMosaicRule: function () {
	    return this.params.mosaicRule;
	  },

	  getRenderingRule: function () {
	    return this.params.renderingRule;
	  },

	  getPixelSize: function () {
	    return this.params.pixelSize;
	  },

	  run: function (callback, context) {
	    return this.request(function (error, response) {
	      callback.call(context, error, (response && this._responseToGeoJSON(response)), response);
	    }, this);
	  },

	  // get pixel data and return as geoJSON point
	  // populate catalog items (if any)
	  // merging in any catalogItemVisibilities as a propery of each feature
	  _responseToGeoJSON: function (response) {
	    var location = response.location;
	    var catalogItems = response.catalogItems;
	    var catalogItemVisibilities = response.catalogItemVisibilities;
	    var geoJSON = {
	      'pixel': {
	        'type': 'Feature',
	        'geometry': {
	          'type': 'Point',
	          'coordinates': [location.x, location.y]
	        },
	        'crs': {
	          'type': 'EPSG',
	          'properties': {
	            'code': location.spatialReference.wkid
	          }
	        },
	        'properties': {
	          'OBJECTID': response.objectId,
	          'name': response.name,
	          'value': response.value
	        },
	        'id': response.objectId
	      }
	    };

	    if (response.properties && response.properties.Values) {
	      geoJSON.pixel.properties.values = response.properties.Values;
	    }

	    if (catalogItems && catalogItems.features) {
	      geoJSON.catalogItems = responseToFeatureCollection(catalogItems);
	      if (catalogItemVisibilities && catalogItemVisibilities.length === geoJSON.catalogItems.features.length) {
	        for (var i = catalogItemVisibilities.length - 1; i >= 0; i--) {
	          geoJSON.catalogItems.features[i].properties.catalogItemVisibility = catalogItemVisibilities[i];
	        }
	      }
	    }
	    return geoJSON;
	  }

	});

	function identifyImage (params) {
	  return new IdentifyImage(params);
	}

	var Service = L$1.Evented.extend({

	  options: {
	    proxy: false,
	    useCors: cors,
	    timeout: 0
	  },

	  initialize: function (options) {
	    options = options || {};
	    this._requestQueue = [];
	    this._authenticating = false;
	    L$1.Util.setOptions(this, options);
	    this.options.url = cleanUrl(this.options.url);
	  },

	  get: function (path, params, callback, context) {
	    return this._request('get', path, params, callback, context);
	  },

	  post: function (path, params, callback, context) {
	    return this._request('post', path, params, callback, context);
	  },

	  request: function (path, params, callback, context) {
	    return this._request('request', path, params, callback, context);
	  },

	  metadata: function (callback, context) {
	    return this._request('get', '', {}, callback, context);
	  },

	  authenticate: function (token) {
	    this._authenticating = false;
	    this.options.token = token;
	    this._runQueue();
	    return this;
	  },

	  getTimeout: function () {
	    return this.options.timeout;
	  },

	  setTimeout: function (timeout) {
	    this.options.timeout = timeout;
	  },

	  _request: function (method, path, params, callback, context) {
	    this.fire('requeststart', {
	      url: this.options.url + path,
	      params: params,
	      method: method
	    }, true);

	    var wrappedCallback = this._createServiceCallback(method, path, params, callback, context);

	    if (this.options.token) {
	      params.token = this.options.token;
	    }

	    if (this._authenticating) {
	      this._requestQueue.push([method, path, params, callback, context]);
	      return;
	    } else {
	      var url = (this.options.proxy) ? this.options.proxy + '?' + this.options.url + path : this.options.url + path;

	      if ((method === 'get' || method === 'request') && !this.options.useCors) {
	        return Request.get.JSONP(url, params, wrappedCallback, context);
	      } else {
	        return Request[method](url, params, wrappedCallback, context);
	      }
	    }
	  },

	  _createServiceCallback: function (method, path, params, callback, context) {
	    return L$1.Util.bind(function (error, response) {
	      if (error && (error.code === 499 || error.code === 498)) {
	        this._authenticating = true;

	        this._requestQueue.push([method, path, params, callback, context]);

	        // fire an event for users to handle and re-authenticate
	        this.fire('authenticationrequired', {
	          authenticate: L$1.Util.bind(this.authenticate, this)
	        }, true);

	        // if the user has access to a callback they can handle the auth error
	        error.authenticate = L$1.Util.bind(this.authenticate, this);
	      }

	      callback.call(context, error, response);

	      if (error) {
	        this.fire('requesterror', {
	          url: this.options.url + path,
	          params: params,
	          message: error.message,
	          code: error.code,
	          method: method
	        }, true);
	      } else {
	        this.fire('requestsuccess', {
	          url: this.options.url + path,
	          params: params,
	          response: response,
	          method: method
	        }, true);
	      }

	      this.fire('requestend', {
	        url: this.options.url + path,
	        params: params,
	        method: method
	      }, true);
	    }, this);
	  },

	  _runQueue: function () {
	    for (var i = this._requestQueue.length - 1; i >= 0; i--) {
	      var request = this._requestQueue[i];
	      var method = request.shift();
	      this[method].apply(this, request);
	    }
	    this._requestQueue = [];
	  }
	});

	function service (options) {
	  return new Service(options);
	}

	var MapService = Service.extend({

	  identify: function () {
	    return identifyFeatures(this);
	  },

	  find: function () {
	    return find(this);
	  },

	  query: function () {
	    return query(this);
	  }

	});

	function mapService (options) {
	  return new MapService(options);
	}

	var ImageService = Service.extend({

	  query: function () {
	    return query(this);
	  },

	  identify: function () {
	    return identifyImage(this);
	  }
	});

	function imageService (options) {
	  return new ImageService(options);
	}

	var FeatureLayerService = Service.extend({

	  options: {
	    idAttribute: 'OBJECTID'
	  },

	  query: function () {
	    return query(this);
	  },

	  addFeature: function (feature, callback, context) {
	    delete feature.id;

	    feature = geojsonToArcGIS(feature);

	    return this.post('addFeatures', {
	      features: [feature]
	    }, function (error, response) {
	      var result = (response && response.addResults) ? response.addResults[0] : undefined;
	      if (callback) {
	        callback.call(context, error || response.addResults[0].error, result);
	      }
	    }, context);
	  },

	  updateFeature: function (feature, callback, context) {
	    feature = geojsonToArcGIS(feature, this.options.idAttribute);

	    return this.post('updateFeatures', {
	      features: [feature]
	    }, function (error, response) {
	      var result = (response && response.updateResults) ? response.updateResults[0] : undefined;
	      if (callback) {
	        callback.call(context, error || response.updateResults[0].error, result);
	      }
	    }, context);
	  },

	  deleteFeature: function (id, callback, context) {
	    return this.post('deleteFeatures', {
	      objectIds: id
	    }, function (error, response) {
	      var result = (response && response.deleteResults) ? response.deleteResults[0] : undefined;
	      if (callback) {
	        callback.call(context, error || response.deleteResults[0].error, result);
	      }
	    }, context);
	  },

	  deleteFeatures: function (ids, callback, context) {
	    return this.post('deleteFeatures', {
	      objectIds: ids
	    }, function (error, response) {
	      // pass back the entire array
	      var result = (response && response.deleteResults) ? response.deleteResults : undefined;
	      if (callback) {
	        callback.call(context, error || response.deleteResults[0].error, result);
	      }
	    }, context);
	  }
	});

	function featureLayerService (options) {
	  return new FeatureLayerService(options);
	}

	var tileProtocol = (window.location.protocol !== 'https:') ? 'http:' : 'https:';

	var BasemapLayer = L$1.TileLayer.extend({
	  statics: {
	    TILES: {
	      Streets: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 19,
	          subdomains: ['server', 'services'],
	          attribution: 'USGS, NOAA',
	          attributionUrl: 'https://static.arcgis.com/attribution/World_Street_Map'
	        }
	      },
	      Topographic: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 19,
	          subdomains: ['server', 'services'],
	          attribution: 'USGS, NOAA',
	          attributionUrl: 'https://static.arcgis.com/attribution/World_Topo_Map'
	        }
	      },
	      Oceans: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 16,
	          subdomains: ['server', 'services'],
	          attribution: 'USGS, NOAA',
	          attributionUrl: 'https://static.arcgis.com/attribution/Ocean_Basemap'
	        }
	      },
	      OceansLabels: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 16,
	          subdomains: ['server', 'services'],
	          pane: (pointerEvents) ? 'esri-labels' : 'tilePane'
	        }
	      },
	      NationalGeographic: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 16,
	          subdomains: ['server', 'services'],
	          attribution: 'National Geographic, DeLorme, HERE, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, increment P Corp.'
	        }
	      },
	      DarkGray: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 16,
	          subdomains: ['server', 'services'],
	          attribution: 'HERE, DeLorme, MapmyIndia, &copy; OpenStreetMap contributors'
	        }
	      },
	      DarkGrayLabels: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 16,
	          subdomains: ['server', 'services'],
	          pane: (pointerEvents) ? 'esri-labels' : 'tilePane',
	          attribution: ''

	        }
	      },
	      Gray: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 16,
	          subdomains: ['server', 'services'],
	          attribution: 'HERE, DeLorme, MapmyIndia, &copy; OpenStreetMap contributors'
	        }
	      },
	      GrayLabels: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 16,
	          subdomains: ['server', 'services'],
	          pane: (pointerEvents) ? 'esri-labels' : 'tilePane',
	          attribution: ''
	        }
	      },
	      Imagery: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 19,
	          subdomains: ['server', 'services'],
	          attribution: 'DigitalGlobe, GeoEye, i-cubed, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community'
	        }
	      },
	      ImageryLabels: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 19,
	          subdomains: ['server', 'services'],
	          pane: (pointerEvents) ? 'esri-labels' : 'tilePane',
	          attribution: ''
	        }
	      },
	      ImageryTransportation: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 19,
	          subdomains: ['server', 'services'],
	          pane: (pointerEvents) ? 'esri-labels' : 'tilePane'
	        }
	      },
	      ShadedRelief: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 13,
	          subdomains: ['server', 'services'],
	          attribution: 'USGS'
	        }
	      },
	      ShadedReliefLabels: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 12,
	          subdomains: ['server', 'services'],
	          pane: (pointerEvents) ? 'esri-labels' : 'tilePane',
	          attribution: ''
	        }
	      },
	      Terrain: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 13,
	          subdomains: ['server', 'services'],
	          attribution: 'USGS, NOAA'
	        }
	      },
	      TerrainLabels: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 13,
	          subdomains: ['server', 'services'],
	          pane: (pointerEvents) ? 'esri-labels' : 'tilePane',
	          attribution: ''
	        }
	      },
	      USATopo: {
	        urlTemplate: tileProtocol + '//{s}.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/{z}/{y}/{x}',
	        options: {
	          minZoom: 1,
	          maxZoom: 15,
	          subdomains: ['server', 'services'],
	          attribution: 'USGS, National Geographic Society, i-cubed'
	        }
	      }
	    }
	  },

	  initialize: function (key, options) {
	    var config;

	    // set the config variable with the appropriate config object
	    if (typeof key === 'object' && key.urlTemplate && key.options) {
	      config = key;
	    } else if (typeof key === 'string' && BasemapLayer.TILES[key]) {
	      config = BasemapLayer.TILES[key];
	    } else {
	      throw new Error('L.esri.BasemapLayer: Invalid parameter. Use one of "Streets", "Topographic", "Oceans", "OceansLabels", "NationalGeographic", "Gray", "GrayLabels", "DarkGray", "DarkGrayLabels", "Imagery", "ImageryLabels", "ImageryTransportation", "ShadedRelief", "ShadedReliefLabels", "Terrain", "TerrainLabels" or "USATopo"');
	    }

	    // merge passed options into the config options
	    var tileOptions = L$1.Util.extend(config.options, options);

	    L$1.Util.setOptions(this, tileOptions);

	    if (this.options.token) {
	      config.urlTemplate += ('?token=' + this.options.token);
	    }

	    // call the initialize method on L.TileLayer to set everything up
	    L$1.TileLayer.prototype.initialize.call(this, config.urlTemplate, tileOptions);
	  },

	  onAdd: function (map) {
	    // include 'Powered by Esri' in map attribution
	    setEsriAttribution(map);

	    if (this.options.pane === 'esri-labels') {
	      this._initPane();
	    }
	    // some basemaps can supply dynamic attribution
	    if (this.options.attributionUrl) {
	      _getAttributionData(this.options.attributionUrl, map);
	    }

	    map.on('moveend', _updateMapAttribution);

	    L$1.TileLayer.prototype.onAdd.call(this, map);
	  },

	  onRemove: function (map) {
	    map.off('moveend', _updateMapAttribution);
	    L$1.TileLayer.prototype.onRemove.call(this, map);
	  },

	  _initPane: function () {
	    if (!this._map.getPane(this.options.pane)) {
	      var pane = this._map.createPane(this.options.pane);
	      pane.style.pointerEvents = 'none';
	      pane.style.zIndex = 500;
	    }
	  },

	  getAttribution: function () {
	    if (this.options.attribution) {
	      var attribution = '<span class="esri-dynamic-attribution">' + this.options.attribution + '</span>';
	    }
	    return attribution;
	  }
	});

	function basemapLayer (key, options) {
	  return new BasemapLayer(key, options);
	}

	var TiledMapLayer = L$1.TileLayer.extend({
	  options: {
	    zoomOffsetAllowance: 0.1,
	    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEABAMAAACuXLVVAAAAA1BMVEUzNDVszlHHAAAAAXRSTlMAQObYZgAAAAlwSFlzAAAAAAAAAAAB6mUWpAAAADZJREFUeJztwQEBAAAAgiD/r25IQAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7waBAAABw08RwAAAAABJRU5ErkJggg=='
	  },

	  statics: {
	    MercatorZoomLevels: {
	      '0': 156543.03392799999,
	      '1': 78271.516963999893,
	      '2': 39135.758482000099,
	      '3': 19567.879240999901,
	      '4': 9783.9396204999593,
	      '5': 4891.9698102499797,
	      '6': 2445.9849051249898,
	      '7': 1222.9924525624899,
	      '8': 611.49622628138002,
	      '9': 305.74811314055802,
	      '10': 152.874056570411,
	      '11': 76.437028285073197,
	      '12': 38.218514142536598,
	      '13': 19.109257071268299,
	      '14': 9.5546285356341496,
	      '15': 4.7773142679493699,
	      '16': 2.38865713397468,
	      '17': 1.1943285668550501,
	      '18': 0.59716428355981699,
	      '19': 0.29858214164761698,
	      '20': 0.14929107082381,
	      '21': 0.07464553541191,
	      '22': 0.0373227677059525,
	      '23': 0.0186613838529763
	    }
	  },

	  initialize: function (options) {
	    options.url = cleanUrl(options.url);
	    options = L$1.Util.setOptions(this, options);

	    // set the urls
	    this.tileUrl = options.url + 'tile/{z}/{y}/{x}';
	    // Remove subdomain in url
	    // https://github.com/Esri/esri-leaflet/issues/991
	    if (options.url.indexOf('{s}') !== -1 && options.subdomains) {
	      options.url = options.url.replace('{s}', options.subdomains[0]);
	    }
	    this.service = mapService(options);
	    this.service.addEventParent(this);

	    var arcgisonline = new RegExp(/tiles.arcgis(online)?\.com/g);
	    if (arcgisonline.test(options.url)) {
	      this.tileUrl = this.tileUrl.replace('://tiles', '://tiles{s}');
	      options.subdomains = ['1', '2', '3', '4'];
	    }

	    if (this.options.token) {
	      this.tileUrl += ('?token=' + this.options.token);
	    }

	    // init layer by calling TileLayers initialize method
	    L$1.TileLayer.prototype.initialize.call(this, this.tileUrl, options);
	  },

	  getTileUrl: function (tilePoint) {
	    var zoom = this._getZoomForUrl();

	    return L$1.Util.template(this.tileUrl, L$1.Util.extend({
	      s: this._getSubdomain(tilePoint),
	      x: tilePoint.x,
	      y: tilePoint.y,
	      // try lod map first, then just default to zoom level
	      z: (this._lodMap && this._lodMap[zoom]) ? this._lodMap[zoom] : zoom
	    }, this.options));
	  },

	  createTile: function (coords, done) {
	    var tile = document.createElement('img');

	    L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
	    L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

	    if (this.options.crossOrigin) {
	      tile.crossOrigin = '';
	    }

	    /*
	     Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
	     http://www.w3.org/TR/WCAG20-TECHS/H67
	    */
	    tile.alt = '';

	    // if there is no lod map or an lod map with a proper zoom load the tile
	    // otherwise wait for the lod map to become available
	    if (!this._lodMap || (this._lodMap && this._lodMap[this._getZoomForUrl()])) {
	      tile.src = this.getTileUrl(coords);
	    } else {
	      this.once('lodmap', function () {
	        tile.src = this.getTileUrl(coords);
	      }, this);
	    }

	    return tile;
	  },

	  onAdd: function (map) {
	    // include 'Powered by Esri' in map attribution
	    setEsriAttribution(map);

	    if (!this._lodMap) {
	      this.metadata(function (error, metadata) {
	        if (!error && metadata.spatialReference) {
	          var sr = metadata.spatialReference.latestWkid || metadata.spatialReference.wkid;
	          if (!this.options.attribution && map.attributionControl && metadata.copyrightText) {
	            this.options.attribution = metadata.copyrightText;
	            map.attributionControl.addAttribution(this.getAttribution());
	          }
	          if (map.options.crs === L.CRS.EPSG3857 && sr === 102100 || sr === 3857) {
	            this._lodMap = {};
	            // create the zoom level data
	            var arcgisLODs = metadata.tileInfo.lods;
	            var correctResolutions = TiledMapLayer.MercatorZoomLevels;

	            for (var i = 0; i < arcgisLODs.length; i++) {
	              var arcgisLOD = arcgisLODs[i];
	              for (var ci in correctResolutions) {
	                var correctRes = correctResolutions[ci];

	                if (this._withinPercentage(arcgisLOD.resolution, correctRes, this.options.zoomOffsetAllowance)) {
	                  this._lodMap[ci] = arcgisLOD.level;
	                  break;
	                }
	              }
	            }

	            this.fire('lodmap');
	          } else {
	            if (!proj4) {
	              warn('L.esri.TiledMapLayer is using a non-mercator spatial reference. Support may be available through Proj4Leaflet http://esri.github.io/esri-leaflet/examples/non-mercator-projection.html');
	            }
	          }
	        }
	      }, this);
	    }

	    L$1.TileLayer.prototype.onAdd.call(this, map);
	  },

	  metadata: function (callback, context) {
	    this.service.metadata(callback, context);
	    return this;
	  },

	  identify: function () {
	    return this.service.identify();
	  },

	  find: function () {
	    return this.service.find();
	  },

	  query: function () {
	    return this.service.query();
	  },

	  authenticate: function (token) {
	    var tokenQs = '?token=' + token;
	    this.tileUrl = (this.options.token) ? this.tileUrl.replace(/\?token=(.+)/g, tokenQs) : this.tileUrl + tokenQs;
	    this.options.token = token;
	    this.service.authenticate(token);
	    return this;
	  },

	  _withinPercentage: function (a, b, percentage) {
	    var diff = Math.abs((a / b) - 1);
	    return diff < percentage;
	  }
	});

	function tiledMapLayer (url, options) {
	  return new TiledMapLayer(url, options);
	}

	var Overlay = L$1.ImageOverlay.extend({
	  onAdd: function (map) {
	    this._topLeft = map.getPixelBounds().min;
	    L$1.ImageOverlay.prototype.onAdd.call(this, map);
	  },
	  _reset: function () {
	    if (this._map.options.crs === L$1.CRS.EPSG3857) {
	      L$1.ImageOverlay.prototype._reset.call(this);
	    } else {
	      L$1.DomUtil.setPosition(this._image, this._topLeft.subtract(this._map.getPixelOrigin()));
	    }
	  }
	});

	var RasterLayer = L$1.Layer.extend({
	  options: {
	    opacity: 1,
	    position: 'front',
	    f: 'image',
	    useCors: cors,
	    attribution: null,
	    interactive: false,
	    alt: ''
	  },

	  onAdd: function (map) {
	    // include 'Powered by Esri' in map attribution
	    setEsriAttribution(map);

	    this._update = L$1.Util.throttle(this._update, this.options.updateInterval, this);

	    map.on('moveend', this._update, this);

	    // if we had an image loaded and it matches the
	    // current bounds show the image otherwise remove it
	    if (this._currentImage && this._currentImage._bounds.equals(this._map.getBounds())) {
	      map.addLayer(this._currentImage);
	    } else if (this._currentImage) {
	      this._map.removeLayer(this._currentImage);
	      this._currentImage = null;
	    }

	    this._update();

	    if (this._popup) {
	      this._map.on('click', this._getPopupData, this);
	      this._map.on('dblclick', this._resetPopupState, this);
	    }

	    // add copyright text listed in service metadata
	    this.metadata(function (err, metadata) {
	      if (!err && !this.options.attribution && map.attributionControl && metadata.copyrightText) {
	        this.options.attribution = metadata.copyrightText;
	        map.attributionControl.addAttribution(this.getAttribution());
	      }
	    }, this);
	  },

	  onRemove: function (map) {
	    if (this._currentImage) {
	      this._map.removeLayer(this._currentImage);
	    }

	    if (this._popup) {
	      this._map.off('click', this._getPopupData, this);
	      this._map.off('dblclick', this._resetPopupState, this);
	    }

	    this._map.off('moveend', this._update, this);
	  },

	  bindPopup: function (fn, popupOptions) {
	    this._shouldRenderPopup = false;
	    this._lastClick = false;
	    this._popup = L$1.popup(popupOptions);
	    this._popupFunction = fn;
	    if (this._map) {
	      this._map.on('click', this._getPopupData, this);
	      this._map.on('dblclick', this._resetPopupState, this);
	    }
	    return this;
	  },

	  unbindPopup: function () {
	    if (this._map) {
	      this._map.closePopup(this._popup);
	      this._map.off('click', this._getPopupData, this);
	      this._map.off('dblclick', this._resetPopupState, this);
	    }
	    this._popup = false;
	    return this;
	  },

	  bringToFront: function () {
	    this.options.position = 'front';
	    if (this._currentImage) {
	      this._currentImage.bringToFront();
	    }
	    return this;
	  },

	  bringToBack: function () {
	    this.options.position = 'back';
	    if (this._currentImage) {
	      this._currentImage.bringToBack();
	    }
	    return this;
	  },

	  getAttribution: function () {
	    return this.options.attribution;
	  },

	  getOpacity: function () {
	    return this.options.opacity;
	  },

	  setOpacity: function (opacity) {
	    this.options.opacity = opacity;
	    if (this._currentImage) {
	      this._currentImage.setOpacity(opacity);
	    }
	    return this;
	  },

	  getTimeRange: function () {
	    return [this.options.from, this.options.to];
	  },

	  setTimeRange: function (from, to) {
	    this.options.from = from;
	    this.options.to = to;
	    this._update();
	    return this;
	  },

	  metadata: function (callback, context) {
	    this.service.metadata(callback, context);
	    return this;
	  },

	  authenticate: function (token) {
	    this.service.authenticate(token);
	    return this;
	  },

	  redraw: function () {
	    this._update();
	  },

	  _renderImage: function (url, bounds, contentType) {
	    if (this._map) {
	      // if no output directory has been specified for a service, MIME data will be returned
	      if (contentType) {
	        url = 'data:' + contentType + ';base64,' + url;
	      }
	      // create a new image overlay and add it to the map
	      // to start loading the image
	      // opacity is 0 while the image is loading
	      var image = new Overlay(url, bounds, {
	        opacity: 0,
	        crossOrigin: this.options.useCors,
	        alt: this.options.alt,
	        pane: this.options.pane || this.getPane(),
	        interactive: this.options.interactive
	      }).addTo(this._map);

	      var onOverlayError = function () {
	        this._map.removeLayer(image);
	        this.fire('error');
	        image.off('load', onOverlayLoad, this);
	      };

	      var onOverlayLoad = function (e) {
	        image.off('error', onOverlayLoad, this);
	        if (this._map) {
	          var newImage = e.target;
	          var oldImage = this._currentImage;

	          // if the bounds of this image matches the bounds that
	          // _renderImage was called with and we have a map with the same bounds
	          // hide the old image if there is one and set the opacity
	          // of the new image otherwise remove the new image
	          if (newImage._bounds.equals(bounds) && newImage._bounds.equals(this._map.getBounds())) {
	            this._currentImage = newImage;

	            if (this.options.position === 'front') {
	              this.bringToFront();
	            } else {
	              this.bringToBack();
	            }

	            if (this._map && this._currentImage._map) {
	              this._currentImage.setOpacity(this.options.opacity);
	            } else {
	              this._currentImage._map.removeLayer(this._currentImage);
	            }

	            if (oldImage && this._map) {
	              this._map.removeLayer(oldImage);
	            }

	            if (oldImage && oldImage._map) {
	              oldImage._map.removeLayer(oldImage);
	            }
	          } else {
	            this._map.removeLayer(newImage);
	          }
	        }

	        this.fire('load', {
	          bounds: bounds
	        });
	      };

	      // If loading the image fails
	      image.once('error', onOverlayError, this);

	      // once the image loads
	      image.once('load', onOverlayLoad, this);

	      this.fire('loading', {
	        bounds: bounds
	      });
	    }
	  },

	  _update: function () {
	    if (!this._map) {
	      return;
	    }

	    var zoom = this._map.getZoom();
	    var bounds = this._map.getBounds();

	    if (this._animatingZoom) {
	      return;
	    }

	    if (this._map._panTransition && this._map._panTransition._inProgress) {
	      return;
	    }

	    if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
	      if (this._currentImage) {
	        this._currentImage._map.removeLayer(this._currentImage);
	        this._currentImage = null;
	      }
	      return;
	    }

	    var params = this._buildExportParams();

	    this._requestExport(params, bounds);
	  },

	  _renderPopup: function (latlng, error, results, response) {
	    latlng = L$1.latLng(latlng);
	    if (this._shouldRenderPopup && this._lastClick.equals(latlng)) {
	      // add the popup to the map where the mouse was clicked at
	      var content = this._popupFunction(error, results, response);
	      if (content) {
	        this._popup.setLatLng(latlng).setContent(content).openOn(this._map);
	      }
	    }
	  },

	  _resetPopupState: function (e) {
	    this._shouldRenderPopup = false;
	    this._lastClick = e.latlng;
	  },

	  _calculateBbox: function () {
	    var pixelBounds = this._map.getPixelBounds();

	    var sw = this._map.unproject(pixelBounds.getBottomLeft());
	    var ne = this._map.unproject(pixelBounds.getTopRight());

	    var neProjected = this._map.options.crs.project(ne);
	    var swProjected = this._map.options.crs.project(sw);

	    // this ensures ne/sw are switched in polar maps where north/top bottom/south is inverted
	    var boundsProjected = L$1.bounds(neProjected, swProjected);

	    return [boundsProjected.getBottomLeft().x, boundsProjected.getBottomLeft().y, boundsProjected.getTopRight().x, boundsProjected.getTopRight().y].join(',');
	  },

	  _calculateImageSize: function () {
	    // ensure that we don't ask ArcGIS Server for a taller image than we have actual map displaying within the div
	    var bounds = this._map.getPixelBounds();
	    var size = this._map.getSize();

	    var sw = this._map.unproject(bounds.getBottomLeft());
	    var ne = this._map.unproject(bounds.getTopRight());

	    var top = this._map.latLngToLayerPoint(ne).y;
	    var bottom = this._map.latLngToLayerPoint(sw).y;

	    if (top > 0 || bottom < size.y) {
	      size.y = bottom - top;
	    }

	    return size.x + ',' + size.y;
	  }
	});

	var ImageMapLayer = RasterLayer.extend({

	  options: {
	    updateInterval: 150,
	    format: 'jpgpng',
	    transparent: true,
	    f: 'image'
	  },

	  query: function () {
	    return this.service.query();
	  },

	  identify: function () {
	    return this.service.identify();
	  },

	  initialize: function (options) {
	    options.url = cleanUrl(options.url);
	    this.service = imageService(options);
	    this.service.addEventParent(this);

	    L$1.Util.setOptions(this, options);
	  },

	  setPixelType: function (pixelType) {
	    this.options.pixelType = pixelType;
	    this._update();
	    return this;
	  },

	  getPixelType: function () {
	    return this.options.pixelType;
	  },

	  setBandIds: function (bandIds) {
	    if (L$1.Util.isArray(bandIds)) {
	      this.options.bandIds = bandIds.join(',');
	    } else {
	      this.options.bandIds = bandIds.toString();
	    }
	    this._update();
	    return this;
	  },

	  getBandIds: function () {
	    return this.options.bandIds;
	  },

	  setNoData: function (noData, noDataInterpretation) {
	    if (L$1.Util.isArray(noData)) {
	      this.options.noData = noData.join(',');
	    } else {
	      this.options.noData = noData.toString();
	    }
	    if (noDataInterpretation) {
	      this.options.noDataInterpretation = noDataInterpretation;
	    }
	    this._update();
	    return this;
	  },

	  getNoData: function () {
	    return this.options.noData;
	  },

	  getNoDataInterpretation: function () {
	    return this.options.noDataInterpretation;
	  },

	  setRenderingRule: function (renderingRule) {
	    this.options.renderingRule = renderingRule;
	    this._update();
	  },

	  getRenderingRule: function () {
	    return this.options.renderingRule;
	  },

	  setMosaicRule: function (mosaicRule) {
	    this.options.mosaicRule = mosaicRule;
	    this._update();
	  },

	  getMosaicRule: function () {
	    return this.options.mosaicRule;
	  },

	  _getPopupData: function (e) {
	    var callback = L$1.Util.bind(function (error, results, response) {
	      if (error) { return; } // we really can't do anything here but authenticate or requesterror will fire
	      setTimeout(L$1.Util.bind(function () {
	        this._renderPopup(e.latlng, error, results, response);
	      }, this), 300);
	    }, this);

	    var identifyRequest = this.identify().at(e.latlng);

	    // set mosaic rule for identify task if it is set for layer
	    if (this.options.mosaicRule) {
	      identifyRequest.setMosaicRule(this.options.mosaicRule);
	      // @TODO: force return catalog items too?
	    }

	    // @TODO: set rendering rule? Not sure,
	    // sometimes you want raw pixel values
	    // if (this.options.renderingRule) {
	    //   identifyRequest.setRenderingRule(this.options.renderingRule);
	    // }

	    identifyRequest.run(callback);

	    // set the flags to show the popup
	    this._shouldRenderPopup = true;
	    this._lastClick = e.latlng;
	  },

	  _buildExportParams: function () {
	    var sr = parseInt(this._map.options.crs.code.split(':')[1], 10);

	    var params = {
	      bbox: this._calculateBbox(),
	      size: this._calculateImageSize(),
	      format: this.options.format,
	      transparent: this.options.transparent,
	      bboxSR: sr,
	      imageSR: sr
	    };

	    if (this.options.from && this.options.to) {
	      params.time = this.options.from.valueOf() + ',' + this.options.to.valueOf();
	    }

	    if (this.options.pixelType) {
	      params.pixelType = this.options.pixelType;
	    }

	    if (this.options.interpolation) {
	      params.interpolation = this.options.interpolation;
	    }

	    if (this.options.compressionQuality) {
	      params.compressionQuality = this.options.compressionQuality;
	    }

	    if (this.options.bandIds) {
	      params.bandIds = this.options.bandIds;
	    }

	    // 0 is falsy *and* a valid input parameter
	    if (this.options.noData === 0 || this.options.noData) {
	      params.noData = this.options.noData;
	    }

	    if (this.options.noDataInterpretation) {
	      params.noDataInterpretation = this.options.noDataInterpretation;
	    }

	    if (this.service.options.token) {
	      params.token = this.service.options.token;
	    }

	    if (this.options.renderingRule) {
	      params.renderingRule = JSON.stringify(this.options.renderingRule);
	    }

	    if (this.options.mosaicRule) {
	      params.mosaicRule = JSON.stringify(this.options.mosaicRule);
	    }

	    return params;
	  },

	  _requestExport: function (params, bounds) {
	    if (this.options.f === 'json') {
	      this.service.request('exportImage', params, function (error, response) {
	        if (error) { return; } // we really can't do anything here but authenticate or requesterror will fire
	        if (this.options.token) {
	          response.href += ('?token=' + this.options.token);
	        }
	        this._renderImage(response.href, bounds);
	      }, this);
	    } else {
	      params.f = 'image';
	      this._renderImage(this.options.url + 'exportImage' + L$1.Util.getParamString(params), bounds);
	    }
	  }
	});

	function imageMapLayer (url, options) {
	  return new ImageMapLayer(url, options);
	}

	var DynamicMapLayer = RasterLayer.extend({

	  options: {
	    updateInterval: 150,
	    layers: false,
	    layerDefs: false,
	    timeOptions: false,
	    format: 'png24',
	    transparent: true,
	    f: 'json'
	  },

	  initialize: function (options) {
	    options.url = cleanUrl(options.url);
	    this.service = mapService(options);
	    this.service.addEventParent(this);

	    if ((options.proxy || options.token) && options.f !== 'json') {
	      options.f = 'json';
	    }

	    L$1.Util.setOptions(this, options);
	  },

	  getDynamicLayers: function () {
	    return this.options.dynamicLayers;
	  },

	  setDynamicLayers: function (dynamicLayers) {
	    this.options.dynamicLayers = dynamicLayers;
	    this._update();
	    return this;
	  },

	  getLayers: function () {
	    return this.options.layers;
	  },

	  setLayers: function (layers) {
	    this.options.layers = layers;
	    this._update();
	    return this;
	  },

	  getLayerDefs: function () {
	    return this.options.layerDefs;
	  },

	  setLayerDefs: function (layerDefs) {
	    this.options.layerDefs = layerDefs;
	    this._update();
	    return this;
	  },

	  getTimeOptions: function () {
	    return this.options.timeOptions;
	  },

	  setTimeOptions: function (timeOptions) {
	    this.options.timeOptions = timeOptions;
	    this._update();
	    return this;
	  },

	  query: function () {
	    return this.service.query();
	  },

	  identify: function () {
	    return this.service.identify();
	  },

	  find: function () {
	    return this.service.find();
	  },

	  _getPopupData: function (e) {
	    var callback = L$1.Util.bind(function (error, featureCollection, response) {
	      if (error) { return; } // we really can't do anything here but authenticate or requesterror will fire
	      setTimeout(L$1.Util.bind(function () {
	        this._renderPopup(e.latlng, error, featureCollection, response);
	      }, this), 300);
	    }, this);

	    var identifyRequest = this.identify().on(this._map).at(e.latlng);

	    // remove extraneous vertices from response features
	    identifyRequest.simplify(this._map, 0.5);

	    if (this.options.layers) {
	      identifyRequest.layers('visible:' + this.options.layers.join(','));
	    } else {
	      identifyRequest.layers('visible');
	    }

	    // if present, pass layer ids and sql filters through to the identify task
	    if (this.options.layerDefs && typeof this.options.layerDefs !== 'string') {
	      for (var id in this.options.layerDefs) {
	        if (this.options.layerDefs.hasOwnProperty(id)) {
	          identifyRequest.layerDef(id, this.options.layerDefs[id]);
	        }
	      }
	    }

	    identifyRequest.run(callback);

	    // set the flags to show the popup
	    this._shouldRenderPopup = true;
	    this._lastClick = e.latlng;
	  },

	  _buildExportParams: function () {
	    var sr = parseInt(this._map.options.crs.code.split(':')[1], 10);

	    var params = {
	      bbox: this._calculateBbox(),
	      size: this._calculateImageSize(),
	      dpi: 96,
	      format: this.options.format,
	      transparent: this.options.transparent,
	      bboxSR: sr,
	      imageSR: sr
	    };

	    if (this.options.dynamicLayers) {
	      params.dynamicLayers = this.options.dynamicLayers;
	    }

	    if (this.options.layers) {
	      params.layers = 'show:' + this.options.layers.join(',');
	    }

	    if (this.options.layerDefs) {
	      params.layerDefs = typeof this.options.layerDefs === 'string' ? this.options.layerDefs : JSON.stringify(this.options.layerDefs);
	    }

	    if (this.options.timeOptions) {
	      params.timeOptions = JSON.stringify(this.options.timeOptions);
	    }

	    if (this.options.from && this.options.to) {
	      params.time = this.options.from.valueOf() + ',' + this.options.to.valueOf();
	    }

	    if (this.service.options.token) {
	      params.token = this.service.options.token;
	    }

	    if (this.options.proxy) {
	      params.proxy = this.options.proxy;
	    }

	    // use a timestamp to bust server cache
	    if (this.options.disableCache) {
	      params._ts = Date.now();
	    }

	    return params;
	  },

	  _requestExport: function (params, bounds) {
	    if (this.options.f === 'json') {
	      this.service.request('export', params, function (error, response) {
	        if (error) { return; } // we really can't do anything here but authenticate or requesterror will fire

	        if (this.options.token) {
	          response.href += ('?token=' + this.options.token);
	        }
	        if (this.options.proxy) {
	          response.href = this.options.proxy + '?' + response.href;
	        }
	        if (response.href) {
	          this._renderImage(response.href, bounds);
	        } else {
	          this._renderImage(response.imageData, bounds, response.contentType);
	        }
	      }, this);
	    } else {
	      params.f = 'image';
	      this._renderImage(this.options.url + 'export' + L$1.Util.getParamString(params), bounds);
	    }
	  }
	});

	function dynamicMapLayer (url, options) {
	  return new DynamicMapLayer(url, options);
	}

	var VirtualGrid = L$1__default.Layer.extend({

	  options: {
	    cellSize: 512,
	    updateInterval: 150
	  },

	  initialize: function (options) {
	    options = L$1__default.setOptions(this, options);
	    this._zooming = false;
	  },

	  onAdd: function (map) {
	    this._map = map;
	    this._update = L$1__default.Util.throttle(this._update, this.options.updateInterval, this);
	    this._reset();
	    this._update();
	  },

	  onRemove: function () {
	    this._map.removeEventListener(this.getEvents(), this);
	    this._removeCells();
	  },

	  getEvents: function () {
	    var events = {
	      moveend: this._update,
	      zoomstart: this._zoomstart,
	      zoomend: this._reset
	    };

	    return events;
	  },

	  addTo: function (map) {
	    map.addLayer(this);
	    return this;
	  },

	  removeFrom: function (map) {
	    map.removeLayer(this);
	    return this;
	  },

	  _zoomstart: function () {
	    this._zooming = true;
	  },

	  _reset: function () {
	    this._removeCells();

	    this._cells = {};
	    this._activeCells = {};
	    this._cellsToLoad = 0;
	    this._cellsTotal = 0;
	    this._cellNumBounds = this._getCellNumBounds();

	    this._resetWrap();
	    this._zooming = false;
	  },

	  _resetWrap: function () {
	    var map = this._map;
	    var crs = map.options.crs;

	    if (crs.infinite) { return; }

	    var cellSize = this._getCellSize();

	    if (crs.wrapLng) {
	      this._wrapLng = [
	        Math.floor(map.project([0, crs.wrapLng[0]]).x / cellSize),
	        Math.ceil(map.project([0, crs.wrapLng[1]]).x / cellSize)
	      ];
	    }

	    if (crs.wrapLat) {
	      this._wrapLat = [
	        Math.floor(map.project([crs.wrapLat[0], 0]).y / cellSize),
	        Math.ceil(map.project([crs.wrapLat[1], 0]).y / cellSize)
	      ];
	    }
	  },

	  _getCellSize: function () {
	    return this.options.cellSize;
	  },

	  _update: function () {
	    if (!this._map) {
	      return;
	    }

	    var bounds = this._map.getPixelBounds();
	    var cellSize = this._getCellSize();

	    // cell coordinates range for the current view
	    var cellBounds = L$1__default.bounds(
	      bounds.min.divideBy(cellSize).floor(),
	      bounds.max.divideBy(cellSize).floor());

	    this._removeOtherCells(cellBounds);
	    this._addCells(cellBounds);

	    this.fire('cellsupdated');
	  },

	  _addCells: function (bounds) {
	    var queue = [];
	    var center = bounds.getCenter();
	    var zoom = this._map.getZoom();

	    var j, i, coords;
	    // create a queue of coordinates to load cells from
	    for (j = bounds.min.y; j <= bounds.max.y; j++) {
	      for (i = bounds.min.x; i <= bounds.max.x; i++) {
	        coords = L$1__default.point(i, j);
	        coords.z = zoom;

	        if (this._isValidCell(coords)) {
	          queue.push(coords);
	        }
	      }
	    }

	    var cellsToLoad = queue.length;

	    if (cellsToLoad === 0) { return; }

	    this._cellsToLoad += cellsToLoad;
	    this._cellsTotal += cellsToLoad;

	    // sort cell queue to load cells in order of their distance to center
	    queue.sort(function (a, b) {
	      return a.distanceTo(center) - b.distanceTo(center);
	    });

	    for (i = 0; i < cellsToLoad; i++) {
	      this._addCell(queue[i]);
	    }
	  },

	  _isValidCell: function (coords) {
	    var crs = this._map.options.crs;

	    if (!crs.infinite) {
	      // don't load cell if it's out of bounds and not wrapped
	      var bounds = this._cellNumBounds;
	      if (
	        (!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x)) ||
	        (!crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y))
	      ) {
	        return false;
	      }
	    }

	    if (!this.options.bounds) {
	      return true;
	    }

	    // don't load cell if it doesn't intersect the bounds in options
	    var cellBounds = this._cellCoordsToBounds(coords);
	    return L$1__default.latLngBounds(this.options.bounds).intersects(cellBounds);
	  },

	  // converts cell coordinates to its geographical bounds
	  _cellCoordsToBounds: function (coords) {
	    var map = this._map;
	    var cellSize = this.options.cellSize;
	    var nwPoint = coords.multiplyBy(cellSize);
	    var sePoint = nwPoint.add([cellSize, cellSize]);
	    var nw = map.wrapLatLng(map.unproject(nwPoint, coords.z));
	    var se = map.wrapLatLng(map.unproject(sePoint, coords.z));

	    return L$1__default.latLngBounds(nw, se);
	  },

	  // converts cell coordinates to key for the cell cache
	  _cellCoordsToKey: function (coords) {
	    return coords.x + ':' + coords.y;
	  },

	  // converts cell cache key to coordiantes
	  _keyToCellCoords: function (key) {
	    var kArr = key.split(':');
	    var x = parseInt(kArr[0], 10);
	    var y = parseInt(kArr[1], 10);

	    return L$1__default.point(x, y);
	  },

	  // remove any present cells that are off the specified bounds
	  _removeOtherCells: function (bounds) {
	    for (var key in this._cells) {
	      if (!bounds.contains(this._keyToCellCoords(key))) {
	        this._removeCell(key);
	      }
	    }
	  },

	  _removeCell: function (key) {
	    var cell = this._activeCells[key];

	    if (cell) {
	      delete this._activeCells[key];

	      if (this.cellLeave) {
	        this.cellLeave(cell.bounds, cell.coords);
	      }

	      this.fire('cellleave', {
	        bounds: cell.bounds,
	        coords: cell.coords
	      });
	    }
	  },

	  _removeCells: function () {
	    for (var key in this._cells) {
	      var bounds = this._cells[key].bounds;
	      var coords = this._cells[key].coords;

	      if (this.cellLeave) {
	        this.cellLeave(bounds, coords);
	      }

	      this.fire('cellleave', {
	        bounds: bounds,
	        coords: coords
	      });
	    }
	  },

	  _addCell: function (coords) {
	    // wrap cell coords if necessary (depending on CRS)
	    this._wrapCoords(coords);

	    // generate the cell key
	    var key = this._cellCoordsToKey(coords);

	    // get the cell from the cache
	    var cell = this._cells[key];
	    // if this cell should be shown as isnt active yet (enter)

	    if (cell && !this._activeCells[key]) {
	      if (this.cellEnter) {
	        this.cellEnter(cell.bounds, coords);
	      }

	      this.fire('cellenter', {
	        bounds: cell.bounds,
	        coords: coords
	      });

	      this._activeCells[key] = cell;
	    }

	    // if we dont have this cell in the cache yet (create)
	    if (!cell) {
	      cell = {
	        coords: coords,
	        bounds: this._cellCoordsToBounds(coords)
	      };

	      this._cells[key] = cell;
	      this._activeCells[key] = cell;

	      if (this.createCell) {
	        this.createCell(cell.bounds, coords);
	      }

	      this.fire('cellcreate', {
	        bounds: cell.bounds,
	        coords: coords
	      });
	    }
	  },

	  _wrapCoords: function (coords) {
	    coords.x = this._wrapLng ? L$1__default.Util.wrapNum(coords.x, this._wrapLng) : coords.x;
	    coords.y = this._wrapLat ? L$1__default.Util.wrapNum(coords.y, this._wrapLat) : coords.y;
	  },

	  // get the global cell coordinates range for the current zoom
	  _getCellNumBounds: function () {
	    var bounds = this._map.getPixelWorldBounds();
	    var size = this._getCellSize();

	    return bounds ? L$1__default.bounds(
	        bounds.min.divideBy(size).floor(),
	        bounds.max.divideBy(size).ceil().subtract([1, 1])) : null;
	  }
	});

	function BinarySearchIndex (values) {
	  this.values = [].concat(values || []);
	}

	BinarySearchIndex.prototype.query = function (value) {
	  var index = this.getIndex(value);
	  return this.values[index];
	};

	BinarySearchIndex.prototype.getIndex = function getIndex (value) {
	  if (this.dirty) {
	    this.sort();
	  }

	  var minIndex = 0;
	  var maxIndex = this.values.length - 1;
	  var currentIndex;
	  var currentElement;

	  while (minIndex <= maxIndex) {
	    currentIndex = (minIndex + maxIndex) / 2 | 0;
	    currentElement = this.values[Math.round(currentIndex)];
	    if (+currentElement.value < +value) {
	      minIndex = currentIndex + 1;
	    } else if (+currentElement.value > +value) {
	      maxIndex = currentIndex - 1;
	    } else {
	      return currentIndex;
	    }
	  }

	  return Math.abs(~maxIndex);
	};

	BinarySearchIndex.prototype.between = function between (start, end) {
	  var startIndex = this.getIndex(start);
	  var endIndex = this.getIndex(end);

	  if (startIndex === 0 && endIndex === 0) {
	    return [];
	  }

	  while (this.values[startIndex - 1] && this.values[startIndex - 1].value === start) {
	    startIndex--;
	  }

	  while (this.values[endIndex + 1] && this.values[endIndex + 1].value === end) {
	    endIndex++;
	  }

	  if (this.values[endIndex] && this.values[endIndex].value === end && this.values[endIndex + 1]) {
	    endIndex++;
	  }

	  return this.values.slice(startIndex, endIndex);
	};

	BinarySearchIndex.prototype.insert = function insert (item) {
	  this.values.splice(this.getIndex(item.value), 0, item);
	  return this;
	};

	BinarySearchIndex.prototype.bulkAdd = function bulkAdd (items, sort) {
	  this.values = this.values.concat([].concat(items || []));

	  if (sort) {
	    this.sort();
	  } else {
	    this.dirty = true;
	  }

	  return this;
	};

	BinarySearchIndex.prototype.sort = function sort () {
	  this.values.sort(function (a, b) {
	    return +b.value - +a.value;
	  }).reverse();
	  this.dirty = false;
	  return this;
	};

	var FeatureManager = VirtualGrid.extend({
	  /**
	   * Options
	   */

	  options: {
	    attribution: null,
	    where: '1=1',
	    fields: ['*'],
	    from: false,
	    to: false,
	    timeField: false,
	    timeFilterMode: 'server',
	    simplifyFactor: 0,
	    precision: 6
	  },

	  /**
	   * Constructor
	   */

	  initialize: function (options) {
	    VirtualGrid.prototype.initialize.call(this, options);

	    options.url = cleanUrl(options.url);
	    options = L$1.Util.setOptions(this, options);

	    this.service = featureLayerService(options);
	    this.service.addEventParent(this);

	    // use case insensitive regex to look for common fieldnames used for indexing
	    if (this.options.fields[0] !== '*') {
	      var oidCheck = false;
	      for (var i = 0; i < this.options.fields.length; i++) {
	        if (this.options.fields[i].match(/^(OBJECTID|FID|OID|ID)$/i)) {
	          oidCheck = true;
	        }
	      }
	      if (oidCheck === false) {
	        warn('no known esriFieldTypeOID field detected in fields Array.  Please add an attribute field containing unique IDs to ensure the layer can be drawn correctly.');
	      }
	    }

	    if (this.options.timeField.start && this.options.timeField.end) {
	      this._startTimeIndex = new BinarySearchIndex();
	      this._endTimeIndex = new BinarySearchIndex();
	    } else if (this.options.timeField) {
	      this._timeIndex = new BinarySearchIndex();
	    }

	    this._cache = {};
	    this._currentSnapshot = []; // cache of what layers should be active
	    this._activeRequests = 0;
	  },

	  /**
	   * Layer Interface
	   */

	  onAdd: function (map) {
	    // include 'Powered by Esri' in map attribution
	    setEsriAttribution(map);

	    this.service.metadata(function (err, metadata) {
	      if (!err) {
	        var supportedFormats = metadata.supportedQueryFormats;

	        // Check if someone has requested that we don't use geoJSON, even if it's available
	        var forceJsonFormat = false;
	        if (this.service.options.isModern === false) {
	          forceJsonFormat = true;
	        }

	        // Unless we've been told otherwise, check to see whether service can emit GeoJSON natively
	        if (!forceJsonFormat && supportedFormats && supportedFormats.indexOf('geoJSON') !== -1) {
	          this.service.options.isModern = true;
	        }

	        // add copyright text listed in service metadata
	        if (!this.options.attribution && map.attributionControl && metadata.copyrightText) {
	          this.options.attribution = metadata.copyrightText;
	          map.attributionControl.addAttribution(this.getAttribution());
	        }
	      }
	    }, this);

	    map.on('zoomend', this._handleZoomChange, this);

	    return VirtualGrid.prototype.onAdd.call(this, map);
	  },

	  onRemove: function (map) {
	    map.off('zoomend', this._handleZoomChange, this);

	    return VirtualGrid.prototype.onRemove.call(this, map);
	  },

	  getAttribution: function () {
	    return this.options.attribution;
	  },

	  /**
	   * Feature Management
	   */

	  createCell: function (bounds, coords) {
	    // dont fetch features outside the scale range defined for the layer
	    if (this._visibleZoom()) {
	      this._requestFeatures(bounds, coords);
	    }
	  },

	  _requestFeatures: function (bounds, coords, callback) {
	    this._activeRequests++;

	    // our first active request fires loading
	    if (this._activeRequests === 1) {
	      this.fire('loading', {
	        bounds: bounds
	      }, true);
	    }

	    return this._buildQuery(bounds).run(function (error, featureCollection, response) {
	      if (response && response.exceededTransferLimit) {
	        this.fire('drawlimitexceeded');
	      }

	      // no error, features
	      if (!error && featureCollection && featureCollection.features.length) {
	        // schedule adding features until the next animation frame
	        L$1.Util.requestAnimFrame(L$1.Util.bind(function () {
	          this._addFeatures(featureCollection.features, coords);
	          this._postProcessFeatures(bounds);
	        }, this));
	      }

	      // no error, no features
	      if (!error && featureCollection && !featureCollection.features.length) {
	        this._postProcessFeatures(bounds);
	      }

	      if (error) {
	        this._postProcessFeatures(bounds);
	      }

	      if (callback) {
	        callback.call(this, error, featureCollection);
	      }
	    }, this);
	  },

	  _postProcessFeatures: function (bounds) {
	    // deincrement the request counter now that we have processed features
	    this._activeRequests--;

	    // if there are no more active requests fire a load event for this view
	    if (this._activeRequests <= 0) {
	      this.fire('load', {
	        bounds: bounds
	      });
	    }
	  },

	  _cacheKey: function (coords) {
	    return coords.z + ':' + coords.x + ':' + coords.y;
	  },

	  _addFeatures: function (features, coords) {
	    var key = this._cacheKey(coords);
	    this._cache[key] = this._cache[key] || [];

	    for (var i = features.length - 1; i >= 0; i--) {
	      var id = features[i].id;

	      if (this._currentSnapshot.indexOf(id) === -1) {
	        this._currentSnapshot.push(id);
	      }
	      if (this._cache[key].indexOf(id) === -1) {
	        this._cache[key].push(id);
	      }
	    }

	    if (this.options.timeField) {
	      this._buildTimeIndexes(features);
	    }

	    this.createLayers(features);
	  },

	  _buildQuery: function (bounds) {
	    var query = this.service.query()
	      .intersects(bounds)
	      .where(this.options.where)
	      .fields(this.options.fields)
	      .precision(this.options.precision);

	    if (this.options.simplifyFactor) {
	      query.simplify(this._map, this.options.simplifyFactor);
	    }

	    if (this.options.timeFilterMode === 'server' && this.options.from && this.options.to) {
	      query.between(this.options.from, this.options.to);
	    }

	    return query;
	  },

	  /**
	   * Where Methods
	   */

	  setWhere: function (where, callback, context) {
	    this.options.where = (where && where.length) ? where : '1=1';

	    var oldSnapshot = [];
	    var newSnapshot = [];
	    var pendingRequests = 0;
	    var requestError = null;
	    var requestCallback = L$1.Util.bind(function (error, featureCollection) {
	      if (error) {
	        requestError = error;
	      }

	      if (featureCollection) {
	        for (var i = featureCollection.features.length - 1; i >= 0; i--) {
	          newSnapshot.push(featureCollection.features[i].id);
	        }
	      }

	      pendingRequests--;

	      if (pendingRequests <= 0 && this._visibleZoom()) {
	        this._currentSnapshot = newSnapshot;
	        // schedule adding features for the next animation frame
	        L$1.Util.requestAnimFrame(L$1.Util.bind(function () {
	          this.removeLayers(oldSnapshot);
	          this.addLayers(newSnapshot);
	          if (callback) {
	            callback.call(context, requestError);
	          }
	        }, this));
	      }
	    }, this);

	    for (var i = this._currentSnapshot.length - 1; i >= 0; i--) {
	      oldSnapshot.push(this._currentSnapshot[i]);
	    }

	    for (var key in this._activeCells) {
	      pendingRequests++;
	      var coords = this._keyToCellCoords(key);
	      var bounds = this._cellCoordsToBounds(coords);
	      this._requestFeatures(bounds, key, requestCallback);
	    }

	    return this;
	  },

	  getWhere: function () {
	    return this.options.where;
	  },

	  /**
	   * Time Range Methods
	   */

	  getTimeRange: function () {
	    return [this.options.from, this.options.to];
	  },

	  setTimeRange: function (from, to, callback, context) {
	    var oldFrom = this.options.from;
	    var oldTo = this.options.to;
	    var pendingRequests = 0;
	    var requestError = null;
	    var requestCallback = L$1.Util.bind(function (error) {
	      if (error) {
	        requestError = error;
	      }
	      this._filterExistingFeatures(oldFrom, oldTo, from, to);

	      pendingRequests--;

	      if (callback && pendingRequests <= 0) {
	        callback.call(context, requestError);
	      }
	    }, this);

	    this.options.from = from;
	    this.options.to = to;

	    this._filterExistingFeatures(oldFrom, oldTo, from, to);

	    if (this.options.timeFilterMode === 'server') {
	      for (var key in this._activeCells) {
	        pendingRequests++;
	        var coords = this._keyToCellCoords(key);
	        var bounds = this._cellCoordsToBounds(coords);
	        this._requestFeatures(bounds, key, requestCallback);
	      }
	    }

	    return this;
	  },

	  refresh: function () {
	    for (var key in this._activeCells) {
	      var coords = this._keyToCellCoords(key);
	      var bounds = this._cellCoordsToBounds(coords);
	      this._requestFeatures(bounds, key);
	    }

	    if (this.redraw) {
	      this.once('load', function () {
	        this.eachFeature(function (layer) {
	          this._redraw(layer.feature.id);
	        }, this);
	      }, this);
	    }
	  },

	  _filterExistingFeatures: function (oldFrom, oldTo, newFrom, newTo) {
	    var layersToRemove = (oldFrom && oldTo) ? this._getFeaturesInTimeRange(oldFrom, oldTo) : this._currentSnapshot;
	    var layersToAdd = this._getFeaturesInTimeRange(newFrom, newTo);

	    if (layersToAdd.indexOf) {
	      for (var i = 0; i < layersToAdd.length; i++) {
	        var shouldRemoveLayer = layersToRemove.indexOf(layersToAdd[i]);
	        if (shouldRemoveLayer >= 0) {
	          layersToRemove.splice(shouldRemoveLayer, 1);
	        }
	      }
	    }

	    // schedule adding features until the next animation frame
	    L$1.Util.requestAnimFrame(L$1.Util.bind(function () {
	      this.removeLayers(layersToRemove);
	      this.addLayers(layersToAdd);
	    }, this));
	  },

	  _getFeaturesInTimeRange: function (start, end) {
	    var ids = [];
	    var search;

	    if (this.options.timeField.start && this.options.timeField.end) {
	      var startTimes = this._startTimeIndex.between(start, end);
	      var endTimes = this._endTimeIndex.between(start, end);
	      search = startTimes.concat(endTimes);
	    } else {
	      search = this._timeIndex.between(start, end);
	    }

	    for (var i = search.length - 1; i >= 0; i--) {
	      ids.push(search[i].id);
	    }

	    return ids;
	  },

	  _buildTimeIndexes: function (geojson) {
	    var i;
	    var feature;
	    if (this.options.timeField.start && this.options.timeField.end) {
	      var startTimeEntries = [];
	      var endTimeEntries = [];
	      for (i = geojson.length - 1; i >= 0; i--) {
	        feature = geojson[i];
	        startTimeEntries.push({
	          id: feature.id,
	          value: new Date(feature.properties[this.options.timeField.start])
	        });
	        endTimeEntries.push({
	          id: feature.id,
	          value: new Date(feature.properties[this.options.timeField.end])
	        });
	      }
	      this._startTimeIndex.bulkAdd(startTimeEntries);
	      this._endTimeIndex.bulkAdd(endTimeEntries);
	    } else {
	      var timeEntries = [];
	      for (i = geojson.length - 1; i >= 0; i--) {
	        feature = geojson[i];
	        timeEntries.push({
	          id: feature.id,
	          value: new Date(feature.properties[this.options.timeField])
	        });
	      }

	      this._timeIndex.bulkAdd(timeEntries);
	    }
	  },

	  _featureWithinTimeRange: function (feature) {
	    if (!this.options.from || !this.options.to) {
	      return true;
	    }

	    var from = +this.options.from.valueOf();
	    var to = +this.options.to.valueOf();

	    if (typeof this.options.timeField === 'string') {
	      var date = +feature.properties[this.options.timeField];
	      return (date >= from) && (date <= to);
	    }

	    if (this.options.timeField.start && this.options.timeField.end) {
	      var startDate = +feature.properties[this.options.timeField.start];
	      var endDate = +feature.properties[this.options.timeField.end];
	      return ((startDate >= from) && (startDate <= to)) || ((endDate >= from) && (endDate <= to));
	    }
	  },

	  _visibleZoom: function () {
	    // check to see whether the current zoom level of the map is within the optional limit defined for the FeatureLayer
	    if (!this._map) {
	      return false;
	    }
	    var zoom = this._map.getZoom();
	    if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
	      return false;
	    } else { return true; }
	  },

	  _handleZoomChange: function () {
	    if (!this._visibleZoom()) {
	      this.removeLayers(this._currentSnapshot);
	      this._currentSnapshot = [];
	    } else {
	      /*
	      for every cell in this._activeCells
	        1. Get the cache key for the coords of the cell
	        2. If this._cache[key] exists it will be an array of feature IDs.
	        3. Call this.addLayers(this._cache[key]) to instruct the feature layer to add the layers back.
	      */
	      for (var i in this._activeCells) {
	        var coords = this._activeCells[i].coords;
	        var key = this._cacheKey(coords);
	        if (this._cache[key]) {
	          this.addLayers(this._cache[key]);
	        }
	      }
	    }
	  },

	  /**
	   * Service Methods
	   */

	  authenticate: function (token) {
	    this.service.authenticate(token);
	    return this;
	  },

	  metadata: function (callback, context) {
	    this.service.metadata(callback, context);
	    return this;
	  },

	  query: function () {
	    return this.service.query();
	  },

	  _getMetadata: function (callback) {
	    if (this._metadata) {
	      var error;
	      callback(error, this._metadata);
	    } else {
	      this.metadata(L$1.Util.bind(function (error, response) {
	        this._metadata = response;
	        callback(error, this._metadata);
	      }, this));
	    }
	  },

	  addFeature: function (feature, callback, context) {
	    this._getMetadata(L$1.Util.bind(function (error, metadata) {
	      if (error) {
	        if (callback) { callback.call(this, error, null); }
	        return;
	      }

	      this.service.addFeature(feature, L$1.Util.bind(function (error, response) {
	        if (!error) {
	          // assign ID from result to appropriate objectid field from service metadata
	          feature.properties[metadata.objectIdField] = response.objectId;

	          // we also need to update the geojson id for createLayers() to function
	          feature.id = response.objectId;
	          this.createLayers([feature]);
	        }

	        if (callback) {
	          callback.call(context, error, response);
	        }
	      }, this));
	    }, this));
	  },

	  updateFeature: function (feature, callback, context) {
	    this.service.updateFeature(feature, function (error, response) {
	      if (!error) {
	        this.removeLayers([feature.id], true);
	        this.createLayers([feature]);
	      }

	      if (callback) {
	        callback.call(context, error, response);
	      }
	    }, this);
	  },

	  deleteFeature: function (id, callback, context) {
	    this.service.deleteFeature(id, function (error, response) {
	      if (!error && response.objectId) {
	        this.removeLayers([response.objectId], true);
	      }
	      if (callback) {
	        callback.call(context, error, response);
	      }
	    }, this);
	  },

	  deleteFeatures: function (ids, callback, context) {
	    return this.service.deleteFeatures(ids, function (error, response) {
	      if (!error && response.length > 0) {
	        for (var i = 0; i < response.length; i++) {
	          this.removeLayers([response[i].objectId], true);
	        }
	      }
	      if (callback) {
	        callback.call(context, error, response);
	      }
	    }, this);
	  }
	});

	var FeatureLayer = FeatureManager.extend({

	  options: {
	    cacheLayers: true
	  },

	  /**
	   * Constructor
	   */
	  initialize: function (options) {
	    FeatureManager.prototype.initialize.call(this, options);
	    this._originalStyle = this.options.style;
	    this._layers = {};
	  },

	  /**
	   * Layer Interface
	   */

	  onRemove: function (map) {
	    for (var i in this._layers) {
	      map.removeLayer(this._layers[i]);
	      // trigger the event when the entire featureLayer is removed from the map
	      this.fire('removefeature', {
	        feature: this._layers[i].feature,
	        permanent: false
	      }, true);
	    }

	    return FeatureManager.prototype.onRemove.call(this, map);
	  },

	  createNewLayer: function (geojson) {
	    var layer = L$1.GeoJSON.geometryToLayer(geojson, this.options);
	    layer.defaultOptions = layer.options;
	    return layer;
	  },

	  _updateLayer: function (layer, geojson) {
	    // convert the geojson coordinates into a Leaflet LatLng array/nested arrays
	    // pass it to setLatLngs to update layer geometries
	    var latlngs = [];
	    var coordsToLatLng = this.options.coordsToLatLng || L$1.GeoJSON.coordsToLatLng;

	    // copy new attributes, if present
	    if (geojson.properties) {
	      layer.feature.properties = geojson.properties;
	    }

	    switch (geojson.geometry.type) {
	      case 'Point':
	        latlngs = L$1.GeoJSON.coordsToLatLng(geojson.geometry.coordinates);
	        layer.setLatLng(latlngs);
	        break;
	      case 'LineString':
	        latlngs = L$1.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 0, coordsToLatLng);
	        layer.setLatLngs(latlngs);
	        break;
	      case 'MultiLineString':
	        latlngs = L$1.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 1, coordsToLatLng);
	        layer.setLatLngs(latlngs);
	        break;
	      case 'Polygon':
	        latlngs = L$1.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 1, coordsToLatLng);
	        layer.setLatLngs(latlngs);
	        break;
	      case 'MultiPolygon':
	        latlngs = L$1.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 2, coordsToLatLng);
	        layer.setLatLngs(latlngs);
	        break;
	    }
	  },

	  /**
	   * Feature Management Methods
	   */

	  createLayers: function (features) {
	    for (var i = features.length - 1; i >= 0; i--) {
	      var geojson = features[i];

	      var layer = this._layers[geojson.id];
	      var newLayer;

	      if (this._visibleZoom() && layer && !this._map.hasLayer(layer)) {
	        this._map.addLayer(layer);
	        this.fire('addfeature', {
	          feature: layer.feature
	        }, true);
	      }

	      // update geometry if necessary
	      if (layer && this.options.simplifyFactor > 0 && (layer.setLatLngs || layer.setLatLng)) {
	        this._updateLayer(layer, geojson);
	      }

	      if (!layer) {
	        newLayer = this.createNewLayer(geojson);
	        newLayer.feature = geojson;

	        // bubble events from individual layers to the feature layer
	        newLayer.addEventParent(this);

	        if (this.options.onEachFeature) {
	          this.options.onEachFeature(newLayer.feature, newLayer);
	        }

	        // cache the layer
	        this._layers[newLayer.feature.id] = newLayer;

	        // style the layer
	        this.setFeatureStyle(newLayer.feature.id, this.options.style);

	        this.fire('createfeature', {
	          feature: newLayer.feature
	        }, true);

	        // add the layer if the current zoom level is inside the range defined for the layer, it is within the current time bounds or our layer is not time enabled
	        if (this._visibleZoom() && (!this.options.timeField || (this.options.timeField && this._featureWithinTimeRange(geojson)))) {
	          this._map.addLayer(newLayer);
	        }
	      }
	    }
	  },

	  addLayers: function (ids) {
	    for (var i = ids.length - 1; i >= 0; i--) {
	      var layer = this._layers[ids[i]];
	      if (layer) {
	        this._map.addLayer(layer);
	      }
	    }
	  },

	  removeLayers: function (ids, permanent) {
	    for (var i = ids.length - 1; i >= 0; i--) {
	      var id = ids[i];
	      var layer = this._layers[id];
	      if (layer) {
	        this.fire('removefeature', {
	          feature: layer.feature,
	          permanent: permanent
	        }, true);
	        this._map.removeLayer(layer);
	      }
	      if (layer && permanent) {
	        delete this._layers[id];
	      }
	    }
	  },

	  cellEnter: function (bounds, coords) {
	    if (this._visibleZoom() && !this._zooming && this._map) {
	      L$1.Util.requestAnimFrame(L$1.Util.bind(function () {
	        var cacheKey = this._cacheKey(coords);
	        var cellKey = this._cellCoordsToKey(coords);
	        var layers = this._cache[cacheKey];
	        if (this._activeCells[cellKey] && layers) {
	          this.addLayers(layers);
	        }
	      }, this));
	    }
	  },

	  cellLeave: function (bounds, coords) {
	    if (!this._zooming) {
	      L$1.Util.requestAnimFrame(L$1.Util.bind(function () {
	        if (this._map) {
	          var cacheKey = this._cacheKey(coords);
	          var cellKey = this._cellCoordsToKey(coords);
	          var layers = this._cache[cacheKey];
	          var mapBounds = this._map.getBounds();
	          if (!this._activeCells[cellKey] && layers) {
	            var removable = true;

	            for (var i = 0; i < layers.length; i++) {
	              var layer = this._layers[layers[i]];
	              if (layer && layer.getBounds && mapBounds.intersects(layer.getBounds())) {
	                removable = false;
	              }
	            }

	            if (removable) {
	              this.removeLayers(layers, !this.options.cacheLayers);
	            }

	            if (!this.options.cacheLayers && removable) {
	              delete this._cache[cacheKey];
	              delete this._cells[cellKey];
	              delete this._activeCells[cellKey];
	            }
	          }
	        }
	      }, this));
	    }
	  },

	  /**
	   * Styling Methods
	   */

	  resetStyle: function () {
	    this.options.style = this._originalStyle;
	    this.eachFeature(function (layer) {
	      this.resetFeatureStyle(layer.feature.id);
	    }, this);
	    return this;
	  },

	  setStyle: function (style) {
	    this.options.style = style;
	    this.eachFeature(function (layer) {
	      this.setFeatureStyle(layer.feature.id, style);
	    }, this);
	    return this;
	  },

	  resetFeatureStyle: function (id) {
	    var layer = this._layers[id];
	    var style = this._originalStyle || L.Path.prototype.options;
	    if (layer) {
	      L$1.Util.extend(layer.options, layer.defaultOptions);
	      this.setFeatureStyle(id, style);
	    }
	    return this;
	  },

	  setFeatureStyle: function (id, style) {
	    var layer = this._layers[id];
	    if (typeof style === 'function') {
	      style = style(layer.feature);
	    }
	    if (layer.setStyle) {
	      layer.setStyle(style);
	    }
	    return this;
	  },

	  /**
	   * Utility Methods
	   */

	  eachActiveFeature: function (fn, context) {
	    // figure out (roughly) which layers are in view
	    if (this._map) {
	      var activeBounds = this._map.getBounds();
	      for (var i in this._layers) {
	        if (this._currentSnapshot.indexOf(this._layers[i].feature.id) !== -1) {
	          // a simple point in poly test for point geometries
	          if (typeof this._layers[i].getLatLng === 'function' && activeBounds.contains(this._layers[i].getLatLng())) {
	            fn.call(context, this._layers[i]);
	          } else if (typeof this._layers[i].getBounds === 'function' && activeBounds.intersects(this._layers[i].getBounds())) {
	            // intersecting bounds check for polyline and polygon geometries
	            fn.call(context, this._layers[i]);
	          }
	        }
	      }
	    }
	    return this;
	  },

	  eachFeature: function (fn, context) {
	    for (var i in this._layers) {
	      fn.call(context, this._layers[i]);
	    }
	    return this;
	  },

	  getFeature: function (id) {
	    return this._layers[id];
	  },

	  bringToBack: function () {
	    this.eachFeature(function (layer) {
	      if (layer.bringToBack) {
	        layer.bringToBack();
	      }
	    });
	  },

	  bringToFront: function () {
	    this.eachFeature(function (layer) {
	      if (layer.bringToFront) {
	        layer.bringToFront();
	      }
	    });
	  },

	  redraw: function (id) {
	    if (id) {
	      this._redraw(id);
	    }
	    return this;
	  },

	  _redraw: function (id) {
	    var layer = this._layers[id];
	    var geojson = layer.feature;

	    // if this looks like a marker
	    if (layer && layer.setIcon && this.options.pointToLayer) {
	      // update custom symbology, if necessary
	      if (this.options.pointToLayer) {
	        var getIcon = this.options.pointToLayer(geojson, L$1.latLng(geojson.geometry.coordinates[1], geojson.geometry.coordinates[0]));
	        var updatedIcon = getIcon.options.icon;
	        layer.setIcon(updatedIcon);
	      }
	    }

	    // looks like a vector marker (circleMarker)
	    if (layer && layer.setStyle && this.options.pointToLayer) {
	      var getStyle = this.options.pointToLayer(geojson, L$1.latLng(geojson.geometry.coordinates[1], geojson.geometry.coordinates[0]));
	      var updatedStyle = getStyle.options;
	      this.setFeatureStyle(geojson.id, updatedStyle);
	    }

	    // looks like a path (polygon/polyline)
	    if (layer && layer.setStyle && this.options.style) {
	      this.resetStyle(geojson.id);
	    }
	  }
	});

	function featureLayer (options) {
	  return new FeatureLayer(options);
	}

	exports.VERSION = version;
	exports.Support = Support;
	exports.options = options;
	exports.Util = EsriUtil;
	exports.get = get;
	exports.post = xmlHttpPost;
	exports.request = request;
	exports.Task = Task;
	exports.task = task;
	exports.Query = Query;
	exports.query = query;
	exports.Find = Find;
	exports.find = find;
	exports.Identify = Identify;
	exports.identify = identify;
	exports.IdentifyFeatures = IdentifyFeatures;
	exports.identifyFeatures = identifyFeatures;
	exports.IdentifyImage = IdentifyImage;
	exports.identifyImage = identifyImage;
	exports.Service = Service;
	exports.service = service;
	exports.MapService = MapService;
	exports.mapService = mapService;
	exports.ImageService = ImageService;
	exports.imageService = imageService;
	exports.FeatureLayerService = FeatureLayerService;
	exports.featureLayerService = featureLayerService;
	exports.BasemapLayer = BasemapLayer;
	exports.basemapLayer = basemapLayer;
	exports.TiledMapLayer = TiledMapLayer;
	exports.tiledMapLayer = tiledMapLayer;
	exports.RasterLayer = RasterLayer;
	exports.ImageMapLayer = ImageMapLayer;
	exports.imageMapLayer = imageMapLayer;
	exports.DynamicMapLayer = DynamicMapLayer;
	exports.dynamicMapLayer = dynamicMapLayer;
	exports.FeatureManager = FeatureManager;
	exports.FeatureLayer = FeatureLayer;
	exports.featureLayer = featureLayer;

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNyaS1sZWFmbGV0LWRlYnVnLmpzIiwic291cmNlcyI6WyIuLi9wYWNrYWdlLmpzb24iLCIuLi9zcmMvU3VwcG9ydC5qcyIsIi4uL3NyYy9PcHRpb25zLmpzIiwiLi4vc3JjL1JlcXVlc3QuanMiLCIuLi9ub2RlX21vZHVsZXMvYXJjZ2lzLXRvLWdlb2pzb24tdXRpbHMvaW5kZXguanMiLCIuLi9zcmMvVXRpbC5qcyIsIi4uL3NyYy9UYXNrcy9UYXNrLmpzIiwiLi4vc3JjL1Rhc2tzL1F1ZXJ5LmpzIiwiLi4vc3JjL1Rhc2tzL0ZpbmQuanMiLCIuLi9zcmMvVGFza3MvSWRlbnRpZnkuanMiLCIuLi9zcmMvVGFza3MvSWRlbnRpZnlGZWF0dXJlcy5qcyIsIi4uL3NyYy9UYXNrcy9JZGVudGlmeUltYWdlLmpzIiwiLi4vc3JjL1NlcnZpY2VzL1NlcnZpY2UuanMiLCIuLi9zcmMvU2VydmljZXMvTWFwU2VydmljZS5qcyIsIi4uL3NyYy9TZXJ2aWNlcy9JbWFnZVNlcnZpY2UuanMiLCIuLi9zcmMvU2VydmljZXMvRmVhdHVyZUxheWVyU2VydmljZS5qcyIsIi4uL3NyYy9MYXllcnMvQmFzZW1hcExheWVyLmpzIiwiLi4vc3JjL0xheWVycy9UaWxlZE1hcExheWVyLmpzIiwiLi4vc3JjL0xheWVycy9SYXN0ZXJMYXllci5qcyIsIi4uL3NyYy9MYXllcnMvSW1hZ2VNYXBMYXllci5qcyIsIi4uL3NyYy9MYXllcnMvRHluYW1pY01hcExheWVyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xlYWZsZXQtdmlydHVhbC1ncmlkL3NyYy92aXJ0dWFsLWdyaWQuanMiLCIuLi9ub2RlX21vZHVsZXMvdGlueS1iaW5hcnktc2VhcmNoL2luZGV4LmpzIiwiLi4vc3JjL0xheWVycy9GZWF0dXJlTGF5ZXIvRmVhdHVyZU1hbmFnZXIuanMiLCIuLi9zcmMvTGF5ZXJzL0ZlYXR1cmVMYXllci9GZWF0dXJlTGF5ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsie1xyXG4gIFwibmFtZVwiOiBcImVzcmktbGVhZmxldFwiLFxyXG4gIFwiZGVzY3JpcHRpb25cIjogXCJMZWFmbGV0IHBsdWdpbnMgZm9yIGNvbnN1bWluZyBBcmNHSVMgT25saW5lIGFuZCBBcmNHSVMgU2VydmVyIHNlcnZpY2VzLlwiLFxyXG4gIFwidmVyc2lvblwiOiBcIjIuMS4xXCIsXHJcbiAgXCJhdXRob3JcIjogXCJQYXRyaWNrIEFybHQgPHBhcmx0QGVzcmkuY29tPiAoaHR0cDovL3BhdHJpY2thcmx0LmNvbSlcIixcclxuICBcImJyb3dzZXJcIjogXCJkaXN0L2VzcmktbGVhZmxldC1kZWJ1Zy5qc1wiLFxyXG4gIFwiYnVnc1wiOiB7XHJcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9lc3JpL2VzcmktbGVhZmxldC9pc3N1ZXNcIlxyXG4gIH0sXHJcbiAgXCJjb250cmlidXRvcnNcIjogW1xyXG4gICAgXCJQYXRyaWNrIEFybHQgPHBhcmx0QGVzcmkuY29tPiAoaHR0cDovL3BhdHJpY2thcmx0LmNvbSlcIixcclxuICAgIFwiSm9obiBHcmF2b2lzIDxqZ3Jhdm9pc0Blc3JpLmNvbT4gKGh0dHA6Ly9qb2huZ3Jhdm9pcy5jb20pXCJcclxuICBdLFxyXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcclxuICAgIFwiYXJjZ2lzLXRvLWdlb2pzb24tdXRpbHNcIjogXCJeMS4wLjFcIixcclxuICAgIFwibGVhZmxldC12aXJ0dWFsLWdyaWRcIjogXCJeMS4wLjNcIixcclxuICAgIFwidGlueS1iaW5hcnktc2VhcmNoXCI6IFwiXjEuMC4yXCJcclxuICB9LFxyXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcclxuICAgIFwiY2hhaVwiOiBcIjMuNS4wXCIsXHJcbiAgICBcImdoLXJlbGVhc2VcIjogXCJeMi4wLjBcIixcclxuICAgIFwiaGlnaGxpZ2h0LmpzXCI6IFwiXjguMC4wXCIsXHJcbiAgICBcImh0dHAtc2VydmVyXCI6IFwiXjAuOC41XCIsXHJcbiAgICBcImh1c2t5XCI6IFwiXjAuMTIuMFwiLFxyXG4gICAgXCJpc3BhcnRhXCI6IFwiXjQuMC4wXCIsXHJcbiAgICBcImlzdGFuYnVsXCI6IFwiXjAuNC4yXCIsXHJcbiAgICBcImthcm1hXCI6IFwiXjEuNy4wXCIsXHJcbiAgICBcImthcm1hLWNoYWktc2lub25cIjogXCJeMC4xLjNcIixcclxuICAgIFwia2FybWEtY292ZXJhZ2VcIjogXCJeMS4xLjFcIixcclxuICAgIFwia2FybWEtbW9jaGFcIjogXCJeMS4zLjBcIixcclxuICAgIFwia2FybWEtbW9jaGEtcmVwb3J0ZXJcIjogXCJeMi4yLjFcIixcclxuICAgIFwia2FybWEtcGhhbnRvbWpzLWxhdW5jaGVyXCI6IFwiXjAuMi4wXCIsXHJcbiAgICBcImthcm1hLXNvdXJjZW1hcC1sb2FkZXJcIjogXCJeMC4zLjVcIixcclxuICAgIFwibWtkaXJwXCI6IFwiXjAuNS4xXCIsXHJcbiAgICBcIm1vY2hhXCI6IFwiXjMuNC4yXCIsXHJcbiAgICBcIm5wbS1ydW4tYWxsXCI6IFwiXjQuMC4yXCIsXHJcbiAgICBcInBoYW50b21qc1wiOiBcIl4xLjkuOFwiLFxyXG4gICAgXCJyb2xsdXBcIjogXCJeMC4yNS40XCIsXHJcbiAgICBcInJvbGx1cC1wbHVnaW4tanNvblwiOiBcIl4yLjMuMFwiLFxyXG4gICAgXCJyb2xsdXAtcGx1Z2luLW5vZGUtcmVzb2x2ZVwiOiBcIl4xLjQuMFwiLFxyXG4gICAgXCJyb2xsdXAtcGx1Z2luLXVnbGlmeVwiOiBcIl4wLjMuMVwiLFxyXG4gICAgXCJzZW1pc3RhbmRhcmRcIjogXCJeOS4wLjBcIixcclxuICAgIFwic2lub25cIjogXCJeMS4xMS4xXCIsXHJcbiAgICBcInNpbm9uLWNoYWlcIjogXCIyLjguMFwiLFxyXG4gICAgXCJzbmF6enlcIjogXCJeNS4wLjBcIixcclxuICAgIFwidWdsaWZ5LWpzXCI6IFwiXjIuOC4yOVwiLFxyXG4gICAgXCJ3YXRjaFwiOiBcIl4wLjE3LjFcIlxyXG4gIH0sXHJcbiAgXCJob21lcGFnZVwiOiBcImh0dHA6Ly9lc3JpLmdpdGh1Yi5pby9lc3JpLWxlYWZsZXRcIixcclxuICBcIm1vZHVsZVwiOiBcInNyYy9Fc3JpTGVhZmxldC5qc1wiLFxyXG4gIFwianNuZXh0Om1haW5cIjogXCJzcmMvRXNyaUxlYWZsZXQuanNcIixcclxuICBcImpzcG1cIjoge1xyXG4gICAgXCJyZWdpc3RyeVwiOiBcIm5wbVwiLFxyXG4gICAgXCJmb3JtYXRcIjogXCJlczZcIixcclxuICAgIFwibWFpblwiOiBcInNyYy9Fc3JpTGVhZmxldC5qc1wiXHJcbiAgfSxcclxuICBcImtleXdvcmRzXCI6IFtcclxuICAgIFwiYXJjZ2lzXCIsXHJcbiAgICBcImVzcmlcIixcclxuICAgIFwiZXNyaSBsZWFmbGV0XCIsXHJcbiAgICBcImdpc1wiLFxyXG4gICAgXCJsZWFmbGV0IHBsdWdpblwiLFxyXG4gICAgXCJtYXBwaW5nXCJcclxuICBdLFxyXG4gIFwibGljZW5zZVwiOiBcIkFwYWNoZS0yLjBcIixcclxuICBcIm1haW5cIjogXCJkaXN0L2VzcmktbGVhZmxldC1kZWJ1Zy5qc1wiLFxyXG4gIFwicGVlckRlcGVuZGVuY2llc1wiOiB7XHJcbiAgICBcImxlYWZsZXRcIjogXCJ+MS4wLjBcIlxyXG4gIH0sXHJcbiAgXCJyZWFkbWVGaWxlbmFtZVwiOiBcIlJFQURNRS5tZFwiLFxyXG4gIFwicmVwb3NpdG9yeVwiOiB7XHJcbiAgICBcInR5cGVcIjogXCJnaXRcIixcclxuICAgIFwidXJsXCI6IFwiZ2l0QGdpdGh1Yi5jb206RXNyaS9lc3JpLWxlYWZsZXQuZ2l0XCJcclxuICB9LFxyXG4gIFwic2NyaXB0c1wiOiB7XHJcbiAgICBcImJ1aWxkXCI6IFwicm9sbHVwIC1jIHByb2ZpbGVzL2RlYnVnLmpzICYgcm9sbHVwIC1jIHByb2ZpbGVzL3Byb2R1Y3Rpb24uanNcIixcclxuICAgIFwibGludFwiOiBcInNlbWlzdGFuZGFyZCB8IHNuYXp6eVwiLFxyXG4gICAgXCJwcmVidWlsZFwiOiBcIm1rZGlycCBkaXN0XCIsXHJcbiAgICBcInByZXB1Ymxpc2hcIjogXCJucG0gcnVuIGJ1aWxkXCIsXHJcbiAgICBcInByZXRlc3RcIjogXCJucG0gcnVuIGJ1aWxkXCIsXHJcbiAgICBcInByZWNvbW1pdFwiOiBcIm5wbSBydW4gbGludFwiLFxyXG4gICAgXCJyZWxlYXNlXCI6IFwiLi9zY3JpcHRzL3JlbGVhc2Uuc2hcIixcclxuICAgIFwic3RhcnQtd2F0Y2hcIjogXCJ3YXRjaCBcXFwibnBtIHJ1biBidWlsZFxcXCIgc3JjXCIsXHJcbiAgICBcInN0YXJ0XCI6IFwicnVuLXAgc3RhcnQtd2F0Y2ggc2VydmVcIixcclxuICAgIFwic2VydmVcIjogXCJodHRwLXNlcnZlciAtcCA1MDAwIC1jLTEgLW9cIixcclxuICAgIFwidGVzdFwiOiBcIm5wbSBydW4gbGludCAmJiBrYXJtYSBzdGFydFwiXHJcbiAgfSxcclxuICBcInNlbWlzdGFuZGFyZFwiOiB7XHJcbiAgICBcImlnbm9yZVwiOiBbXHJcbiAgICAgIFwiL2Rpc3RcIlxyXG4gICAgXSxcclxuICAgIFwiZ2xvYmFsc1wiOiBbXHJcbiAgICAgIFwiZXhwZWN0XCIsXHJcbiAgICAgIFwiTFwiLFxyXG4gICAgICBcIlhNTEh0dHBSZXF1ZXN0XCIsXHJcbiAgICAgIFwic2lub25cIixcclxuICAgICAgXCJ4aHJcIixcclxuICAgICAgXCJwcm9qNFwiXHJcbiAgICBdXHJcbiAgfVxyXG59XHJcbiIsImV4cG9ydCB2YXIgY29ycyA9ICgod2luZG93LlhNTEh0dHBSZXF1ZXN0ICYmICd3aXRoQ3JlZGVudGlhbHMnIGluIG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3QoKSkpO1xyXG5leHBvcnQgdmFyIHBvaW50ZXJFdmVudHMgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9PT0gJyc7XHJcblxyXG5leHBvcnQgdmFyIFN1cHBvcnQgPSB7XHJcbiAgY29yczogY29ycyxcclxuICBwb2ludGVyRXZlbnRzOiBwb2ludGVyRXZlbnRzXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTdXBwb3J0O1xyXG4iLCJleHBvcnQgdmFyIG9wdGlvbnMgPSB7XHJcbiAgYXR0cmlidXRpb25XaWR0aE9mZnNldDogNTVcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IG9wdGlvbnM7XHJcbiIsImltcG9ydCB7IFV0aWwsIERvbVV0aWwgfSBmcm9tICdsZWFmbGV0JztcclxuaW1wb3J0IFN1cHBvcnQgZnJvbSAnLi9TdXBwb3J0JztcclxuaW1wb3J0IHsgd2FybiB9IGZyb20gJy4vVXRpbCc7XHJcblxyXG52YXIgY2FsbGJhY2tzID0gMDtcclxuXHJcbmZ1bmN0aW9uIHNlcmlhbGl6ZSAocGFyYW1zKSB7XHJcbiAgdmFyIGRhdGEgPSAnJztcclxuXHJcbiAgcGFyYW1zLmYgPSBwYXJhbXMuZiB8fCAnanNvbic7XHJcblxyXG4gIGZvciAodmFyIGtleSBpbiBwYXJhbXMpIHtcclxuICAgIGlmIChwYXJhbXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICB2YXIgcGFyYW0gPSBwYXJhbXNba2V5XTtcclxuICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocGFyYW0pO1xyXG4gICAgICB2YXIgdmFsdWU7XHJcblxyXG4gICAgICBpZiAoZGF0YS5sZW5ndGgpIHtcclxuICAgICAgICBkYXRhICs9ICcmJztcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcclxuICAgICAgICB2YWx1ZSA9IChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocGFyYW1bMF0pID09PSAnW29iamVjdCBPYmplY3RdJykgPyBKU09OLnN0cmluZ2lmeShwYXJhbSkgOiBwYXJhbS5qb2luKCcsJyk7XHJcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcclxuICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHBhcmFtKTtcclxuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnW29iamVjdCBEYXRlXScpIHtcclxuICAgICAgICB2YWx1ZSA9IHBhcmFtLnZhbHVlT2YoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YWx1ZSA9IHBhcmFtO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkYXRhICs9IGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBkYXRhO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVSZXF1ZXN0IChjYWxsYmFjaywgY29udGV4dCkge1xyXG4gIHZhciBodHRwUmVxdWVzdCA9IG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3QoKTtcclxuXHJcbiAgaHR0cFJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBodHRwUmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBVdGlsLmZhbHNlRm47XHJcblxyXG4gICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCB7XHJcbiAgICAgIGVycm9yOiB7XHJcbiAgICAgICAgY29kZTogNTAwLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdYTUxIdHRwUmVxdWVzdCBlcnJvcidcclxuICAgICAgfVxyXG4gICAgfSwgbnVsbCk7XHJcbiAgfTtcclxuXHJcbiAgaHR0cFJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHJlc3BvbnNlO1xyXG4gICAgdmFyIGVycm9yO1xyXG5cclxuICAgIGlmIChodHRwUmVxdWVzdC5yZWFkeVN0YXRlID09PSA0KSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKGh0dHBSZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICByZXNwb25zZSA9IG51bGw7XHJcbiAgICAgICAgZXJyb3IgPSB7XHJcbiAgICAgICAgICBjb2RlOiA1MDAsXHJcbiAgICAgICAgICBtZXNzYWdlOiAnQ291bGQgbm90IHBhcnNlIHJlc3BvbnNlIGFzIEpTT04uIFRoaXMgY291bGQgYWxzbyBiZSBjYXVzZWQgYnkgYSBDT1JTIG9yIFhNTEh0dHBSZXF1ZXN0IGVycm9yLidcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIWVycm9yICYmIHJlc3BvbnNlLmVycm9yKSB7XHJcbiAgICAgICAgZXJyb3IgPSByZXNwb25zZS5lcnJvcjtcclxuICAgICAgICByZXNwb25zZSA9IG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGh0dHBSZXF1ZXN0Lm9uZXJyb3IgPSBVdGlsLmZhbHNlRm47XHJcblxyXG4gICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yLCByZXNwb25zZSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaHR0cFJlcXVlc3Qub250aW1lb3V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5vbmVycm9yKCk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGh0dHBSZXF1ZXN0O1xyXG59XHJcblxyXG5mdW5jdGlvbiB4bWxIdHRwUG9zdCAodXJsLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgdmFyIGh0dHBSZXF1ZXN0ID0gY3JlYXRlUmVxdWVzdChjYWxsYmFjaywgY29udGV4dCk7XHJcbiAgaHR0cFJlcXVlc3Qub3BlbignUE9TVCcsIHVybCk7XHJcblxyXG4gIGlmICh0eXBlb2YgY29udGV4dCAhPT0gJ3VuZGVmaW5lZCcgJiYgY29udGV4dCAhPT0gbnVsbCkge1xyXG4gICAgaWYgKHR5cGVvZiBjb250ZXh0Lm9wdGlvbnMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIGh0dHBSZXF1ZXN0LnRpbWVvdXQgPSBjb250ZXh0Lm9wdGlvbnMudGltZW91dDtcclxuICAgIH1cclxuICB9XHJcbiAgaHR0cFJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOCcpO1xyXG4gIGh0dHBSZXF1ZXN0LnNlbmQoc2VyaWFsaXplKHBhcmFtcykpO1xyXG5cclxuICByZXR1cm4gaHR0cFJlcXVlc3Q7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHhtbEh0dHBHZXQgKHVybCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gIGNvbnNvbGUubG9nKCd4bWxodHRwZ2V0JywgdXJsKTtcclxuICB2YXIgaHR0cFJlcXVlc3QgPSBjcmVhdGVSZXF1ZXN0KGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICBodHRwUmVxdWVzdC5vcGVuKCdHRVQnLCB1cmwgKyAnPycgKyBzZXJpYWxpemUocGFyYW1zKSwgdHJ1ZSk7XHJcblxyXG4gIGlmICh0eXBlb2YgY29udGV4dCAhPT0gJ3VuZGVmaW5lZCcgJiYgY29udGV4dCAhPT0gbnVsbCkge1xyXG4gICAgaWYgKHR5cGVvZiBjb250ZXh0Lm9wdGlvbnMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIGh0dHBSZXF1ZXN0LnRpbWVvdXQgPSBjb250ZXh0Lm9wdGlvbnMudGltZW91dDtcclxuICAgIH1cclxuICB9XHJcbiAgaHR0cFJlcXVlc3Quc2VuZChudWxsKTtcclxuXHJcbiAgcmV0dXJuIGh0dHBSZXF1ZXN0O1xyXG59XHJcblxyXG4vLyBBSkFYIGhhbmRsZXJzIGZvciBDT1JTIChtb2Rlcm4gYnJvd3NlcnMpIG9yIEpTT05QIChvbGRlciBicm93c2VycylcclxuZXhwb3J0IGZ1bmN0aW9uIHJlcXVlc3QgKHVybCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gIGNvbnNvbGUubG9nKCdyZWFsIHJlcXVlc3QnLCB1cmwpO1xyXG4gIHZhciBwYXJhbVN0cmluZyA9IHNlcmlhbGl6ZShwYXJhbXMpO1xyXG4gIHZhciBodHRwUmVxdWVzdCA9IGNyZWF0ZVJlcXVlc3QoY2FsbGJhY2ssIGNvbnRleHQpO1xyXG4gIHZhciByZXF1ZXN0TGVuZ3RoID0gKHVybCArICc/JyArIHBhcmFtU3RyaW5nKS5sZW5ndGg7XHJcblxyXG4gIC8vIGllMTAvMTEgcmVxdWlyZSB0aGUgcmVxdWVzdCBiZSBvcGVuZWQgYmVmb3JlIGEgdGltZW91dCBpcyBhcHBsaWVkXHJcbiAgaWYgKHJlcXVlc3RMZW5ndGggPD0gMjAwMCAmJiBTdXBwb3J0LmNvcnMpIHtcclxuICAgIGh0dHBSZXF1ZXN0Lm9wZW4oJ0dFVCcsIHVybCArICc/JyArIHBhcmFtU3RyaW5nKTtcclxuICB9IGVsc2UgaWYgKHJlcXVlc3RMZW5ndGggPiAyMDAwICYmIFN1cHBvcnQuY29ycykge1xyXG4gICAgaHR0cFJlcXVlc3Qub3BlbignUE9TVCcsIHVybCk7XHJcbiAgICBodHRwUmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04Jyk7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGNvbnRleHQgIT09ICd1bmRlZmluZWQnICYmIGNvbnRleHQgIT09IG51bGwpIHtcclxuICAgIGlmICh0eXBlb2YgY29udGV4dC5vcHRpb25zICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICBodHRwUmVxdWVzdC50aW1lb3V0ID0gY29udGV4dC5vcHRpb25zLnRpbWVvdXQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyByZXF1ZXN0IGlzIGxlc3MgdGhhbiAyMDAwIGNoYXJhY3RlcnMgYW5kIHRoZSBicm93c2VyIHN1cHBvcnRzIENPUlMsIG1ha2UgR0VUIHJlcXVlc3Qgd2l0aCBYTUxIdHRwUmVxdWVzdFxyXG4gIGlmIChyZXF1ZXN0TGVuZ3RoIDw9IDIwMDAgJiYgU3VwcG9ydC5jb3JzKSB7XHJcbiAgICBodHRwUmVxdWVzdC5zZW5kKG51bGwpO1xyXG5cclxuICAvLyByZXF1ZXN0IGlzIG1vcmUgdGhhbiAyMDAwIGNoYXJhY3RlcnMgYW5kIHRoZSBicm93c2VyIHN1cHBvcnRzIENPUlMsIG1ha2UgUE9TVCByZXF1ZXN0IHdpdGggWE1MSHR0cFJlcXVlc3RcclxuICB9IGVsc2UgaWYgKHJlcXVlc3RMZW5ndGggPiAyMDAwICYmIFN1cHBvcnQuY29ycykge1xyXG4gICAgaHR0cFJlcXVlc3Quc2VuZChwYXJhbVN0cmluZyk7XHJcblxyXG4gIC8vIHJlcXVlc3QgaXMgbGVzcyAgdGhhbiAyMDAwIGNoYXJhY3RlcnMgYW5kIHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgQ09SUywgbWFrZSBhIEpTT05QIHJlcXVlc3RcclxuICB9IGVsc2UgaWYgKHJlcXVlc3RMZW5ndGggPD0gMjAwMCAmJiAhU3VwcG9ydC5jb3JzKSB7XHJcbiAgICByZXR1cm4ganNvbnAodXJsLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuXHJcbiAgLy8gcmVxdWVzdCBpcyBsb25nZXIgdGhlbiAyMDAwIGNoYXJhY3RlcnMgYW5kIHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgQ09SUywgbG9nIGEgd2FybmluZ1xyXG4gIH0gZWxzZSB7XHJcbiAgICB3YXJuKCdhIHJlcXVlc3QgdG8gJyArIHVybCArICcgd2FzIGxvbmdlciB0aGVuIDIwMDAgY2hhcmFjdGVycyBhbmQgdGhpcyBicm93c2VyIGNhbm5vdCBtYWtlIGEgY3Jvc3MtZG9tYWluIHBvc3QgcmVxdWVzdC4gUGxlYXNlIHVzZSBhIHByb3h5IGh0dHA6Ly9lc3JpLmdpdGh1Yi5pby9lc3JpLWxlYWZsZXQvYXBpLXJlZmVyZW5jZS9yZXF1ZXN0Lmh0bWwnKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHJldHVybiBodHRwUmVxdWVzdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpzb25wICh1cmwsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICB3aW5kb3cuX0VzcmlMZWFmbGV0Q2FsbGJhY2tzID0gd2luZG93Ll9Fc3JpTGVhZmxldENhbGxiYWNrcyB8fCB7fTtcclxuICB2YXIgY2FsbGJhY2tJZCA9ICdjJyArIGNhbGxiYWNrcztcclxuICBwYXJhbXMuY2FsbGJhY2sgPSAnd2luZG93Ll9Fc3JpTGVhZmxldENhbGxiYWNrcy4nICsgY2FsbGJhY2tJZDtcclxuXHJcbiAgd2luZG93Ll9Fc3JpTGVhZmxldENhbGxiYWNrc1tjYWxsYmFja0lkXSA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgaWYgKHdpbmRvdy5fRXNyaUxlYWZsZXRDYWxsYmFja3NbY2FsbGJhY2tJZF0gIT09IHRydWUpIHtcclxuICAgICAgdmFyIGVycm9yO1xyXG4gICAgICB2YXIgcmVzcG9uc2VUeXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHJlc3BvbnNlKTtcclxuXHJcbiAgICAgIGlmICghKHJlc3BvbnNlVHlwZSA9PT0gJ1tvYmplY3QgT2JqZWN0XScgfHwgcmVzcG9uc2VUeXBlID09PSAnW29iamVjdCBBcnJheV0nKSkge1xyXG4gICAgICAgIGVycm9yID0ge1xyXG4gICAgICAgICAgZXJyb3I6IHtcclxuICAgICAgICAgICAgY29kZTogNTAwLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiAnRXhwZWN0ZWQgYXJyYXkgb3Igb2JqZWN0IGFzIEpTT05QIHJlc3BvbnNlJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmVzcG9uc2UgPSBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIWVycm9yICYmIHJlc3BvbnNlLmVycm9yKSB7XHJcbiAgICAgICAgZXJyb3IgPSByZXNwb25zZTtcclxuICAgICAgICByZXNwb25zZSA9IG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IsIHJlc3BvbnNlKTtcclxuICAgICAgd2luZG93Ll9Fc3JpTGVhZmxldENhbGxiYWNrc1tjYWxsYmFja0lkXSA9IHRydWU7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdmFyIHNjcmlwdCA9IERvbVV0aWwuY3JlYXRlKCdzY3JpcHQnLCBudWxsLCBkb2N1bWVudC5ib2R5KTtcclxuICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xyXG4gIHNjcmlwdC5zcmMgPSB1cmwgKyAnPycgKyBzZXJpYWxpemUocGFyYW1zKTtcclxuICBzY3JpcHQuaWQgPSBjYWxsYmFja0lkO1xyXG5cclxuICBjYWxsYmFja3MrKztcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGlkOiBjYWxsYmFja0lkLFxyXG4gICAgdXJsOiBzY3JpcHQuc3JjLFxyXG4gICAgYWJvcnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgd2luZG93Ll9Fc3JpTGVhZmxldENhbGxiYWNrcy5fY2FsbGJhY2tbY2FsbGJhY2tJZF0oe1xyXG4gICAgICAgIGNvZGU6IDAsXHJcbiAgICAgICAgbWVzc2FnZTogJ1JlcXVlc3QgYWJvcnRlZC4nXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcbn1cclxuXHJcbnZhciBnZXQgPSAoKFN1cHBvcnQuY29ycykgPyB4bWxIdHRwR2V0IDoganNvbnApO1xyXG5nZXQuQ09SUyA9IHhtbEh0dHBHZXQ7XHJcbmdldC5KU09OUCA9IGpzb25wO1xyXG5cclxuLy8gY2hvb3NlIHRoZSBjb3JyZWN0IEFKQVggaGFuZGxlciBkZXBlbmRpbmcgb24gQ09SUyBzdXBwb3J0XHJcbmV4cG9ydCB7IGdldCB9O1xyXG5cclxuLy8gYWx3YXlzIHVzZSBYTUxIdHRwUmVxdWVzdCBmb3IgcG9zdHNcclxuZXhwb3J0IHsgeG1sSHR0cFBvc3QgYXMgcG9zdCB9O1xyXG5cclxuLy8gZXhwb3J0IHRoZSBSZXF1ZXN0IG9iamVjdCB0byBjYWxsIHRoZSBkaWZmZXJlbnQgaGFuZGxlcnMgZm9yIGRlYnVnZ2luZ1xyXG5leHBvcnQgdmFyIFJlcXVlc3QgPSB7XHJcbiAgcmVxdWVzdDogcmVxdWVzdCxcclxuICBnZXQ6IGdldCxcclxuICBwb3N0OiB4bWxIdHRwUG9zdFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgUmVxdWVzdDtcclxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE3IEVzcmlcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gY2hlY2tzIGlmIDIgeCx5IHBvaW50cyBhcmUgZXF1YWxcbmZ1bmN0aW9uIHBvaW50c0VxdWFsIChhLCBiKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBjaGVja3MgaWYgdGhlIGZpcnN0IGFuZCBsYXN0IHBvaW50cyBvZiBhIHJpbmcgYXJlIGVxdWFsIGFuZCBjbG9zZXMgdGhlIHJpbmdcbmZ1bmN0aW9uIGNsb3NlUmluZyAoY29vcmRpbmF0ZXMpIHtcbiAgaWYgKCFwb2ludHNFcXVhbChjb29yZGluYXRlc1swXSwgY29vcmRpbmF0ZXNbY29vcmRpbmF0ZXMubGVuZ3RoIC0gMV0pKSB7XG4gICAgY29vcmRpbmF0ZXMucHVzaChjb29yZGluYXRlc1swXSk7XG4gIH1cbiAgcmV0dXJuIGNvb3JkaW5hdGVzO1xufVxuXG4vLyBkZXRlcm1pbmUgaWYgcG9seWdvbiByaW5nIGNvb3JkaW5hdGVzIGFyZSBjbG9ja3dpc2UuIGNsb2Nrd2lzZSBzaWduaWZpZXMgb3V0ZXIgcmluZywgY291bnRlci1jbG9ja3dpc2UgYW4gaW5uZXIgcmluZ1xuLy8gb3IgaG9sZS4gdGhpcyBsb2dpYyB3YXMgZm91bmQgYXQgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMTY1NjQ3L2hvdy10by1kZXRlcm1pbmUtaWYtYS1saXN0LW9mLXBvbHlnb24tXG4vLyBwb2ludHMtYXJlLWluLWNsb2Nrd2lzZS1vcmRlclxuZnVuY3Rpb24gcmluZ0lzQ2xvY2t3aXNlIChyaW5nVG9UZXN0KSB7XG4gIHZhciB0b3RhbCA9IDA7XG4gIHZhciBpID0gMDtcbiAgdmFyIHJMZW5ndGggPSByaW5nVG9UZXN0Lmxlbmd0aDtcbiAgdmFyIHB0MSA9IHJpbmdUb1Rlc3RbaV07XG4gIHZhciBwdDI7XG4gIGZvciAoaTsgaSA8IHJMZW5ndGggLSAxOyBpKyspIHtcbiAgICBwdDIgPSByaW5nVG9UZXN0W2kgKyAxXTtcbiAgICB0b3RhbCArPSAocHQyWzBdIC0gcHQxWzBdKSAqIChwdDJbMV0gKyBwdDFbMV0pO1xuICAgIHB0MSA9IHB0MjtcbiAgfVxuICByZXR1cm4gKHRvdGFsID49IDApO1xufVxuXG4vLyBwb3J0ZWQgZnJvbSB0ZXJyYWZvcm1lci5qcyBodHRwczovL2dpdGh1Yi5jb20vRXNyaS9UZXJyYWZvcm1lci9ibG9iL21hc3Rlci90ZXJyYWZvcm1lci5qcyNMNTA0LUw1MTlcbmZ1bmN0aW9uIHZlcnRleEludGVyc2VjdHNWZXJ0ZXggKGExLCBhMiwgYjEsIGIyKSB7XG4gIHZhciB1YVQgPSAoKGIyWzBdIC0gYjFbMF0pICogKGExWzFdIC0gYjFbMV0pKSAtICgoYjJbMV0gLSBiMVsxXSkgKiAoYTFbMF0gLSBiMVswXSkpO1xuICB2YXIgdWJUID0gKChhMlswXSAtIGExWzBdKSAqIChhMVsxXSAtIGIxWzFdKSkgLSAoKGEyWzFdIC0gYTFbMV0pICogKGExWzBdIC0gYjFbMF0pKTtcbiAgdmFyIHVCID0gKChiMlsxXSAtIGIxWzFdKSAqIChhMlswXSAtIGExWzBdKSkgLSAoKGIyWzBdIC0gYjFbMF0pICogKGEyWzFdIC0gYTFbMV0pKTtcblxuICBpZiAodUIgIT09IDApIHtcbiAgICB2YXIgdWEgPSB1YVQgLyB1QjtcbiAgICB2YXIgdWIgPSB1YlQgLyB1QjtcblxuICAgIGlmICh1YSA+PSAwICYmIHVhIDw9IDEgJiYgdWIgPj0gMCAmJiB1YiA8PSAxKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIHBvcnRlZCBmcm9tIHRlcnJhZm9ybWVyLmpzIGh0dHBzOi8vZ2l0aHViLmNvbS9Fc3JpL1RlcnJhZm9ybWVyL2Jsb2IvbWFzdGVyL3RlcnJhZm9ybWVyLmpzI0w1MjEtTDUzMVxuZnVuY3Rpb24gYXJyYXlJbnRlcnNlY3RzQXJyYXkgKGEsIGIpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgYi5sZW5ndGggLSAxOyBqKyspIHtcbiAgICAgIGlmICh2ZXJ0ZXhJbnRlcnNlY3RzVmVydGV4KGFbaV0sIGFbaSArIDFdLCBiW2pdLCBiW2ogKyAxXSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vLyBwb3J0ZWQgZnJvbSB0ZXJyYWZvcm1lci5qcyBodHRwczovL2dpdGh1Yi5jb20vRXNyaS9UZXJyYWZvcm1lci9ibG9iL21hc3Rlci90ZXJyYWZvcm1lci5qcyNMNDcwLUw0ODBcbmZ1bmN0aW9uIGNvb3JkaW5hdGVzQ29udGFpblBvaW50IChjb29yZGluYXRlcywgcG9pbnQpIHtcbiAgdmFyIGNvbnRhaW5zID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSAtMSwgbCA9IGNvb3JkaW5hdGVzLmxlbmd0aCwgaiA9IGwgLSAxOyArK2kgPCBsOyBqID0gaSkge1xuICAgIGlmICgoKGNvb3JkaW5hdGVzW2ldWzFdIDw9IHBvaW50WzFdICYmIHBvaW50WzFdIDwgY29vcmRpbmF0ZXNbal1bMV0pIHx8XG4gICAgICAgICAoY29vcmRpbmF0ZXNbal1bMV0gPD0gcG9pbnRbMV0gJiYgcG9pbnRbMV0gPCBjb29yZGluYXRlc1tpXVsxXSkpICYmXG4gICAgICAgIChwb2ludFswXSA8ICgoKGNvb3JkaW5hdGVzW2pdWzBdIC0gY29vcmRpbmF0ZXNbaV1bMF0pICogKHBvaW50WzFdIC0gY29vcmRpbmF0ZXNbaV1bMV0pKSAvIChjb29yZGluYXRlc1tqXVsxXSAtIGNvb3JkaW5hdGVzW2ldWzFdKSkgKyBjb29yZGluYXRlc1tpXVswXSkpIHtcbiAgICAgIGNvbnRhaW5zID0gIWNvbnRhaW5zO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29udGFpbnM7XG59XG5cbi8vIHBvcnRlZCBmcm9tIHRlcnJhZm9ybWVyLWFyY2dpcy1wYXJzZXIuanMgaHR0cHM6Ly9naXRodWIuY29tL0VzcmkvdGVycmFmb3JtZXItYXJjZ2lzLXBhcnNlci9ibG9iL21hc3Rlci90ZXJyYWZvcm1lci1hcmNnaXMtcGFyc2VyLmpzI0wxMDYtTDExM1xuZnVuY3Rpb24gY29vcmRpbmF0ZXNDb250YWluQ29vcmRpbmF0ZXMgKG91dGVyLCBpbm5lcikge1xuICB2YXIgaW50ZXJzZWN0cyA9IGFycmF5SW50ZXJzZWN0c0FycmF5KG91dGVyLCBpbm5lcik7XG4gIHZhciBjb250YWlucyA9IGNvb3JkaW5hdGVzQ29udGFpblBvaW50KG91dGVyLCBpbm5lclswXSk7XG4gIGlmICghaW50ZXJzZWN0cyAmJiBjb250YWlucykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gZG8gYW55IHBvbHlnb25zIGluIHRoaXMgYXJyYXkgY29udGFpbiBhbnkgb3RoZXIgcG9seWdvbnMgaW4gdGhpcyBhcnJheT9cbi8vIHVzZWQgZm9yIGNoZWNraW5nIGZvciBob2xlcyBpbiBhcmNnaXMgcmluZ3Ncbi8vIHBvcnRlZCBmcm9tIHRlcnJhZm9ybWVyLWFyY2dpcy1wYXJzZXIuanMgaHR0cHM6Ly9naXRodWIuY29tL0VzcmkvdGVycmFmb3JtZXItYXJjZ2lzLXBhcnNlci9ibG9iL21hc3Rlci90ZXJyYWZvcm1lci1hcmNnaXMtcGFyc2VyLmpzI0wxMTctTDE3MlxuZnVuY3Rpb24gY29udmVydFJpbmdzVG9HZW9KU09OIChyaW5ncykge1xuICB2YXIgb3V0ZXJSaW5ncyA9IFtdO1xuICB2YXIgaG9sZXMgPSBbXTtcbiAgdmFyIHg7IC8vIGl0ZXJhdG9yXG4gIHZhciBvdXRlclJpbmc7IC8vIGN1cnJlbnQgb3V0ZXIgcmluZyBiZWluZyBldmFsdWF0ZWRcbiAgdmFyIGhvbGU7IC8vIGN1cnJlbnQgaG9sZSBiZWluZyBldmFsdWF0ZWRcblxuICAvLyBmb3IgZWFjaCByaW5nXG4gIGZvciAodmFyIHIgPSAwOyByIDwgcmluZ3MubGVuZ3RoOyByKyspIHtcbiAgICB2YXIgcmluZyA9IGNsb3NlUmluZyhyaW5nc1tyXS5zbGljZSgwKSk7XG4gICAgaWYgKHJpbmcubGVuZ3RoIDwgNCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIC8vIGlzIHRoaXMgcmluZyBhbiBvdXRlciByaW5nPyBpcyBpdCBjbG9ja3dpc2U/XG4gICAgaWYgKHJpbmdJc0Nsb2Nrd2lzZShyaW5nKSkge1xuICAgICAgdmFyIHBvbHlnb24gPSBbIHJpbmcgXTtcbiAgICAgIG91dGVyUmluZ3MucHVzaChwb2x5Z29uKTsgLy8gcHVzaCB0byBvdXRlciByaW5nc1xuICAgIH0gZWxzZSB7XG4gICAgICBob2xlcy5wdXNoKHJpbmcpOyAvLyBjb3VudGVyY2xvY2t3aXNlIHB1c2ggdG8gaG9sZXNcbiAgICB9XG4gIH1cblxuICB2YXIgdW5jb250YWluZWRIb2xlcyA9IFtdO1xuXG4gIC8vIHdoaWxlIHRoZXJlIGFyZSBob2xlcyBsZWZ0Li4uXG4gIHdoaWxlIChob2xlcy5sZW5ndGgpIHtcbiAgICAvLyBwb3AgYSBob2xlIG9mZiBvdXQgc3RhY2tcbiAgICBob2xlID0gaG9sZXMucG9wKCk7XG5cbiAgICAvLyBsb29wIG92ZXIgYWxsIG91dGVyIHJpbmdzIGFuZCBzZWUgaWYgdGhleSBjb250YWluIG91ciBob2xlLlxuICAgIHZhciBjb250YWluZWQgPSBmYWxzZTtcbiAgICBmb3IgKHggPSBvdXRlclJpbmdzLmxlbmd0aCAtIDE7IHggPj0gMDsgeC0tKSB7XG4gICAgICBvdXRlclJpbmcgPSBvdXRlclJpbmdzW3hdWzBdO1xuICAgICAgaWYgKGNvb3JkaW5hdGVzQ29udGFpbkNvb3JkaW5hdGVzKG91dGVyUmluZywgaG9sZSkpIHtcbiAgICAgICAgLy8gdGhlIGhvbGUgaXMgY29udGFpbmVkIHB1c2ggaXQgaW50byBvdXIgcG9seWdvblxuICAgICAgICBvdXRlclJpbmdzW3hdLnB1c2goaG9sZSk7XG4gICAgICAgIGNvbnRhaW5lZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJpbmcgaXMgbm90IGNvbnRhaW5lZCBpbiBhbnkgb3V0ZXIgcmluZ1xuICAgIC8vIHNvbWV0aW1lcyB0aGlzIGhhcHBlbnMgaHR0cHM6Ly9naXRodWIuY29tL0VzcmkvZXNyaS1sZWFmbGV0L2lzc3Vlcy8zMjBcbiAgICBpZiAoIWNvbnRhaW5lZCkge1xuICAgICAgdW5jb250YWluZWRIb2xlcy5wdXNoKGhvbGUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHdlIGNvdWxkbid0IG1hdGNoIGFueSBob2xlcyB1c2luZyBjb250YWlucyB3ZSBjYW4gdHJ5IGludGVyc2VjdHMuLi5cbiAgd2hpbGUgKHVuY29udGFpbmVkSG9sZXMubGVuZ3RoKSB7XG4gICAgLy8gcG9wIGEgaG9sZSBvZmYgb3V0IHN0YWNrXG4gICAgaG9sZSA9IHVuY29udGFpbmVkSG9sZXMucG9wKCk7XG5cbiAgICAvLyBsb29wIG92ZXIgYWxsIG91dGVyIHJpbmdzIGFuZCBzZWUgaWYgYW55IGludGVyc2VjdCBvdXIgaG9sZS5cbiAgICB2YXIgaW50ZXJzZWN0cyA9IGZhbHNlO1xuXG4gICAgZm9yICh4ID0gb3V0ZXJSaW5ncy5sZW5ndGggLSAxOyB4ID49IDA7IHgtLSkge1xuICAgICAgb3V0ZXJSaW5nID0gb3V0ZXJSaW5nc1t4XVswXTtcbiAgICAgIGlmIChhcnJheUludGVyc2VjdHNBcnJheShvdXRlclJpbmcsIGhvbGUpKSB7XG4gICAgICAgIC8vIHRoZSBob2xlIGlzIGNvbnRhaW5lZCBwdXNoIGl0IGludG8gb3VyIHBvbHlnb25cbiAgICAgICAgb3V0ZXJSaW5nc1t4XS5wdXNoKGhvbGUpO1xuICAgICAgICBpbnRlcnNlY3RzID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFpbnRlcnNlY3RzKSB7XG4gICAgICBvdXRlclJpbmdzLnB1c2goW2hvbGUucmV2ZXJzZSgpXSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG91dGVyUmluZ3MubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdQb2x5Z29uJyxcbiAgICAgIGNvb3JkaW5hdGVzOiBvdXRlclJpbmdzWzBdXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ011bHRpUG9seWdvbicsXG4gICAgICBjb29yZGluYXRlczogb3V0ZXJSaW5nc1xuICAgIH07XG4gIH1cbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBlbnN1cmVzIHRoYXQgcmluZ3MgYXJlIG9yaWVudGVkIGluIHRoZSByaWdodCBkaXJlY3Rpb25zXG4vLyBvdXRlciByaW5ncyBhcmUgY2xvY2t3aXNlLCBob2xlcyBhcmUgY291bnRlcmNsb2Nrd2lzZVxuLy8gdXNlZCBmb3IgY29udmVydGluZyBHZW9KU09OIFBvbHlnb25zIHRvIEFyY0dJUyBQb2x5Z29uc1xuZnVuY3Rpb24gb3JpZW50UmluZ3MgKHBvbHkpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICB2YXIgcG9seWdvbiA9IHBvbHkuc2xpY2UoMCk7XG4gIHZhciBvdXRlclJpbmcgPSBjbG9zZVJpbmcocG9seWdvbi5zaGlmdCgpLnNsaWNlKDApKTtcbiAgaWYgKG91dGVyUmluZy5sZW5ndGggPj0gNCkge1xuICAgIGlmICghcmluZ0lzQ2xvY2t3aXNlKG91dGVyUmluZykpIHtcbiAgICAgIG91dGVyUmluZy5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgb3V0cHV0LnB1c2gob3V0ZXJSaW5nKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9seWdvbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGhvbGUgPSBjbG9zZVJpbmcocG9seWdvbltpXS5zbGljZSgwKSk7XG4gICAgICBpZiAoaG9sZS5sZW5ndGggPj0gNCkge1xuICAgICAgICBpZiAocmluZ0lzQ2xvY2t3aXNlKGhvbGUpKSB7XG4gICAgICAgICAgaG9sZS5yZXZlcnNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgb3V0cHV0LnB1c2goaG9sZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBmbGF0dGVucyBob2xlcyBpbiBtdWx0aXBvbHlnb25zIHRvIG9uZSBhcnJheSBvZiBwb2x5Z29uc1xuLy8gdXNlZCBmb3IgY29udmVydGluZyBHZW9KU09OIFBvbHlnb25zIHRvIEFyY0dJUyBQb2x5Z29uc1xuZnVuY3Rpb24gZmxhdHRlbk11bHRpUG9seWdvblJpbmdzIChyaW5ncykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcG9seWdvbiA9IG9yaWVudFJpbmdzKHJpbmdzW2ldKTtcbiAgICBmb3IgKHZhciB4ID0gcG9seWdvbi5sZW5ndGggLSAxOyB4ID49IDA7IHgtLSkge1xuICAgICAgdmFyIHJpbmcgPSBwb2x5Z29uW3hdLnNsaWNlKDApO1xuICAgICAgb3V0cHV0LnB1c2gocmluZyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbi8vIHNoYWxsb3cgb2JqZWN0IGNsb25lIGZvciBmZWF0dXJlIHByb3BlcnRpZXMgYW5kIGF0dHJpYnV0ZXNcbi8vIGZyb20gaHR0cDovL2pzcGVyZi5jb20vY2xvbmluZy1hbi1vYmplY3QvMlxuZnVuY3Rpb24gc2hhbGxvd0Nsb25lIChvYmopIHtcbiAgdmFyIHRhcmdldCA9IHt9O1xuICBmb3IgKHZhciBpIGluIG9iaikge1xuICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgIHRhcmdldFtpXSA9IG9ialtpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFyY2dpc1RvR2VvSlNPTiAoYXJjZ2lzLCBpZEF0dHJpYnV0ZSkge1xuICB2YXIgZ2VvanNvbiA9IHt9O1xuXG4gIGlmICh0eXBlb2YgYXJjZ2lzLnggPT09ICdudW1iZXInICYmIHR5cGVvZiBhcmNnaXMueSA9PT0gJ251bWJlcicpIHtcbiAgICBnZW9qc29uLnR5cGUgPSAnUG9pbnQnO1xuICAgIGdlb2pzb24uY29vcmRpbmF0ZXMgPSBbYXJjZ2lzLngsIGFyY2dpcy55XTtcbiAgfVxuXG4gIGlmIChhcmNnaXMucG9pbnRzKSB7XG4gICAgZ2VvanNvbi50eXBlID0gJ011bHRpUG9pbnQnO1xuICAgIGdlb2pzb24uY29vcmRpbmF0ZXMgPSBhcmNnaXMucG9pbnRzLnNsaWNlKDApO1xuICB9XG5cbiAgaWYgKGFyY2dpcy5wYXRocykge1xuICAgIGlmIChhcmNnaXMucGF0aHMubGVuZ3RoID09PSAxKSB7XG4gICAgICBnZW9qc29uLnR5cGUgPSAnTGluZVN0cmluZyc7XG4gICAgICBnZW9qc29uLmNvb3JkaW5hdGVzID0gYXJjZ2lzLnBhdGhzWzBdLnNsaWNlKDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBnZW9qc29uLnR5cGUgPSAnTXVsdGlMaW5lU3RyaW5nJztcbiAgICAgIGdlb2pzb24uY29vcmRpbmF0ZXMgPSBhcmNnaXMucGF0aHMuc2xpY2UoMCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGFyY2dpcy5yaW5ncykge1xuICAgIGdlb2pzb24gPSBjb252ZXJ0UmluZ3NUb0dlb0pTT04oYXJjZ2lzLnJpbmdzLnNsaWNlKDApKTtcbiAgfVxuXG4gIGlmIChhcmNnaXMuZ2VvbWV0cnkgfHwgYXJjZ2lzLmF0dHJpYnV0ZXMpIHtcbiAgICBnZW9qc29uLnR5cGUgPSAnRmVhdHVyZSc7XG4gICAgZ2VvanNvbi5nZW9tZXRyeSA9IChhcmNnaXMuZ2VvbWV0cnkpID8gYXJjZ2lzVG9HZW9KU09OKGFyY2dpcy5nZW9tZXRyeSkgOiBudWxsO1xuICAgIGdlb2pzb24ucHJvcGVydGllcyA9IChhcmNnaXMuYXR0cmlidXRlcykgPyBzaGFsbG93Q2xvbmUoYXJjZ2lzLmF0dHJpYnV0ZXMpIDogbnVsbDtcbiAgICBpZiAoYXJjZ2lzLmF0dHJpYnV0ZXMpIHtcbiAgICAgIGdlb2pzb24uaWQgPSBhcmNnaXMuYXR0cmlidXRlc1tpZEF0dHJpYnV0ZV0gfHwgYXJjZ2lzLmF0dHJpYnV0ZXMuT0JKRUNUSUQgfHwgYXJjZ2lzLmF0dHJpYnV0ZXMuRklEO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIG5vIHZhbGlkIGdlb21ldHJ5IHdhcyBlbmNvdW50ZXJlZFxuICBpZiAoSlNPTi5zdHJpbmdpZnkoZ2VvanNvbi5nZW9tZXRyeSkgPT09IEpTT04uc3RyaW5naWZ5KHt9KSkge1xuICAgIGdlb2pzb24uZ2VvbWV0cnkgPSBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGdlb2pzb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW9qc29uVG9BcmNHSVMgKGdlb2pzb24sIGlkQXR0cmlidXRlKSB7XG4gIGlkQXR0cmlidXRlID0gaWRBdHRyaWJ1dGUgfHwgJ09CSkVDVElEJztcbiAgdmFyIHNwYXRpYWxSZWZlcmVuY2UgPSB7IHdraWQ6IDQzMjYgfTtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICB2YXIgaTtcblxuICBzd2l0Y2ggKGdlb2pzb24udHlwZSkge1xuICAgIGNhc2UgJ1BvaW50JzpcbiAgICAgIHJlc3VsdC54ID0gZ2VvanNvbi5jb29yZGluYXRlc1swXTtcbiAgICAgIHJlc3VsdC55ID0gZ2VvanNvbi5jb29yZGluYXRlc1sxXTtcbiAgICAgIHJlc3VsdC5zcGF0aWFsUmVmZXJlbmNlID0gc3BhdGlhbFJlZmVyZW5jZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ011bHRpUG9pbnQnOlxuICAgICAgcmVzdWx0LnBvaW50cyA9IGdlb2pzb24uY29vcmRpbmF0ZXMuc2xpY2UoMCk7XG4gICAgICByZXN1bHQuc3BhdGlhbFJlZmVyZW5jZSA9IHNwYXRpYWxSZWZlcmVuY2U7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdMaW5lU3RyaW5nJzpcbiAgICAgIHJlc3VsdC5wYXRocyA9IFtnZW9qc29uLmNvb3JkaW5hdGVzLnNsaWNlKDApXTtcbiAgICAgIHJlc3VsdC5zcGF0aWFsUmVmZXJlbmNlID0gc3BhdGlhbFJlZmVyZW5jZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ011bHRpTGluZVN0cmluZyc6XG4gICAgICByZXN1bHQucGF0aHMgPSBnZW9qc29uLmNvb3JkaW5hdGVzLnNsaWNlKDApO1xuICAgICAgcmVzdWx0LnNwYXRpYWxSZWZlcmVuY2UgPSBzcGF0aWFsUmVmZXJlbmNlO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnUG9seWdvbic6XG4gICAgICByZXN1bHQucmluZ3MgPSBvcmllbnRSaW5ncyhnZW9qc29uLmNvb3JkaW5hdGVzLnNsaWNlKDApKTtcbiAgICAgIHJlc3VsdC5zcGF0aWFsUmVmZXJlbmNlID0gc3BhdGlhbFJlZmVyZW5jZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ011bHRpUG9seWdvbic6XG4gICAgICByZXN1bHQucmluZ3MgPSBmbGF0dGVuTXVsdGlQb2x5Z29uUmluZ3MoZ2VvanNvbi5jb29yZGluYXRlcy5zbGljZSgwKSk7XG4gICAgICByZXN1bHQuc3BhdGlhbFJlZmVyZW5jZSA9IHNwYXRpYWxSZWZlcmVuY2U7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdGZWF0dXJlJzpcbiAgICAgIGlmIChnZW9qc29uLmdlb21ldHJ5KSB7XG4gICAgICAgIHJlc3VsdC5nZW9tZXRyeSA9IGdlb2pzb25Ub0FyY0dJUyhnZW9qc29uLmdlb21ldHJ5LCBpZEF0dHJpYnV0ZSk7XG4gICAgICB9XG4gICAgICByZXN1bHQuYXR0cmlidXRlcyA9IChnZW9qc29uLnByb3BlcnRpZXMpID8gc2hhbGxvd0Nsb25lKGdlb2pzb24ucHJvcGVydGllcykgOiB7fTtcbiAgICAgIGlmIChnZW9qc29uLmlkKSB7XG4gICAgICAgIHJlc3VsdC5hdHRyaWJ1dGVzW2lkQXR0cmlidXRlXSA9IGdlb2pzb24uaWQ7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdGZWF0dXJlQ29sbGVjdGlvbic6XG4gICAgICByZXN1bHQgPSBbXTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBnZW9qc29uLmZlYXR1cmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGdlb2pzb25Ub0FyY0dJUyhnZW9qc29uLmZlYXR1cmVzW2ldLCBpZEF0dHJpYnV0ZSkpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnR2VvbWV0cnlDb2xsZWN0aW9uJzpcbiAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGdlb2pzb24uZ2VvbWV0cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZXN1bHQucHVzaChnZW9qc29uVG9BcmNHSVMoZ2VvanNvbi5nZW9tZXRyaWVzW2ldLCBpZEF0dHJpYnV0ZSkpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZGVmYXVsdCB7IGFyY2dpc1RvR2VvSlNPTiwgZ2VvanNvblRvQXJjR0lTIH07XG4iLCJpbXBvcnQgeyBsYXRMbmcsIGxhdExuZ0JvdW5kcywgTGF0TG5nLCBMYXRMbmdCb3VuZHMsIFV0aWwsIERvbVV0aWwsIEdlb0pTT04gfSBmcm9tICdsZWFmbGV0JztcclxuaW1wb3J0IHsganNvbnAgfSBmcm9tICcuL1JlcXVlc3QnO1xyXG5pbXBvcnQgeyBvcHRpb25zIH0gZnJvbSAnLi9PcHRpb25zJztcclxuXHJcbmltcG9ydCB7XHJcbiAgZ2VvanNvblRvQXJjR0lTIGFzIGcyYSxcclxuICBhcmNnaXNUb0dlb0pTT04gYXMgYTJnXHJcbn0gZnJvbSAnYXJjZ2lzLXRvLWdlb2pzb24tdXRpbHMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlb2pzb25Ub0FyY0dJUyAoZ2VvanNvbiwgaWRBdHRyKSB7XHJcbiAgcmV0dXJuIGcyYShnZW9qc29uLCBpZEF0dHIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXJjZ2lzVG9HZW9KU09OIChhcmNnaXMsIGlkQXR0cikge1xyXG4gIHJldHVybiBhMmcoYXJjZ2lzLCBpZEF0dHIpO1xyXG59XHJcblxyXG4vLyBzaGFsbG93IG9iamVjdCBjbG9uZSBmb3IgZmVhdHVyZSBwcm9wZXJ0aWVzIGFuZCBhdHRyaWJ1dGVzXHJcbi8vIGZyb20gaHR0cDovL2pzcGVyZi5jb20vY2xvbmluZy1hbi1vYmplY3QvMlxyXG5leHBvcnQgZnVuY3Rpb24gc2hhbGxvd0Nsb25lIChvYmopIHtcclxuICB2YXIgdGFyZ2V0ID0ge307XHJcbiAgZm9yICh2YXIgaSBpbiBvYmopIHtcclxuICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaSkpIHtcclxuICAgICAgdGFyZ2V0W2ldID0gb2JqW2ldO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gdGFyZ2V0O1xyXG59XHJcblxyXG4vLyBjb252ZXJ0IGFuIGV4dGVudCAoQXJjR0lTKSB0byBMYXRMbmdCb3VuZHMgKExlYWZsZXQpXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRlbnRUb0JvdW5kcyAoZXh0ZW50KSB7XHJcbiAgLy8gXCJOYU5cIiBjb29yZGluYXRlcyBmcm9tIEFyY0dJUyBTZXJ2ZXIgaW5kaWNhdGUgYSBudWxsIGdlb21ldHJ5XHJcbiAgaWYgKGV4dGVudC54bWluICE9PSAnTmFOJyAmJiBleHRlbnQueW1pbiAhPT0gJ05hTicgJiYgZXh0ZW50LnhtYXggIT09ICdOYU4nICYmIGV4dGVudC55bWF4ICE9PSAnTmFOJykge1xyXG4gICAgdmFyIHN3ID0gbGF0TG5nKGV4dGVudC55bWluLCBleHRlbnQueG1pbik7XHJcbiAgICB2YXIgbmUgPSBsYXRMbmcoZXh0ZW50LnltYXgsIGV4dGVudC54bWF4KTtcclxuICAgIHJldHVybiBsYXRMbmdCb3VuZHMoc3csIG5lKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBjb252ZXJ0IGFuIExhdExuZ0JvdW5kcyAoTGVhZmxldCkgdG8gZXh0ZW50IChBcmNHSVMpXHJcbmV4cG9ydCBmdW5jdGlvbiBib3VuZHNUb0V4dGVudCAoYm91bmRzKSB7XHJcbiAgYm91bmRzID0gbGF0TG5nQm91bmRzKGJvdW5kcyk7XHJcbiAgcmV0dXJuIHtcclxuICAgICd4bWluJzogYm91bmRzLmdldFNvdXRoV2VzdCgpLmxuZyxcclxuICAgICd5bWluJzogYm91bmRzLmdldFNvdXRoV2VzdCgpLmxhdCxcclxuICAgICd4bWF4JzogYm91bmRzLmdldE5vcnRoRWFzdCgpLmxuZyxcclxuICAgICd5bWF4JzogYm91bmRzLmdldE5vcnRoRWFzdCgpLmxhdCxcclxuICAgICdzcGF0aWFsUmVmZXJlbmNlJzoge1xyXG4gICAgICAnd2tpZCc6IDQzMjZcclxuICAgIH1cclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVzcG9uc2VUb0ZlYXR1cmVDb2xsZWN0aW9uIChyZXNwb25zZSwgaWRBdHRyaWJ1dGUpIHtcclxuICB2YXIgb2JqZWN0SWRGaWVsZDtcclxuICB2YXIgZmVhdHVyZXMgPSByZXNwb25zZS5mZWF0dXJlcyB8fCByZXNwb25zZS5yZXN1bHRzO1xyXG4gIHZhciBjb3VudCA9IGZlYXR1cmVzLmxlbmd0aDtcclxuXHJcbiAgaWYgKGlkQXR0cmlidXRlKSB7XHJcbiAgICBvYmplY3RJZEZpZWxkID0gaWRBdHRyaWJ1dGU7XHJcbiAgfSBlbHNlIGlmIChyZXNwb25zZS5vYmplY3RJZEZpZWxkTmFtZSkge1xyXG4gICAgb2JqZWN0SWRGaWVsZCA9IHJlc3BvbnNlLm9iamVjdElkRmllbGROYW1lO1xyXG4gIH0gZWxzZSBpZiAocmVzcG9uc2UuZmllbGRzKSB7XHJcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8PSByZXNwb25zZS5maWVsZHMubGVuZ3RoIC0gMTsgaisrKSB7XHJcbiAgICAgIGlmIChyZXNwb25zZS5maWVsZHNbal0udHlwZSA9PT0gJ2VzcmlGaWVsZFR5cGVPSUQnKSB7XHJcbiAgICAgICAgb2JqZWN0SWRGaWVsZCA9IHJlc3BvbnNlLmZpZWxkc1tqXS5uYW1lO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmIChjb3VudCkge1xyXG4gICAgLyogYXMgYSBsYXN0IHJlc29ydCwgY2hlY2sgZm9yIGNvbW1vbiBJRCBmaWVsZG5hbWVzIGluIHRoZSBmaXJzdCBmZWF0dXJlIHJldHVybmVkXHJcbiAgICBub3QgZm9vbHByb29mLiBpZGVudGlmeUZlYXR1cmVzIGNhbiByZXR1cm5lZCBhIG1peGVkIGFycmF5IG9mIGZlYXR1cmVzLiAqL1xyXG4gICAgZm9yICh2YXIga2V5IGluIGZlYXR1cmVzWzBdLmF0dHJpYnV0ZXMpIHtcclxuICAgICAgaWYgKGtleS5tYXRjaCgvXihPQkpFQ1RJRHxGSUR8T0lEfElEKSQvaSkpIHtcclxuICAgICAgICBvYmplY3RJZEZpZWxkID0ga2V5O1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgZmVhdHVyZUNvbGxlY3Rpb24gPSB7XHJcbiAgICB0eXBlOiAnRmVhdHVyZUNvbGxlY3Rpb24nLFxyXG4gICAgZmVhdHVyZXM6IFtdXHJcbiAgfTtcclxuXHJcbiAgaWYgKGNvdW50KSB7XHJcbiAgICBmb3IgKHZhciBpID0gZmVhdHVyZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgdmFyIGZlYXR1cmUgPSBhcmNnaXNUb0dlb0pTT04oZmVhdHVyZXNbaV0sIG9iamVjdElkRmllbGQpO1xyXG4gICAgICBmZWF0dXJlQ29sbGVjdGlvbi5mZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGZlYXR1cmVDb2xsZWN0aW9uO1xyXG59XHJcblxyXG4gIC8vIHRyaW0gdXJsIHdoaXRlc3BhY2UgYW5kIGFkZCBhIHRyYWlsaW5nIHNsYXNoIGlmIG5lZWRlZFxyXG5leHBvcnQgZnVuY3Rpb24gY2xlYW5VcmwgKHVybCkge1xyXG4gIC8vIHRyaW0gbGVhZGluZyBhbmQgdHJhaWxpbmcgc3BhY2VzLCBidXQgbm90IHNwYWNlcyBpbnNpZGUgdGhlIHVybFxyXG4gIHVybCA9IFV0aWwudHJpbSh1cmwpO1xyXG5cclxuICAvLyBhZGQgYSB0cmFpbGluZyBzbGFzaCB0byB0aGUgdXJsIGlmIHRoZSB1c2VyIG9taXR0ZWQgaXRcclxuICBpZiAodXJsW3VybC5sZW5ndGggLSAxXSAhPT0gJy8nKSB7XHJcbiAgICB1cmwgKz0gJy8nO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHVybDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQXJjZ2lzT25saW5lICh1cmwpIHtcclxuICAvKiBob3N0ZWQgZmVhdHVyZSBzZXJ2aWNlcyBzdXBwb3J0IGdlb2pzb24gYXMgYW4gb3V0cHV0IGZvcm1hdFxyXG4gIHV0aWxpdHkuYXJjZ2lzLmNvbSBzZXJ2aWNlcyBhcmUgcHJveGllZCBmcm9tIGEgdmFyaWV0eSBvZiBBcmNHSVMgU2VydmVyIHZpbnRhZ2VzLCBhbmQgbWF5IG5vdCAqL1xyXG4gIHJldHVybiAoL14oPyEuKnV0aWxpdHlcXC5hcmNnaXNcXC5jb20pLipcXC5hcmNnaXNcXC5jb20uKkZlYXR1cmVTZXJ2ZXIvaSkudGVzdCh1cmwpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VvanNvblR5cGVUb0FyY0dJUyAoZ2VvSnNvblR5cGUpIHtcclxuICB2YXIgYXJjZ2lzR2VvbWV0cnlUeXBlO1xyXG4gIHN3aXRjaCAoZ2VvSnNvblR5cGUpIHtcclxuICAgIGNhc2UgJ1BvaW50JzpcclxuICAgICAgYXJjZ2lzR2VvbWV0cnlUeXBlID0gJ2VzcmlHZW9tZXRyeVBvaW50JztcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdNdWx0aVBvaW50JzpcclxuICAgICAgYXJjZ2lzR2VvbWV0cnlUeXBlID0gJ2VzcmlHZW9tZXRyeU11bHRpcG9pbnQnO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ0xpbmVTdHJpbmcnOlxyXG4gICAgICBhcmNnaXNHZW9tZXRyeVR5cGUgPSAnZXNyaUdlb21ldHJ5UG9seWxpbmUnO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ011bHRpTGluZVN0cmluZyc6XHJcbiAgICAgIGFyY2dpc0dlb21ldHJ5VHlwZSA9ICdlc3JpR2VvbWV0cnlQb2x5bGluZSc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAnUG9seWdvbic6XHJcbiAgICAgIGFyY2dpc0dlb21ldHJ5VHlwZSA9ICdlc3JpR2VvbWV0cnlQb2x5Z29uJztcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdNdWx0aVBvbHlnb24nOlxyXG4gICAgICBhcmNnaXNHZW9tZXRyeVR5cGUgPSAnZXNyaUdlb21ldHJ5UG9seWdvbic7XHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGFyY2dpc0dlb21ldHJ5VHlwZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHdhcm4gKCkge1xyXG4gIGlmIChjb25zb2xlICYmIGNvbnNvbGUud2Fybikge1xyXG4gICAgY29uc29sZS53YXJuLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2FsY0F0dHJpYnV0aW9uV2lkdGggKG1hcCkge1xyXG4gIC8vIGVpdGhlciBjcm9wIGF0IDU1cHggb3IgdXNlciBkZWZpbmVkIGJ1ZmZlclxyXG4gIHJldHVybiAobWFwLmdldFNpemUoKS54IC0gb3B0aW9ucy5hdHRyaWJ1dGlvbldpZHRoT2Zmc2V0KSArICdweCc7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRFc3JpQXR0cmlidXRpb24gKG1hcCkge1xyXG4gIGlmIChtYXAuYXR0cmlidXRpb25Db250cm9sICYmICFtYXAuYXR0cmlidXRpb25Db250cm9sLl9lc3JpQXR0cmlidXRpb25BZGRlZCkge1xyXG4gICAgbWFwLmF0dHJpYnV0aW9uQ29udHJvbC5zZXRQcmVmaXgoJzxhIGhyZWY9XCJodHRwOi8vbGVhZmxldGpzLmNvbVwiIHRpdGxlPVwiQSBKUyBsaWJyYXJ5IGZvciBpbnRlcmFjdGl2ZSBtYXBzXCI+TGVhZmxldDwvYT4gfCBQb3dlcmVkIGJ5IDxhIGhyZWY9XCJodHRwczovL3d3dy5lc3JpLmNvbVwiPkVzcmk8L2E+Jyk7XHJcblxyXG4gICAgdmFyIGhvdmVyQXR0cmlidXRpb25TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICBob3ZlckF0dHJpYnV0aW9uU3R5bGUudHlwZSA9ICd0ZXh0L2Nzcyc7XHJcbiAgICBob3ZlckF0dHJpYnV0aW9uU3R5bGUuaW5uZXJIVE1MID0gJy5lc3JpLXRydW5jYXRlZC1hdHRyaWJ1dGlvbjpob3ZlciB7JyArXHJcbiAgICAgICd3aGl0ZS1zcGFjZTogbm9ybWFsOycgK1xyXG4gICAgJ30nO1xyXG5cclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoaG92ZXJBdHRyaWJ1dGlvblN0eWxlKTtcclxuICAgIERvbVV0aWwuYWRkQ2xhc3MobWFwLmF0dHJpYnV0aW9uQ29udHJvbC5fY29udGFpbmVyLCAnZXNyaS10cnVuY2F0ZWQtYXR0cmlidXRpb246aG92ZXInKTtcclxuXHJcbiAgICAvLyBkZWZpbmUgYSBuZXcgY3NzIGNsYXNzIGluIEpTIHRvIHRyaW0gYXR0cmlidXRpb24gaW50byBhIHNpbmdsZSBsaW5lXHJcbiAgICB2YXIgYXR0cmlidXRpb25TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICBhdHRyaWJ1dGlvblN0eWxlLnR5cGUgPSAndGV4dC9jc3MnO1xyXG4gICAgYXR0cmlidXRpb25TdHlsZS5pbm5lckhUTUwgPSAnLmVzcmktdHJ1bmNhdGVkLWF0dHJpYnV0aW9uIHsnICtcclxuICAgICAgJ3ZlcnRpY2FsLWFsaWduOiAtM3B4OycgK1xyXG4gICAgICAnd2hpdGUtc3BhY2U6IG5vd3JhcDsnICtcclxuICAgICAgJ292ZXJmbG93OiBoaWRkZW47JyArXHJcbiAgICAgICd0ZXh0LW92ZXJmbG93OiBlbGxpcHNpczsnICtcclxuICAgICAgJ2Rpc3BsYXk6IGlubGluZS1ibG9jazsnICtcclxuICAgICAgJ3RyYW5zaXRpb246IDBzIHdoaXRlLXNwYWNlOycgK1xyXG4gICAgICAndHJhbnNpdGlvbi1kZWxheTogMXM7JyArXHJcbiAgICAgICdtYXgtd2lkdGg6ICcgKyBjYWxjQXR0cmlidXRpb25XaWR0aChtYXApICsgJzsnICtcclxuICAgICd9JztcclxuXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGF0dHJpYnV0aW9uU3R5bGUpO1xyXG4gICAgRG9tVXRpbC5hZGRDbGFzcyhtYXAuYXR0cmlidXRpb25Db250cm9sLl9jb250YWluZXIsICdlc3JpLXRydW5jYXRlZC1hdHRyaWJ1dGlvbicpO1xyXG5cclxuICAgIC8vIHVwZGF0ZSB0aGUgd2lkdGggdXNlZCB0byB0cnVuY2F0ZSB3aGVuIHRoZSBtYXAgaXRzZWxmIGlzIHJlc2l6ZWRcclxuICAgIG1hcC5vbigncmVzaXplJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgbWFwLmF0dHJpYnV0aW9uQ29udHJvbC5fY29udGFpbmVyLnN0eWxlLm1heFdpZHRoID0gY2FsY0F0dHJpYnV0aW9uV2lkdGgoZS50YXJnZXQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgbWFwLmF0dHJpYnV0aW9uQ29udHJvbC5fZXNyaUF0dHJpYnV0aW9uQWRkZWQgPSB0cnVlO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9zZXRHZW9tZXRyeSAoZ2VvbWV0cnkpIHtcclxuICB2YXIgcGFyYW1zID0ge1xyXG4gICAgZ2VvbWV0cnk6IG51bGwsXHJcbiAgICBnZW9tZXRyeVR5cGU6IG51bGxcclxuICB9O1xyXG5cclxuICAvLyBjb252ZXJ0IGJvdW5kcyB0byBleHRlbnQgYW5kIGZpbmlzaFxyXG4gIGlmIChnZW9tZXRyeSBpbnN0YW5jZW9mIExhdExuZ0JvdW5kcykge1xyXG4gICAgLy8gc2V0IGdlb21ldHJ5ICsgZ2VvbWV0cnlUeXBlXHJcbiAgICBwYXJhbXMuZ2VvbWV0cnkgPSBib3VuZHNUb0V4dGVudChnZW9tZXRyeSk7XHJcbiAgICBwYXJhbXMuZ2VvbWV0cnlUeXBlID0gJ2VzcmlHZW9tZXRyeUVudmVsb3BlJztcclxuICAgIHJldHVybiBwYXJhbXM7XHJcbiAgfVxyXG5cclxuICAvLyBjb252ZXJ0IEwuTWFya2VyID4gTC5MYXRMbmdcclxuICBpZiAoZ2VvbWV0cnkuZ2V0TGF0TG5nKSB7XHJcbiAgICBnZW9tZXRyeSA9IGdlb21ldHJ5LmdldExhdExuZygpO1xyXG4gIH1cclxuXHJcbiAgLy8gY29udmVydCBMLkxhdExuZyB0byBhIGdlb2pzb24gcG9pbnQgYW5kIGNvbnRpbnVlO1xyXG4gIGlmIChnZW9tZXRyeSBpbnN0YW5jZW9mIExhdExuZykge1xyXG4gICAgZ2VvbWV0cnkgPSB7XHJcbiAgICAgIHR5cGU6ICdQb2ludCcsXHJcbiAgICAgIGNvb3JkaW5hdGVzOiBbZ2VvbWV0cnkubG5nLCBnZW9tZXRyeS5sYXRdXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gaGFuZGxlIEwuR2VvSlNPTiwgcHVsbCBvdXQgdGhlIGZpcnN0IGdlb21ldHJ5XHJcbiAgaWYgKGdlb21ldHJ5IGluc3RhbmNlb2YgR2VvSlNPTikge1xyXG4gICAgLy8gcmVhc3NpZ24gZ2VvbWV0cnkgdG8gdGhlIEdlb0pTT04gdmFsdWUgICh3ZSBhcmUgYXNzdW1pbmcgdGhhdCBvbmx5IG9uZSBmZWF0dXJlIGlzIHByZXNlbnQpXHJcbiAgICBnZW9tZXRyeSA9IGdlb21ldHJ5LmdldExheWVycygpWzBdLmZlYXR1cmUuZ2VvbWV0cnk7XHJcbiAgICBwYXJhbXMuZ2VvbWV0cnkgPSBnZW9qc29uVG9BcmNHSVMoZ2VvbWV0cnkpO1xyXG4gICAgcGFyYW1zLmdlb21ldHJ5VHlwZSA9IGdlb2pzb25UeXBlVG9BcmNHSVMoZ2VvbWV0cnkudHlwZSk7XHJcbiAgfVxyXG5cclxuICAvLyBIYW5kbGUgTC5Qb2x5bGluZSBhbmQgTC5Qb2x5Z29uXHJcbiAgaWYgKGdlb21ldHJ5LnRvR2VvSlNPTikge1xyXG4gICAgZ2VvbWV0cnkgPSBnZW9tZXRyeS50b0dlb0pTT04oKTtcclxuICB9XHJcblxyXG4gIC8vIGhhbmRsZSBHZW9KU09OIGZlYXR1cmUgYnkgcHVsbGluZyBvdXQgdGhlIGdlb21ldHJ5XHJcbiAgaWYgKGdlb21ldHJ5LnR5cGUgPT09ICdGZWF0dXJlJykge1xyXG4gICAgLy8gZ2V0IHRoZSBnZW9tZXRyeSBvZiB0aGUgZ2VvanNvbiBmZWF0dXJlXHJcbiAgICBnZW9tZXRyeSA9IGdlb21ldHJ5Lmdlb21ldHJ5O1xyXG4gIH1cclxuXHJcbiAgLy8gY29uZmlybSB0aGF0IG91ciBHZW9KU09OIGlzIGEgcG9pbnQsIGxpbmUgb3IgcG9seWdvblxyXG4gIGlmIChnZW9tZXRyeS50eXBlID09PSAnUG9pbnQnIHx8IGdlb21ldHJ5LnR5cGUgPT09ICdMaW5lU3RyaW5nJyB8fCBnZW9tZXRyeS50eXBlID09PSAnUG9seWdvbicgfHwgZ2VvbWV0cnkudHlwZSA9PT0gJ011bHRpUG9seWdvbicpIHtcclxuICAgIHBhcmFtcy5nZW9tZXRyeSA9IGdlb2pzb25Ub0FyY0dJUyhnZW9tZXRyeSk7XHJcbiAgICBwYXJhbXMuZ2VvbWV0cnlUeXBlID0gZ2VvanNvblR5cGVUb0FyY0dJUyhnZW9tZXRyeS50eXBlKTtcclxuICAgIHJldHVybiBwYXJhbXM7XHJcbiAgfVxyXG5cclxuICAvLyB3YXJuIHRoZSB1c2VyIGlmIHdlIGhhdm4ndCBmb3VuZCBhbiBhcHByb3ByaWF0ZSBvYmplY3RcclxuICB3YXJuKCdpbnZhbGlkIGdlb21ldHJ5IHBhc3NlZCB0byBzcGF0aWFsIHF1ZXJ5LiBTaG91bGQgYmUgTC5MYXRMbmcsIEwuTGF0TG5nQm91bmRzLCBMLk1hcmtlciBvciBhIEdlb0pTT04gUG9pbnQsIExpbmUsIFBvbHlnb24gb3IgTXVsdGlQb2x5Z29uIG9iamVjdCcpO1xyXG5cclxuICByZXR1cm47XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfZ2V0QXR0cmlidXRpb25EYXRhICh1cmwsIG1hcCkge1xyXG4gIGpzb25wKHVybCwge30sIFV0aWwuYmluZChmdW5jdGlvbiAoZXJyb3IsIGF0dHJpYnV0aW9ucykge1xyXG4gICAgaWYgKGVycm9yKSB7IHJldHVybjsgfVxyXG4gICAgbWFwLl9lc3JpQXR0cmlidXRpb25zID0gW107XHJcbiAgICBmb3IgKHZhciBjID0gMDsgYyA8IGF0dHJpYnV0aW9ucy5jb250cmlidXRvcnMubGVuZ3RoOyBjKyspIHtcclxuICAgICAgdmFyIGNvbnRyaWJ1dG9yID0gYXR0cmlidXRpb25zLmNvbnRyaWJ1dG9yc1tjXTtcclxuXHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udHJpYnV0b3IuY292ZXJhZ2VBcmVhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBjb3ZlcmFnZUFyZWEgPSBjb250cmlidXRvci5jb3ZlcmFnZUFyZWFzW2ldO1xyXG4gICAgICAgIHZhciBzb3V0aFdlc3QgPSBsYXRMbmcoY292ZXJhZ2VBcmVhLmJib3hbMF0sIGNvdmVyYWdlQXJlYS5iYm94WzFdKTtcclxuICAgICAgICB2YXIgbm9ydGhFYXN0ID0gbGF0TG5nKGNvdmVyYWdlQXJlYS5iYm94WzJdLCBjb3ZlcmFnZUFyZWEuYmJveFszXSk7XHJcbiAgICAgICAgbWFwLl9lc3JpQXR0cmlidXRpb25zLnB1c2goe1xyXG4gICAgICAgICAgYXR0cmlidXRpb246IGNvbnRyaWJ1dG9yLmF0dHJpYnV0aW9uLFxyXG4gICAgICAgICAgc2NvcmU6IGNvdmVyYWdlQXJlYS5zY29yZSxcclxuICAgICAgICAgIGJvdW5kczogbGF0TG5nQm91bmRzKHNvdXRoV2VzdCwgbm9ydGhFYXN0KSxcclxuICAgICAgICAgIG1pblpvb206IGNvdmVyYWdlQXJlYS56b29tTWluLFxyXG4gICAgICAgICAgbWF4Wm9vbTogY292ZXJhZ2VBcmVhLnpvb21NYXhcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1hcC5fZXNyaUF0dHJpYnV0aW9ucy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgIHJldHVybiBiLnNjb3JlIC0gYS5zY29yZTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIHBhc3MgdGhlIHNhbWUgYXJndW1lbnQgYXMgdGhlIG1hcCdzICdtb3ZlZW5kJyBldmVudFxyXG4gICAgdmFyIG9iaiA9IHsgdGFyZ2V0OiBtYXAgfTtcclxuICAgIF91cGRhdGVNYXBBdHRyaWJ1dGlvbihvYmopO1xyXG4gIH0sIHRoaXMpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF91cGRhdGVNYXBBdHRyaWJ1dGlvbiAoZXZ0KSB7XHJcbiAgdmFyIG1hcCA9IGV2dC50YXJnZXQ7XHJcbiAgdmFyIG9sZEF0dHJpYnV0aW9ucyA9IG1hcC5fZXNyaUF0dHJpYnV0aW9ucztcclxuXHJcbiAgaWYgKG1hcCAmJiBtYXAuYXR0cmlidXRpb25Db250cm9sICYmIG9sZEF0dHJpYnV0aW9ucykge1xyXG4gICAgdmFyIG5ld0F0dHJpYnV0aW9ucyA9ICcnO1xyXG4gICAgdmFyIGJvdW5kcyA9IG1hcC5nZXRCb3VuZHMoKTtcclxuICAgIHZhciB3cmFwcGVkQm91bmRzID0gbGF0TG5nQm91bmRzKFxyXG4gICAgICBib3VuZHMuZ2V0U291dGhXZXN0KCkud3JhcCgpLFxyXG4gICAgICBib3VuZHMuZ2V0Tm9ydGhFYXN0KCkud3JhcCgpXHJcbiAgICApO1xyXG4gICAgdmFyIHpvb20gPSBtYXAuZ2V0Wm9vbSgpO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2xkQXR0cmlidXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBhdHRyaWJ1dGlvbiA9IG9sZEF0dHJpYnV0aW9uc1tpXTtcclxuICAgICAgdmFyIHRleHQgPSBhdHRyaWJ1dGlvbi5hdHRyaWJ1dGlvbjtcclxuXHJcbiAgICAgIGlmICghbmV3QXR0cmlidXRpb25zLm1hdGNoKHRleHQpICYmIGF0dHJpYnV0aW9uLmJvdW5kcy5pbnRlcnNlY3RzKHdyYXBwZWRCb3VuZHMpICYmIHpvb20gPj0gYXR0cmlidXRpb24ubWluWm9vbSAmJiB6b29tIDw9IGF0dHJpYnV0aW9uLm1heFpvb20pIHtcclxuICAgICAgICBuZXdBdHRyaWJ1dGlvbnMgKz0gKCcsICcgKyB0ZXh0KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG5ld0F0dHJpYnV0aW9ucyA9IG5ld0F0dHJpYnV0aW9ucy5zdWJzdHIoMik7XHJcbiAgICB2YXIgYXR0cmlidXRpb25FbGVtZW50ID0gbWFwLmF0dHJpYnV0aW9uQ29udHJvbC5fY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5lc3JpLWR5bmFtaWMtYXR0cmlidXRpb24nKTtcclxuXHJcbiAgICBhdHRyaWJ1dGlvbkVsZW1lbnQuaW5uZXJIVE1MID0gbmV3QXR0cmlidXRpb25zO1xyXG4gICAgYXR0cmlidXRpb25FbGVtZW50LnN0eWxlLm1heFdpZHRoID0gY2FsY0F0dHJpYnV0aW9uV2lkdGgobWFwKTtcclxuXHJcbiAgICBtYXAuZmlyZSgnYXR0cmlidXRpb251cGRhdGVkJywge1xyXG4gICAgICBhdHRyaWJ1dGlvbjogbmV3QXR0cmlidXRpb25zXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgRXNyaVV0aWwgPSB7XHJcbiAgc2hhbGxvd0Nsb25lOiBzaGFsbG93Q2xvbmUsXHJcbiAgd2Fybjogd2FybixcclxuICBjbGVhblVybDogY2xlYW5VcmwsXHJcbiAgaXNBcmNnaXNPbmxpbmU6IGlzQXJjZ2lzT25saW5lLFxyXG4gIGdlb2pzb25UeXBlVG9BcmNHSVM6IGdlb2pzb25UeXBlVG9BcmNHSVMsXHJcbiAgcmVzcG9uc2VUb0ZlYXR1cmVDb2xsZWN0aW9uOiByZXNwb25zZVRvRmVhdHVyZUNvbGxlY3Rpb24sXHJcbiAgZ2VvanNvblRvQXJjR0lTOiBnZW9qc29uVG9BcmNHSVMsXHJcbiAgYXJjZ2lzVG9HZW9KU09OOiBhcmNnaXNUb0dlb0pTT04sXHJcbiAgYm91bmRzVG9FeHRlbnQ6IGJvdW5kc1RvRXh0ZW50LFxyXG4gIGV4dGVudFRvQm91bmRzOiBleHRlbnRUb0JvdW5kcyxcclxuICBjYWxjQXR0cmlidXRpb25XaWR0aDogY2FsY0F0dHJpYnV0aW9uV2lkdGgsXHJcbiAgc2V0RXNyaUF0dHJpYnV0aW9uOiBzZXRFc3JpQXR0cmlidXRpb24sXHJcbiAgX3NldEdlb21ldHJ5OiBfc2V0R2VvbWV0cnksXHJcbiAgX2dldEF0dHJpYnV0aW9uRGF0YTogX2dldEF0dHJpYnV0aW9uRGF0YSxcclxuICBfdXBkYXRlTWFwQXR0cmlidXRpb246IF91cGRhdGVNYXBBdHRyaWJ1dGlvblxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgRXNyaVV0aWw7XHJcbiIsImltcG9ydCB7IENsYXNzLCBVdGlsIH0gZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCB7Y29yc30gZnJvbSAnLi4vU3VwcG9ydCc7XHJcbmltcG9ydCB7Y2xlYW5Vcmx9IGZyb20gJy4uL1V0aWwnO1xyXG5pbXBvcnQgUmVxdWVzdCBmcm9tICcuLi9SZXF1ZXN0JztcclxuXHJcbmV4cG9ydCB2YXIgVGFzayA9IENsYXNzLmV4dGVuZCh7XHJcblxyXG4gIG9wdGlvbnM6IHtcclxuICAgIHByb3h5OiBmYWxzZSxcclxuICAgIHVzZUNvcnM6IGNvcnNcclxuICB9LFxyXG5cclxuICAvLyBHZW5lcmF0ZSBhIG1ldGhvZCBmb3IgZWFjaCBtZXRob2ROYW1lOnBhcmFtTmFtZSBpbiB0aGUgc2V0dGVycyBmb3IgdGhpcyB0YXNrLlxyXG4gIGdlbmVyYXRlU2V0dGVyOiBmdW5jdGlvbiAocGFyYW0sIGNvbnRleHQpIHtcclxuICAgIHJldHVybiBVdGlsLmJpbmQoZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgIHRoaXMucGFyYW1zW3BhcmFtXSA9IHZhbHVlO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sIGNvbnRleHQpO1xyXG4gIH0sXHJcblxyXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChlbmRwb2ludCkge1xyXG4gICAgY29uc29sZS5sb2coJ2luaXRpYWxpemluZyB3aXRoIGVuZHBvaW50JywgZW5kcG9pbnQpO1xyXG5cclxuICAgIC8vIGVuZHBvaW50IGNhbiBiZSBlaXRoZXIgYSB1cmwgKGFuZCBvcHRpb25zKSBmb3IgYW4gQXJjR0lTIFJlc3QgU2VydmljZSBvciBhbiBpbnN0YW5jZSBvZiBFc3JpTGVhZmxldC5TZXJ2aWNlXHJcbiAgICBpZiAoZW5kcG9pbnQucmVxdWVzdCAmJiBlbmRwb2ludC5vcHRpb25zKSB7XHJcbiAgICAgIHRoaXMuX3NlcnZpY2UgPSBlbmRwb2ludDtcclxuICAgICAgVXRpbC5zZXRPcHRpb25zKHRoaXMsIGVuZHBvaW50Lm9wdGlvbnMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgVXRpbC5zZXRPcHRpb25zKHRoaXMsIGVuZHBvaW50KTtcclxuICAgICAgdGhpcy5vcHRpb25zLnVybCA9IGNsZWFuVXJsKGVuZHBvaW50LnVybCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2xvbmUgZGVmYXVsdCBwYXJhbXMgaW50byB0aGlzIG9iamVjdFxyXG4gICAgdGhpcy5wYXJhbXMgPSBVdGlsLmV4dGVuZCh7fSwgdGhpcy5wYXJhbXMgfHwge30pO1xyXG5cclxuICAgIC8vIGdlbmVyYXRlIHNldHRlciBtZXRob2RzIGJhc2VkIG9uIHRoZSBzZXR0ZXJzIG9iamVjdCBpbXBsaW1lbnRlZCBhIGNoaWxkIGNsYXNzXHJcbiAgICBpZiAodGhpcy5zZXR0ZXJzKSB7XHJcbiAgICAgIGZvciAodmFyIHNldHRlciBpbiB0aGlzLnNldHRlcnMpIHtcclxuICAgICAgICB2YXIgcGFyYW0gPSB0aGlzLnNldHRlcnNbc2V0dGVyXTtcclxuICAgICAgICB0aGlzW3NldHRlcl0gPSB0aGlzLmdlbmVyYXRlU2V0dGVyKHBhcmFtLCB0aGlzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdpbml0aWFsaXplJywgdGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgdG9rZW46IGZ1bmN0aW9uICh0b2tlbikge1xyXG4gICAgaWYgKHRoaXMuX3NlcnZpY2UpIHtcclxuICAgICAgdGhpcy5fc2VydmljZS5hdXRoZW50aWNhdGUodG9rZW4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5wYXJhbXMudG9rZW4gPSB0b2tlbjtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIC8vIEFyY0dJUyBTZXJ2ZXIgRmluZC9JZGVudGlmeSAxMC41K1xyXG4gIGZvcm1hdDogZnVuY3Rpb24gKGJvb2xlYW4pIHtcclxuICAgIC8vIHVzZSBkb3VibGUgbmVnYXRpdmUgdG8gZXhwb3NlIGEgbW9yZSBpbnR1aXRpdmUgcG9zaXRpdmUgbWV0aG9kIG5hbWVcclxuICAgIHRoaXMucGFyYW1zLnJldHVyblVuZm9ybWF0dGVkVmFsdWVzID0gIWJvb2xlYW47XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICByZXF1ZXN0OiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIGNvbnNvbGUubG9nKCdyZXF1ZXN0IGNhbGxiYWNrJywgY2FsbGJhY2spO1xyXG4gICAgY29uc29sZS5sb2coJ3JlcXVlc3QgY29udGV4dCcsIGNhbGxiYWNrKTtcclxuICAgIGNvbnNvbGUubG9nKCdyZXF1ZXN0IHRoaXMnLCB0aGlzKTtcclxuICAgIGlmICh0aGlzLl9zZXJ2aWNlKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdoYXMgc2VydmljZScsIHRoaXMuX3NlcnZpY2UpO1xyXG4gICAgICByZXR1cm4gdGhpcy5fc2VydmljZS5yZXF1ZXN0KHRoaXMucGF0aCwgdGhpcy5wYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmxvZygnbm8gc2VydmljZScpO1xyXG4gICAgcmV0dXJuIHRoaXMuX3JlcXVlc3QoJ3JlcXVlc3QnLCB0aGlzLnBhdGgsIHRoaXMucGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCk7XHJcbiAgfSxcclxuXHJcbiAgX3JlcXVlc3Q6IGZ1bmN0aW9uIChtZXRob2QsIHBhdGgsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIGNvbnNvbGUubG9nKCd1c2luZyBpbnRlcm5hbCByZXF1ZXN0IScpO1xyXG4gICAgdmFyIHVybCA9ICh0aGlzLm9wdGlvbnMucHJveHkpID8gdGhpcy5vcHRpb25zLnByb3h5ICsgJz8nICsgdGhpcy5vcHRpb25zLnVybCArIHBhdGggOiB0aGlzLm9wdGlvbnMudXJsICsgcGF0aDtcclxuXHJcbiAgICBjb25zb2xlLmxvZygndGhpcyBpcyB0aGUgdXJsIScsIHVybCk7XHJcblxyXG4gICAgaWYgKChtZXRob2QgPT09ICdnZXQnIHx8IG1ldGhvZCA9PT0gJ3JlcXVlc3QnKSAmJiAhdGhpcy5vcHRpb25zLnVzZUNvcnMpIHtcclxuICAgICAgcmV0dXJuIFJlcXVlc3QuZ2V0LkpTT05QKHVybCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFJlcXVlc3RbbWV0aG9kXSh1cmwsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHQpO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGFzayAob3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgVGFzayhvcHRpb25zKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgdGFzaztcclxuIiwiaW1wb3J0IHsgcG9pbnQsIGxhdExuZyB9IGZyb20gJ2xlYWZsZXQnO1xyXG5pbXBvcnQgeyBUYXNrIH0gZnJvbSAnLi9UYXNrJztcclxuaW1wb3J0IHtcclxuICB3YXJuLFxyXG4gIHJlc3BvbnNlVG9GZWF0dXJlQ29sbGVjdGlvbixcclxuICBpc0FyY2dpc09ubGluZSxcclxuICBleHRlbnRUb0JvdW5kcyxcclxuICBfc2V0R2VvbWV0cnlcclxufSBmcm9tICcuLi9VdGlsJztcclxuXHJcbmV4cG9ydCB2YXIgUXVlcnkgPSBUYXNrLmV4dGVuZCh7XHJcbiAgc2V0dGVyczoge1xyXG4gICAgJ29mZnNldCc6ICdyZXN1bHRPZmZzZXQnLFxyXG4gICAgJ2xpbWl0JzogJ3Jlc3VsdFJlY29yZENvdW50JyxcclxuICAgICdmaWVsZHMnOiAnb3V0RmllbGRzJyxcclxuICAgICdwcmVjaXNpb24nOiAnZ2VvbWV0cnlQcmVjaXNpb24nLFxyXG4gICAgJ2ZlYXR1cmVJZHMnOiAnb2JqZWN0SWRzJyxcclxuICAgICdyZXR1cm5HZW9tZXRyeSc6ICdyZXR1cm5HZW9tZXRyeScsXHJcbiAgICAncmV0dXJuTSc6ICdyZXR1cm5NJyxcclxuICAgICd0cmFuc2Zvcm0nOiAnZGF0dW1UcmFuc2Zvcm1hdGlvbicsXHJcbiAgICAndG9rZW4nOiAndG9rZW4nXHJcbiAgfSxcclxuXHJcbiAgcGF0aDogJ3F1ZXJ5JyxcclxuXHJcbiAgcGFyYW1zOiB7XHJcbiAgICByZXR1cm5HZW9tZXRyeTogdHJ1ZSxcclxuICAgIHdoZXJlOiAnMT0xJyxcclxuICAgIG91dFNyOiA0MzI2LFxyXG4gICAgb3V0RmllbGRzOiAnKidcclxuICB9LFxyXG5cclxuICAvLyBSZXR1cm5zIGEgZmVhdHVyZSBpZiBpdHMgc2hhcGUgaXMgd2hvbGx5IGNvbnRhaW5lZCB3aXRoaW4gdGhlIHNlYXJjaCBnZW9tZXRyeS4gVmFsaWQgZm9yIGFsbCBzaGFwZSB0eXBlIGNvbWJpbmF0aW9ucy5cclxuICB3aXRoaW46IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xyXG4gICAgdGhpcy5fc2V0R2VvbWV0cnlQYXJhbXMoZ2VvbWV0cnkpO1xyXG4gICAgdGhpcy5wYXJhbXMuc3BhdGlhbFJlbCA9ICdlc3JpU3BhdGlhbFJlbENvbnRhaW5zJzsgLy8gdG8gdGhlIFJFU1QgYXBpIHRoaXMgcmVhZHMgZ2VvbWV0cnkgKipjb250YWlucyoqIGxheWVyXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICAvLyBSZXR1cm5zIGEgZmVhdHVyZSBpZiBhbnkgc3BhdGlhbCByZWxhdGlvbnNoaXAgaXMgZm91bmQuIEFwcGxpZXMgdG8gYWxsIHNoYXBlIHR5cGUgY29tYmluYXRpb25zLlxyXG4gIGludGVyc2VjdHM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xyXG4gICAgdGhpcy5fc2V0R2VvbWV0cnlQYXJhbXMoZ2VvbWV0cnkpO1xyXG4gICAgdGhpcy5wYXJhbXMuc3BhdGlhbFJlbCA9ICdlc3JpU3BhdGlhbFJlbEludGVyc2VjdHMnO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgLy8gUmV0dXJucyBhIGZlYXR1cmUgaWYgaXRzIHNoYXBlIHdob2xseSBjb250YWlucyB0aGUgc2VhcmNoIGdlb21ldHJ5LiBWYWxpZCBmb3IgYWxsIHNoYXBlIHR5cGUgY29tYmluYXRpb25zLlxyXG4gIGNvbnRhaW5zOiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcclxuICAgIHRoaXMuX3NldEdlb21ldHJ5UGFyYW1zKGdlb21ldHJ5KTtcclxuICAgIHRoaXMucGFyYW1zLnNwYXRpYWxSZWwgPSAnZXNyaVNwYXRpYWxSZWxXaXRoaW4nOyAvLyB0byB0aGUgUkVTVCBhcGkgdGhpcyByZWFkcyBnZW9tZXRyeSAqKndpdGhpbioqIGxheWVyXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICAvLyBSZXR1cm5zIGEgZmVhdHVyZSBpZiB0aGUgaW50ZXJzZWN0aW9uIG9mIHRoZSBpbnRlcmlvcnMgb2YgdGhlIHR3byBzaGFwZXMgaXMgbm90IGVtcHR5IGFuZCBoYXMgYSBsb3dlciBkaW1lbnNpb24gdGhhbiB0aGUgbWF4aW11bSBkaW1lbnNpb24gb2YgdGhlIHR3byBzaGFwZXMuIFR3byBsaW5lcyB0aGF0IHNoYXJlIGFuIGVuZHBvaW50IGluIGNvbW1vbiBkbyBub3QgY3Jvc3MuIFZhbGlkIGZvciBMaW5lL0xpbmUsIExpbmUvQXJlYSwgTXVsdGktcG9pbnQvQXJlYSwgYW5kIE11bHRpLXBvaW50L0xpbmUgc2hhcGUgdHlwZSBjb21iaW5hdGlvbnMuXHJcbiAgY3Jvc3NlczogZnVuY3Rpb24gKGdlb21ldHJ5KSB7XHJcbiAgICB0aGlzLl9zZXRHZW9tZXRyeVBhcmFtcyhnZW9tZXRyeSk7XHJcbiAgICB0aGlzLnBhcmFtcy5zcGF0aWFsUmVsID0gJ2VzcmlTcGF0aWFsUmVsQ3Jvc3Nlcyc7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICAvLyBSZXR1cm5zIGEgZmVhdHVyZSBpZiB0aGUgdHdvIHNoYXBlcyBzaGFyZSBhIGNvbW1vbiBib3VuZGFyeS4gSG93ZXZlciwgdGhlIGludGVyc2VjdGlvbiBvZiB0aGUgaW50ZXJpb3JzIG9mIHRoZSB0d28gc2hhcGVzIG11c3QgYmUgZW1wdHkuIEluIHRoZSBQb2ludC9MaW5lIGNhc2UsIHRoZSBwb2ludCBtYXkgdG91Y2ggYW4gZW5kcG9pbnQgb25seSBvZiB0aGUgbGluZS4gQXBwbGllcyB0byBhbGwgY29tYmluYXRpb25zIGV4Y2VwdCBQb2ludC9Qb2ludC5cclxuICB0b3VjaGVzOiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcclxuICAgIHRoaXMuX3NldEdlb21ldHJ5UGFyYW1zKGdlb21ldHJ5KTtcclxuICAgIHRoaXMucGFyYW1zLnNwYXRpYWxSZWwgPSAnZXNyaVNwYXRpYWxSZWxUb3VjaGVzJztcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIC8vIFJldHVybnMgYSBmZWF0dXJlIGlmIHRoZSBpbnRlcnNlY3Rpb24gb2YgdGhlIHR3byBzaGFwZXMgcmVzdWx0cyBpbiBhbiBvYmplY3Qgb2YgdGhlIHNhbWUgZGltZW5zaW9uLCBidXQgZGlmZmVyZW50IGZyb20gYm90aCBvZiB0aGUgc2hhcGVzLiBBcHBsaWVzIHRvIEFyZWEvQXJlYSwgTGluZS9MaW5lLCBhbmQgTXVsdGktcG9pbnQvTXVsdGktcG9pbnQgc2hhcGUgdHlwZSBjb21iaW5hdGlvbnMuXHJcbiAgb3ZlcmxhcHM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xyXG4gICAgdGhpcy5fc2V0R2VvbWV0cnlQYXJhbXMoZ2VvbWV0cnkpO1xyXG4gICAgdGhpcy5wYXJhbXMuc3BhdGlhbFJlbCA9ICdlc3JpU3BhdGlhbFJlbE92ZXJsYXBzJztcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIC8vIFJldHVybnMgYSBmZWF0dXJlIGlmIHRoZSBlbnZlbG9wZSBvZiB0aGUgdHdvIHNoYXBlcyBpbnRlcnNlY3RzLlxyXG4gIGJib3hJbnRlcnNlY3RzOiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcclxuICAgIHRoaXMuX3NldEdlb21ldHJ5UGFyYW1zKGdlb21ldHJ5KTtcclxuICAgIHRoaXMucGFyYW1zLnNwYXRpYWxSZWwgPSAnZXNyaVNwYXRpYWxSZWxFbnZlbG9wZUludGVyc2VjdHMnO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgLy8gaWYgc29tZW9uZSBjYW4gaGVscCBkZWNpcGhlciB0aGUgQXJjT2JqZWN0cyBleHBsYW5hdGlvbiBhbmQgdHJhbnNsYXRlIHRvIHBsYWluIHNwZWFrLCB3ZSBzaG91bGQgbWVudGlvbiB0aGlzIG1ldGhvZCBpbiB0aGUgZG9jXHJcbiAgaW5kZXhJbnRlcnNlY3RzOiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcclxuICAgIHRoaXMuX3NldEdlb21ldHJ5UGFyYW1zKGdlb21ldHJ5KTtcclxuICAgIHRoaXMucGFyYW1zLnNwYXRpYWxSZWwgPSAnZXNyaVNwYXRpYWxSZWxJbmRleEludGVyc2VjdHMnOyAvLyBSZXR1cm5zIGEgZmVhdHVyZSBpZiB0aGUgZW52ZWxvcGUgb2YgdGhlIHF1ZXJ5IGdlb21ldHJ5IGludGVyc2VjdHMgdGhlIGluZGV4IGVudHJ5IGZvciB0aGUgdGFyZ2V0IGdlb21ldHJ5XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICAvLyBvbmx5IHZhbGlkIGZvciBGZWF0dXJlIFNlcnZpY2VzIHJ1bm5pbmcgb24gQXJjR0lTIFNlcnZlciAxMC4zKyBvciBBcmNHSVMgT25saW5lXHJcbiAgbmVhcmJ5OiBmdW5jdGlvbiAobGF0bG5nLCByYWRpdXMpIHtcclxuICAgIGxhdGxuZyA9IGxhdExuZyhsYXRsbmcpO1xyXG4gICAgdGhpcy5wYXJhbXMuZ2VvbWV0cnkgPSBbbGF0bG5nLmxuZywgbGF0bG5nLmxhdF07XHJcbiAgICB0aGlzLnBhcmFtcy5nZW9tZXRyeVR5cGUgPSAnZXNyaUdlb21ldHJ5UG9pbnQnO1xyXG4gICAgdGhpcy5wYXJhbXMuc3BhdGlhbFJlbCA9ICdlc3JpU3BhdGlhbFJlbEludGVyc2VjdHMnO1xyXG4gICAgdGhpcy5wYXJhbXMudW5pdHMgPSAnZXNyaVNSVW5pdF9NZXRlcic7XHJcbiAgICB0aGlzLnBhcmFtcy5kaXN0YW5jZSA9IHJhZGl1cztcclxuICAgIHRoaXMucGFyYW1zLmluU3IgPSA0MzI2O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgd2hlcmU6IGZ1bmN0aW9uIChzdHJpbmcpIHtcclxuICAgIC8vIGluc3RlYWQgb2YgY29udmVydGluZyBkb3VibGUtcXVvdGVzIHRvIHNpbmdsZSBxdW90ZXMsIHBhc3MgYXMgaXMsIGFuZCBwcm92aWRlIGEgbW9yZSBpbmZvcm1hdGl2ZSBtZXNzYWdlIGlmIGEgNDAwIGlzIGVuY291bnRlcmVkXHJcbiAgICB0aGlzLnBhcmFtcy53aGVyZSA9IHN0cmluZztcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGJldHdlZW46IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XHJcbiAgICB0aGlzLnBhcmFtcy50aW1lID0gW3N0YXJ0LnZhbHVlT2YoKSwgZW5kLnZhbHVlT2YoKV07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBzaW1wbGlmeTogZnVuY3Rpb24gKG1hcCwgZmFjdG9yKSB7XHJcbiAgICB2YXIgbWFwV2lkdGggPSBNYXRoLmFicyhtYXAuZ2V0Qm91bmRzKCkuZ2V0V2VzdCgpIC0gbWFwLmdldEJvdW5kcygpLmdldEVhc3QoKSk7XHJcbiAgICB0aGlzLnBhcmFtcy5tYXhBbGxvd2FibGVPZmZzZXQgPSAobWFwV2lkdGggLyBtYXAuZ2V0U2l6ZSgpLnkpICogZmFjdG9yO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgb3JkZXJCeTogZnVuY3Rpb24gKGZpZWxkTmFtZSwgb3JkZXIpIHtcclxuICAgIG9yZGVyID0gb3JkZXIgfHwgJ0FTQyc7XHJcbiAgICB0aGlzLnBhcmFtcy5vcmRlckJ5RmllbGRzID0gKHRoaXMucGFyYW1zLm9yZGVyQnlGaWVsZHMpID8gdGhpcy5wYXJhbXMub3JkZXJCeUZpZWxkcyArICcsJyA6ICcnO1xyXG4gICAgdGhpcy5wYXJhbXMub3JkZXJCeUZpZWxkcyArPSAoW2ZpZWxkTmFtZSwgb3JkZXJdKS5qb2luKCcgJyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBydW46IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgY29uc29sZS5sb2coJ3J1biBzb21lIHN0dWZmJyk7XHJcbiAgICBjb25zb2xlLmxvZyh0aGlzKTtcclxuICAgIGNvbnNvbGUubG9nKHRoaXMub3B0aW9ucyk7XHJcbiAgICBjb25zb2xlLmxvZyh0aGlzLnBhcmFtcyk7XHJcbiAgICB0aGlzLl9jbGVhblBhcmFtcygpO1xyXG5cclxuICAgIC8vIHNlcnZpY2VzIGhvc3RlZCBvbiBBcmNHSVMgT25saW5lIGFuZCBBcmNHSVMgU2VydmVyIDEwLjMuMSsgc3VwcG9ydCByZXF1ZXN0aW5nIGdlb2pzb24gZGlyZWN0bHlcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuaXNNb2Rlcm4gfHwgaXNBcmNnaXNPbmxpbmUodGhpcy5vcHRpb25zLnVybCkpIHtcclxuICAgICAgY29uc29sZS5sb2coJ3llcyBpdHMgbW9kZXJuJyk7XHJcbiAgICAgIHRoaXMucGFyYW1zLmYgPSAnZ2VvanNvbic7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygncmVxdWVzdCBpcyBjb21wbGV0ZScpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgdGhpcy5fdHJhcFNRTGVycm9ycyhlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBlcnJvciwgcmVzcG9uc2UsIHJlc3BvbnNlKTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgLy8gb3RoZXJ3aXNlIGNvbnZlcnQgaXQgaW4gdGhlIGNhbGxiYWNrIHRoZW4gcGFzcyBpdCBvblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5sb2coJ25vIGl0cyBub3QgbW9kZXJuJyk7XHJcbiAgICAgIHJldHVybiB0aGlzLnJlcXVlc3QoZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdyZXF1ZXN0IGlzIGNvbXBsZXRlJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICB0aGlzLl90cmFwU1FMZXJyb3JzKGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yLCAocmVzcG9uc2UgJiYgcmVzcG9uc2VUb0ZlYXR1cmVDb2xsZWN0aW9uKHJlc3BvbnNlKSksIHJlc3BvbnNlKTtcclxuICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY291bnQ6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5fY2xlYW5QYXJhbXMoKTtcclxuICAgIHRoaXMucGFyYW1zLnJldHVybkNvdW50T25seSA9IHRydWU7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgY2FsbGJhY2suY2FsbCh0aGlzLCBlcnJvciwgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmNvdW50KSwgcmVzcG9uc2UpO1xyXG4gICAgfSwgY29udGV4dCk7XHJcbiAgfSxcclxuXHJcbiAgaWRzOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIHRoaXMuX2NsZWFuUGFyYW1zKCk7XHJcbiAgICB0aGlzLnBhcmFtcy5yZXR1cm5JZHNPbmx5ID0gdHJ1ZTtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXMsIGVycm9yLCAocmVzcG9uc2UgJiYgcmVzcG9uc2Uub2JqZWN0SWRzKSwgcmVzcG9uc2UpO1xyXG4gICAgfSwgY29udGV4dCk7XHJcbiAgfSxcclxuXHJcbiAgLy8gb25seSB2YWxpZCBmb3IgRmVhdHVyZSBTZXJ2aWNlcyBydW5uaW5nIG9uIEFyY0dJUyBTZXJ2ZXIgMTAuMysgb3IgQXJjR0lTIE9ubGluZVxyXG4gIGJvdW5kczogZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICB0aGlzLl9jbGVhblBhcmFtcygpO1xyXG4gICAgdGhpcy5wYXJhbXMucmV0dXJuRXh0ZW50T25seSA9IHRydWU7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmV4dGVudCAmJiBleHRlbnRUb0JvdW5kcyhyZXNwb25zZS5leHRlbnQpKSB7XHJcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBlcnJvciwgZXh0ZW50VG9Cb3VuZHMocmVzcG9uc2UuZXh0ZW50KSwgcmVzcG9uc2UpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVycm9yID0ge1xyXG4gICAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgQm91bmRzJ1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBlcnJvciwgbnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgICB9XHJcbiAgICB9LCBjb250ZXh0KTtcclxuICB9LFxyXG5cclxuICAvLyBvbmx5IHZhbGlkIGZvciBpbWFnZSBzZXJ2aWNlc1xyXG4gIHBpeGVsU2l6ZTogZnVuY3Rpb24gKHJhd1BvaW50KSB7XHJcbiAgICB2YXIgY2FzdFBvaW50ID0gcG9pbnQocmF3UG9pbnQpO1xyXG4gICAgdGhpcy5wYXJhbXMucGl4ZWxTaXplID0gW2Nhc3RQb2ludC54LCBjYXN0UG9pbnQueV07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICAvLyBvbmx5IHZhbGlkIGZvciBtYXAgc2VydmljZXNcclxuICBsYXllcjogZnVuY3Rpb24gKGxheWVyKSB7XHJcbiAgICB0aGlzLnBhdGggPSBsYXllciArICcvcXVlcnknO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgX3RyYXBTUUxlcnJvcnM6IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgaWYgKGVycm9yKSB7XHJcbiAgICAgIGlmIChlcnJvci5jb2RlID09PSAnNDAwJykge1xyXG4gICAgICAgIHdhcm4oJ29uZSBjb21tb24gc3ludGF4IGVycm9yIGluIHF1ZXJ5IHJlcXVlc3RzIGlzIGVuY2FzaW5nIHN0cmluZyB2YWx1ZXMgaW4gZG91YmxlIHF1b3RlcyBpbnN0ZWFkIG9mIHNpbmdsZSBxdW90ZXMnKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIF9jbGVhblBhcmFtczogZnVuY3Rpb24gKCkge1xyXG4gICAgZGVsZXRlIHRoaXMucGFyYW1zLnJldHVybklkc09ubHk7XHJcbiAgICBkZWxldGUgdGhpcy5wYXJhbXMucmV0dXJuRXh0ZW50T25seTtcclxuICAgIGRlbGV0ZSB0aGlzLnBhcmFtcy5yZXR1cm5Db3VudE9ubHk7XHJcbiAgfSxcclxuXHJcbiAgX3NldEdlb21ldHJ5UGFyYW1zOiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcclxuICAgIHRoaXMucGFyYW1zLmluU3IgPSA0MzI2O1xyXG4gICAgdmFyIGNvbnZlcnRlZCA9IF9zZXRHZW9tZXRyeShnZW9tZXRyeSk7XHJcbiAgICB0aGlzLnBhcmFtcy5nZW9tZXRyeSA9IGNvbnZlcnRlZC5nZW9tZXRyeTtcclxuICAgIHRoaXMucGFyYW1zLmdlb21ldHJ5VHlwZSA9IGNvbnZlcnRlZC5nZW9tZXRyeVR5cGU7XHJcbiAgfVxyXG5cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcXVlcnkgKG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IFF1ZXJ5KG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBxdWVyeTtcclxuIiwiaW1wb3J0IHsgVGFzayB9IGZyb20gJy4vVGFzayc7XHJcbmltcG9ydCB7IHJlc3BvbnNlVG9GZWF0dXJlQ29sbGVjdGlvbiB9IGZyb20gJy4uL1V0aWwnO1xyXG5cclxuZXhwb3J0IHZhciBGaW5kID0gVGFzay5leHRlbmQoe1xyXG4gIHNldHRlcnM6IHtcclxuICAgIC8vIG1ldGhvZCBuYW1lID4gcGFyYW0gbmFtZVxyXG4gICAgJ2NvbnRhaW5zJzogJ2NvbnRhaW5zJyxcclxuICAgICd0ZXh0JzogJ3NlYXJjaFRleHQnLFxyXG4gICAgJ2ZpZWxkcyc6ICdzZWFyY2hGaWVsZHMnLCAvLyBkZW5vdGUgYW4gYXJyYXkgb3Igc2luZ2xlIHN0cmluZ1xyXG4gICAgJ3NwYXRpYWxSZWZlcmVuY2UnOiAnc3InLFxyXG4gICAgJ3NyJzogJ3NyJyxcclxuICAgICdsYXllcnMnOiAnbGF5ZXJzJyxcclxuICAgICdyZXR1cm5HZW9tZXRyeSc6ICdyZXR1cm5HZW9tZXRyeScsXHJcbiAgICAnbWF4QWxsb3dhYmxlT2Zmc2V0JzogJ21heEFsbG93YWJsZU9mZnNldCcsXHJcbiAgICAncHJlY2lzaW9uJzogJ2dlb21ldHJ5UHJlY2lzaW9uJyxcclxuICAgICdkeW5hbWljTGF5ZXJzJzogJ2R5bmFtaWNMYXllcnMnLFxyXG4gICAgJ3JldHVyblonOiAncmV0dXJuWicsXHJcbiAgICAncmV0dXJuTSc6ICdyZXR1cm5NJyxcclxuICAgICdnZGJWZXJzaW9uJzogJ2dkYlZlcnNpb24nLFxyXG4gICAgLy8gc2tpcHBlZCBpbXBsZW1lbnRpbmcgdGhpcyAoZm9yIG5vdykgYmVjYXVzZSB0aGUgUkVTVCBzZXJ2aWNlIGltcGxlbWVudGF0aW9uIGlzbnQgY29uc2lzdGVudCBiZXR3ZWVuIG9wZXJhdGlvbnNcclxuICAgIC8vICd0cmFuc2Zvcm0nOiAnZGF0dW1UcmFuc2Zvcm1hdGlvbnMnLFxyXG4gICAgJ3Rva2VuJzogJ3Rva2VuJ1xyXG4gIH0sXHJcblxyXG4gIHBhdGg6ICdmaW5kJyxcclxuXHJcbiAgcGFyYW1zOiB7XHJcbiAgICBzcjogNDMyNixcclxuICAgIGNvbnRhaW5zOiB0cnVlLFxyXG4gICAgcmV0dXJuR2VvbWV0cnk6IHRydWUsXHJcbiAgICByZXR1cm5aOiB0cnVlLFxyXG4gICAgcmV0dXJuTTogZmFsc2VcclxuICB9LFxyXG5cclxuICBsYXllckRlZnM6IGZ1bmN0aW9uIChpZCwgd2hlcmUpIHtcclxuICAgIHRoaXMucGFyYW1zLmxheWVyRGVmcyA9ICh0aGlzLnBhcmFtcy5sYXllckRlZnMpID8gdGhpcy5wYXJhbXMubGF5ZXJEZWZzICsgJzsnIDogJyc7XHJcbiAgICB0aGlzLnBhcmFtcy5sYXllckRlZnMgKz0gKFtpZCwgd2hlcmVdKS5qb2luKCc6Jyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBzaW1wbGlmeTogZnVuY3Rpb24gKG1hcCwgZmFjdG9yKSB7XHJcbiAgICB2YXIgbWFwV2lkdGggPSBNYXRoLmFicyhtYXAuZ2V0Qm91bmRzKCkuZ2V0V2VzdCgpIC0gbWFwLmdldEJvdW5kcygpLmdldEVhc3QoKSk7XHJcbiAgICB0aGlzLnBhcmFtcy5tYXhBbGxvd2FibGVPZmZzZXQgPSAobWFwV2lkdGggLyBtYXAuZ2V0U2l6ZSgpLnkpICogZmFjdG9yO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgcnVuOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yLCAocmVzcG9uc2UgJiYgcmVzcG9uc2VUb0ZlYXR1cmVDb2xsZWN0aW9uKHJlc3BvbnNlKSksIHJlc3BvbnNlKTtcclxuICAgIH0sIGNvbnRleHQpO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmluZCAob3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgRmluZChvcHRpb25zKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZmluZDtcclxuIiwiaW1wb3J0IHsgVGFzayB9IGZyb20gJy4vVGFzayc7XHJcblxyXG5leHBvcnQgdmFyIElkZW50aWZ5ID0gVGFzay5leHRlbmQoe1xyXG4gIHBhdGg6ICdpZGVudGlmeScsXHJcblxyXG4gIGJldHdlZW46IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XHJcbiAgICB0aGlzLnBhcmFtcy50aW1lID0gW3N0YXJ0LnZhbHVlT2YoKSwgZW5kLnZhbHVlT2YoKV07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlkZW50aWZ5IChvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBJZGVudGlmeShvcHRpb25zKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaWRlbnRpZnk7XHJcbiIsImltcG9ydCB7IGxhdExuZyB9IGZyb20gJ2xlYWZsZXQnO1xyXG5pbXBvcnQgeyBJZGVudGlmeSB9IGZyb20gJy4vSWRlbnRpZnknO1xyXG5pbXBvcnQgeyByZXNwb25zZVRvRmVhdHVyZUNvbGxlY3Rpb24sXHJcbiAgYm91bmRzVG9FeHRlbnQsXHJcbiAgX3NldEdlb21ldHJ5XHJcbn0gZnJvbSAnLi4vVXRpbCc7XHJcblxyXG5leHBvcnQgdmFyIElkZW50aWZ5RmVhdHVyZXMgPSBJZGVudGlmeS5leHRlbmQoe1xyXG4gIHNldHRlcnM6IHtcclxuICAgICdsYXllcnMnOiAnbGF5ZXJzJyxcclxuICAgICdwcmVjaXNpb24nOiAnZ2VvbWV0cnlQcmVjaXNpb24nLFxyXG4gICAgJ3RvbGVyYW5jZSc6ICd0b2xlcmFuY2UnLFxyXG4gICAgLy8gc2tpcHBlZCBpbXBsZW1lbnRpbmcgdGhpcyAoZm9yIG5vdykgYmVjYXVzZSB0aGUgUkVTVCBzZXJ2aWNlIGltcGxlbWVudGF0aW9uIGlzbnQgY29uc2lzdGVudCBiZXR3ZWVuIG9wZXJhdGlvbnMuXHJcbiAgICAvLyAndHJhbnNmb3JtJzogJ2RhdHVtVHJhbnNmb3JtYXRpb25zJ1xyXG4gICAgJ3JldHVybkdlb21ldHJ5JzogJ3JldHVybkdlb21ldHJ5J1xyXG4gIH0sXHJcblxyXG4gIHBhcmFtczoge1xyXG4gICAgc3I6IDQzMjYsXHJcbiAgICBsYXllcnM6ICdhbGwnLFxyXG4gICAgdG9sZXJhbmNlOiAzLFxyXG4gICAgcmV0dXJuR2VvbWV0cnk6IHRydWVcclxuICB9LFxyXG5cclxuICBvbjogZnVuY3Rpb24gKG1hcCkge1xyXG4gICAgdmFyIGV4dGVudCA9IGJvdW5kc1RvRXh0ZW50KG1hcC5nZXRCb3VuZHMoKSk7XHJcbiAgICB2YXIgc2l6ZSA9IG1hcC5nZXRTaXplKCk7XHJcbiAgICB0aGlzLnBhcmFtcy5pbWFnZURpc3BsYXkgPSBbc2l6ZS54LCBzaXplLnksIDk2XTtcclxuICAgIHRoaXMucGFyYW1zLm1hcEV4dGVudCA9IFtleHRlbnQueG1pbiwgZXh0ZW50LnltaW4sIGV4dGVudC54bWF4LCBleHRlbnQueW1heF07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBhdDogZnVuY3Rpb24gKGdlb21ldHJ5KSB7XHJcbiAgICAvLyBjYXN0IGxhdCwgbG9uZyBwYWlycyBpbiByYXcgYXJyYXkgZm9ybSBtYW51YWxseVxyXG4gICAgaWYgKGdlb21ldHJ5Lmxlbmd0aCA9PT0gMikge1xyXG4gICAgICBnZW9tZXRyeSA9IGxhdExuZyhnZW9tZXRyeSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9zZXRHZW9tZXRyeVBhcmFtcyhnZW9tZXRyeSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBsYXllckRlZjogZnVuY3Rpb24gKGlkLCB3aGVyZSkge1xyXG4gICAgdGhpcy5wYXJhbXMubGF5ZXJEZWZzID0gKHRoaXMucGFyYW1zLmxheWVyRGVmcykgPyB0aGlzLnBhcmFtcy5sYXllckRlZnMgKyAnOycgOiAnJztcclxuICAgIHRoaXMucGFyYW1zLmxheWVyRGVmcyArPSAoW2lkLCB3aGVyZV0pLmpvaW4oJzonKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIHNpbXBsaWZ5OiBmdW5jdGlvbiAobWFwLCBmYWN0b3IpIHtcclxuICAgIHZhciBtYXBXaWR0aCA9IE1hdGguYWJzKG1hcC5nZXRCb3VuZHMoKS5nZXRXZXN0KCkgLSBtYXAuZ2V0Qm91bmRzKCkuZ2V0RWFzdCgpKTtcclxuICAgIHRoaXMucGFyYW1zLm1heEFsbG93YWJsZU9mZnNldCA9IChtYXBXaWR0aCAvIG1hcC5nZXRTaXplKCkueSkgKiBmYWN0b3I7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBydW46IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XHJcbiAgICAgIC8vIGltbWVkaWF0ZWx5IGludm9rZSB3aXRoIGFuIGVycm9yXHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IsIHVuZGVmaW5lZCwgcmVzcG9uc2UpO1xyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgIC8vIG9rIG5vIGVycm9yIGxldHMganVzdCBhc3N1bWUgd2UgaGF2ZSBmZWF0dXJlcy4uLlxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBmZWF0dXJlQ29sbGVjdGlvbiA9IHJlc3BvbnNlVG9GZWF0dXJlQ29sbGVjdGlvbihyZXNwb25zZSk7XHJcbiAgICAgICAgcmVzcG9uc2UucmVzdWx0cyA9IHJlc3BvbnNlLnJlc3VsdHMucmV2ZXJzZSgpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIHZhciBmZWF0dXJlID0gZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXNbaV07XHJcbiAgICAgICAgICBmZWF0dXJlLmxheWVySWQgPSByZXNwb25zZS5yZXN1bHRzW2ldLmxheWVySWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgdW5kZWZpbmVkLCBmZWF0dXJlQ29sbGVjdGlvbiwgcmVzcG9uc2UpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICBfc2V0R2VvbWV0cnlQYXJhbXM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xyXG4gICAgdmFyIGNvbnZlcnRlZCA9IF9zZXRHZW9tZXRyeShnZW9tZXRyeSk7XHJcbiAgICB0aGlzLnBhcmFtcy5nZW9tZXRyeSA9IGNvbnZlcnRlZC5nZW9tZXRyeTtcclxuICAgIHRoaXMucGFyYW1zLmdlb21ldHJ5VHlwZSA9IGNvbnZlcnRlZC5nZW9tZXRyeVR5cGU7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpZGVudGlmeUZlYXR1cmVzIChvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBJZGVudGlmeUZlYXR1cmVzKG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpZGVudGlmeUZlYXR1cmVzO1xyXG4iLCJpbXBvcnQgeyBsYXRMbmcgfSBmcm9tICdsZWFmbGV0JztcclxuaW1wb3J0IHsgSWRlbnRpZnkgfSBmcm9tICcuL0lkZW50aWZ5JztcclxuaW1wb3J0IHsgcmVzcG9uc2VUb0ZlYXR1cmVDb2xsZWN0aW9uIH0gZnJvbSAnLi4vVXRpbCc7XHJcblxyXG5leHBvcnQgdmFyIElkZW50aWZ5SW1hZ2UgPSBJZGVudGlmeS5leHRlbmQoe1xyXG4gIHNldHRlcnM6IHtcclxuICAgICdzZXRNb3NhaWNSdWxlJzogJ21vc2FpY1J1bGUnLFxyXG4gICAgJ3NldFJlbmRlcmluZ1J1bGUnOiAncmVuZGVyaW5nUnVsZScsXHJcbiAgICAnc2V0UGl4ZWxTaXplJzogJ3BpeGVsU2l6ZScsXHJcbiAgICAncmV0dXJuQ2F0YWxvZ0l0ZW1zJzogJ3JldHVybkNhdGFsb2dJdGVtcycsXHJcbiAgICAncmV0dXJuR2VvbWV0cnknOiAncmV0dXJuR2VvbWV0cnknXHJcbiAgfSxcclxuXHJcbiAgcGFyYW1zOiB7XHJcbiAgICByZXR1cm5HZW9tZXRyeTogZmFsc2VcclxuICB9LFxyXG5cclxuICBhdDogZnVuY3Rpb24gKGxhdGxuZykge1xyXG4gICAgbGF0bG5nID0gbGF0TG5nKGxhdGxuZyk7XHJcbiAgICB0aGlzLnBhcmFtcy5nZW9tZXRyeSA9IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgeDogbGF0bG5nLmxuZyxcclxuICAgICAgeTogbGF0bG5nLmxhdCxcclxuICAgICAgc3BhdGlhbFJlZmVyZW5jZToge1xyXG4gICAgICAgIHdraWQ6IDQzMjZcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLnBhcmFtcy5nZW9tZXRyeVR5cGUgPSAnZXNyaUdlb21ldHJ5UG9pbnQnO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZ2V0TW9zYWljUnVsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyYW1zLm1vc2FpY1J1bGU7XHJcbiAgfSxcclxuXHJcbiAgZ2V0UmVuZGVyaW5nUnVsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyYW1zLnJlbmRlcmluZ1J1bGU7XHJcbiAgfSxcclxuXHJcbiAgZ2V0UGl4ZWxTaXplOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJhbXMucGl4ZWxTaXplO1xyXG4gIH0sXHJcblxyXG4gIHJ1bjogZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBlcnJvciwgKHJlc3BvbnNlICYmIHRoaXMuX3Jlc3BvbnNlVG9HZW9KU09OKHJlc3BvbnNlKSksIHJlc3BvbnNlKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gIH0sXHJcblxyXG4gIC8vIGdldCBwaXhlbCBkYXRhIGFuZCByZXR1cm4gYXMgZ2VvSlNPTiBwb2ludFxyXG4gIC8vIHBvcHVsYXRlIGNhdGFsb2cgaXRlbXMgKGlmIGFueSlcclxuICAvLyBtZXJnaW5nIGluIGFueSBjYXRhbG9nSXRlbVZpc2liaWxpdGllcyBhcyBhIHByb3Blcnkgb2YgZWFjaCBmZWF0dXJlXHJcbiAgX3Jlc3BvbnNlVG9HZW9KU09OOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgIHZhciBsb2NhdGlvbiA9IHJlc3BvbnNlLmxvY2F0aW9uO1xyXG4gICAgdmFyIGNhdGFsb2dJdGVtcyA9IHJlc3BvbnNlLmNhdGFsb2dJdGVtcztcclxuICAgIHZhciBjYXRhbG9nSXRlbVZpc2liaWxpdGllcyA9IHJlc3BvbnNlLmNhdGFsb2dJdGVtVmlzaWJpbGl0aWVzO1xyXG4gICAgdmFyIGdlb0pTT04gPSB7XHJcbiAgICAgICdwaXhlbCc6IHtcclxuICAgICAgICAndHlwZSc6ICdGZWF0dXJlJyxcclxuICAgICAgICAnZ2VvbWV0cnknOiB7XHJcbiAgICAgICAgICAndHlwZSc6ICdQb2ludCcsXHJcbiAgICAgICAgICAnY29vcmRpbmF0ZXMnOiBbbG9jYXRpb24ueCwgbG9jYXRpb24ueV1cclxuICAgICAgICB9LFxyXG4gICAgICAgICdjcnMnOiB7XHJcbiAgICAgICAgICAndHlwZSc6ICdFUFNHJyxcclxuICAgICAgICAgICdwcm9wZXJ0aWVzJzoge1xyXG4gICAgICAgICAgICAnY29kZSc6IGxvY2F0aW9uLnNwYXRpYWxSZWZlcmVuY2Uud2tpZFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ3Byb3BlcnRpZXMnOiB7XHJcbiAgICAgICAgICAnT0JKRUNUSUQnOiByZXNwb25zZS5vYmplY3RJZCxcclxuICAgICAgICAgICduYW1lJzogcmVzcG9uc2UubmFtZSxcclxuICAgICAgICAgICd2YWx1ZSc6IHJlc3BvbnNlLnZhbHVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICAnaWQnOiByZXNwb25zZS5vYmplY3RJZFxyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChyZXNwb25zZS5wcm9wZXJ0aWVzICYmIHJlc3BvbnNlLnByb3BlcnRpZXMuVmFsdWVzKSB7XHJcbiAgICAgIGdlb0pTT04ucGl4ZWwucHJvcGVydGllcy52YWx1ZXMgPSByZXNwb25zZS5wcm9wZXJ0aWVzLlZhbHVlcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY2F0YWxvZ0l0ZW1zICYmIGNhdGFsb2dJdGVtcy5mZWF0dXJlcykge1xyXG4gICAgICBnZW9KU09OLmNhdGFsb2dJdGVtcyA9IHJlc3BvbnNlVG9GZWF0dXJlQ29sbGVjdGlvbihjYXRhbG9nSXRlbXMpO1xyXG4gICAgICBpZiAoY2F0YWxvZ0l0ZW1WaXNpYmlsaXRpZXMgJiYgY2F0YWxvZ0l0ZW1WaXNpYmlsaXRpZXMubGVuZ3RoID09PSBnZW9KU09OLmNhdGFsb2dJdGVtcy5mZWF0dXJlcy5sZW5ndGgpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gY2F0YWxvZ0l0ZW1WaXNpYmlsaXRpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgIGdlb0pTT04uY2F0YWxvZ0l0ZW1zLmZlYXR1cmVzW2ldLnByb3BlcnRpZXMuY2F0YWxvZ0l0ZW1WaXNpYmlsaXR5ID0gY2F0YWxvZ0l0ZW1WaXNpYmlsaXRpZXNbaV07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ2VvSlNPTjtcclxuICB9XHJcblxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpZGVudGlmeUltYWdlIChwYXJhbXMpIHtcclxuICByZXR1cm4gbmV3IElkZW50aWZ5SW1hZ2UocGFyYW1zKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaWRlbnRpZnlJbWFnZTtcclxuIiwiaW1wb3J0IHsgVXRpbCwgRXZlbnRlZCB9IGZyb20gJ2xlYWZsZXQnO1xyXG5pbXBvcnQge2NvcnN9IGZyb20gJy4uL1N1cHBvcnQnO1xyXG5pbXBvcnQge2NsZWFuVXJsfSBmcm9tICcuLi9VdGlsJztcclxuaW1wb3J0IFJlcXVlc3QgZnJvbSAnLi4vUmVxdWVzdCc7XHJcblxyXG5leHBvcnQgdmFyIFNlcnZpY2UgPSBFdmVudGVkLmV4dGVuZCh7XHJcblxyXG4gIG9wdGlvbnM6IHtcclxuICAgIHByb3h5OiBmYWxzZSxcclxuICAgIHVzZUNvcnM6IGNvcnMsXHJcbiAgICB0aW1lb3V0OiAwXHJcbiAgfSxcclxuXHJcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgdGhpcy5fcmVxdWVzdFF1ZXVlID0gW107XHJcbiAgICB0aGlzLl9hdXRoZW50aWNhdGluZyA9IGZhbHNlO1xyXG4gICAgVXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgdGhpcy5vcHRpb25zLnVybCA9IGNsZWFuVXJsKHRoaXMub3B0aW9ucy51cmwpO1xyXG4gIH0sXHJcblxyXG4gIGdldDogZnVuY3Rpb24gKHBhdGgsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIHJldHVybiB0aGlzLl9yZXF1ZXN0KCdnZXQnLCBwYXRoLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICB9LFxyXG5cclxuICBwb3N0OiBmdW5jdGlvbiAocGF0aCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3JlcXVlc3QoJ3Bvc3QnLCBwYXRoLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICB9LFxyXG5cclxuICByZXF1ZXN0OiBmdW5jdGlvbiAocGF0aCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3JlcXVlc3QoJ3JlcXVlc3QnLCBwYXRoLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICB9LFxyXG5cclxuICBtZXRhZGF0YTogZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcmVxdWVzdCgnZ2V0JywgJycsIHt9LCBjYWxsYmFjaywgY29udGV4dCk7XHJcbiAgfSxcclxuXHJcbiAgYXV0aGVudGljYXRlOiBmdW5jdGlvbiAodG9rZW4pIHtcclxuICAgIHRoaXMuX2F1dGhlbnRpY2F0aW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLm9wdGlvbnMudG9rZW4gPSB0b2tlbjtcclxuICAgIHRoaXMuX3J1blF1ZXVlKCk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBnZXRUaW1lb3V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnRpbWVvdXQ7XHJcbiAgfSxcclxuXHJcbiAgc2V0VGltZW91dDogZnVuY3Rpb24gKHRpbWVvdXQpIHtcclxuICAgIHRoaXMub3B0aW9ucy50aW1lb3V0ID0gdGltZW91dDtcclxuICB9LFxyXG5cclxuICBfcmVxdWVzdDogZnVuY3Rpb24gKG1ldGhvZCwgcGF0aCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5maXJlKCdyZXF1ZXN0c3RhcnQnLCB7XHJcbiAgICAgIHVybDogdGhpcy5vcHRpb25zLnVybCArIHBhdGgsXHJcbiAgICAgIHBhcmFtczogcGFyYW1zLFxyXG4gICAgICBtZXRob2Q6IG1ldGhvZFxyXG4gICAgfSwgdHJ1ZSk7XHJcblxyXG4gICAgdmFyIHdyYXBwZWRDYWxsYmFjayA9IHRoaXMuX2NyZWF0ZVNlcnZpY2VDYWxsYmFjayhtZXRob2QsIHBhdGgsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHQpO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudG9rZW4pIHtcclxuICAgICAgcGFyYW1zLnRva2VuID0gdGhpcy5vcHRpb25zLnRva2VuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLl9hdXRoZW50aWNhdGluZykge1xyXG4gICAgICB0aGlzLl9yZXF1ZXN0UXVldWUucHVzaChbbWV0aG9kLCBwYXRoLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0XSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciB1cmwgPSAodGhpcy5vcHRpb25zLnByb3h5KSA/IHRoaXMub3B0aW9ucy5wcm94eSArICc/JyArIHRoaXMub3B0aW9ucy51cmwgKyBwYXRoIDogdGhpcy5vcHRpb25zLnVybCArIHBhdGg7XHJcblxyXG4gICAgICBpZiAoKG1ldGhvZCA9PT0gJ2dldCcgfHwgbWV0aG9kID09PSAncmVxdWVzdCcpICYmICF0aGlzLm9wdGlvbnMudXNlQ29ycykge1xyXG4gICAgICAgIHJldHVybiBSZXF1ZXN0LmdldC5KU09OUCh1cmwsIHBhcmFtcywgd3JhcHBlZENhbGxiYWNrLCBjb250ZXh0KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gUmVxdWVzdFttZXRob2RdKHVybCwgcGFyYW1zLCB3cmFwcGVkQ2FsbGJhY2ssIGNvbnRleHQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgX2NyZWF0ZVNlcnZpY2VDYWxsYmFjazogZnVuY3Rpb24gKG1ldGhvZCwgcGF0aCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuIFV0aWwuYmluZChmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmIChlcnJvciAmJiAoZXJyb3IuY29kZSA9PT0gNDk5IHx8IGVycm9yLmNvZGUgPT09IDQ5OCkpIHtcclxuICAgICAgICB0aGlzLl9hdXRoZW50aWNhdGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHRoaXMuX3JlcXVlc3RRdWV1ZS5wdXNoKFttZXRob2QsIHBhdGgsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHRdKTtcclxuXHJcbiAgICAgICAgLy8gZmlyZSBhbiBldmVudCBmb3IgdXNlcnMgdG8gaGFuZGxlIGFuZCByZS1hdXRoZW50aWNhdGVcclxuICAgICAgICB0aGlzLmZpcmUoJ2F1dGhlbnRpY2F0aW9ucmVxdWlyZWQnLCB7XHJcbiAgICAgICAgICBhdXRoZW50aWNhdGU6IFV0aWwuYmluZCh0aGlzLmF1dGhlbnRpY2F0ZSwgdGhpcylcclxuICAgICAgICB9LCB0cnVlKTtcclxuXHJcbiAgICAgICAgLy8gaWYgdGhlIHVzZXIgaGFzIGFjY2VzcyB0byBhIGNhbGxiYWNrIHRoZXkgY2FuIGhhbmRsZSB0aGUgYXV0aCBlcnJvclxyXG4gICAgICAgIGVycm9yLmF1dGhlbnRpY2F0ZSA9IFV0aWwuYmluZCh0aGlzLmF1dGhlbnRpY2F0ZSwgdGhpcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IsIHJlc3BvbnNlKTtcclxuXHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIHRoaXMuZmlyZSgncmVxdWVzdGVycm9yJywge1xyXG4gICAgICAgICAgdXJsOiB0aGlzLm9wdGlvbnMudXJsICsgcGF0aCxcclxuICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxyXG4gICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcclxuICAgICAgICAgIGNvZGU6IGVycm9yLmNvZGUsXHJcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZFxyXG4gICAgICAgIH0sIHRydWUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZmlyZSgncmVxdWVzdHN1Y2Nlc3MnLCB7XHJcbiAgICAgICAgICB1cmw6IHRoaXMub3B0aW9ucy51cmwgKyBwYXRoLFxyXG4gICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXHJcbiAgICAgICAgICByZXNwb25zZTogcmVzcG9uc2UsXHJcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZFxyXG4gICAgICAgIH0sIHRydWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmZpcmUoJ3JlcXVlc3RlbmQnLCB7XHJcbiAgICAgICAgdXJsOiB0aGlzLm9wdGlvbnMudXJsICsgcGF0aCxcclxuICAgICAgICBwYXJhbXM6IHBhcmFtcyxcclxuICAgICAgICBtZXRob2Q6IG1ldGhvZFxyXG4gICAgICB9LCB0cnVlKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gIH0sXHJcblxyXG4gIF9ydW5RdWV1ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgZm9yICh2YXIgaSA9IHRoaXMuX3JlcXVlc3RRdWV1ZS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICB2YXIgcmVxdWVzdCA9IHRoaXMuX3JlcXVlc3RRdWV1ZVtpXTtcclxuICAgICAgdmFyIG1ldGhvZCA9IHJlcXVlc3Quc2hpZnQoKTtcclxuICAgICAgdGhpc1ttZXRob2RdLmFwcGx5KHRoaXMsIHJlcXVlc3QpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fcmVxdWVzdFF1ZXVlID0gW107XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXJ2aWNlIChvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBTZXJ2aWNlKG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzZXJ2aWNlO1xyXG4iLCJpbXBvcnQgeyBTZXJ2aWNlIH0gZnJvbSAnLi9TZXJ2aWNlJztcclxuaW1wb3J0IGlkZW50aWZ5RmVhdHVyZXMgZnJvbSAnLi4vVGFza3MvSWRlbnRpZnlGZWF0dXJlcyc7XHJcbmltcG9ydCBxdWVyeSBmcm9tICcuLi9UYXNrcy9RdWVyeSc7XHJcbmltcG9ydCBmaW5kIGZyb20gJy4uL1Rhc2tzL0ZpbmQnO1xyXG5cclxuZXhwb3J0IHZhciBNYXBTZXJ2aWNlID0gU2VydmljZS5leHRlbmQoe1xyXG5cclxuICBpZGVudGlmeTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIGlkZW50aWZ5RmVhdHVyZXModGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgZmluZDogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIGZpbmQodGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgcXVlcnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBxdWVyeSh0aGlzKTtcclxuICB9XHJcblxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYXBTZXJ2aWNlIChvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBNYXBTZXJ2aWNlKG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBtYXBTZXJ2aWNlO1xyXG4iLCJpbXBvcnQgeyBTZXJ2aWNlIH0gZnJvbSAnLi9TZXJ2aWNlJztcclxuaW1wb3J0IGlkZW50aWZ5SW1hZ2UgZnJvbSAnLi4vVGFza3MvSWRlbnRpZnlJbWFnZSc7XHJcbmltcG9ydCBxdWVyeSBmcm9tICcuLi9UYXNrcy9RdWVyeSc7XHJcblxyXG5leHBvcnQgdmFyIEltYWdlU2VydmljZSA9IFNlcnZpY2UuZXh0ZW5kKHtcclxuXHJcbiAgcXVlcnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBxdWVyeSh0aGlzKTtcclxuICB9LFxyXG5cclxuICBpZGVudGlmeTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIGlkZW50aWZ5SW1hZ2UodGhpcyk7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbWFnZVNlcnZpY2UgKG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IEltYWdlU2VydmljZShvcHRpb25zKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaW1hZ2VTZXJ2aWNlO1xyXG4iLCJpbXBvcnQgeyBTZXJ2aWNlIH0gZnJvbSAnLi9TZXJ2aWNlJztcclxuaW1wb3J0IHF1ZXJ5IGZyb20gJy4uL1Rhc2tzL1F1ZXJ5JztcclxuaW1wb3J0IHsgZ2VvanNvblRvQXJjR0lTIH0gZnJvbSAnLi4vVXRpbCc7XHJcblxyXG5leHBvcnQgdmFyIEZlYXR1cmVMYXllclNlcnZpY2UgPSBTZXJ2aWNlLmV4dGVuZCh7XHJcblxyXG4gIG9wdGlvbnM6IHtcclxuICAgIGlkQXR0cmlidXRlOiAnT0JKRUNUSUQnXHJcbiAgfSxcclxuXHJcbiAgcXVlcnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBxdWVyeSh0aGlzKTtcclxuICB9LFxyXG5cclxuICBhZGRGZWF0dXJlOiBmdW5jdGlvbiAoZmVhdHVyZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIGRlbGV0ZSBmZWF0dXJlLmlkO1xyXG5cclxuICAgIGZlYXR1cmUgPSBnZW9qc29uVG9BcmNHSVMoZmVhdHVyZSk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMucG9zdCgnYWRkRmVhdHVyZXMnLCB7XHJcbiAgICAgIGZlYXR1cmVzOiBbZmVhdHVyZV1cclxuICAgIH0sIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgdmFyIHJlc3VsdCA9IChyZXNwb25zZSAmJiByZXNwb25zZS5hZGRSZXN1bHRzKSA/IHJlc3BvbnNlLmFkZFJlc3VsdHNbMF0gOiB1bmRlZmluZWQ7XHJcbiAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IgfHwgcmVzcG9uc2UuYWRkUmVzdWx0c1swXS5lcnJvciwgcmVzdWx0KTtcclxuICAgICAgfVxyXG4gICAgfSwgY29udGV4dCk7XHJcbiAgfSxcclxuXHJcbiAgdXBkYXRlRmVhdHVyZTogZnVuY3Rpb24gKGZlYXR1cmUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICBmZWF0dXJlID0gZ2VvanNvblRvQXJjR0lTKGZlYXR1cmUsIHRoaXMub3B0aW9ucy5pZEF0dHJpYnV0ZSk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMucG9zdCgndXBkYXRlRmVhdHVyZXMnLCB7XHJcbiAgICAgIGZlYXR1cmVzOiBbZmVhdHVyZV1cclxuICAgIH0sIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgdmFyIHJlc3VsdCA9IChyZXNwb25zZSAmJiByZXNwb25zZS51cGRhdGVSZXN1bHRzKSA/IHJlc3BvbnNlLnVwZGF0ZVJlc3VsdHNbMF0gOiB1bmRlZmluZWQ7XHJcbiAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IgfHwgcmVzcG9uc2UudXBkYXRlUmVzdWx0c1swXS5lcnJvciwgcmVzdWx0KTtcclxuICAgICAgfVxyXG4gICAgfSwgY29udGV4dCk7XHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlRmVhdHVyZTogZnVuY3Rpb24gKGlkLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuIHRoaXMucG9zdCgnZGVsZXRlRmVhdHVyZXMnLCB7XHJcbiAgICAgIG9iamVjdElkczogaWRcclxuICAgIH0sIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgdmFyIHJlc3VsdCA9IChyZXNwb25zZSAmJiByZXNwb25zZS5kZWxldGVSZXN1bHRzKSA/IHJlc3BvbnNlLmRlbGV0ZVJlc3VsdHNbMF0gOiB1bmRlZmluZWQ7XHJcbiAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IgfHwgcmVzcG9uc2UuZGVsZXRlUmVzdWx0c1swXS5lcnJvciwgcmVzdWx0KTtcclxuICAgICAgfVxyXG4gICAgfSwgY29udGV4dCk7XHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlRmVhdHVyZXM6IGZ1bmN0aW9uIChpZHMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICByZXR1cm4gdGhpcy5wb3N0KCdkZWxldGVGZWF0dXJlcycsIHtcclxuICAgICAgb2JqZWN0SWRzOiBpZHNcclxuICAgIH0sIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgLy8gcGFzcyBiYWNrIHRoZSBlbnRpcmUgYXJyYXlcclxuICAgICAgdmFyIHJlc3VsdCA9IChyZXNwb25zZSAmJiByZXNwb25zZS5kZWxldGVSZXN1bHRzKSA/IHJlc3BvbnNlLmRlbGV0ZVJlc3VsdHMgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IgfHwgcmVzcG9uc2UuZGVsZXRlUmVzdWx0c1swXS5lcnJvciwgcmVzdWx0KTtcclxuICAgICAgfVxyXG4gICAgfSwgY29udGV4dCk7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmZWF0dXJlTGF5ZXJTZXJ2aWNlIChvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBGZWF0dXJlTGF5ZXJTZXJ2aWNlKG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmZWF0dXJlTGF5ZXJTZXJ2aWNlO1xyXG4iLCJpbXBvcnQgeyBUaWxlTGF5ZXIsIFV0aWwgfSBmcm9tICdsZWFmbGV0JztcclxuaW1wb3J0IHsgcG9pbnRlckV2ZW50cyB9IGZyb20gJy4uL1N1cHBvcnQnO1xyXG5pbXBvcnQge1xyXG4gIHNldEVzcmlBdHRyaWJ1dGlvbixcclxuICBfZ2V0QXR0cmlidXRpb25EYXRhLFxyXG4gIF91cGRhdGVNYXBBdHRyaWJ1dGlvblxyXG59IGZyb20gJy4uL1V0aWwnO1xyXG5cclxudmFyIHRpbGVQcm90b2NvbCA9ICh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgIT09ICdodHRwczonKSA/ICdodHRwOicgOiAnaHR0cHM6JztcclxuXHJcbmV4cG9ydCB2YXIgQmFzZW1hcExheWVyID0gVGlsZUxheWVyLmV4dGVuZCh7XHJcbiAgc3RhdGljczoge1xyXG4gICAgVElMRVM6IHtcclxuICAgICAgU3RyZWV0czoge1xyXG4gICAgICAgIHVybFRlbXBsYXRlOiB0aWxlUHJvdG9jb2wgKyAnLy97c30uYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9Xb3JsZF9TdHJlZXRfTWFwL01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9JyxcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICBtaW5ab29tOiAxLFxyXG4gICAgICAgICAgbWF4Wm9vbTogMTksXHJcbiAgICAgICAgICBzdWJkb21haW5zOiBbJ3NlcnZlcicsICdzZXJ2aWNlcyddLFxyXG4gICAgICAgICAgYXR0cmlidXRpb246ICdVU0dTLCBOT0FBJyxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uVXJsOiAnaHR0cHM6Ly9zdGF0aWMuYXJjZ2lzLmNvbS9hdHRyaWJ1dGlvbi9Xb3JsZF9TdHJlZXRfTWFwJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgVG9wb2dyYXBoaWM6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvV29ybGRfVG9wb19NYXAvTWFwU2VydmVyL3RpbGUve3p9L3t5fS97eH0nLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgIG1pblpvb206IDEsXHJcbiAgICAgICAgICBtYXhab29tOiAxOSxcclxuICAgICAgICAgIHN1YmRvbWFpbnM6IFsnc2VydmVyJywgJ3NlcnZpY2VzJ10sXHJcbiAgICAgICAgICBhdHRyaWJ1dGlvbjogJ1VTR1MsIE5PQUEnLFxyXG4gICAgICAgICAgYXR0cmlidXRpb25Vcmw6ICdodHRwczovL3N0YXRpYy5hcmNnaXMuY29tL2F0dHJpYnV0aW9uL1dvcmxkX1RvcG9fTWFwJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgT2NlYW5zOiB7XHJcbiAgICAgICAgdXJsVGVtcGxhdGU6IHRpbGVQcm90b2NvbCArICcvL3tzfS5hcmNnaXNvbmxpbmUuY29tL2FyY2dpcy9yZXN0L3NlcnZpY2VzL09jZWFuL1dvcmxkX09jZWFuX0Jhc2UvTWFwU2VydmVyL3RpbGUve3p9L3t5fS97eH0nLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgIG1pblpvb206IDEsXHJcbiAgICAgICAgICBtYXhab29tOiAxNixcclxuICAgICAgICAgIHN1YmRvbWFpbnM6IFsnc2VydmVyJywgJ3NlcnZpY2VzJ10sXHJcbiAgICAgICAgICBhdHRyaWJ1dGlvbjogJ1VTR1MsIE5PQUEnLFxyXG4gICAgICAgICAgYXR0cmlidXRpb25Vcmw6ICdodHRwczovL3N0YXRpYy5hcmNnaXMuY29tL2F0dHJpYnV0aW9uL09jZWFuX0Jhc2VtYXAnXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBPY2VhbnNMYWJlbHM6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vYXJjZ2lzL3Jlc3Qvc2VydmljZXMvT2NlYW4vV29ybGRfT2NlYW5fUmVmZXJlbmNlL01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9JyxcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICBtaW5ab29tOiAxLFxyXG4gICAgICAgICAgbWF4Wm9vbTogMTYsXHJcbiAgICAgICAgICBzdWJkb21haW5zOiBbJ3NlcnZlcicsICdzZXJ2aWNlcyddLFxyXG4gICAgICAgICAgcGFuZTogKHBvaW50ZXJFdmVudHMpID8gJ2VzcmktbGFiZWxzJyA6ICd0aWxlUGFuZSdcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIE5hdGlvbmFsR2VvZ3JhcGhpYzoge1xyXG4gICAgICAgIHVybFRlbXBsYXRlOiB0aWxlUHJvdG9jb2wgKyAnLy97c30uYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9OYXRHZW9fV29ybGRfTWFwL01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9JyxcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICBtaW5ab29tOiAxLFxyXG4gICAgICAgICAgbWF4Wm9vbTogMTYsXHJcbiAgICAgICAgICBzdWJkb21haW5zOiBbJ3NlcnZlcicsICdzZXJ2aWNlcyddLFxyXG4gICAgICAgICAgYXR0cmlidXRpb246ICdOYXRpb25hbCBHZW9ncmFwaGljLCBEZUxvcm1lLCBIRVJFLCBVTkVQLVdDTUMsIFVTR1MsIE5BU0EsIEVTQSwgTUVUSSwgTlJDQU4sIEdFQkNPLCBOT0FBLCBpbmNyZW1lbnQgUCBDb3JwLidcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIERhcmtHcmF5OiB7XHJcbiAgICAgICAgdXJsVGVtcGxhdGU6IHRpbGVQcm90b2NvbCArICcvL3tzfS5hcmNnaXNvbmxpbmUuY29tL0FyY0dJUy9yZXN0L3NlcnZpY2VzL0NhbnZhcy9Xb3JsZF9EYXJrX0dyYXlfQmFzZS9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDE2LFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnSEVSRSwgRGVMb3JtZSwgTWFwbXlJbmRpYSwgJmNvcHk7IE9wZW5TdHJlZXRNYXAgY29udHJpYnV0b3JzJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgRGFya0dyYXlMYWJlbHM6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvQ2FudmFzL1dvcmxkX0RhcmtfR3JheV9SZWZlcmVuY2UvTWFwU2VydmVyL3RpbGUve3p9L3t5fS97eH0nLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgIG1pblpvb206IDEsXHJcbiAgICAgICAgICBtYXhab29tOiAxNixcclxuICAgICAgICAgIHN1YmRvbWFpbnM6IFsnc2VydmVyJywgJ3NlcnZpY2VzJ10sXHJcbiAgICAgICAgICBwYW5lOiAocG9pbnRlckV2ZW50cykgPyAnZXNyaS1sYWJlbHMnIDogJ3RpbGVQYW5lJyxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnJ1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIEdyYXk6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvQ2FudmFzL1dvcmxkX0xpZ2h0X0dyYXlfQmFzZS9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDE2LFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnSEVSRSwgRGVMb3JtZSwgTWFwbXlJbmRpYSwgJmNvcHk7IE9wZW5TdHJlZXRNYXAgY29udHJpYnV0b3JzJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgR3JheUxhYmVsczoge1xyXG4gICAgICAgIHVybFRlbXBsYXRlOiB0aWxlUHJvdG9jb2wgKyAnLy97c30uYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9DYW52YXMvV29ybGRfTGlnaHRfR3JheV9SZWZlcmVuY2UvTWFwU2VydmVyL3RpbGUve3p9L3t5fS97eH0nLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgIG1pblpvb206IDEsXHJcbiAgICAgICAgICBtYXhab29tOiAxNixcclxuICAgICAgICAgIHN1YmRvbWFpbnM6IFsnc2VydmVyJywgJ3NlcnZpY2VzJ10sXHJcbiAgICAgICAgICBwYW5lOiAocG9pbnRlckV2ZW50cykgPyAnZXNyaS1sYWJlbHMnIDogJ3RpbGVQYW5lJyxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgSW1hZ2VyeToge1xyXG4gICAgICAgIHVybFRlbXBsYXRlOiB0aWxlUHJvdG9jb2wgKyAnLy97c30uYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9Xb3JsZF9JbWFnZXJ5L01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9JyxcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICBtaW5ab29tOiAxLFxyXG4gICAgICAgICAgbWF4Wm9vbTogMTksXHJcbiAgICAgICAgICBzdWJkb21haW5zOiBbJ3NlcnZlcicsICdzZXJ2aWNlcyddLFxyXG4gICAgICAgICAgYXR0cmlidXRpb246ICdEaWdpdGFsR2xvYmUsIEdlb0V5ZSwgaS1jdWJlZCwgVVNEQSwgVVNHUywgQUVYLCBHZXRtYXBwaW5nLCBBZXJvZ3JpZCwgSUdOLCBJR1AsIHN3aXNzdG9wbywgYW5kIHRoZSBHSVMgVXNlciBDb21tdW5pdHknXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBJbWFnZXJ5TGFiZWxzOiB7XHJcbiAgICAgICAgdXJsVGVtcGxhdGU6IHRpbGVQcm90b2NvbCArICcvL3tzfS5hcmNnaXNvbmxpbmUuY29tL0FyY0dJUy9yZXN0L3NlcnZpY2VzL1JlZmVyZW5jZS9Xb3JsZF9Cb3VuZGFyaWVzX2FuZF9QbGFjZXMvTWFwU2VydmVyL3RpbGUve3p9L3t5fS97eH0nLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgIG1pblpvb206IDEsXHJcbiAgICAgICAgICBtYXhab29tOiAxOSxcclxuICAgICAgICAgIHN1YmRvbWFpbnM6IFsnc2VydmVyJywgJ3NlcnZpY2VzJ10sXHJcbiAgICAgICAgICBwYW5lOiAocG9pbnRlckV2ZW50cykgPyAnZXNyaS1sYWJlbHMnIDogJ3RpbGVQYW5lJyxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgSW1hZ2VyeVRyYW5zcG9ydGF0aW9uOiB7XHJcbiAgICAgICAgdXJsVGVtcGxhdGU6IHRpbGVQcm90b2NvbCArICcvL3tzfS5hcmNnaXNvbmxpbmUuY29tL0FyY0dJUy9yZXN0L3NlcnZpY2VzL1JlZmVyZW5jZS9Xb3JsZF9UcmFuc3BvcnRhdGlvbi9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDE5LFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIHBhbmU6IChwb2ludGVyRXZlbnRzKSA/ICdlc3JpLWxhYmVscycgOiAndGlsZVBhbmUnXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBTaGFkZWRSZWxpZWY6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvV29ybGRfU2hhZGVkX1JlbGllZi9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDEzLFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnVVNHUydcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIFNoYWRlZFJlbGllZkxhYmVsczoge1xyXG4gICAgICAgIHVybFRlbXBsYXRlOiB0aWxlUHJvdG9jb2wgKyAnLy97c30uYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9SZWZlcmVuY2UvV29ybGRfQm91bmRhcmllc19hbmRfUGxhY2VzX0FsdGVybmF0ZS9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDEyLFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIHBhbmU6IChwb2ludGVyRXZlbnRzKSA/ICdlc3JpLWxhYmVscycgOiAndGlsZVBhbmUnLFxyXG4gICAgICAgICAgYXR0cmlidXRpb246ICcnXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBUZXJyYWluOiB7XHJcbiAgICAgICAgdXJsVGVtcGxhdGU6IHRpbGVQcm90b2NvbCArICcvL3tzfS5hcmNnaXNvbmxpbmUuY29tL0FyY0dJUy9yZXN0L3NlcnZpY2VzL1dvcmxkX1RlcnJhaW5fQmFzZS9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDEzLFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnVVNHUywgTk9BQSdcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIFRlcnJhaW5MYWJlbHM6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvUmVmZXJlbmNlL1dvcmxkX1JlZmVyZW5jZV9PdmVybGF5L01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9JyxcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICBtaW5ab29tOiAxLFxyXG4gICAgICAgICAgbWF4Wm9vbTogMTMsXHJcbiAgICAgICAgICBzdWJkb21haW5zOiBbJ3NlcnZlcicsICdzZXJ2aWNlcyddLFxyXG4gICAgICAgICAgcGFuZTogKHBvaW50ZXJFdmVudHMpID8gJ2VzcmktbGFiZWxzJyA6ICd0aWxlUGFuZScsXHJcbiAgICAgICAgICBhdHRyaWJ1dGlvbjogJydcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIFVTQVRvcG86IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvVVNBX1RvcG9fTWFwcy9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDE1LFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnVVNHUywgTmF0aW9uYWwgR2VvZ3JhcGhpYyBTb2NpZXR5LCBpLWN1YmVkJ1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChrZXksIG9wdGlvbnMpIHtcclxuICAgIHZhciBjb25maWc7XHJcblxyXG4gICAgLy8gc2V0IHRoZSBjb25maWcgdmFyaWFibGUgd2l0aCB0aGUgYXBwcm9wcmlhdGUgY29uZmlnIG9iamVjdFxyXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmIGtleS51cmxUZW1wbGF0ZSAmJiBrZXkub3B0aW9ucykge1xyXG4gICAgICBjb25maWcgPSBrZXk7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIEJhc2VtYXBMYXllci5USUxFU1trZXldKSB7XHJcbiAgICAgIGNvbmZpZyA9IEJhc2VtYXBMYXllci5USUxFU1trZXldO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdMLmVzcmkuQmFzZW1hcExheWVyOiBJbnZhbGlkIHBhcmFtZXRlci4gVXNlIG9uZSBvZiBcIlN0cmVldHNcIiwgXCJUb3BvZ3JhcGhpY1wiLCBcIk9jZWFuc1wiLCBcIk9jZWFuc0xhYmVsc1wiLCBcIk5hdGlvbmFsR2VvZ3JhcGhpY1wiLCBcIkdyYXlcIiwgXCJHcmF5TGFiZWxzXCIsIFwiRGFya0dyYXlcIiwgXCJEYXJrR3JheUxhYmVsc1wiLCBcIkltYWdlcnlcIiwgXCJJbWFnZXJ5TGFiZWxzXCIsIFwiSW1hZ2VyeVRyYW5zcG9ydGF0aW9uXCIsIFwiU2hhZGVkUmVsaWVmXCIsIFwiU2hhZGVkUmVsaWVmTGFiZWxzXCIsIFwiVGVycmFpblwiLCBcIlRlcnJhaW5MYWJlbHNcIiBvciBcIlVTQVRvcG9cIicpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG1lcmdlIHBhc3NlZCBvcHRpb25zIGludG8gdGhlIGNvbmZpZyBvcHRpb25zXHJcbiAgICB2YXIgdGlsZU9wdGlvbnMgPSBVdGlsLmV4dGVuZChjb25maWcub3B0aW9ucywgb3B0aW9ucyk7XHJcblxyXG4gICAgVXRpbC5zZXRPcHRpb25zKHRoaXMsIHRpbGVPcHRpb25zKTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRva2VuKSB7XHJcbiAgICAgIGNvbmZpZy51cmxUZW1wbGF0ZSArPSAoJz90b2tlbj0nICsgdGhpcy5vcHRpb25zLnRva2VuKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjYWxsIHRoZSBpbml0aWFsaXplIG1ldGhvZCBvbiBMLlRpbGVMYXllciB0byBzZXQgZXZlcnl0aGluZyB1cFxyXG4gICAgVGlsZUxheWVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgY29uZmlnLnVybFRlbXBsYXRlLCB0aWxlT3B0aW9ucyk7XHJcbiAgfSxcclxuXHJcbiAgb25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIC8vIGluY2x1ZGUgJ1Bvd2VyZWQgYnkgRXNyaScgaW4gbWFwIGF0dHJpYnV0aW9uXHJcbiAgICBzZXRFc3JpQXR0cmlidXRpb24obWFwKTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnBhbmUgPT09ICdlc3JpLWxhYmVscycpIHtcclxuICAgICAgdGhpcy5faW5pdFBhbmUoKTtcclxuICAgIH1cclxuICAgIC8vIHNvbWUgYmFzZW1hcHMgY2FuIHN1cHBseSBkeW5hbWljIGF0dHJpYnV0aW9uXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmF0dHJpYnV0aW9uVXJsKSB7XHJcbiAgICAgIF9nZXRBdHRyaWJ1dGlvbkRhdGEodGhpcy5vcHRpb25zLmF0dHJpYnV0aW9uVXJsLCBtYXApO1xyXG4gICAgfVxyXG5cclxuICAgIG1hcC5vbignbW92ZWVuZCcsIF91cGRhdGVNYXBBdHRyaWJ1dGlvbik7XHJcblxyXG4gICAgVGlsZUxheWVyLnByb3RvdHlwZS5vbkFkZC5jYWxsKHRoaXMsIG1hcCk7XHJcbiAgfSxcclxuXHJcbiAgb25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIG1hcC5vZmYoJ21vdmVlbmQnLCBfdXBkYXRlTWFwQXR0cmlidXRpb24pO1xyXG4gICAgVGlsZUxheWVyLnByb3RvdHlwZS5vblJlbW92ZS5jYWxsKHRoaXMsIG1hcCk7XHJcbiAgfSxcclxuXHJcbiAgX2luaXRQYW5lOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXRoaXMuX21hcC5nZXRQYW5lKHRoaXMub3B0aW9ucy5wYW5lKSkge1xyXG4gICAgICB2YXIgcGFuZSA9IHRoaXMuX21hcC5jcmVhdGVQYW5lKHRoaXMub3B0aW9ucy5wYW5lKTtcclxuICAgICAgcGFuZS5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xyXG4gICAgICBwYW5lLnN0eWxlLnpJbmRleCA9IDUwMDtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBnZXRBdHRyaWJ1dGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdHRyaWJ1dGlvbikge1xyXG4gICAgICB2YXIgYXR0cmlidXRpb24gPSAnPHNwYW4gY2xhc3M9XCJlc3JpLWR5bmFtaWMtYXR0cmlidXRpb25cIj4nICsgdGhpcy5vcHRpb25zLmF0dHJpYnV0aW9uICsgJzwvc3Bhbj4nO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGF0dHJpYnV0aW9uO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYmFzZW1hcExheWVyIChrZXksIG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IEJhc2VtYXBMYXllcihrZXksIG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBiYXNlbWFwTGF5ZXI7XHJcbiIsImltcG9ydCB7IFRpbGVMYXllciwgVXRpbCB9IGZyb20gJ2xlYWZsZXQnO1xyXG5pbXBvcnQgeyB3YXJuLCBjbGVhblVybCwgc2V0RXNyaUF0dHJpYnV0aW9uIH0gZnJvbSAnLi4vVXRpbCc7XHJcbmltcG9ydCBtYXBTZXJ2aWNlIGZyb20gJy4uL1NlcnZpY2VzL01hcFNlcnZpY2UnO1xyXG5cclxuZXhwb3J0IHZhciBUaWxlZE1hcExheWVyID0gVGlsZUxheWVyLmV4dGVuZCh7XHJcbiAgb3B0aW9uczoge1xyXG4gICAgem9vbU9mZnNldEFsbG93YW5jZTogMC4xLFxyXG4gICAgZXJyb3JUaWxlVXJsOiAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFRQUFBQUVBQkFNQUFBQ3VYTFZWQUFBQUExQk1WRVV6TkRWc3psSEhBQUFBQVhSU1RsTUFRT2JZWmdBQUFBbHdTRmx6QUFBQUFBQUFBQUFCNm1VV3BBQUFBRFpKUkVGVWVKenR3UUVCQUFBQWdpRC9yMjVJUUFFQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUE3d2FCQUFBQncwOFJ3QUFBQUFCSlJVNUVya0pnZ2c9PSdcclxuICB9LFxyXG5cclxuICBzdGF0aWNzOiB7XHJcbiAgICBNZXJjYXRvclpvb21MZXZlbHM6IHtcclxuICAgICAgJzAnOiAxNTY1NDMuMDMzOTI3OTk5OTksXHJcbiAgICAgICcxJzogNzgyNzEuNTE2OTYzOTk5ODkzLFxyXG4gICAgICAnMic6IDM5MTM1Ljc1ODQ4MjAwMDA5OSxcclxuICAgICAgJzMnOiAxOTU2Ny44NzkyNDA5OTk5MDEsXHJcbiAgICAgICc0JzogOTc4My45Mzk2MjA0OTk5NTkzLFxyXG4gICAgICAnNSc6IDQ4OTEuOTY5ODEwMjQ5OTc5NyxcclxuICAgICAgJzYnOiAyNDQ1Ljk4NDkwNTEyNDk4OTgsXHJcbiAgICAgICc3JzogMTIyMi45OTI0NTI1NjI0ODk5LFxyXG4gICAgICAnOCc6IDYxMS40OTYyMjYyODEzODAwMixcclxuICAgICAgJzknOiAzMDUuNzQ4MTEzMTQwNTU4MDIsXHJcbiAgICAgICcxMCc6IDE1Mi44NzQwNTY1NzA0MTEsXHJcbiAgICAgICcxMSc6IDc2LjQzNzAyODI4NTA3MzE5NyxcclxuICAgICAgJzEyJzogMzguMjE4NTE0MTQyNTM2NTk4LFxyXG4gICAgICAnMTMnOiAxOS4xMDkyNTcwNzEyNjgyOTksXHJcbiAgICAgICcxNCc6IDkuNTU0NjI4NTM1NjM0MTQ5NixcclxuICAgICAgJzE1JzogNC43NzczMTQyNjc5NDkzNjk5LFxyXG4gICAgICAnMTYnOiAyLjM4ODY1NzEzMzk3NDY4LFxyXG4gICAgICAnMTcnOiAxLjE5NDMyODU2Njg1NTA1MDEsXHJcbiAgICAgICcxOCc6IDAuNTk3MTY0MjgzNTU5ODE2OTksXHJcbiAgICAgICcxOSc6IDAuMjk4NTgyMTQxNjQ3NjE2OTgsXHJcbiAgICAgICcyMCc6IDAuMTQ5MjkxMDcwODIzODEsXHJcbiAgICAgICcyMSc6IDAuMDc0NjQ1NTM1NDExOTEsXHJcbiAgICAgICcyMic6IDAuMDM3MzIyNzY3NzA1OTUyNSxcclxuICAgICAgJzIzJzogMC4wMTg2NjEzODM4NTI5NzYzXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMudXJsID0gY2xlYW5Vcmwob3B0aW9ucy51cmwpO1xyXG4gICAgb3B0aW9ucyA9IFV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcclxuXHJcbiAgICAvLyBzZXQgdGhlIHVybHNcclxuICAgIHRoaXMudGlsZVVybCA9IG9wdGlvbnMudXJsICsgJ3RpbGUve3p9L3t5fS97eH0nO1xyXG4gICAgLy8gUmVtb3ZlIHN1YmRvbWFpbiBpbiB1cmxcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9Fc3JpL2VzcmktbGVhZmxldC9pc3N1ZXMvOTkxXHJcbiAgICBpZiAob3B0aW9ucy51cmwuaW5kZXhPZigne3N9JykgIT09IC0xICYmIG9wdGlvbnMuc3ViZG9tYWlucykge1xyXG4gICAgICBvcHRpb25zLnVybCA9IG9wdGlvbnMudXJsLnJlcGxhY2UoJ3tzfScsIG9wdGlvbnMuc3ViZG9tYWluc1swXSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnNlcnZpY2UgPSBtYXBTZXJ2aWNlKG9wdGlvbnMpO1xyXG4gICAgdGhpcy5zZXJ2aWNlLmFkZEV2ZW50UGFyZW50KHRoaXMpO1xyXG5cclxuICAgIHZhciBhcmNnaXNvbmxpbmUgPSBuZXcgUmVnRXhwKC90aWxlcy5hcmNnaXMob25saW5lKT9cXC5jb20vZyk7XHJcbiAgICBpZiAoYXJjZ2lzb25saW5lLnRlc3Qob3B0aW9ucy51cmwpKSB7XHJcbiAgICAgIHRoaXMudGlsZVVybCA9IHRoaXMudGlsZVVybC5yZXBsYWNlKCc6Ly90aWxlcycsICc6Ly90aWxlc3tzfScpO1xyXG4gICAgICBvcHRpb25zLnN1YmRvbWFpbnMgPSBbJzEnLCAnMicsICczJywgJzQnXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRva2VuKSB7XHJcbiAgICAgIHRoaXMudGlsZVVybCArPSAoJz90b2tlbj0nICsgdGhpcy5vcHRpb25zLnRva2VuKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpbml0IGxheWVyIGJ5IGNhbGxpbmcgVGlsZUxheWVycyBpbml0aWFsaXplIG1ldGhvZFxyXG4gICAgVGlsZUxheWVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgdGhpcy50aWxlVXJsLCBvcHRpb25zKTtcclxuICB9LFxyXG5cclxuICBnZXRUaWxlVXJsOiBmdW5jdGlvbiAodGlsZVBvaW50KSB7XHJcbiAgICB2YXIgem9vbSA9IHRoaXMuX2dldFpvb21Gb3JVcmwoKTtcclxuXHJcbiAgICByZXR1cm4gVXRpbC50ZW1wbGF0ZSh0aGlzLnRpbGVVcmwsIFV0aWwuZXh0ZW5kKHtcclxuICAgICAgczogdGhpcy5fZ2V0U3ViZG9tYWluKHRpbGVQb2ludCksXHJcbiAgICAgIHg6IHRpbGVQb2ludC54LFxyXG4gICAgICB5OiB0aWxlUG9pbnQueSxcclxuICAgICAgLy8gdHJ5IGxvZCBtYXAgZmlyc3QsIHRoZW4ganVzdCBkZWZhdWx0IHRvIHpvb20gbGV2ZWxcclxuICAgICAgejogKHRoaXMuX2xvZE1hcCAmJiB0aGlzLl9sb2RNYXBbem9vbV0pID8gdGhpcy5fbG9kTWFwW3pvb21dIDogem9vbVxyXG4gICAgfSwgdGhpcy5vcHRpb25zKSk7XHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlVGlsZTogZnVuY3Rpb24gKGNvb3JkcywgZG9uZSkge1xyXG4gICAgdmFyIHRpbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuXHJcbiAgICBMLkRvbUV2ZW50Lm9uKHRpbGUsICdsb2FkJywgTC5iaW5kKHRoaXMuX3RpbGVPbkxvYWQsIHRoaXMsIGRvbmUsIHRpbGUpKTtcclxuICAgIEwuRG9tRXZlbnQub24odGlsZSwgJ2Vycm9yJywgTC5iaW5kKHRoaXMuX3RpbGVPbkVycm9yLCB0aGlzLCBkb25lLCB0aWxlKSk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jcm9zc09yaWdpbikge1xyXG4gICAgICB0aWxlLmNyb3NzT3JpZ2luID0gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICBBbHQgdGFnIGlzIHNldCB0byBlbXB0eSBzdHJpbmcgdG8ga2VlcCBzY3JlZW4gcmVhZGVycyBmcm9tIHJlYWRpbmcgVVJMIGFuZCBmb3IgY29tcGxpYW5jZSByZWFzb25zXHJcbiAgICAgaHR0cDovL3d3dy53My5vcmcvVFIvV0NBRzIwLVRFQ0hTL0g2N1xyXG4gICAgKi9cclxuICAgIHRpbGUuYWx0ID0gJyc7XHJcblxyXG4gICAgLy8gaWYgdGhlcmUgaXMgbm8gbG9kIG1hcCBvciBhbiBsb2QgbWFwIHdpdGggYSBwcm9wZXIgem9vbSBsb2FkIHRoZSB0aWxlXHJcbiAgICAvLyBvdGhlcndpc2Ugd2FpdCBmb3IgdGhlIGxvZCBtYXAgdG8gYmVjb21lIGF2YWlsYWJsZVxyXG4gICAgaWYgKCF0aGlzLl9sb2RNYXAgfHwgKHRoaXMuX2xvZE1hcCAmJiB0aGlzLl9sb2RNYXBbdGhpcy5fZ2V0Wm9vbUZvclVybCgpXSkpIHtcclxuICAgICAgdGlsZS5zcmMgPSB0aGlzLmdldFRpbGVVcmwoY29vcmRzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMub25jZSgnbG9kbWFwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRpbGUuc3JjID0gdGhpcy5nZXRUaWxlVXJsKGNvb3Jkcyk7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aWxlO1xyXG4gIH0sXHJcblxyXG4gIG9uQWRkOiBmdW5jdGlvbiAobWFwKSB7XHJcbiAgICAvLyBpbmNsdWRlICdQb3dlcmVkIGJ5IEVzcmknIGluIG1hcCBhdHRyaWJ1dGlvblxyXG4gICAgc2V0RXNyaUF0dHJpYnV0aW9uKG1hcCk7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9sb2RNYXApIHtcclxuICAgICAgdGhpcy5tZXRhZGF0YShmdW5jdGlvbiAoZXJyb3IsIG1ldGFkYXRhKSB7XHJcbiAgICAgICAgaWYgKCFlcnJvciAmJiBtZXRhZGF0YS5zcGF0aWFsUmVmZXJlbmNlKSB7XHJcbiAgICAgICAgICB2YXIgc3IgPSBtZXRhZGF0YS5zcGF0aWFsUmVmZXJlbmNlLmxhdGVzdFdraWQgfHwgbWV0YWRhdGEuc3BhdGlhbFJlZmVyZW5jZS53a2lkO1xyXG4gICAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYXR0cmlidXRpb24gJiYgbWFwLmF0dHJpYnV0aW9uQ29udHJvbCAmJiBtZXRhZGF0YS5jb3B5cmlnaHRUZXh0KSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hdHRyaWJ1dGlvbiA9IG1ldGFkYXRhLmNvcHlyaWdodFRleHQ7XHJcbiAgICAgICAgICAgIG1hcC5hdHRyaWJ1dGlvbkNvbnRyb2wuYWRkQXR0cmlidXRpb24odGhpcy5nZXRBdHRyaWJ1dGlvbigpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChtYXAub3B0aW9ucy5jcnMgPT09IEwuQ1JTLkVQU0czODU3ICYmIHNyID09PSAxMDIxMDAgfHwgc3IgPT09IDM4NTcpIHtcclxuICAgICAgICAgICAgdGhpcy5fbG9kTWFwID0ge307XHJcbiAgICAgICAgICAgIC8vIGNyZWF0ZSB0aGUgem9vbSBsZXZlbCBkYXRhXHJcbiAgICAgICAgICAgIHZhciBhcmNnaXNMT0RzID0gbWV0YWRhdGEudGlsZUluZm8ubG9kcztcclxuICAgICAgICAgICAgdmFyIGNvcnJlY3RSZXNvbHV0aW9ucyA9IFRpbGVkTWFwTGF5ZXIuTWVyY2F0b3Jab29tTGV2ZWxzO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmNnaXNMT0RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgdmFyIGFyY2dpc0xPRCA9IGFyY2dpc0xPRHNbaV07XHJcbiAgICAgICAgICAgICAgZm9yICh2YXIgY2kgaW4gY29ycmVjdFJlc29sdXRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29ycmVjdFJlcyA9IGNvcnJlY3RSZXNvbHV0aW9uc1tjaV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3dpdGhpblBlcmNlbnRhZ2UoYXJjZ2lzTE9ELnJlc29sdXRpb24sIGNvcnJlY3RSZXMsIHRoaXMub3B0aW9ucy56b29tT2Zmc2V0QWxsb3dhbmNlKSkge1xyXG4gICAgICAgICAgICAgICAgICB0aGlzLl9sb2RNYXBbY2ldID0gYXJjZ2lzTE9ELmxldmVsO1xyXG4gICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnbG9kbWFwJyk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoIXByb2o0KSB7XHJcbiAgICAgICAgICAgICAgd2FybignTC5lc3JpLlRpbGVkTWFwTGF5ZXIgaXMgdXNpbmcgYSBub24tbWVyY2F0b3Igc3BhdGlhbCByZWZlcmVuY2UuIFN1cHBvcnQgbWF5IGJlIGF2YWlsYWJsZSB0aHJvdWdoIFByb2o0TGVhZmxldCBodHRwOi8vZXNyaS5naXRodWIuaW8vZXNyaS1sZWFmbGV0L2V4YW1wbGVzL25vbi1tZXJjYXRvci1wcm9qZWN0aW9uLmh0bWwnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgVGlsZUxheWVyLnByb3RvdHlwZS5vbkFkZC5jYWxsKHRoaXMsIG1hcCk7XHJcbiAgfSxcclxuXHJcbiAgbWV0YWRhdGE6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5zZXJ2aWNlLm1ldGFkYXRhKGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGlkZW50aWZ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLmlkZW50aWZ5KCk7XHJcbiAgfSxcclxuXHJcbiAgZmluZDogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VydmljZS5maW5kKCk7XHJcbiAgfSxcclxuXHJcbiAgcXVlcnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UucXVlcnkoKTtcclxuICB9LFxyXG5cclxuICBhdXRoZW50aWNhdGU6IGZ1bmN0aW9uICh0b2tlbikge1xyXG4gICAgdmFyIHRva2VuUXMgPSAnP3Rva2VuPScgKyB0b2tlbjtcclxuICAgIHRoaXMudGlsZVVybCA9ICh0aGlzLm9wdGlvbnMudG9rZW4pID8gdGhpcy50aWxlVXJsLnJlcGxhY2UoL1xcP3Rva2VuPSguKykvZywgdG9rZW5RcykgOiB0aGlzLnRpbGVVcmwgKyB0b2tlblFzO1xyXG4gICAgdGhpcy5vcHRpb25zLnRva2VuID0gdG9rZW47XHJcbiAgICB0aGlzLnNlcnZpY2UuYXV0aGVudGljYXRlKHRva2VuKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIF93aXRoaW5QZXJjZW50YWdlOiBmdW5jdGlvbiAoYSwgYiwgcGVyY2VudGFnZSkge1xyXG4gICAgdmFyIGRpZmYgPSBNYXRoLmFicygoYSAvIGIpIC0gMSk7XHJcbiAgICByZXR1cm4gZGlmZiA8IHBlcmNlbnRhZ2U7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0aWxlZE1hcExheWVyICh1cmwsIG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IFRpbGVkTWFwTGF5ZXIodXJsLCBvcHRpb25zKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgdGlsZWRNYXBMYXllcjtcclxuIiwiaW1wb3J0IHsgSW1hZ2VPdmVybGF5LCBDUlMsIERvbVV0aWwsIFV0aWwsIExheWVyLCBwb3B1cCwgbGF0TG5nLCBib3VuZHMgfSBmcm9tICdsZWFmbGV0JztcclxuaW1wb3J0IHsgY29ycyB9IGZyb20gJy4uL1N1cHBvcnQnO1xyXG5pbXBvcnQgeyBzZXRFc3JpQXR0cmlidXRpb24gfSBmcm9tICcuLi9VdGlsJztcclxuXHJcbnZhciBPdmVybGF5ID0gSW1hZ2VPdmVybGF5LmV4dGVuZCh7XHJcbiAgb25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIHRoaXMuX3RvcExlZnQgPSBtYXAuZ2V0UGl4ZWxCb3VuZHMoKS5taW47XHJcbiAgICBJbWFnZU92ZXJsYXkucHJvdG90eXBlLm9uQWRkLmNhbGwodGhpcywgbWFwKTtcclxuICB9LFxyXG4gIF9yZXNldDogZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMuX21hcC5vcHRpb25zLmNycyA9PT0gQ1JTLkVQU0czODU3KSB7XHJcbiAgICAgIEltYWdlT3ZlcmxheS5wcm90b3R5cGUuX3Jlc2V0LmNhbGwodGhpcyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBEb21VdGlsLnNldFBvc2l0aW9uKHRoaXMuX2ltYWdlLCB0aGlzLl90b3BMZWZ0LnN1YnRyYWN0KHRoaXMuX21hcC5nZXRQaXhlbE9yaWdpbigpKSk7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCB2YXIgUmFzdGVyTGF5ZXIgPSBMYXllci5leHRlbmQoe1xyXG4gIG9wdGlvbnM6IHtcclxuICAgIG9wYWNpdHk6IDEsXHJcbiAgICBwb3NpdGlvbjogJ2Zyb250JyxcclxuICAgIGY6ICdpbWFnZScsXHJcbiAgICB1c2VDb3JzOiBjb3JzLFxyXG4gICAgYXR0cmlidXRpb246IG51bGwsXHJcbiAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXHJcbiAgICBhbHQ6ICcnXHJcbiAgfSxcclxuXHJcbiAgb25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIC8vIGluY2x1ZGUgJ1Bvd2VyZWQgYnkgRXNyaScgaW4gbWFwIGF0dHJpYnV0aW9uXHJcbiAgICBzZXRFc3JpQXR0cmlidXRpb24obWFwKTtcclxuXHJcbiAgICB0aGlzLl91cGRhdGUgPSBVdGlsLnRocm90dGxlKHRoaXMuX3VwZGF0ZSwgdGhpcy5vcHRpb25zLnVwZGF0ZUludGVydmFsLCB0aGlzKTtcclxuXHJcbiAgICBtYXAub24oJ21vdmVlbmQnLCB0aGlzLl91cGRhdGUsIHRoaXMpO1xyXG5cclxuICAgIC8vIGlmIHdlIGhhZCBhbiBpbWFnZSBsb2FkZWQgYW5kIGl0IG1hdGNoZXMgdGhlXHJcbiAgICAvLyBjdXJyZW50IGJvdW5kcyBzaG93IHRoZSBpbWFnZSBvdGhlcndpc2UgcmVtb3ZlIGl0XHJcbiAgICBpZiAodGhpcy5fY3VycmVudEltYWdlICYmIHRoaXMuX2N1cnJlbnRJbWFnZS5fYm91bmRzLmVxdWFscyh0aGlzLl9tYXAuZ2V0Qm91bmRzKCkpKSB7XHJcbiAgICAgIG1hcC5hZGRMYXllcih0aGlzLl9jdXJyZW50SW1hZ2UpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLl9jdXJyZW50SW1hZ2UpIHtcclxuICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKHRoaXMuX2N1cnJlbnRJbWFnZSk7XHJcbiAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgaWYgKHRoaXMuX3BvcHVwKSB7XHJcbiAgICAgIHRoaXMuX21hcC5vbignY2xpY2snLCB0aGlzLl9nZXRQb3B1cERhdGEsIHRoaXMpO1xyXG4gICAgICB0aGlzLl9tYXAub24oJ2RibGNsaWNrJywgdGhpcy5fcmVzZXRQb3B1cFN0YXRlLCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgY29weXJpZ2h0IHRleHQgbGlzdGVkIGluIHNlcnZpY2UgbWV0YWRhdGFcclxuICAgIHRoaXMubWV0YWRhdGEoZnVuY3Rpb24gKGVyciwgbWV0YWRhdGEpIHtcclxuICAgICAgaWYgKCFlcnIgJiYgIXRoaXMub3B0aW9ucy5hdHRyaWJ1dGlvbiAmJiBtYXAuYXR0cmlidXRpb25Db250cm9sICYmIG1ldGFkYXRhLmNvcHlyaWdodFRleHQpIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMuYXR0cmlidXRpb24gPSBtZXRhZGF0YS5jb3B5cmlnaHRUZXh0O1xyXG4gICAgICAgIG1hcC5hdHRyaWJ1dGlvbkNvbnRyb2wuYWRkQXR0cmlidXRpb24odGhpcy5nZXRBdHRyaWJ1dGlvbigpKTtcclxuICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgb25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIGlmICh0aGlzLl9jdXJyZW50SW1hZ2UpIHtcclxuICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKHRoaXMuX2N1cnJlbnRJbWFnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuX3BvcHVwKSB7XHJcbiAgICAgIHRoaXMuX21hcC5vZmYoJ2NsaWNrJywgdGhpcy5fZ2V0UG9wdXBEYXRhLCB0aGlzKTtcclxuICAgICAgdGhpcy5fbWFwLm9mZignZGJsY2xpY2snLCB0aGlzLl9yZXNldFBvcHVwU3RhdGUsIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX21hcC5vZmYoJ21vdmVlbmQnLCB0aGlzLl91cGRhdGUsIHRoaXMpO1xyXG4gIH0sXHJcblxyXG4gIGJpbmRQb3B1cDogZnVuY3Rpb24gKGZuLCBwb3B1cE9wdGlvbnMpIHtcclxuICAgIHRoaXMuX3Nob3VsZFJlbmRlclBvcHVwID0gZmFsc2U7XHJcbiAgICB0aGlzLl9sYXN0Q2xpY2sgPSBmYWxzZTtcclxuICAgIHRoaXMuX3BvcHVwID0gcG9wdXAocG9wdXBPcHRpb25zKTtcclxuICAgIHRoaXMuX3BvcHVwRnVuY3Rpb24gPSBmbjtcclxuICAgIGlmICh0aGlzLl9tYXApIHtcclxuICAgICAgdGhpcy5fbWFwLm9uKCdjbGljaycsIHRoaXMuX2dldFBvcHVwRGF0YSwgdGhpcyk7XHJcbiAgICAgIHRoaXMuX21hcC5vbignZGJsY2xpY2snLCB0aGlzLl9yZXNldFBvcHVwU3RhdGUsIHRoaXMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgdW5iaW5kUG9wdXA6IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLl9tYXApIHtcclxuICAgICAgdGhpcy5fbWFwLmNsb3NlUG9wdXAodGhpcy5fcG9wdXApO1xyXG4gICAgICB0aGlzLl9tYXAub2ZmKCdjbGljaycsIHRoaXMuX2dldFBvcHVwRGF0YSwgdGhpcyk7XHJcbiAgICAgIHRoaXMuX21hcC5vZmYoJ2RibGNsaWNrJywgdGhpcy5fcmVzZXRQb3B1cFN0YXRlLCB0aGlzKTtcclxuICAgIH1cclxuICAgIHRoaXMuX3BvcHVwID0gZmFsc2U7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBicmluZ1RvRnJvbnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbiA9ICdmcm9udCc7XHJcbiAgICBpZiAodGhpcy5fY3VycmVudEltYWdlKSB7XHJcbiAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZS5icmluZ1RvRnJvbnQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGJyaW5nVG9CYWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMucG9zaXRpb24gPSAnYmFjayc7XHJcbiAgICBpZiAodGhpcy5fY3VycmVudEltYWdlKSB7XHJcbiAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZS5icmluZ1RvQmFjaygpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZ2V0QXR0cmlidXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYXR0cmlidXRpb247XHJcbiAgfSxcclxuXHJcbiAgZ2V0T3BhY2l0eTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5vcGFjaXR5O1xyXG4gIH0sXHJcblxyXG4gIHNldE9wYWNpdHk6IGZ1bmN0aW9uIChvcGFjaXR5KSB7XHJcbiAgICB0aGlzLm9wdGlvbnMub3BhY2l0eSA9IG9wYWNpdHk7XHJcbiAgICBpZiAodGhpcy5fY3VycmVudEltYWdlKSB7XHJcbiAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZS5zZXRPcGFjaXR5KG9wYWNpdHkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZ2V0VGltZVJhbmdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gW3RoaXMub3B0aW9ucy5mcm9tLCB0aGlzLm9wdGlvbnMudG9dO1xyXG4gIH0sXHJcblxyXG4gIHNldFRpbWVSYW5nZTogZnVuY3Rpb24gKGZyb20sIHRvKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMuZnJvbSA9IGZyb207XHJcbiAgICB0aGlzLm9wdGlvbnMudG8gPSB0bztcclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgbWV0YWRhdGE6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5zZXJ2aWNlLm1ldGFkYXRhKGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGF1dGhlbnRpY2F0ZTogZnVuY3Rpb24gKHRva2VuKSB7XHJcbiAgICB0aGlzLnNlcnZpY2UuYXV0aGVudGljYXRlKHRva2VuKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIHJlZHJhdzogZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgfSxcclxuXHJcbiAgX3JlbmRlckltYWdlOiBmdW5jdGlvbiAodXJsLCBib3VuZHMsIGNvbnRlbnRUeXBlKSB7XHJcbiAgICBpZiAodGhpcy5fbWFwKSB7XHJcbiAgICAgIC8vIGlmIG5vIG91dHB1dCBkaXJlY3RvcnkgaGFzIGJlZW4gc3BlY2lmaWVkIGZvciBhIHNlcnZpY2UsIE1JTUUgZGF0YSB3aWxsIGJlIHJldHVybmVkXHJcbiAgICAgIGlmIChjb250ZW50VHlwZSkge1xyXG4gICAgICAgIHVybCA9ICdkYXRhOicgKyBjb250ZW50VHlwZSArICc7YmFzZTY0LCcgKyB1cmw7XHJcbiAgICAgIH1cclxuICAgICAgLy8gY3JlYXRlIGEgbmV3IGltYWdlIG92ZXJsYXkgYW5kIGFkZCBpdCB0byB0aGUgbWFwXHJcbiAgICAgIC8vIHRvIHN0YXJ0IGxvYWRpbmcgdGhlIGltYWdlXHJcbiAgICAgIC8vIG9wYWNpdHkgaXMgMCB3aGlsZSB0aGUgaW1hZ2UgaXMgbG9hZGluZ1xyXG4gICAgICB2YXIgaW1hZ2UgPSBuZXcgT3ZlcmxheSh1cmwsIGJvdW5kcywge1xyXG4gICAgICAgIG9wYWNpdHk6IDAsXHJcbiAgICAgICAgY3Jvc3NPcmlnaW46IHRoaXMub3B0aW9ucy51c2VDb3JzLFxyXG4gICAgICAgIGFsdDogdGhpcy5vcHRpb25zLmFsdCxcclxuICAgICAgICBwYW5lOiB0aGlzLm9wdGlvbnMucGFuZSB8fCB0aGlzLmdldFBhbmUoKSxcclxuICAgICAgICBpbnRlcmFjdGl2ZTogdGhpcy5vcHRpb25zLmludGVyYWN0aXZlXHJcbiAgICAgIH0pLmFkZFRvKHRoaXMuX21hcCk7XHJcblxyXG4gICAgICB2YXIgb25PdmVybGF5RXJyb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKGltYWdlKTtcclxuICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJyk7XHJcbiAgICAgICAgaW1hZ2Uub2ZmKCdsb2FkJywgb25PdmVybGF5TG9hZCwgdGhpcyk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB2YXIgb25PdmVybGF5TG9hZCA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgaW1hZ2Uub2ZmKCdlcnJvcicsIG9uT3ZlcmxheUxvYWQsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0aGlzLl9tYXApIHtcclxuICAgICAgICAgIHZhciBuZXdJbWFnZSA9IGUudGFyZ2V0O1xyXG4gICAgICAgICAgdmFyIG9sZEltYWdlID0gdGhpcy5fY3VycmVudEltYWdlO1xyXG5cclxuICAgICAgICAgIC8vIGlmIHRoZSBib3VuZHMgb2YgdGhpcyBpbWFnZSBtYXRjaGVzIHRoZSBib3VuZHMgdGhhdFxyXG4gICAgICAgICAgLy8gX3JlbmRlckltYWdlIHdhcyBjYWxsZWQgd2l0aCBhbmQgd2UgaGF2ZSBhIG1hcCB3aXRoIHRoZSBzYW1lIGJvdW5kc1xyXG4gICAgICAgICAgLy8gaGlkZSB0aGUgb2xkIGltYWdlIGlmIHRoZXJlIGlzIG9uZSBhbmQgc2V0IHRoZSBvcGFjaXR5XHJcbiAgICAgICAgICAvLyBvZiB0aGUgbmV3IGltYWdlIG90aGVyd2lzZSByZW1vdmUgdGhlIG5ldyBpbWFnZVxyXG4gICAgICAgICAgaWYgKG5ld0ltYWdlLl9ib3VuZHMuZXF1YWxzKGJvdW5kcykgJiYgbmV3SW1hZ2UuX2JvdW5kcy5lcXVhbHModGhpcy5fbWFwLmdldEJvdW5kcygpKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SW1hZ2UgPSBuZXdJbWFnZTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucG9zaXRpb24gPT09ICdmcm9udCcpIHtcclxuICAgICAgICAgICAgICB0aGlzLmJyaW5nVG9Gcm9udCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuYnJpbmdUb0JhY2soKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX21hcCAmJiB0aGlzLl9jdXJyZW50SW1hZ2UuX21hcCkge1xyXG4gICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZS5zZXRPcGFjaXR5KHRoaXMub3B0aW9ucy5vcGFjaXR5KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW1hZ2UuX21hcC5yZW1vdmVMYXllcih0aGlzLl9jdXJyZW50SW1hZ2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAob2xkSW1hZ2UgJiYgdGhpcy5fbWFwKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKG9sZEltYWdlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG9sZEltYWdlICYmIG9sZEltYWdlLl9tYXApIHtcclxuICAgICAgICAgICAgICBvbGRJbWFnZS5fbWFwLnJlbW92ZUxheWVyKG9sZEltYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKG5ld0ltYWdlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZmlyZSgnbG9hZCcsIHtcclxuICAgICAgICAgIGJvdW5kczogYm91bmRzXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBJZiBsb2FkaW5nIHRoZSBpbWFnZSBmYWlsc1xyXG4gICAgICBpbWFnZS5vbmNlKCdlcnJvcicsIG9uT3ZlcmxheUVycm9yLCB0aGlzKTtcclxuXHJcbiAgICAgIC8vIG9uY2UgdGhlIGltYWdlIGxvYWRzXHJcbiAgICAgIGltYWdlLm9uY2UoJ2xvYWQnLCBvbk92ZXJsYXlMb2FkLCB0aGlzKTtcclxuXHJcbiAgICAgIHRoaXMuZmlyZSgnbG9hZGluZycsIHtcclxuICAgICAgICBib3VuZHM6IGJvdW5kc1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfdXBkYXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXRoaXMuX21hcCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHpvb20gPSB0aGlzLl9tYXAuZ2V0Wm9vbSgpO1xyXG4gICAgdmFyIGJvdW5kcyA9IHRoaXMuX21hcC5nZXRCb3VuZHMoKTtcclxuXHJcbiAgICBpZiAodGhpcy5fYW5pbWF0aW5nWm9vbSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuX21hcC5fcGFuVHJhbnNpdGlvbiAmJiB0aGlzLl9tYXAuX3BhblRyYW5zaXRpb24uX2luUHJvZ3Jlc3MpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh6b29tID4gdGhpcy5vcHRpb25zLm1heFpvb20gfHwgem9vbSA8IHRoaXMub3B0aW9ucy5taW5ab29tKSB7XHJcbiAgICAgIGlmICh0aGlzLl9jdXJyZW50SW1hZ2UpIHtcclxuICAgICAgICB0aGlzLl9jdXJyZW50SW1hZ2UuX21hcC5yZW1vdmVMYXllcih0aGlzLl9jdXJyZW50SW1hZ2UpO1xyXG4gICAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZSA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBwYXJhbXMgPSB0aGlzLl9idWlsZEV4cG9ydFBhcmFtcygpO1xyXG5cclxuICAgIHRoaXMuX3JlcXVlc3RFeHBvcnQocGFyYW1zLCBib3VuZHMpO1xyXG4gIH0sXHJcblxyXG4gIF9yZW5kZXJQb3B1cDogZnVuY3Rpb24gKGxhdGxuZywgZXJyb3IsIHJlc3VsdHMsIHJlc3BvbnNlKSB7XHJcbiAgICBsYXRsbmcgPSBsYXRMbmcobGF0bG5nKTtcclxuICAgIGlmICh0aGlzLl9zaG91bGRSZW5kZXJQb3B1cCAmJiB0aGlzLl9sYXN0Q2xpY2suZXF1YWxzKGxhdGxuZykpIHtcclxuICAgICAgLy8gYWRkIHRoZSBwb3B1cCB0byB0aGUgbWFwIHdoZXJlIHRoZSBtb3VzZSB3YXMgY2xpY2tlZCBhdFxyXG4gICAgICB2YXIgY29udGVudCA9IHRoaXMuX3BvcHVwRnVuY3Rpb24oZXJyb3IsIHJlc3VsdHMsIHJlc3BvbnNlKTtcclxuICAgICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICB0aGlzLl9wb3B1cC5zZXRMYXRMbmcobGF0bG5nKS5zZXRDb250ZW50KGNvbnRlbnQpLm9wZW5Pbih0aGlzLl9tYXApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgX3Jlc2V0UG9wdXBTdGF0ZTogZnVuY3Rpb24gKGUpIHtcclxuICAgIHRoaXMuX3Nob3VsZFJlbmRlclBvcHVwID0gZmFsc2U7XHJcbiAgICB0aGlzLl9sYXN0Q2xpY2sgPSBlLmxhdGxuZztcclxuICB9LFxyXG5cclxuICBfY2FsY3VsYXRlQmJveDogZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHBpeGVsQm91bmRzID0gdGhpcy5fbWFwLmdldFBpeGVsQm91bmRzKCk7XHJcblxyXG4gICAgdmFyIHN3ID0gdGhpcy5fbWFwLnVucHJvamVjdChwaXhlbEJvdW5kcy5nZXRCb3R0b21MZWZ0KCkpO1xyXG4gICAgdmFyIG5lID0gdGhpcy5fbWFwLnVucHJvamVjdChwaXhlbEJvdW5kcy5nZXRUb3BSaWdodCgpKTtcclxuXHJcbiAgICB2YXIgbmVQcm9qZWN0ZWQgPSB0aGlzLl9tYXAub3B0aW9ucy5jcnMucHJvamVjdChuZSk7XHJcbiAgICB2YXIgc3dQcm9qZWN0ZWQgPSB0aGlzLl9tYXAub3B0aW9ucy5jcnMucHJvamVjdChzdyk7XHJcblxyXG4gICAgLy8gdGhpcyBlbnN1cmVzIG5lL3N3IGFyZSBzd2l0Y2hlZCBpbiBwb2xhciBtYXBzIHdoZXJlIG5vcnRoL3RvcCBib3R0b20vc291dGggaXMgaW52ZXJ0ZWRcclxuICAgIHZhciBib3VuZHNQcm9qZWN0ZWQgPSBib3VuZHMobmVQcm9qZWN0ZWQsIHN3UHJvamVjdGVkKTtcclxuXHJcbiAgICByZXR1cm4gW2JvdW5kc1Byb2plY3RlZC5nZXRCb3R0b21MZWZ0KCkueCwgYm91bmRzUHJvamVjdGVkLmdldEJvdHRvbUxlZnQoKS55LCBib3VuZHNQcm9qZWN0ZWQuZ2V0VG9wUmlnaHQoKS54LCBib3VuZHNQcm9qZWN0ZWQuZ2V0VG9wUmlnaHQoKS55XS5qb2luKCcsJyk7XHJcbiAgfSxcclxuXHJcbiAgX2NhbGN1bGF0ZUltYWdlU2l6ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gZW5zdXJlIHRoYXQgd2UgZG9uJ3QgYXNrIEFyY0dJUyBTZXJ2ZXIgZm9yIGEgdGFsbGVyIGltYWdlIHRoYW4gd2UgaGF2ZSBhY3R1YWwgbWFwIGRpc3BsYXlpbmcgd2l0aGluIHRoZSBkaXZcclxuICAgIHZhciBib3VuZHMgPSB0aGlzLl9tYXAuZ2V0UGl4ZWxCb3VuZHMoKTtcclxuICAgIHZhciBzaXplID0gdGhpcy5fbWFwLmdldFNpemUoKTtcclxuXHJcbiAgICB2YXIgc3cgPSB0aGlzLl9tYXAudW5wcm9qZWN0KGJvdW5kcy5nZXRCb3R0b21MZWZ0KCkpO1xyXG4gICAgdmFyIG5lID0gdGhpcy5fbWFwLnVucHJvamVjdChib3VuZHMuZ2V0VG9wUmlnaHQoKSk7XHJcblxyXG4gICAgdmFyIHRvcCA9IHRoaXMuX21hcC5sYXRMbmdUb0xheWVyUG9pbnQobmUpLnk7XHJcbiAgICB2YXIgYm90dG9tID0gdGhpcy5fbWFwLmxhdExuZ1RvTGF5ZXJQb2ludChzdykueTtcclxuXHJcbiAgICBpZiAodG9wID4gMCB8fCBib3R0b20gPCBzaXplLnkpIHtcclxuICAgICAgc2l6ZS55ID0gYm90dG9tIC0gdG9wO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzaXplLnggKyAnLCcgKyBzaXplLnk7XHJcbiAgfVxyXG59KTtcclxuIiwiaW1wb3J0IHsgVXRpbCB9IGZyb20gJ2xlYWZsZXQnO1xyXG5pbXBvcnQgeyBSYXN0ZXJMYXllciB9IGZyb20gJy4vUmFzdGVyTGF5ZXInO1xyXG5pbXBvcnQgeyBjbGVhblVybCB9IGZyb20gJy4uL1V0aWwnO1xyXG5pbXBvcnQgaW1hZ2VTZXJ2aWNlIGZyb20gJy4uL1NlcnZpY2VzL0ltYWdlU2VydmljZSc7XHJcblxyXG5leHBvcnQgdmFyIEltYWdlTWFwTGF5ZXIgPSBSYXN0ZXJMYXllci5leHRlbmQoe1xyXG5cclxuICBvcHRpb25zOiB7XHJcbiAgICB1cGRhdGVJbnRlcnZhbDogMTUwLFxyXG4gICAgZm9ybWF0OiAnanBncG5nJyxcclxuICAgIHRyYW5zcGFyZW50OiB0cnVlLFxyXG4gICAgZjogJ2ltYWdlJ1xyXG4gIH0sXHJcblxyXG4gIHF1ZXJ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLnF1ZXJ5KCk7XHJcbiAgfSxcclxuXHJcbiAgaWRlbnRpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UuaWRlbnRpZnkoKTtcclxuICB9LFxyXG5cclxuICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucy51cmwgPSBjbGVhblVybChvcHRpb25zLnVybCk7XHJcbiAgICB0aGlzLnNlcnZpY2UgPSBpbWFnZVNlcnZpY2Uob3B0aW9ucyk7XHJcbiAgICB0aGlzLnNlcnZpY2UuYWRkRXZlbnRQYXJlbnQodGhpcyk7XHJcblxyXG4gICAgVXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xyXG4gIH0sXHJcblxyXG4gIHNldFBpeGVsVHlwZTogZnVuY3Rpb24gKHBpeGVsVHlwZSkge1xyXG4gICAgdGhpcy5vcHRpb25zLnBpeGVsVHlwZSA9IHBpeGVsVHlwZTtcclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZ2V0UGl4ZWxUeXBlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnBpeGVsVHlwZTtcclxuICB9LFxyXG5cclxuICBzZXRCYW5kSWRzOiBmdW5jdGlvbiAoYmFuZElkcykge1xyXG4gICAgaWYgKFV0aWwuaXNBcnJheShiYW5kSWRzKSkge1xyXG4gICAgICB0aGlzLm9wdGlvbnMuYmFuZElkcyA9IGJhbmRJZHMuam9pbignLCcpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5vcHRpb25zLmJhbmRJZHMgPSBiYW5kSWRzLnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGdldEJhbmRJZHM6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYmFuZElkcztcclxuICB9LFxyXG5cclxuICBzZXROb0RhdGE6IGZ1bmN0aW9uIChub0RhdGEsIG5vRGF0YUludGVycHJldGF0aW9uKSB7XHJcbiAgICBpZiAoVXRpbC5pc0FycmF5KG5vRGF0YSkpIHtcclxuICAgICAgdGhpcy5vcHRpb25zLm5vRGF0YSA9IG5vRGF0YS5qb2luKCcsJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm9wdGlvbnMubm9EYXRhID0gbm9EYXRhLnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBpZiAobm9EYXRhSW50ZXJwcmV0YXRpb24pIHtcclxuICAgICAgdGhpcy5vcHRpb25zLm5vRGF0YUludGVycHJldGF0aW9uID0gbm9EYXRhSW50ZXJwcmV0YXRpb247XHJcbiAgICB9XHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGdldE5vRGF0YTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5ub0RhdGE7XHJcbiAgfSxcclxuXHJcbiAgZ2V0Tm9EYXRhSW50ZXJwcmV0YXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMubm9EYXRhSW50ZXJwcmV0YXRpb247XHJcbiAgfSxcclxuXHJcbiAgc2V0UmVuZGVyaW5nUnVsZTogZnVuY3Rpb24gKHJlbmRlcmluZ1J1bGUpIHtcclxuICAgIHRoaXMub3B0aW9ucy5yZW5kZXJpbmdSdWxlID0gcmVuZGVyaW5nUnVsZTtcclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gIH0sXHJcblxyXG4gIGdldFJlbmRlcmluZ1J1bGU6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMucmVuZGVyaW5nUnVsZTtcclxuICB9LFxyXG5cclxuICBzZXRNb3NhaWNSdWxlOiBmdW5jdGlvbiAobW9zYWljUnVsZSkge1xyXG4gICAgdGhpcy5vcHRpb25zLm1vc2FpY1J1bGUgPSBtb3NhaWNSdWxlO1xyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0TW9zYWljUnVsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5tb3NhaWNSdWxlO1xyXG4gIH0sXHJcblxyXG4gIF9nZXRQb3B1cERhdGE6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICB2YXIgY2FsbGJhY2sgPSBVdGlsLmJpbmQoZnVuY3Rpb24gKGVycm9yLCByZXN1bHRzLCByZXNwb25zZSkge1xyXG4gICAgICBpZiAoZXJyb3IpIHsgcmV0dXJuOyB9IC8vIHdlIHJlYWxseSBjYW4ndCBkbyBhbnl0aGluZyBoZXJlIGJ1dCBhdXRoZW50aWNhdGUgb3IgcmVxdWVzdGVycm9yIHdpbGwgZmlyZVxyXG4gICAgICBzZXRUaW1lb3V0KFV0aWwuYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5fcmVuZGVyUG9wdXAoZS5sYXRsbmcsIGVycm9yLCByZXN1bHRzLCByZXNwb25zZSk7XHJcbiAgICAgIH0sIHRoaXMpLCAzMDApO1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdmFyIGlkZW50aWZ5UmVxdWVzdCA9IHRoaXMuaWRlbnRpZnkoKS5hdChlLmxhdGxuZyk7XHJcblxyXG4gICAgLy8gc2V0IG1vc2FpYyBydWxlIGZvciBpZGVudGlmeSB0YXNrIGlmIGl0IGlzIHNldCBmb3IgbGF5ZXJcclxuICAgIGlmICh0aGlzLm9wdGlvbnMubW9zYWljUnVsZSkge1xyXG4gICAgICBpZGVudGlmeVJlcXVlc3Quc2V0TW9zYWljUnVsZSh0aGlzLm9wdGlvbnMubW9zYWljUnVsZSk7XHJcbiAgICAgIC8vIEBUT0RPOiBmb3JjZSByZXR1cm4gY2F0YWxvZyBpdGVtcyB0b28/XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQFRPRE86IHNldCByZW5kZXJpbmcgcnVsZT8gTm90IHN1cmUsXHJcbiAgICAvLyBzb21ldGltZXMgeW91IHdhbnQgcmF3IHBpeGVsIHZhbHVlc1xyXG4gICAgLy8gaWYgKHRoaXMub3B0aW9ucy5yZW5kZXJpbmdSdWxlKSB7XHJcbiAgICAvLyAgIGlkZW50aWZ5UmVxdWVzdC5zZXRSZW5kZXJpbmdSdWxlKHRoaXMub3B0aW9ucy5yZW5kZXJpbmdSdWxlKTtcclxuICAgIC8vIH1cclxuXHJcbiAgICBpZGVudGlmeVJlcXVlc3QucnVuKGNhbGxiYWNrKTtcclxuXHJcbiAgICAvLyBzZXQgdGhlIGZsYWdzIHRvIHNob3cgdGhlIHBvcHVwXHJcbiAgICB0aGlzLl9zaG91bGRSZW5kZXJQb3B1cCA9IHRydWU7XHJcbiAgICB0aGlzLl9sYXN0Q2xpY2sgPSBlLmxhdGxuZztcclxuICB9LFxyXG5cclxuICBfYnVpbGRFeHBvcnRQYXJhbXM6IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzciA9IHBhcnNlSW50KHRoaXMuX21hcC5vcHRpb25zLmNycy5jb2RlLnNwbGl0KCc6JylbMV0sIDEwKTtcclxuXHJcbiAgICB2YXIgcGFyYW1zID0ge1xyXG4gICAgICBiYm94OiB0aGlzLl9jYWxjdWxhdGVCYm94KCksXHJcbiAgICAgIHNpemU6IHRoaXMuX2NhbGN1bGF0ZUltYWdlU2l6ZSgpLFxyXG4gICAgICBmb3JtYXQ6IHRoaXMub3B0aW9ucy5mb3JtYXQsXHJcbiAgICAgIHRyYW5zcGFyZW50OiB0aGlzLm9wdGlvbnMudHJhbnNwYXJlbnQsXHJcbiAgICAgIGJib3hTUjogc3IsXHJcbiAgICAgIGltYWdlU1I6IHNyXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZnJvbSAmJiB0aGlzLm9wdGlvbnMudG8pIHtcclxuICAgICAgcGFyYW1zLnRpbWUgPSB0aGlzLm9wdGlvbnMuZnJvbS52YWx1ZU9mKCkgKyAnLCcgKyB0aGlzLm9wdGlvbnMudG8udmFsdWVPZigpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMucGl4ZWxUeXBlKSB7XHJcbiAgICAgIHBhcmFtcy5waXhlbFR5cGUgPSB0aGlzLm9wdGlvbnMucGl4ZWxUeXBlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbikge1xyXG4gICAgICBwYXJhbXMuaW50ZXJwb2xhdGlvbiA9IHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcHJlc3Npb25RdWFsaXR5KSB7XHJcbiAgICAgIHBhcmFtcy5jb21wcmVzc2lvblF1YWxpdHkgPSB0aGlzLm9wdGlvbnMuY29tcHJlc3Npb25RdWFsaXR5O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuYmFuZElkcykge1xyXG4gICAgICBwYXJhbXMuYmFuZElkcyA9IHRoaXMub3B0aW9ucy5iYW5kSWRzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIDAgaXMgZmFsc3kgKmFuZCogYSB2YWxpZCBpbnB1dCBwYXJhbWV0ZXJcclxuICAgIGlmICh0aGlzLm9wdGlvbnMubm9EYXRhID09PSAwIHx8IHRoaXMub3B0aW9ucy5ub0RhdGEpIHtcclxuICAgICAgcGFyYW1zLm5vRGF0YSA9IHRoaXMub3B0aW9ucy5ub0RhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5ub0RhdGFJbnRlcnByZXRhdGlvbikge1xyXG4gICAgICBwYXJhbXMubm9EYXRhSW50ZXJwcmV0YXRpb24gPSB0aGlzLm9wdGlvbnMubm9EYXRhSW50ZXJwcmV0YXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuc2VydmljZS5vcHRpb25zLnRva2VuKSB7XHJcbiAgICAgIHBhcmFtcy50b2tlbiA9IHRoaXMuc2VydmljZS5vcHRpb25zLnRva2VuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMucmVuZGVyaW5nUnVsZSkge1xyXG4gICAgICBwYXJhbXMucmVuZGVyaW5nUnVsZSA9IEpTT04uc3RyaW5naWZ5KHRoaXMub3B0aW9ucy5yZW5kZXJpbmdSdWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLm1vc2FpY1J1bGUpIHtcclxuICAgICAgcGFyYW1zLm1vc2FpY1J1bGUgPSBKU09OLnN0cmluZ2lmeSh0aGlzLm9wdGlvbnMubW9zYWljUnVsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHBhcmFtcztcclxuICB9LFxyXG5cclxuICBfcmVxdWVzdEV4cG9ydDogZnVuY3Rpb24gKHBhcmFtcywgYm91bmRzKSB7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmYgPT09ICdqc29uJykge1xyXG4gICAgICB0aGlzLnNlcnZpY2UucmVxdWVzdCgnZXhwb3J0SW1hZ2UnLCBwYXJhbXMsIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgICBpZiAoZXJyb3IpIHsgcmV0dXJuOyB9IC8vIHdlIHJlYWxseSBjYW4ndCBkbyBhbnl0aGluZyBoZXJlIGJ1dCBhdXRoZW50aWNhdGUgb3IgcmVxdWVzdGVycm9yIHdpbGwgZmlyZVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudG9rZW4pIHtcclxuICAgICAgICAgIHJlc3BvbnNlLmhyZWYgKz0gKCc/dG9rZW49JyArIHRoaXMub3B0aW9ucy50b2tlbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3JlbmRlckltYWdlKHJlc3BvbnNlLmhyZWYsIGJvdW5kcyk7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcGFyYW1zLmYgPSAnaW1hZ2UnO1xyXG4gICAgICB0aGlzLl9yZW5kZXJJbWFnZSh0aGlzLm9wdGlvbnMudXJsICsgJ2V4cG9ydEltYWdlJyArIFV0aWwuZ2V0UGFyYW1TdHJpbmcocGFyYW1zKSwgYm91bmRzKTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGltYWdlTWFwTGF5ZXIgKHVybCwgb3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgSW1hZ2VNYXBMYXllcih1cmwsIG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpbWFnZU1hcExheWVyO1xyXG4iLCJpbXBvcnQgeyBVdGlsIH0gZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCB7IFJhc3RlckxheWVyIH0gZnJvbSAnLi9SYXN0ZXJMYXllcic7XHJcbmltcG9ydCB7IGNsZWFuVXJsIH0gZnJvbSAnLi4vVXRpbCc7XHJcbmltcG9ydCBtYXBTZXJ2aWNlIGZyb20gJy4uL1NlcnZpY2VzL01hcFNlcnZpY2UnO1xyXG5cclxuZXhwb3J0IHZhciBEeW5hbWljTWFwTGF5ZXIgPSBSYXN0ZXJMYXllci5leHRlbmQoe1xyXG5cclxuICBvcHRpb25zOiB7XHJcbiAgICB1cGRhdGVJbnRlcnZhbDogMTUwLFxyXG4gICAgbGF5ZXJzOiBmYWxzZSxcclxuICAgIGxheWVyRGVmczogZmFsc2UsXHJcbiAgICB0aW1lT3B0aW9uczogZmFsc2UsXHJcbiAgICBmb3JtYXQ6ICdwbmcyNCcsXHJcbiAgICB0cmFuc3BhcmVudDogdHJ1ZSxcclxuICAgIGY6ICdqc29uJ1xyXG4gIH0sXHJcblxyXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zLnVybCA9IGNsZWFuVXJsKG9wdGlvbnMudXJsKTtcclxuICAgIHRoaXMuc2VydmljZSA9IG1hcFNlcnZpY2Uob3B0aW9ucyk7XHJcbiAgICB0aGlzLnNlcnZpY2UuYWRkRXZlbnRQYXJlbnQodGhpcyk7XHJcblxyXG4gICAgaWYgKChvcHRpb25zLnByb3h5IHx8IG9wdGlvbnMudG9rZW4pICYmIG9wdGlvbnMuZiAhPT0gJ2pzb24nKSB7XHJcbiAgICAgIG9wdGlvbnMuZiA9ICdqc29uJztcclxuICAgIH1cclxuXHJcbiAgICBVdGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0RHluYW1pY0xheWVyczogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5keW5hbWljTGF5ZXJzO1xyXG4gIH0sXHJcblxyXG4gIHNldER5bmFtaWNMYXllcnM6IGZ1bmN0aW9uIChkeW5hbWljTGF5ZXJzKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMuZHluYW1pY0xheWVycyA9IGR5bmFtaWNMYXllcnM7XHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGdldExheWVyczogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5sYXllcnM7XHJcbiAgfSxcclxuXHJcbiAgc2V0TGF5ZXJzOiBmdW5jdGlvbiAobGF5ZXJzKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMubGF5ZXJzID0gbGF5ZXJzO1xyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBnZXRMYXllckRlZnM6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMubGF5ZXJEZWZzO1xyXG4gIH0sXHJcblxyXG4gIHNldExheWVyRGVmczogZnVuY3Rpb24gKGxheWVyRGVmcykge1xyXG4gICAgdGhpcy5vcHRpb25zLmxheWVyRGVmcyA9IGxheWVyRGVmcztcclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZ2V0VGltZU9wdGlvbnM6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudGltZU9wdGlvbnM7XHJcbiAgfSxcclxuXHJcbiAgc2V0VGltZU9wdGlvbnM6IGZ1bmN0aW9uICh0aW1lT3B0aW9ucykge1xyXG4gICAgdGhpcy5vcHRpb25zLnRpbWVPcHRpb25zID0gdGltZU9wdGlvbnM7XHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIHF1ZXJ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLnF1ZXJ5KCk7XHJcbiAgfSxcclxuXHJcbiAgaWRlbnRpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UuaWRlbnRpZnkoKTtcclxuICB9LFxyXG5cclxuICBmaW5kOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLmZpbmQoKTtcclxuICB9LFxyXG5cclxuICBfZ2V0UG9wdXBEYXRhOiBmdW5jdGlvbiAoZSkge1xyXG4gICAgdmFyIGNhbGxiYWNrID0gVXRpbC5iaW5kKGZ1bmN0aW9uIChlcnJvciwgZmVhdHVyZUNvbGxlY3Rpb24sIHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmIChlcnJvcikgeyByZXR1cm47IH0gLy8gd2UgcmVhbGx5IGNhbid0IGRvIGFueXRoaW5nIGhlcmUgYnV0IGF1dGhlbnRpY2F0ZSBvciByZXF1ZXN0ZXJyb3Igd2lsbCBmaXJlXHJcbiAgICAgIHNldFRpbWVvdXQoVXRpbC5iaW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLl9yZW5kZXJQb3B1cChlLmxhdGxuZywgZXJyb3IsIGZlYXR1cmVDb2xsZWN0aW9uLCByZXNwb25zZSk7XHJcbiAgICAgIH0sIHRoaXMpLCAzMDApO1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdmFyIGlkZW50aWZ5UmVxdWVzdCA9IHRoaXMuaWRlbnRpZnkoKS5vbih0aGlzLl9tYXApLmF0KGUubGF0bG5nKTtcclxuXHJcbiAgICAvLyByZW1vdmUgZXh0cmFuZW91cyB2ZXJ0aWNlcyBmcm9tIHJlc3BvbnNlIGZlYXR1cmVzXHJcbiAgICBpZGVudGlmeVJlcXVlc3Quc2ltcGxpZnkodGhpcy5fbWFwLCAwLjUpO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMubGF5ZXJzKSB7XHJcbiAgICAgIGlkZW50aWZ5UmVxdWVzdC5sYXllcnMoJ3Zpc2libGU6JyArIHRoaXMub3B0aW9ucy5sYXllcnMuam9pbignLCcpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlkZW50aWZ5UmVxdWVzdC5sYXllcnMoJ3Zpc2libGUnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiBwcmVzZW50LCBwYXNzIGxheWVyIGlkcyBhbmQgc3FsIGZpbHRlcnMgdGhyb3VnaCB0byB0aGUgaWRlbnRpZnkgdGFza1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5sYXllckRlZnMgJiYgdHlwZW9mIHRoaXMub3B0aW9ucy5sYXllckRlZnMgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGZvciAodmFyIGlkIGluIHRoaXMub3B0aW9ucy5sYXllckRlZnMpIHtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmxheWVyRGVmcy5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcclxuICAgICAgICAgIGlkZW50aWZ5UmVxdWVzdC5sYXllckRlZihpZCwgdGhpcy5vcHRpb25zLmxheWVyRGVmc1tpZF0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlkZW50aWZ5UmVxdWVzdC5ydW4oY2FsbGJhY2spO1xyXG5cclxuICAgIC8vIHNldCB0aGUgZmxhZ3MgdG8gc2hvdyB0aGUgcG9wdXBcclxuICAgIHRoaXMuX3Nob3VsZFJlbmRlclBvcHVwID0gdHJ1ZTtcclxuICAgIHRoaXMuX2xhc3RDbGljayA9IGUubGF0bG5nO1xyXG4gIH0sXHJcblxyXG4gIF9idWlsZEV4cG9ydFBhcmFtczogZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNyID0gcGFyc2VJbnQodGhpcy5fbWFwLm9wdGlvbnMuY3JzLmNvZGUuc3BsaXQoJzonKVsxXSwgMTApO1xyXG5cclxuICAgIHZhciBwYXJhbXMgPSB7XHJcbiAgICAgIGJib3g6IHRoaXMuX2NhbGN1bGF0ZUJib3goKSxcclxuICAgICAgc2l6ZTogdGhpcy5fY2FsY3VsYXRlSW1hZ2VTaXplKCksXHJcbiAgICAgIGRwaTogOTYsXHJcbiAgICAgIGZvcm1hdDogdGhpcy5vcHRpb25zLmZvcm1hdCxcclxuICAgICAgdHJhbnNwYXJlbnQ6IHRoaXMub3B0aW9ucy50cmFuc3BhcmVudCxcclxuICAgICAgYmJveFNSOiBzcixcclxuICAgICAgaW1hZ2VTUjogc3JcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5keW5hbWljTGF5ZXJzKSB7XHJcbiAgICAgIHBhcmFtcy5keW5hbWljTGF5ZXJzID0gdGhpcy5vcHRpb25zLmR5bmFtaWNMYXllcnM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5sYXllcnMpIHtcclxuICAgICAgcGFyYW1zLmxheWVycyA9ICdzaG93OicgKyB0aGlzLm9wdGlvbnMubGF5ZXJzLmpvaW4oJywnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmxheWVyRGVmcykge1xyXG4gICAgICBwYXJhbXMubGF5ZXJEZWZzID0gdHlwZW9mIHRoaXMub3B0aW9ucy5sYXllckRlZnMgPT09ICdzdHJpbmcnID8gdGhpcy5vcHRpb25zLmxheWVyRGVmcyA6IEpTT04uc3RyaW5naWZ5KHRoaXMub3B0aW9ucy5sYXllckRlZnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudGltZU9wdGlvbnMpIHtcclxuICAgICAgcGFyYW1zLnRpbWVPcHRpb25zID0gSlNPTi5zdHJpbmdpZnkodGhpcy5vcHRpb25zLnRpbWVPcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmZyb20gJiYgdGhpcy5vcHRpb25zLnRvKSB7XHJcbiAgICAgIHBhcmFtcy50aW1lID0gdGhpcy5vcHRpb25zLmZyb20udmFsdWVPZigpICsgJywnICsgdGhpcy5vcHRpb25zLnRvLnZhbHVlT2YoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5zZXJ2aWNlLm9wdGlvbnMudG9rZW4pIHtcclxuICAgICAgcGFyYW1zLnRva2VuID0gdGhpcy5zZXJ2aWNlLm9wdGlvbnMudG9rZW47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5wcm94eSkge1xyXG4gICAgICBwYXJhbXMucHJveHkgPSB0aGlzLm9wdGlvbnMucHJveHk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdXNlIGEgdGltZXN0YW1wIHRvIGJ1c3Qgc2VydmVyIGNhY2hlXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmRpc2FibGVDYWNoZSkge1xyXG4gICAgICBwYXJhbXMuX3RzID0gRGF0ZS5ub3coKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGFyYW1zO1xyXG4gIH0sXHJcblxyXG4gIF9yZXF1ZXN0RXhwb3J0OiBmdW5jdGlvbiAocGFyYW1zLCBib3VuZHMpIHtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZiA9PT0gJ2pzb24nKSB7XHJcbiAgICAgIHRoaXMuc2VydmljZS5yZXF1ZXN0KCdleHBvcnQnLCBwYXJhbXMsIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgICBpZiAoZXJyb3IpIHsgcmV0dXJuOyB9IC8vIHdlIHJlYWxseSBjYW4ndCBkbyBhbnl0aGluZyBoZXJlIGJ1dCBhdXRoZW50aWNhdGUgb3IgcmVxdWVzdGVycm9yIHdpbGwgZmlyZVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRva2VuKSB7XHJcbiAgICAgICAgICByZXNwb25zZS5ocmVmICs9ICgnP3Rva2VuPScgKyB0aGlzLm9wdGlvbnMudG9rZW4pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnByb3h5KSB7XHJcbiAgICAgICAgICByZXNwb25zZS5ocmVmID0gdGhpcy5vcHRpb25zLnByb3h5ICsgJz8nICsgcmVzcG9uc2UuaHJlZjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlc3BvbnNlLmhyZWYpIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlckltYWdlKHJlc3BvbnNlLmhyZWYsIGJvdW5kcyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlckltYWdlKHJlc3BvbnNlLmltYWdlRGF0YSwgYm91bmRzLCByZXNwb25zZS5jb250ZW50VHlwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHBhcmFtcy5mID0gJ2ltYWdlJztcclxuICAgICAgdGhpcy5fcmVuZGVySW1hZ2UodGhpcy5vcHRpb25zLnVybCArICdleHBvcnQnICsgVXRpbC5nZXRQYXJhbVN0cmluZyhwYXJhbXMpLCBib3VuZHMpO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHluYW1pY01hcExheWVyICh1cmwsIG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IER5bmFtaWNNYXBMYXllcih1cmwsIG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkeW5hbWljTWFwTGF5ZXI7XHJcbiIsImltcG9ydCBMIGZyb20gJ2xlYWZsZXQnO1xuXG52YXIgVmlydHVhbEdyaWQgPSBMLkxheWVyLmV4dGVuZCh7XG5cbiAgb3B0aW9uczoge1xuICAgIGNlbGxTaXplOiA1MTIsXG4gICAgdXBkYXRlSW50ZXJ2YWw6IDE1MFxuICB9LFxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLl96b29taW5nID0gZmFsc2U7XG4gIH0sXG5cbiAgb25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcbiAgICB0aGlzLl9tYXAgPSBtYXA7XG4gICAgdGhpcy5fdXBkYXRlID0gTC5VdGlsLnRocm90dGxlKHRoaXMuX3VwZGF0ZSwgdGhpcy5vcHRpb25zLnVwZGF0ZUludGVydmFsLCB0aGlzKTtcbiAgICB0aGlzLl9yZXNldCgpO1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9LFxuXG4gIG9uUmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fbWFwLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5nZXRFdmVudHMoKSwgdGhpcyk7XG4gICAgdGhpcy5fcmVtb3ZlQ2VsbHMoKTtcbiAgfSxcblxuICBnZXRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXZlbnRzID0ge1xuICAgICAgbW92ZWVuZDogdGhpcy5fdXBkYXRlLFxuICAgICAgem9vbXN0YXJ0OiB0aGlzLl96b29tc3RhcnQsXG4gICAgICB6b29tZW5kOiB0aGlzLl9yZXNldFxuICAgIH07XG5cbiAgICByZXR1cm4gZXZlbnRzO1xuICB9LFxuXG4gIGFkZFRvOiBmdW5jdGlvbiAobWFwKSB7XG4gICAgbWFwLmFkZExheWVyKHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHJlbW92ZUZyb206IGZ1bmN0aW9uIChtYXApIHtcbiAgICBtYXAucmVtb3ZlTGF5ZXIodGhpcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgX3pvb21zdGFydDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3pvb21pbmcgPSB0cnVlO1xuICB9LFxuXG4gIF9yZXNldDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3JlbW92ZUNlbGxzKCk7XG5cbiAgICB0aGlzLl9jZWxscyA9IHt9O1xuICAgIHRoaXMuX2FjdGl2ZUNlbGxzID0ge307XG4gICAgdGhpcy5fY2VsbHNUb0xvYWQgPSAwO1xuICAgIHRoaXMuX2NlbGxzVG90YWwgPSAwO1xuICAgIHRoaXMuX2NlbGxOdW1Cb3VuZHMgPSB0aGlzLl9nZXRDZWxsTnVtQm91bmRzKCk7XG5cbiAgICB0aGlzLl9yZXNldFdyYXAoKTtcbiAgICB0aGlzLl96b29taW5nID0gZmFsc2U7XG4gIH0sXG5cbiAgX3Jlc2V0V3JhcDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBtYXAgPSB0aGlzLl9tYXA7XG4gICAgdmFyIGNycyA9IG1hcC5vcHRpb25zLmNycztcblxuICAgIGlmIChjcnMuaW5maW5pdGUpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgY2VsbFNpemUgPSB0aGlzLl9nZXRDZWxsU2l6ZSgpO1xuXG4gICAgaWYgKGNycy53cmFwTG5nKSB7XG4gICAgICB0aGlzLl93cmFwTG5nID0gW1xuICAgICAgICBNYXRoLmZsb29yKG1hcC5wcm9qZWN0KFswLCBjcnMud3JhcExuZ1swXV0pLnggLyBjZWxsU2l6ZSksXG4gICAgICAgIE1hdGguY2VpbChtYXAucHJvamVjdChbMCwgY3JzLndyYXBMbmdbMV1dKS54IC8gY2VsbFNpemUpXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmIChjcnMud3JhcExhdCkge1xuICAgICAgdGhpcy5fd3JhcExhdCA9IFtcbiAgICAgICAgTWF0aC5mbG9vcihtYXAucHJvamVjdChbY3JzLndyYXBMYXRbMF0sIDBdKS55IC8gY2VsbFNpemUpLFxuICAgICAgICBNYXRoLmNlaWwobWFwLnByb2plY3QoW2Nycy53cmFwTGF0WzFdLCAwXSkueSAvIGNlbGxTaXplKVxuICAgICAgXTtcbiAgICB9XG4gIH0sXG5cbiAgX2dldENlbGxTaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jZWxsU2l6ZTtcbiAgfSxcblxuICBfdXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLl9tYXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYm91bmRzID0gdGhpcy5fbWFwLmdldFBpeGVsQm91bmRzKCk7XG4gICAgdmFyIGNlbGxTaXplID0gdGhpcy5fZ2V0Q2VsbFNpemUoKTtcblxuICAgIC8vIGNlbGwgY29vcmRpbmF0ZXMgcmFuZ2UgZm9yIHRoZSBjdXJyZW50IHZpZXdcbiAgICB2YXIgY2VsbEJvdW5kcyA9IEwuYm91bmRzKFxuICAgICAgYm91bmRzLm1pbi5kaXZpZGVCeShjZWxsU2l6ZSkuZmxvb3IoKSxcbiAgICAgIGJvdW5kcy5tYXguZGl2aWRlQnkoY2VsbFNpemUpLmZsb29yKCkpO1xuXG4gICAgdGhpcy5fcmVtb3ZlT3RoZXJDZWxscyhjZWxsQm91bmRzKTtcbiAgICB0aGlzLl9hZGRDZWxscyhjZWxsQm91bmRzKTtcblxuICAgIHRoaXMuZmlyZSgnY2VsbHN1cGRhdGVkJyk7XG4gIH0sXG5cbiAgX2FkZENlbGxzOiBmdW5jdGlvbiAoYm91bmRzKSB7XG4gICAgdmFyIHF1ZXVlID0gW107XG4gICAgdmFyIGNlbnRlciA9IGJvdW5kcy5nZXRDZW50ZXIoKTtcbiAgICB2YXIgem9vbSA9IHRoaXMuX21hcC5nZXRab29tKCk7XG5cbiAgICB2YXIgaiwgaSwgY29vcmRzO1xuICAgIC8vIGNyZWF0ZSBhIHF1ZXVlIG9mIGNvb3JkaW5hdGVzIHRvIGxvYWQgY2VsbHMgZnJvbVxuICAgIGZvciAoaiA9IGJvdW5kcy5taW4ueTsgaiA8PSBib3VuZHMubWF4Lnk7IGorKykge1xuICAgICAgZm9yIChpID0gYm91bmRzLm1pbi54OyBpIDw9IGJvdW5kcy5tYXgueDsgaSsrKSB7XG4gICAgICAgIGNvb3JkcyA9IEwucG9pbnQoaSwgaik7XG4gICAgICAgIGNvb3Jkcy56ID0gem9vbTtcblxuICAgICAgICBpZiAodGhpcy5faXNWYWxpZENlbGwoY29vcmRzKSkge1xuICAgICAgICAgIHF1ZXVlLnB1c2goY29vcmRzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjZWxsc1RvTG9hZCA9IHF1ZXVlLmxlbmd0aDtcblxuICAgIGlmIChjZWxsc1RvTG9hZCA9PT0gMCkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuX2NlbGxzVG9Mb2FkICs9IGNlbGxzVG9Mb2FkO1xuICAgIHRoaXMuX2NlbGxzVG90YWwgKz0gY2VsbHNUb0xvYWQ7XG5cbiAgICAvLyBzb3J0IGNlbGwgcXVldWUgdG8gbG9hZCBjZWxscyBpbiBvcmRlciBvZiB0aGVpciBkaXN0YW5jZSB0byBjZW50ZXJcbiAgICBxdWV1ZS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICByZXR1cm4gYS5kaXN0YW5jZVRvKGNlbnRlcikgLSBiLmRpc3RhbmNlVG8oY2VudGVyKTtcbiAgICB9KTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBjZWxsc1RvTG9hZDsgaSsrKSB7XG4gICAgICB0aGlzLl9hZGRDZWxsKHF1ZXVlW2ldKTtcbiAgICB9XG4gIH0sXG5cbiAgX2lzVmFsaWRDZWxsOiBmdW5jdGlvbiAoY29vcmRzKSB7XG4gICAgdmFyIGNycyA9IHRoaXMuX21hcC5vcHRpb25zLmNycztcblxuICAgIGlmICghY3JzLmluZmluaXRlKSB7XG4gICAgICAvLyBkb24ndCBsb2FkIGNlbGwgaWYgaXQncyBvdXQgb2YgYm91bmRzIGFuZCBub3Qgd3JhcHBlZFxuICAgICAgdmFyIGJvdW5kcyA9IHRoaXMuX2NlbGxOdW1Cb3VuZHM7XG4gICAgICBpZiAoXG4gICAgICAgICghY3JzLndyYXBMbmcgJiYgKGNvb3Jkcy54IDwgYm91bmRzLm1pbi54IHx8IGNvb3Jkcy54ID4gYm91bmRzLm1heC54KSkgfHxcbiAgICAgICAgKCFjcnMud3JhcExhdCAmJiAoY29vcmRzLnkgPCBib3VuZHMubWluLnkgfHwgY29vcmRzLnkgPiBib3VuZHMubWF4LnkpKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5ib3VuZHMpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIGRvbid0IGxvYWQgY2VsbCBpZiBpdCBkb2Vzbid0IGludGVyc2VjdCB0aGUgYm91bmRzIGluIG9wdGlvbnNcbiAgICB2YXIgY2VsbEJvdW5kcyA9IHRoaXMuX2NlbGxDb29yZHNUb0JvdW5kcyhjb29yZHMpO1xuICAgIHJldHVybiBMLmxhdExuZ0JvdW5kcyh0aGlzLm9wdGlvbnMuYm91bmRzKS5pbnRlcnNlY3RzKGNlbGxCb3VuZHMpO1xuICB9LFxuXG4gIC8vIGNvbnZlcnRzIGNlbGwgY29vcmRpbmF0ZXMgdG8gaXRzIGdlb2dyYXBoaWNhbCBib3VuZHNcbiAgX2NlbGxDb29yZHNUb0JvdW5kczogZnVuY3Rpb24gKGNvb3Jkcykge1xuICAgIHZhciBtYXAgPSB0aGlzLl9tYXA7XG4gICAgdmFyIGNlbGxTaXplID0gdGhpcy5vcHRpb25zLmNlbGxTaXplO1xuICAgIHZhciBud1BvaW50ID0gY29vcmRzLm11bHRpcGx5QnkoY2VsbFNpemUpO1xuICAgIHZhciBzZVBvaW50ID0gbndQb2ludC5hZGQoW2NlbGxTaXplLCBjZWxsU2l6ZV0pO1xuICAgIHZhciBudyA9IG1hcC53cmFwTGF0TG5nKG1hcC51bnByb2plY3QobndQb2ludCwgY29vcmRzLnopKTtcbiAgICB2YXIgc2UgPSBtYXAud3JhcExhdExuZyhtYXAudW5wcm9qZWN0KHNlUG9pbnQsIGNvb3Jkcy56KSk7XG5cbiAgICByZXR1cm4gTC5sYXRMbmdCb3VuZHMobncsIHNlKTtcbiAgfSxcblxuICAvLyBjb252ZXJ0cyBjZWxsIGNvb3JkaW5hdGVzIHRvIGtleSBmb3IgdGhlIGNlbGwgY2FjaGVcbiAgX2NlbGxDb29yZHNUb0tleTogZnVuY3Rpb24gKGNvb3Jkcykge1xuICAgIHJldHVybiBjb29yZHMueCArICc6JyArIGNvb3Jkcy55O1xuICB9LFxuXG4gIC8vIGNvbnZlcnRzIGNlbGwgY2FjaGUga2V5IHRvIGNvb3JkaWFudGVzXG4gIF9rZXlUb0NlbGxDb29yZHM6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIga0FyciA9IGtleS5zcGxpdCgnOicpO1xuICAgIHZhciB4ID0gcGFyc2VJbnQoa0FyclswXSwgMTApO1xuICAgIHZhciB5ID0gcGFyc2VJbnQoa0FyclsxXSwgMTApO1xuXG4gICAgcmV0dXJuIEwucG9pbnQoeCwgeSk7XG4gIH0sXG5cbiAgLy8gcmVtb3ZlIGFueSBwcmVzZW50IGNlbGxzIHRoYXQgYXJlIG9mZiB0aGUgc3BlY2lmaWVkIGJvdW5kc1xuICBfcmVtb3ZlT3RoZXJDZWxsczogZnVuY3Rpb24gKGJvdW5kcykge1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9jZWxscykge1xuICAgICAgaWYgKCFib3VuZHMuY29udGFpbnModGhpcy5fa2V5VG9DZWxsQ29vcmRzKGtleSkpKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZUNlbGwoa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgX3JlbW92ZUNlbGw6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIgY2VsbCA9IHRoaXMuX2FjdGl2ZUNlbGxzW2tleV07XG5cbiAgICBpZiAoY2VsbCkge1xuICAgICAgZGVsZXRlIHRoaXMuX2FjdGl2ZUNlbGxzW2tleV07XG5cbiAgICAgIGlmICh0aGlzLmNlbGxMZWF2ZSkge1xuICAgICAgICB0aGlzLmNlbGxMZWF2ZShjZWxsLmJvdW5kcywgY2VsbC5jb29yZHMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmZpcmUoJ2NlbGxsZWF2ZScsIHtcbiAgICAgICAgYm91bmRzOiBjZWxsLmJvdW5kcyxcbiAgICAgICAgY29vcmRzOiBjZWxsLmNvb3Jkc1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIF9yZW1vdmVDZWxsczogZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9jZWxscykge1xuICAgICAgdmFyIGJvdW5kcyA9IHRoaXMuX2NlbGxzW2tleV0uYm91bmRzO1xuICAgICAgdmFyIGNvb3JkcyA9IHRoaXMuX2NlbGxzW2tleV0uY29vcmRzO1xuXG4gICAgICBpZiAodGhpcy5jZWxsTGVhdmUpIHtcbiAgICAgICAgdGhpcy5jZWxsTGVhdmUoYm91bmRzLCBjb29yZHMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmZpcmUoJ2NlbGxsZWF2ZScsIHtcbiAgICAgICAgYm91bmRzOiBib3VuZHMsXG4gICAgICAgIGNvb3JkczogY29vcmRzXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgX2FkZENlbGw6IGZ1bmN0aW9uIChjb29yZHMpIHtcbiAgICAvLyB3cmFwIGNlbGwgY29vcmRzIGlmIG5lY2Vzc2FyeSAoZGVwZW5kaW5nIG9uIENSUylcbiAgICB0aGlzLl93cmFwQ29vcmRzKGNvb3Jkcyk7XG5cbiAgICAvLyBnZW5lcmF0ZSB0aGUgY2VsbCBrZXlcbiAgICB2YXIga2V5ID0gdGhpcy5fY2VsbENvb3Jkc1RvS2V5KGNvb3Jkcyk7XG5cbiAgICAvLyBnZXQgdGhlIGNlbGwgZnJvbSB0aGUgY2FjaGVcbiAgICB2YXIgY2VsbCA9IHRoaXMuX2NlbGxzW2tleV07XG4gICAgLy8gaWYgdGhpcyBjZWxsIHNob3VsZCBiZSBzaG93biBhcyBpc250IGFjdGl2ZSB5ZXQgKGVudGVyKVxuXG4gICAgaWYgKGNlbGwgJiYgIXRoaXMuX2FjdGl2ZUNlbGxzW2tleV0pIHtcbiAgICAgIGlmICh0aGlzLmNlbGxFbnRlcikge1xuICAgICAgICB0aGlzLmNlbGxFbnRlcihjZWxsLmJvdW5kcywgY29vcmRzKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5maXJlKCdjZWxsZW50ZXInLCB7XG4gICAgICAgIGJvdW5kczogY2VsbC5ib3VuZHMsXG4gICAgICAgIGNvb3JkczogY29vcmRzXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fYWN0aXZlQ2VsbHNba2V5XSA9IGNlbGw7XG4gICAgfVxuXG4gICAgLy8gaWYgd2UgZG9udCBoYXZlIHRoaXMgY2VsbCBpbiB0aGUgY2FjaGUgeWV0IChjcmVhdGUpXG4gICAgaWYgKCFjZWxsKSB7XG4gICAgICBjZWxsID0ge1xuICAgICAgICBjb29yZHM6IGNvb3JkcyxcbiAgICAgICAgYm91bmRzOiB0aGlzLl9jZWxsQ29vcmRzVG9Cb3VuZHMoY29vcmRzKVxuICAgICAgfTtcblxuICAgICAgdGhpcy5fY2VsbHNba2V5XSA9IGNlbGw7XG4gICAgICB0aGlzLl9hY3RpdmVDZWxsc1trZXldID0gY2VsbDtcblxuICAgICAgaWYgKHRoaXMuY3JlYXRlQ2VsbCkge1xuICAgICAgICB0aGlzLmNyZWF0ZUNlbGwoY2VsbC5ib3VuZHMsIGNvb3Jkcyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZmlyZSgnY2VsbGNyZWF0ZScsIHtcbiAgICAgICAgYm91bmRzOiBjZWxsLmJvdW5kcyxcbiAgICAgICAgY29vcmRzOiBjb29yZHNcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBfd3JhcENvb3JkczogZnVuY3Rpb24gKGNvb3Jkcykge1xuICAgIGNvb3Jkcy54ID0gdGhpcy5fd3JhcExuZyA/IEwuVXRpbC53cmFwTnVtKGNvb3Jkcy54LCB0aGlzLl93cmFwTG5nKSA6IGNvb3Jkcy54O1xuICAgIGNvb3Jkcy55ID0gdGhpcy5fd3JhcExhdCA/IEwuVXRpbC53cmFwTnVtKGNvb3Jkcy55LCB0aGlzLl93cmFwTGF0KSA6IGNvb3Jkcy55O1xuICB9LFxuXG4gIC8vIGdldCB0aGUgZ2xvYmFsIGNlbGwgY29vcmRpbmF0ZXMgcmFuZ2UgZm9yIHRoZSBjdXJyZW50IHpvb21cbiAgX2dldENlbGxOdW1Cb3VuZHM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYm91bmRzID0gdGhpcy5fbWFwLmdldFBpeGVsV29ybGRCb3VuZHMoKTtcbiAgICB2YXIgc2l6ZSA9IHRoaXMuX2dldENlbGxTaXplKCk7XG5cbiAgICByZXR1cm4gYm91bmRzID8gTC5ib3VuZHMoXG4gICAgICAgIGJvdW5kcy5taW4uZGl2aWRlQnkoc2l6ZSkuZmxvb3IoKSxcbiAgICAgICAgYm91bmRzLm1heC5kaXZpZGVCeShzaXplKS5jZWlsKCkuc3VidHJhY3QoWzEsIDFdKSkgOiBudWxsO1xuICB9XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgVmlydHVhbEdyaWQ7XG4iLCJmdW5jdGlvbiBCaW5hcnlTZWFyY2hJbmRleCAodmFsdWVzKSB7XG4gIHRoaXMudmFsdWVzID0gW10uY29uY2F0KHZhbHVlcyB8fCBbXSk7XG59XG5cbkJpbmFyeVNlYXJjaEluZGV4LnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgaW5kZXggPSB0aGlzLmdldEluZGV4KHZhbHVlKTtcbiAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbn07XG5cbkJpbmFyeVNlYXJjaEluZGV4LnByb3RvdHlwZS5nZXRJbmRleCA9IGZ1bmN0aW9uIGdldEluZGV4ICh2YWx1ZSkge1xuICBpZiAodGhpcy5kaXJ0eSkge1xuICAgIHRoaXMuc29ydCgpO1xuICB9XG5cbiAgdmFyIG1pbkluZGV4ID0gMDtcbiAgdmFyIG1heEluZGV4ID0gdGhpcy52YWx1ZXMubGVuZ3RoIC0gMTtcbiAgdmFyIGN1cnJlbnRJbmRleDtcbiAgdmFyIGN1cnJlbnRFbGVtZW50O1xuXG4gIHdoaWxlIChtaW5JbmRleCA8PSBtYXhJbmRleCkge1xuICAgIGN1cnJlbnRJbmRleCA9IChtaW5JbmRleCArIG1heEluZGV4KSAvIDIgfCAwO1xuICAgIGN1cnJlbnRFbGVtZW50ID0gdGhpcy52YWx1ZXNbTWF0aC5yb3VuZChjdXJyZW50SW5kZXgpXTtcbiAgICBpZiAoK2N1cnJlbnRFbGVtZW50LnZhbHVlIDwgK3ZhbHVlKSB7XG4gICAgICBtaW5JbmRleCA9IGN1cnJlbnRJbmRleCArIDE7XG4gICAgfSBlbHNlIGlmICgrY3VycmVudEVsZW1lbnQudmFsdWUgPiArdmFsdWUpIHtcbiAgICAgIG1heEluZGV4ID0gY3VycmVudEluZGV4IC0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN1cnJlbnRJbmRleDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gTWF0aC5hYnMofm1heEluZGV4KTtcbn07XG5cbkJpbmFyeVNlYXJjaEluZGV4LnByb3RvdHlwZS5iZXR3ZWVuID0gZnVuY3Rpb24gYmV0d2VlbiAoc3RhcnQsIGVuZCkge1xuICB2YXIgc3RhcnRJbmRleCA9IHRoaXMuZ2V0SW5kZXgoc3RhcnQpO1xuICB2YXIgZW5kSW5kZXggPSB0aGlzLmdldEluZGV4KGVuZCk7XG5cbiAgaWYgKHN0YXJ0SW5kZXggPT09IDAgJiYgZW5kSW5kZXggPT09IDApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICB3aGlsZSAodGhpcy52YWx1ZXNbc3RhcnRJbmRleCAtIDFdICYmIHRoaXMudmFsdWVzW3N0YXJ0SW5kZXggLSAxXS52YWx1ZSA9PT0gc3RhcnQpIHtcbiAgICBzdGFydEluZGV4LS07XG4gIH1cblxuICB3aGlsZSAodGhpcy52YWx1ZXNbZW5kSW5kZXggKyAxXSAmJiB0aGlzLnZhbHVlc1tlbmRJbmRleCArIDFdLnZhbHVlID09PSBlbmQpIHtcbiAgICBlbmRJbmRleCsrO1xuICB9XG5cbiAgaWYgKHRoaXMudmFsdWVzW2VuZEluZGV4XSAmJiB0aGlzLnZhbHVlc1tlbmRJbmRleF0udmFsdWUgPT09IGVuZCAmJiB0aGlzLnZhbHVlc1tlbmRJbmRleCArIDFdKSB7XG4gICAgZW5kSW5kZXgrKztcbiAgfVxuXG4gIHJldHVybiB0aGlzLnZhbHVlcy5zbGljZShzdGFydEluZGV4LCBlbmRJbmRleCk7XG59O1xuXG5CaW5hcnlTZWFyY2hJbmRleC5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24gaW5zZXJ0IChpdGVtKSB7XG4gIHRoaXMudmFsdWVzLnNwbGljZSh0aGlzLmdldEluZGV4KGl0ZW0udmFsdWUpLCAwLCBpdGVtKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5CaW5hcnlTZWFyY2hJbmRleC5wcm90b3R5cGUuYnVsa0FkZCA9IGZ1bmN0aW9uIGJ1bGtBZGQgKGl0ZW1zLCBzb3J0KSB7XG4gIHRoaXMudmFsdWVzID0gdGhpcy52YWx1ZXMuY29uY2F0KFtdLmNvbmNhdChpdGVtcyB8fCBbXSkpO1xuXG4gIGlmIChzb3J0KSB7XG4gICAgdGhpcy5zb3J0KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkJpbmFyeVNlYXJjaEluZGV4LnByb3RvdHlwZS5zb3J0ID0gZnVuY3Rpb24gc29ydCAoKSB7XG4gIHRoaXMudmFsdWVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gK2IudmFsdWUgLSArYS52YWx1ZTtcbiAgfSkucmV2ZXJzZSgpO1xuICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gIHJldHVybiB0aGlzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQmluYXJ5U2VhcmNoSW5kZXg7XG4iLCJpbXBvcnQgeyBVdGlsIH0gZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCBmZWF0dXJlTGF5ZXJTZXJ2aWNlIGZyb20gJy4uLy4uL1NlcnZpY2VzL0ZlYXR1cmVMYXllclNlcnZpY2UnO1xyXG5pbXBvcnQgeyBjbGVhblVybCwgd2Fybiwgc2V0RXNyaUF0dHJpYnV0aW9uIH0gZnJvbSAnLi4vLi4vVXRpbCc7XHJcbmltcG9ydCBWaXJ0dWFsR3JpZCBmcm9tICdsZWFmbGV0LXZpcnR1YWwtZ3JpZCc7XHJcbmltcG9ydCBCaW5hcnlTZWFyY2hJbmRleCBmcm9tICd0aW55LWJpbmFyeS1zZWFyY2gnO1xyXG5cclxuZXhwb3J0IHZhciBGZWF0dXJlTWFuYWdlciA9IFZpcnR1YWxHcmlkLmV4dGVuZCh7XHJcbiAgLyoqXHJcbiAgICogT3B0aW9uc1xyXG4gICAqL1xyXG5cclxuICBvcHRpb25zOiB7XHJcbiAgICBhdHRyaWJ1dGlvbjogbnVsbCxcclxuICAgIHdoZXJlOiAnMT0xJyxcclxuICAgIGZpZWxkczogWycqJ10sXHJcbiAgICBmcm9tOiBmYWxzZSxcclxuICAgIHRvOiBmYWxzZSxcclxuICAgIHRpbWVGaWVsZDogZmFsc2UsXHJcbiAgICB0aW1lRmlsdGVyTW9kZTogJ3NlcnZlcicsXHJcbiAgICBzaW1wbGlmeUZhY3RvcjogMCxcclxuICAgIHByZWNpc2lvbjogNlxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0cnVjdG9yXHJcbiAgICovXHJcblxyXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBWaXJ0dWFsR3JpZC5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG5cclxuICAgIG9wdGlvbnMudXJsID0gY2xlYW5Vcmwob3B0aW9ucy51cmwpO1xyXG4gICAgb3B0aW9ucyA9IFV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLnNlcnZpY2UgPSBmZWF0dXJlTGF5ZXJTZXJ2aWNlKG9wdGlvbnMpO1xyXG4gICAgdGhpcy5zZXJ2aWNlLmFkZEV2ZW50UGFyZW50KHRoaXMpO1xyXG5cclxuICAgIC8vIHVzZSBjYXNlIGluc2Vuc2l0aXZlIHJlZ2V4IHRvIGxvb2sgZm9yIGNvbW1vbiBmaWVsZG5hbWVzIHVzZWQgZm9yIGluZGV4aW5nXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmZpZWxkc1swXSAhPT0gJyonKSB7XHJcbiAgICAgIHZhciBvaWRDaGVjayA9IGZhbHNlO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZpZWxkc1tpXS5tYXRjaCgvXihPQkpFQ1RJRHxGSUR8T0lEfElEKSQvaSkpIHtcclxuICAgICAgICAgIG9pZENoZWNrID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG9pZENoZWNrID09PSBmYWxzZSkge1xyXG4gICAgICAgIHdhcm4oJ25vIGtub3duIGVzcmlGaWVsZFR5cGVPSUQgZmllbGQgZGV0ZWN0ZWQgaW4gZmllbGRzIEFycmF5LiAgUGxlYXNlIGFkZCBhbiBhdHRyaWJ1dGUgZmllbGQgY29udGFpbmluZyB1bmlxdWUgSURzIHRvIGVuc3VyZSB0aGUgbGF5ZXIgY2FuIGJlIGRyYXduIGNvcnJlY3RseS4nKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudGltZUZpZWxkLnN0YXJ0ICYmIHRoaXMub3B0aW9ucy50aW1lRmllbGQuZW5kKSB7XHJcbiAgICAgIHRoaXMuX3N0YXJ0VGltZUluZGV4ID0gbmV3IEJpbmFyeVNlYXJjaEluZGV4KCk7XHJcbiAgICAgIHRoaXMuX2VuZFRpbWVJbmRleCA9IG5ldyBCaW5hcnlTZWFyY2hJbmRleCgpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMudGltZUZpZWxkKSB7XHJcbiAgICAgIHRoaXMuX3RpbWVJbmRleCA9IG5ldyBCaW5hcnlTZWFyY2hJbmRleCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2NhY2hlID0ge307XHJcbiAgICB0aGlzLl9jdXJyZW50U25hcHNob3QgPSBbXTsgLy8gY2FjaGUgb2Ygd2hhdCBsYXllcnMgc2hvdWxkIGJlIGFjdGl2ZVxyXG4gICAgdGhpcy5fYWN0aXZlUmVxdWVzdHMgPSAwO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIExheWVyIEludGVyZmFjZVxyXG4gICAqL1xyXG5cclxuICBvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xyXG4gICAgLy8gaW5jbHVkZSAnUG93ZXJlZCBieSBFc3JpJyBpbiBtYXAgYXR0cmlidXRpb25cclxuICAgIHNldEVzcmlBdHRyaWJ1dGlvbihtYXApO1xyXG5cclxuICAgIHRoaXMuc2VydmljZS5tZXRhZGF0YShmdW5jdGlvbiAoZXJyLCBtZXRhZGF0YSkge1xyXG4gICAgICBpZiAoIWVycikge1xyXG4gICAgICAgIHZhciBzdXBwb3J0ZWRGb3JtYXRzID0gbWV0YWRhdGEuc3VwcG9ydGVkUXVlcnlGb3JtYXRzO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiBzb21lb25lIGhhcyByZXF1ZXN0ZWQgdGhhdCB3ZSBkb24ndCB1c2UgZ2VvSlNPTiwgZXZlbiBpZiBpdCdzIGF2YWlsYWJsZVxyXG4gICAgICAgIHZhciBmb3JjZUpzb25Gb3JtYXQgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGhpcy5zZXJ2aWNlLm9wdGlvbnMuaXNNb2Rlcm4gPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICBmb3JjZUpzb25Gb3JtYXQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVW5sZXNzIHdlJ3ZlIGJlZW4gdG9sZCBvdGhlcndpc2UsIGNoZWNrIHRvIHNlZSB3aGV0aGVyIHNlcnZpY2UgY2FuIGVtaXQgR2VvSlNPTiBuYXRpdmVseVxyXG4gICAgICAgIGlmICghZm9yY2VKc29uRm9ybWF0ICYmIHN1cHBvcnRlZEZvcm1hdHMgJiYgc3VwcG9ydGVkRm9ybWF0cy5pbmRleE9mKCdnZW9KU09OJykgIT09IC0xKSB7XHJcbiAgICAgICAgICB0aGlzLnNlcnZpY2Uub3B0aW9ucy5pc01vZGVybiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBhZGQgY29weXJpZ2h0IHRleHQgbGlzdGVkIGluIHNlcnZpY2UgbWV0YWRhdGFcclxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hdHRyaWJ1dGlvbiAmJiBtYXAuYXR0cmlidXRpb25Db250cm9sICYmIG1ldGFkYXRhLmNvcHlyaWdodFRleHQpIHtcclxuICAgICAgICAgIHRoaXMub3B0aW9ucy5hdHRyaWJ1dGlvbiA9IG1ldGFkYXRhLmNvcHlyaWdodFRleHQ7XHJcbiAgICAgICAgICBtYXAuYXR0cmlidXRpb25Db250cm9sLmFkZEF0dHJpYnV0aW9uKHRoaXMuZ2V0QXR0cmlidXRpb24oKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICBtYXAub24oJ3pvb21lbmQnLCB0aGlzLl9oYW5kbGVab29tQ2hhbmdlLCB0aGlzKTtcclxuXHJcbiAgICByZXR1cm4gVmlydHVhbEdyaWQucHJvdG90eXBlLm9uQWRkLmNhbGwodGhpcywgbWFwKTtcclxuICB9LFxyXG5cclxuICBvblJlbW92ZTogZnVuY3Rpb24gKG1hcCkge1xyXG4gICAgbWFwLm9mZignem9vbWVuZCcsIHRoaXMuX2hhbmRsZVpvb21DaGFuZ2UsIHRoaXMpO1xyXG5cclxuICAgIHJldHVybiBWaXJ0dWFsR3JpZC5wcm90b3R5cGUub25SZW1vdmUuY2FsbCh0aGlzLCBtYXApO1xyXG4gIH0sXHJcblxyXG4gIGdldEF0dHJpYnV0aW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmF0dHJpYnV0aW9uO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEZlYXR1cmUgTWFuYWdlbWVudFxyXG4gICAqL1xyXG5cclxuICBjcmVhdGVDZWxsOiBmdW5jdGlvbiAoYm91bmRzLCBjb29yZHMpIHtcclxuICAgIC8vIGRvbnQgZmV0Y2ggZmVhdHVyZXMgb3V0c2lkZSB0aGUgc2NhbGUgcmFuZ2UgZGVmaW5lZCBmb3IgdGhlIGxheWVyXHJcbiAgICBpZiAodGhpcy5fdmlzaWJsZVpvb20oKSkge1xyXG4gICAgICB0aGlzLl9yZXF1ZXN0RmVhdHVyZXMoYm91bmRzLCBjb29yZHMpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIF9yZXF1ZXN0RmVhdHVyZXM6IGZ1bmN0aW9uIChib3VuZHMsIGNvb3JkcywgY2FsbGJhY2spIHtcclxuICAgIHRoaXMuX2FjdGl2ZVJlcXVlc3RzKys7XHJcblxyXG4gICAgLy8gb3VyIGZpcnN0IGFjdGl2ZSByZXF1ZXN0IGZpcmVzIGxvYWRpbmdcclxuICAgIGlmICh0aGlzLl9hY3RpdmVSZXF1ZXN0cyA9PT0gMSkge1xyXG4gICAgICB0aGlzLmZpcmUoJ2xvYWRpbmcnLCB7XHJcbiAgICAgICAgYm91bmRzOiBib3VuZHNcclxuICAgICAgfSwgdHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX2J1aWxkUXVlcnkoYm91bmRzKS5ydW4oZnVuY3Rpb24gKGVycm9yLCBmZWF0dXJlQ29sbGVjdGlvbiwgcmVzcG9uc2UpIHtcclxuICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmV4Y2VlZGVkVHJhbnNmZXJMaW1pdCkge1xyXG4gICAgICAgIHRoaXMuZmlyZSgnZHJhd2xpbWl0ZXhjZWVkZWQnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gbm8gZXJyb3IsIGZlYXR1cmVzXHJcbiAgICAgIGlmICghZXJyb3IgJiYgZmVhdHVyZUNvbGxlY3Rpb24gJiYgZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgLy8gc2NoZWR1bGUgYWRkaW5nIGZlYXR1cmVzIHVudGlsIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZVxyXG4gICAgICAgIFV0aWwucmVxdWVzdEFuaW1GcmFtZShVdGlsLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdGhpcy5fYWRkRmVhdHVyZXMoZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXMsIGNvb3Jkcyk7XHJcbiAgICAgICAgICB0aGlzLl9wb3N0UHJvY2Vzc0ZlYXR1cmVzKGJvdW5kcyk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBubyBlcnJvciwgbm8gZmVhdHVyZXNcclxuICAgICAgaWYgKCFlcnJvciAmJiBmZWF0dXJlQ29sbGVjdGlvbiAmJiAhZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgdGhpcy5fcG9zdFByb2Nlc3NGZWF0dXJlcyhib3VuZHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICB0aGlzLl9wb3N0UHJvY2Vzc0ZlYXR1cmVzKGJvdW5kcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwodGhpcywgZXJyb3IsIGZlYXR1cmVDb2xsZWN0aW9uKTtcclxuICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgX3Bvc3RQcm9jZXNzRmVhdHVyZXM6IGZ1bmN0aW9uIChib3VuZHMpIHtcclxuICAgIC8vIGRlaW5jcmVtZW50IHRoZSByZXF1ZXN0IGNvdW50ZXIgbm93IHRoYXQgd2UgaGF2ZSBwcm9jZXNzZWQgZmVhdHVyZXNcclxuICAgIHRoaXMuX2FjdGl2ZVJlcXVlc3RzLS07XHJcblxyXG4gICAgLy8gaWYgdGhlcmUgYXJlIG5vIG1vcmUgYWN0aXZlIHJlcXVlc3RzIGZpcmUgYSBsb2FkIGV2ZW50IGZvciB0aGlzIHZpZXdcclxuICAgIGlmICh0aGlzLl9hY3RpdmVSZXF1ZXN0cyA8PSAwKSB7XHJcbiAgICAgIHRoaXMuZmlyZSgnbG9hZCcsIHtcclxuICAgICAgICBib3VuZHM6IGJvdW5kc1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfY2FjaGVLZXk6IGZ1bmN0aW9uIChjb29yZHMpIHtcclxuICAgIHJldHVybiBjb29yZHMueiArICc6JyArIGNvb3Jkcy54ICsgJzonICsgY29vcmRzLnk7XHJcbiAgfSxcclxuXHJcbiAgX2FkZEZlYXR1cmVzOiBmdW5jdGlvbiAoZmVhdHVyZXMsIGNvb3Jkcykge1xyXG4gICAgdmFyIGtleSA9IHRoaXMuX2NhY2hlS2V5KGNvb3Jkcyk7XHJcbiAgICB0aGlzLl9jYWNoZVtrZXldID0gdGhpcy5fY2FjaGVba2V5XSB8fCBbXTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gZmVhdHVyZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgdmFyIGlkID0gZmVhdHVyZXNbaV0uaWQ7XHJcblxyXG4gICAgICBpZiAodGhpcy5fY3VycmVudFNuYXBzaG90LmluZGV4T2YoaWQpID09PSAtMSkge1xyXG4gICAgICAgIHRoaXMuX2N1cnJlbnRTbmFwc2hvdC5wdXNoKGlkKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5fY2FjaGVba2V5XS5pbmRleE9mKGlkKSA9PT0gLTEpIHtcclxuICAgICAgICB0aGlzLl9jYWNoZVtrZXldLnB1c2goaWQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy50aW1lRmllbGQpIHtcclxuICAgICAgdGhpcy5fYnVpbGRUaW1lSW5kZXhlcyhmZWF0dXJlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jcmVhdGVMYXllcnMoZmVhdHVyZXMpO1xyXG4gIH0sXHJcblxyXG4gIF9idWlsZFF1ZXJ5OiBmdW5jdGlvbiAoYm91bmRzKSB7XHJcbiAgICB2YXIgcXVlcnkgPSB0aGlzLnNlcnZpY2UucXVlcnkoKVxyXG4gICAgICAuaW50ZXJzZWN0cyhib3VuZHMpXHJcbiAgICAgIC53aGVyZSh0aGlzLm9wdGlvbnMud2hlcmUpXHJcbiAgICAgIC5maWVsZHModGhpcy5vcHRpb25zLmZpZWxkcylcclxuICAgICAgLnByZWNpc2lvbih0aGlzLm9wdGlvbnMucHJlY2lzaW9uKTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnNpbXBsaWZ5RmFjdG9yKSB7XHJcbiAgICAgIHF1ZXJ5LnNpbXBsaWZ5KHRoaXMuX21hcCwgdGhpcy5vcHRpb25zLnNpbXBsaWZ5RmFjdG9yKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVGaWx0ZXJNb2RlID09PSAnc2VydmVyJyAmJiB0aGlzLm9wdGlvbnMuZnJvbSAmJiB0aGlzLm9wdGlvbnMudG8pIHtcclxuICAgICAgcXVlcnkuYmV0d2Vlbih0aGlzLm9wdGlvbnMuZnJvbSwgdGhpcy5vcHRpb25zLnRvKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcXVlcnk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogV2hlcmUgTWV0aG9kc1xyXG4gICAqL1xyXG5cclxuICBzZXRXaGVyZTogZnVuY3Rpb24gKHdoZXJlLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5vcHRpb25zLndoZXJlID0gKHdoZXJlICYmIHdoZXJlLmxlbmd0aCkgPyB3aGVyZSA6ICcxPTEnO1xyXG5cclxuICAgIHZhciBvbGRTbmFwc2hvdCA9IFtdO1xyXG4gICAgdmFyIG5ld1NuYXBzaG90ID0gW107XHJcbiAgICB2YXIgcGVuZGluZ1JlcXVlc3RzID0gMDtcclxuICAgIHZhciByZXF1ZXN0RXJyb3IgPSBudWxsO1xyXG4gICAgdmFyIHJlcXVlc3RDYWxsYmFjayA9IFV0aWwuYmluZChmdW5jdGlvbiAoZXJyb3IsIGZlYXR1cmVDb2xsZWN0aW9uKSB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIHJlcXVlc3RFcnJvciA9IGVycm9yO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZmVhdHVyZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgIG5ld1NuYXBzaG90LnB1c2goZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXNbaV0uaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcGVuZGluZ1JlcXVlc3RzLS07XHJcblxyXG4gICAgICBpZiAocGVuZGluZ1JlcXVlc3RzIDw9IDAgJiYgdGhpcy5fdmlzaWJsZVpvb20oKSkge1xyXG4gICAgICAgIHRoaXMuX2N1cnJlbnRTbmFwc2hvdCA9IG5ld1NuYXBzaG90O1xyXG4gICAgICAgIC8vIHNjaGVkdWxlIGFkZGluZyBmZWF0dXJlcyBmb3IgdGhlIG5leHQgYW5pbWF0aW9uIGZyYW1lXHJcbiAgICAgICAgVXRpbC5yZXF1ZXN0QW5pbUZyYW1lKFV0aWwuYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB0aGlzLnJlbW92ZUxheWVycyhvbGRTbmFwc2hvdCk7XHJcbiAgICAgICAgICB0aGlzLmFkZExheWVycyhuZXdTbmFwc2hvdCk7XHJcbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCByZXF1ZXN0RXJyb3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IHRoaXMuX2N1cnJlbnRTbmFwc2hvdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICBvbGRTbmFwc2hvdC5wdXNoKHRoaXMuX2N1cnJlbnRTbmFwc2hvdFtpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2FjdGl2ZUNlbGxzKSB7XHJcbiAgICAgIHBlbmRpbmdSZXF1ZXN0cysrO1xyXG4gICAgICB2YXIgY29vcmRzID0gdGhpcy5fa2V5VG9DZWxsQ29vcmRzKGtleSk7XHJcbiAgICAgIHZhciBib3VuZHMgPSB0aGlzLl9jZWxsQ29vcmRzVG9Cb3VuZHMoY29vcmRzKTtcclxuICAgICAgdGhpcy5fcmVxdWVzdEZlYXR1cmVzKGJvdW5kcywga2V5LCByZXF1ZXN0Q2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGdldFdoZXJlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLndoZXJlO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFRpbWUgUmFuZ2UgTWV0aG9kc1xyXG4gICAqL1xyXG5cclxuICBnZXRUaW1lUmFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBbdGhpcy5vcHRpb25zLmZyb20sIHRoaXMub3B0aW9ucy50b107XHJcbiAgfSxcclxuXHJcbiAgc2V0VGltZVJhbmdlOiBmdW5jdGlvbiAoZnJvbSwgdG8sIGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICB2YXIgb2xkRnJvbSA9IHRoaXMub3B0aW9ucy5mcm9tO1xyXG4gICAgdmFyIG9sZFRvID0gdGhpcy5vcHRpb25zLnRvO1xyXG4gICAgdmFyIHBlbmRpbmdSZXF1ZXN0cyA9IDA7XHJcbiAgICB2YXIgcmVxdWVzdEVycm9yID0gbnVsbDtcclxuICAgIHZhciByZXF1ZXN0Q2FsbGJhY2sgPSBVdGlsLmJpbmQoZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIHJlcXVlc3RFcnJvciA9IGVycm9yO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuX2ZpbHRlckV4aXN0aW5nRmVhdHVyZXMob2xkRnJvbSwgb2xkVG8sIGZyb20sIHRvKTtcclxuXHJcbiAgICAgIHBlbmRpbmdSZXF1ZXN0cy0tO1xyXG5cclxuICAgICAgaWYgKGNhbGxiYWNrICYmIHBlbmRpbmdSZXF1ZXN0cyA8PSAwKSB7XHJcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCByZXF1ZXN0RXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLm9wdGlvbnMuZnJvbSA9IGZyb207XHJcbiAgICB0aGlzLm9wdGlvbnMudG8gPSB0bztcclxuXHJcbiAgICB0aGlzLl9maWx0ZXJFeGlzdGluZ0ZlYXR1cmVzKG9sZEZyb20sIG9sZFRvLCBmcm9tLCB0byk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy50aW1lRmlsdGVyTW9kZSA9PT0gJ3NlcnZlcicpIHtcclxuICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2FjdGl2ZUNlbGxzKSB7XHJcbiAgICAgICAgcGVuZGluZ1JlcXVlc3RzKys7XHJcbiAgICAgICAgdmFyIGNvb3JkcyA9IHRoaXMuX2tleVRvQ2VsbENvb3JkcyhrZXkpO1xyXG4gICAgICAgIHZhciBib3VuZHMgPSB0aGlzLl9jZWxsQ29vcmRzVG9Cb3VuZHMoY29vcmRzKTtcclxuICAgICAgICB0aGlzLl9yZXF1ZXN0RmVhdHVyZXMoYm91bmRzLCBrZXksIHJlcXVlc3RDYWxsYmFjayk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICByZWZyZXNoOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fYWN0aXZlQ2VsbHMpIHtcclxuICAgICAgdmFyIGNvb3JkcyA9IHRoaXMuX2tleVRvQ2VsbENvb3JkcyhrZXkpO1xyXG4gICAgICB2YXIgYm91bmRzID0gdGhpcy5fY2VsbENvb3Jkc1RvQm91bmRzKGNvb3Jkcyk7XHJcbiAgICAgIHRoaXMuX3JlcXVlc3RGZWF0dXJlcyhib3VuZHMsIGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMucmVkcmF3KSB7XHJcbiAgICAgIHRoaXMub25jZSgnbG9hZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmVhY2hGZWF0dXJlKGZ1bmN0aW9uIChsYXllcikge1xyXG4gICAgICAgICAgdGhpcy5fcmVkcmF3KGxheWVyLmZlYXR1cmUuaWQpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfZmlsdGVyRXhpc3RpbmdGZWF0dXJlczogZnVuY3Rpb24gKG9sZEZyb20sIG9sZFRvLCBuZXdGcm9tLCBuZXdUbykge1xyXG4gICAgdmFyIGxheWVyc1RvUmVtb3ZlID0gKG9sZEZyb20gJiYgb2xkVG8pID8gdGhpcy5fZ2V0RmVhdHVyZXNJblRpbWVSYW5nZShvbGRGcm9tLCBvbGRUbykgOiB0aGlzLl9jdXJyZW50U25hcHNob3Q7XHJcbiAgICB2YXIgbGF5ZXJzVG9BZGQgPSB0aGlzLl9nZXRGZWF0dXJlc0luVGltZVJhbmdlKG5ld0Zyb20sIG5ld1RvKTtcclxuXHJcbiAgICBpZiAobGF5ZXJzVG9BZGQuaW5kZXhPZikge1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxheWVyc1RvQWRkLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHNob3VsZFJlbW92ZUxheWVyID0gbGF5ZXJzVG9SZW1vdmUuaW5kZXhPZihsYXllcnNUb0FkZFtpXSk7XHJcbiAgICAgICAgaWYgKHNob3VsZFJlbW92ZUxheWVyID49IDApIHtcclxuICAgICAgICAgIGxheWVyc1RvUmVtb3ZlLnNwbGljZShzaG91bGRSZW1vdmVMYXllciwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2NoZWR1bGUgYWRkaW5nIGZlYXR1cmVzIHVudGlsIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZVxyXG4gICAgVXRpbC5yZXF1ZXN0QW5pbUZyYW1lKFV0aWwuYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHRoaXMucmVtb3ZlTGF5ZXJzKGxheWVyc1RvUmVtb3ZlKTtcclxuICAgICAgdGhpcy5hZGRMYXllcnMobGF5ZXJzVG9BZGQpO1xyXG4gICAgfSwgdGhpcykpO1xyXG4gIH0sXHJcblxyXG4gIF9nZXRGZWF0dXJlc0luVGltZVJhbmdlOiBmdW5jdGlvbiAoc3RhcnQsIGVuZCkge1xyXG4gICAgdmFyIGlkcyA9IFtdO1xyXG4gICAgdmFyIHNlYXJjaDtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVGaWVsZC5zdGFydCAmJiB0aGlzLm9wdGlvbnMudGltZUZpZWxkLmVuZCkge1xyXG4gICAgICB2YXIgc3RhcnRUaW1lcyA9IHRoaXMuX3N0YXJ0VGltZUluZGV4LmJldHdlZW4oc3RhcnQsIGVuZCk7XHJcbiAgICAgIHZhciBlbmRUaW1lcyA9IHRoaXMuX2VuZFRpbWVJbmRleC5iZXR3ZWVuKHN0YXJ0LCBlbmQpO1xyXG4gICAgICBzZWFyY2ggPSBzdGFydFRpbWVzLmNvbmNhdChlbmRUaW1lcyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWFyY2ggPSB0aGlzLl90aW1lSW5kZXguYmV0d2VlbihzdGFydCwgZW5kKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpID0gc2VhcmNoLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIGlkcy5wdXNoKHNlYXJjaFtpXS5pZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGlkcztcclxuICB9LFxyXG5cclxuICBfYnVpbGRUaW1lSW5kZXhlczogZnVuY3Rpb24gKGdlb2pzb24pIHtcclxuICAgIHZhciBpO1xyXG4gICAgdmFyIGZlYXR1cmU7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVGaWVsZC5zdGFydCAmJiB0aGlzLm9wdGlvbnMudGltZUZpZWxkLmVuZCkge1xyXG4gICAgICB2YXIgc3RhcnRUaW1lRW50cmllcyA9IFtdO1xyXG4gICAgICB2YXIgZW5kVGltZUVudHJpZXMgPSBbXTtcclxuICAgICAgZm9yIChpID0gZ2VvanNvbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgIGZlYXR1cmUgPSBnZW9qc29uW2ldO1xyXG4gICAgICAgIHN0YXJ0VGltZUVudHJpZXMucHVzaCh7XHJcbiAgICAgICAgICBpZDogZmVhdHVyZS5pZCxcclxuICAgICAgICAgIHZhbHVlOiBuZXcgRGF0ZShmZWF0dXJlLnByb3BlcnRpZXNbdGhpcy5vcHRpb25zLnRpbWVGaWVsZC5zdGFydF0pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZW5kVGltZUVudHJpZXMucHVzaCh7XHJcbiAgICAgICAgICBpZDogZmVhdHVyZS5pZCxcclxuICAgICAgICAgIHZhbHVlOiBuZXcgRGF0ZShmZWF0dXJlLnByb3BlcnRpZXNbdGhpcy5vcHRpb25zLnRpbWVGaWVsZC5lbmRdKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuX3N0YXJ0VGltZUluZGV4LmJ1bGtBZGQoc3RhcnRUaW1lRW50cmllcyk7XHJcbiAgICAgIHRoaXMuX2VuZFRpbWVJbmRleC5idWxrQWRkKGVuZFRpbWVFbnRyaWVzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciB0aW1lRW50cmllcyA9IFtdO1xyXG4gICAgICBmb3IgKGkgPSBnZW9qc29uLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgZmVhdHVyZSA9IGdlb2pzb25baV07XHJcbiAgICAgICAgdGltZUVudHJpZXMucHVzaCh7XHJcbiAgICAgICAgICBpZDogZmVhdHVyZS5pZCxcclxuICAgICAgICAgIHZhbHVlOiBuZXcgRGF0ZShmZWF0dXJlLnByb3BlcnRpZXNbdGhpcy5vcHRpb25zLnRpbWVGaWVsZF0pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX3RpbWVJbmRleC5idWxrQWRkKHRpbWVFbnRyaWVzKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfZmVhdHVyZVdpdGhpblRpbWVSYW5nZTogZnVuY3Rpb24gKGZlYXR1cmUpIHtcclxuICAgIGlmICghdGhpcy5vcHRpb25zLmZyb20gfHwgIXRoaXMub3B0aW9ucy50bykge1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZnJvbSA9ICt0aGlzLm9wdGlvbnMuZnJvbS52YWx1ZU9mKCk7XHJcbiAgICB2YXIgdG8gPSArdGhpcy5vcHRpb25zLnRvLnZhbHVlT2YoKTtcclxuXHJcbiAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy50aW1lRmllbGQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHZhciBkYXRlID0gK2ZlYXR1cmUucHJvcGVydGllc1t0aGlzLm9wdGlvbnMudGltZUZpZWxkXTtcclxuICAgICAgcmV0dXJuIChkYXRlID49IGZyb20pICYmIChkYXRlIDw9IHRvKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVGaWVsZC5zdGFydCAmJiB0aGlzLm9wdGlvbnMudGltZUZpZWxkLmVuZCkge1xyXG4gICAgICB2YXIgc3RhcnREYXRlID0gK2ZlYXR1cmUucHJvcGVydGllc1t0aGlzLm9wdGlvbnMudGltZUZpZWxkLnN0YXJ0XTtcclxuICAgICAgdmFyIGVuZERhdGUgPSArZmVhdHVyZS5wcm9wZXJ0aWVzW3RoaXMub3B0aW9ucy50aW1lRmllbGQuZW5kXTtcclxuICAgICAgcmV0dXJuICgoc3RhcnREYXRlID49IGZyb20pICYmIChzdGFydERhdGUgPD0gdG8pKSB8fCAoKGVuZERhdGUgPj0gZnJvbSkgJiYgKGVuZERhdGUgPD0gdG8pKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfdmlzaWJsZVpvb206IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIGNoZWNrIHRvIHNlZSB3aGV0aGVyIHRoZSBjdXJyZW50IHpvb20gbGV2ZWwgb2YgdGhlIG1hcCBpcyB3aXRoaW4gdGhlIG9wdGlvbmFsIGxpbWl0IGRlZmluZWQgZm9yIHRoZSBGZWF0dXJlTGF5ZXJcclxuICAgIGlmICghdGhpcy5fbWFwKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHZhciB6b29tID0gdGhpcy5fbWFwLmdldFpvb20oKTtcclxuICAgIGlmICh6b29tID4gdGhpcy5vcHRpb25zLm1heFpvb20gfHwgem9vbSA8IHRoaXMub3B0aW9ucy5taW5ab29tKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0gZWxzZSB7IHJldHVybiB0cnVlOyB9XHJcbiAgfSxcclxuXHJcbiAgX2hhbmRsZVpvb21DaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICghdGhpcy5fdmlzaWJsZVpvb20oKSkge1xyXG4gICAgICB0aGlzLnJlbW92ZUxheWVycyh0aGlzLl9jdXJyZW50U25hcHNob3QpO1xyXG4gICAgICB0aGlzLl9jdXJyZW50U25hcHNob3QgPSBbXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8qXHJcbiAgICAgIGZvciBldmVyeSBjZWxsIGluIHRoaXMuX2FjdGl2ZUNlbGxzXHJcbiAgICAgICAgMS4gR2V0IHRoZSBjYWNoZSBrZXkgZm9yIHRoZSBjb29yZHMgb2YgdGhlIGNlbGxcclxuICAgICAgICAyLiBJZiB0aGlzLl9jYWNoZVtrZXldIGV4aXN0cyBpdCB3aWxsIGJlIGFuIGFycmF5IG9mIGZlYXR1cmUgSURzLlxyXG4gICAgICAgIDMuIENhbGwgdGhpcy5hZGRMYXllcnModGhpcy5fY2FjaGVba2V5XSkgdG8gaW5zdHJ1Y3QgdGhlIGZlYXR1cmUgbGF5ZXIgdG8gYWRkIHRoZSBsYXllcnMgYmFjay5cclxuICAgICAgKi9cclxuICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLl9hY3RpdmVDZWxscykge1xyXG4gICAgICAgIHZhciBjb29yZHMgPSB0aGlzLl9hY3RpdmVDZWxsc1tpXS5jb29yZHM7XHJcbiAgICAgICAgdmFyIGtleSA9IHRoaXMuX2NhY2hlS2V5KGNvb3Jkcyk7XHJcbiAgICAgICAgaWYgKHRoaXMuX2NhY2hlW2tleV0pIHtcclxuICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzKHRoaXMuX2NhY2hlW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFNlcnZpY2UgTWV0aG9kc1xyXG4gICAqL1xyXG5cclxuICBhdXRoZW50aWNhdGU6IGZ1bmN0aW9uICh0b2tlbikge1xyXG4gICAgdGhpcy5zZXJ2aWNlLmF1dGhlbnRpY2F0ZSh0b2tlbik7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBtZXRhZGF0YTogZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICB0aGlzLnNlcnZpY2UubWV0YWRhdGEoY2FsbGJhY2ssIGNvbnRleHQpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgcXVlcnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UucXVlcnkoKTtcclxuICB9LFxyXG5cclxuICBfZ2V0TWV0YWRhdGE6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgaWYgKHRoaXMuX21ldGFkYXRhKSB7XHJcbiAgICAgIHZhciBlcnJvcjtcclxuICAgICAgY2FsbGJhY2soZXJyb3IsIHRoaXMuX21ldGFkYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubWV0YWRhdGEoVXRpbC5iaW5kKGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgICB0aGlzLl9tZXRhZGF0YSA9IHJlc3BvbnNlO1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCB0aGlzLl9tZXRhZGF0YSk7XHJcbiAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBhZGRGZWF0dXJlOiBmdW5jdGlvbiAoZmVhdHVyZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIHRoaXMuX2dldE1ldGFkYXRhKFV0aWwuYmluZChmdW5jdGlvbiAoZXJyb3IsIG1ldGFkYXRhKSB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjay5jYWxsKHRoaXMsIGVycm9yLCBudWxsKTsgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5zZXJ2aWNlLmFkZEZlYXR1cmUoZmVhdHVyZSwgVXRpbC5iaW5kKGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgICBpZiAoIWVycm9yKSB7XHJcbiAgICAgICAgICAvLyBhc3NpZ24gSUQgZnJvbSByZXN1bHQgdG8gYXBwcm9wcmlhdGUgb2JqZWN0aWQgZmllbGQgZnJvbSBzZXJ2aWNlIG1ldGFkYXRhXHJcbiAgICAgICAgICBmZWF0dXJlLnByb3BlcnRpZXNbbWV0YWRhdGEub2JqZWN0SWRGaWVsZF0gPSByZXNwb25zZS5vYmplY3RJZDtcclxuXHJcbiAgICAgICAgICAvLyB3ZSBhbHNvIG5lZWQgdG8gdXBkYXRlIHRoZSBnZW9qc29uIGlkIGZvciBjcmVhdGVMYXllcnMoKSB0byBmdW5jdGlvblxyXG4gICAgICAgICAgZmVhdHVyZS5pZCA9IHJlc3BvbnNlLm9iamVjdElkO1xyXG4gICAgICAgICAgdGhpcy5jcmVhdGVMYXllcnMoW2ZlYXR1cmVdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBlcnJvciwgcmVzcG9uc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSwgdGhpcykpO1xyXG4gICAgfSwgdGhpcykpO1xyXG4gIH0sXHJcblxyXG4gIHVwZGF0ZUZlYXR1cmU6IGZ1bmN0aW9uIChmZWF0dXJlLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5zZXJ2aWNlLnVwZGF0ZUZlYXR1cmUoZmVhdHVyZSwgZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICBpZiAoIWVycm9yKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVMYXllcnMoW2ZlYXR1cmUuaWRdLCB0cnVlKTtcclxuICAgICAgICB0aGlzLmNyZWF0ZUxheWVycyhbZmVhdHVyZV0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yLCByZXNwb25zZSk7XHJcbiAgICAgIH1cclxuICAgIH0sIHRoaXMpO1xyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZUZlYXR1cmU6IGZ1bmN0aW9uIChpZCwgY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIHRoaXMuc2VydmljZS5kZWxldGVGZWF0dXJlKGlkLCBmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmICghZXJyb3IgJiYgcmVzcG9uc2Uub2JqZWN0SWQpIHtcclxuICAgICAgICB0aGlzLnJlbW92ZUxheWVycyhbcmVzcG9uc2Uub2JqZWN0SWRdLCB0cnVlKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yLCByZXNwb25zZSk7XHJcbiAgICAgIH1cclxuICAgIH0sIHRoaXMpO1xyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZUZlYXR1cmVzOiBmdW5jdGlvbiAoaWRzLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VydmljZS5kZWxldGVGZWF0dXJlcyhpZHMsIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgaWYgKCFlcnJvciAmJiByZXNwb25zZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXNwb25zZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgdGhpcy5yZW1vdmVMYXllcnMoW3Jlc3BvbnNlW2ldLm9iamVjdElkXSwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IsIHJlc3BvbnNlKTtcclxuICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgfVxyXG59KTtcclxuIiwiaW1wb3J0IHsgVXRpbCwgR2VvSlNPTiwgbGF0TG5nIH0gZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCB7IEZlYXR1cmVNYW5hZ2VyIH0gZnJvbSAnLi9GZWF0dXJlTWFuYWdlcic7XHJcblxyXG5leHBvcnQgdmFyIEZlYXR1cmVMYXllciA9IEZlYXR1cmVNYW5hZ2VyLmV4dGVuZCh7XHJcblxyXG4gIG9wdGlvbnM6IHtcclxuICAgIGNhY2hlTGF5ZXJzOiB0cnVlXHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydWN0b3JcclxuICAgKi9cclxuICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgRmVhdHVyZU1hbmFnZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIHRoaXMuX29yaWdpbmFsU3R5bGUgPSB0aGlzLm9wdGlvbnMuc3R5bGU7XHJcbiAgICB0aGlzLl9sYXllcnMgPSB7fTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBMYXllciBJbnRlcmZhY2VcclxuICAgKi9cclxuXHJcbiAgb25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIGZvciAodmFyIGkgaW4gdGhpcy5fbGF5ZXJzKSB7XHJcbiAgICAgIG1hcC5yZW1vdmVMYXllcih0aGlzLl9sYXllcnNbaV0pO1xyXG4gICAgICAvLyB0cmlnZ2VyIHRoZSBldmVudCB3aGVuIHRoZSBlbnRpcmUgZmVhdHVyZUxheWVyIGlzIHJlbW92ZWQgZnJvbSB0aGUgbWFwXHJcbiAgICAgIHRoaXMuZmlyZSgncmVtb3ZlZmVhdHVyZScsIHtcclxuICAgICAgICBmZWF0dXJlOiB0aGlzLl9sYXllcnNbaV0uZmVhdHVyZSxcclxuICAgICAgICBwZXJtYW5lbnQ6IGZhbHNlXHJcbiAgICAgIH0sIHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBGZWF0dXJlTWFuYWdlci5wcm90b3R5cGUub25SZW1vdmUuY2FsbCh0aGlzLCBtYXApO1xyXG4gIH0sXHJcblxyXG4gIGNyZWF0ZU5ld0xheWVyOiBmdW5jdGlvbiAoZ2VvanNvbikge1xyXG4gICAgdmFyIGxheWVyID0gR2VvSlNPTi5nZW9tZXRyeVRvTGF5ZXIoZ2VvanNvbiwgdGhpcy5vcHRpb25zKTtcclxuICAgIGxheWVyLmRlZmF1bHRPcHRpb25zID0gbGF5ZXIub3B0aW9ucztcclxuICAgIHJldHVybiBsYXllcjtcclxuICB9LFxyXG5cclxuICBfdXBkYXRlTGF5ZXI6IGZ1bmN0aW9uIChsYXllciwgZ2VvanNvbikge1xyXG4gICAgLy8gY29udmVydCB0aGUgZ2VvanNvbiBjb29yZGluYXRlcyBpbnRvIGEgTGVhZmxldCBMYXRMbmcgYXJyYXkvbmVzdGVkIGFycmF5c1xyXG4gICAgLy8gcGFzcyBpdCB0byBzZXRMYXRMbmdzIHRvIHVwZGF0ZSBsYXllciBnZW9tZXRyaWVzXHJcbiAgICB2YXIgbGF0bG5ncyA9IFtdO1xyXG4gICAgdmFyIGNvb3Jkc1RvTGF0TG5nID0gdGhpcy5vcHRpb25zLmNvb3Jkc1RvTGF0TG5nIHx8IEdlb0pTT04uY29vcmRzVG9MYXRMbmc7XHJcblxyXG4gICAgLy8gY29weSBuZXcgYXR0cmlidXRlcywgaWYgcHJlc2VudFxyXG4gICAgaWYgKGdlb2pzb24ucHJvcGVydGllcykge1xyXG4gICAgICBsYXllci5mZWF0dXJlLnByb3BlcnRpZXMgPSBnZW9qc29uLnByb3BlcnRpZXM7XHJcbiAgICB9XHJcblxyXG4gICAgc3dpdGNoIChnZW9qc29uLmdlb21ldHJ5LnR5cGUpIHtcclxuICAgICAgY2FzZSAnUG9pbnQnOlxyXG4gICAgICAgIGxhdGxuZ3MgPSBHZW9KU09OLmNvb3Jkc1RvTGF0TG5nKGdlb2pzb24uZ2VvbWV0cnkuY29vcmRpbmF0ZXMpO1xyXG4gICAgICAgIGxheWVyLnNldExhdExuZyhsYXRsbmdzKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnTGluZVN0cmluZyc6XHJcbiAgICAgICAgbGF0bG5ncyA9IEdlb0pTT04uY29vcmRzVG9MYXRMbmdzKGdlb2pzb24uZ2VvbWV0cnkuY29vcmRpbmF0ZXMsIDAsIGNvb3Jkc1RvTGF0TG5nKTtcclxuICAgICAgICBsYXllci5zZXRMYXRMbmdzKGxhdGxuZ3MpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdNdWx0aUxpbmVTdHJpbmcnOlxyXG4gICAgICAgIGxhdGxuZ3MgPSBHZW9KU09OLmNvb3Jkc1RvTGF0TG5ncyhnZW9qc29uLmdlb21ldHJ5LmNvb3JkaW5hdGVzLCAxLCBjb29yZHNUb0xhdExuZyk7XHJcbiAgICAgICAgbGF5ZXIuc2V0TGF0TG5ncyhsYXRsbmdzKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnUG9seWdvbic6XHJcbiAgICAgICAgbGF0bG5ncyA9IEdlb0pTT04uY29vcmRzVG9MYXRMbmdzKGdlb2pzb24uZ2VvbWV0cnkuY29vcmRpbmF0ZXMsIDEsIGNvb3Jkc1RvTGF0TG5nKTtcclxuICAgICAgICBsYXllci5zZXRMYXRMbmdzKGxhdGxuZ3MpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdNdWx0aVBvbHlnb24nOlxyXG4gICAgICAgIGxhdGxuZ3MgPSBHZW9KU09OLmNvb3Jkc1RvTGF0TG5ncyhnZW9qc29uLmdlb21ldHJ5LmNvb3JkaW5hdGVzLCAyLCBjb29yZHNUb0xhdExuZyk7XHJcbiAgICAgICAgbGF5ZXIuc2V0TGF0TG5ncyhsYXRsbmdzKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBGZWF0dXJlIE1hbmFnZW1lbnQgTWV0aG9kc1xyXG4gICAqL1xyXG5cclxuICBjcmVhdGVMYXllcnM6IGZ1bmN0aW9uIChmZWF0dXJlcykge1xyXG4gICAgZm9yICh2YXIgaSA9IGZlYXR1cmVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIHZhciBnZW9qc29uID0gZmVhdHVyZXNbaV07XHJcblxyXG4gICAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcnNbZ2VvanNvbi5pZF07XHJcbiAgICAgIHZhciBuZXdMYXllcjtcclxuXHJcbiAgICAgIGlmICh0aGlzLl92aXNpYmxlWm9vbSgpICYmIGxheWVyICYmICF0aGlzLl9tYXAuaGFzTGF5ZXIobGF5ZXIpKSB7XHJcbiAgICAgICAgdGhpcy5fbWFwLmFkZExheWVyKGxheWVyKTtcclxuICAgICAgICB0aGlzLmZpcmUoJ2FkZGZlYXR1cmUnLCB7XHJcbiAgICAgICAgICBmZWF0dXJlOiBsYXllci5mZWF0dXJlXHJcbiAgICAgICAgfSwgdHJ1ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHVwZGF0ZSBnZW9tZXRyeSBpZiBuZWNlc3NhcnlcclxuICAgICAgaWYgKGxheWVyICYmIHRoaXMub3B0aW9ucy5zaW1wbGlmeUZhY3RvciA+IDAgJiYgKGxheWVyLnNldExhdExuZ3MgfHwgbGF5ZXIuc2V0TGF0TG5nKSkge1xyXG4gICAgICAgIHRoaXMuX3VwZGF0ZUxheWVyKGxheWVyLCBnZW9qc29uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFsYXllcikge1xyXG4gICAgICAgIG5ld0xheWVyID0gdGhpcy5jcmVhdGVOZXdMYXllcihnZW9qc29uKTtcclxuICAgICAgICBuZXdMYXllci5mZWF0dXJlID0gZ2VvanNvbjtcclxuXHJcbiAgICAgICAgLy8gYnViYmxlIGV2ZW50cyBmcm9tIGluZGl2aWR1YWwgbGF5ZXJzIHRvIHRoZSBmZWF0dXJlIGxheWVyXHJcbiAgICAgICAgbmV3TGF5ZXIuYWRkRXZlbnRQYXJlbnQodGhpcyk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMub25FYWNoRmVhdHVyZSkge1xyXG4gICAgICAgICAgdGhpcy5vcHRpb25zLm9uRWFjaEZlYXR1cmUobmV3TGF5ZXIuZmVhdHVyZSwgbmV3TGF5ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY2FjaGUgdGhlIGxheWVyXHJcbiAgICAgICAgdGhpcy5fbGF5ZXJzW25ld0xheWVyLmZlYXR1cmUuaWRdID0gbmV3TGF5ZXI7XHJcblxyXG4gICAgICAgIC8vIHN0eWxlIHRoZSBsYXllclxyXG4gICAgICAgIHRoaXMuc2V0RmVhdHVyZVN0eWxlKG5ld0xheWVyLmZlYXR1cmUuaWQsIHRoaXMub3B0aW9ucy5zdHlsZSk7XHJcblxyXG4gICAgICAgIHRoaXMuZmlyZSgnY3JlYXRlZmVhdHVyZScsIHtcclxuICAgICAgICAgIGZlYXR1cmU6IG5ld0xheWVyLmZlYXR1cmVcclxuICAgICAgICB9LCB0cnVlKTtcclxuXHJcbiAgICAgICAgLy8gYWRkIHRoZSBsYXllciBpZiB0aGUgY3VycmVudCB6b29tIGxldmVsIGlzIGluc2lkZSB0aGUgcmFuZ2UgZGVmaW5lZCBmb3IgdGhlIGxheWVyLCBpdCBpcyB3aXRoaW4gdGhlIGN1cnJlbnQgdGltZSBib3VuZHMgb3Igb3VyIGxheWVyIGlzIG5vdCB0aW1lIGVuYWJsZWRcclxuICAgICAgICBpZiAodGhpcy5fdmlzaWJsZVpvb20oKSAmJiAoIXRoaXMub3B0aW9ucy50aW1lRmllbGQgfHwgKHRoaXMub3B0aW9ucy50aW1lRmllbGQgJiYgdGhpcy5fZmVhdHVyZVdpdGhpblRpbWVSYW5nZShnZW9qc29uKSkpKSB7XHJcbiAgICAgICAgICB0aGlzLl9tYXAuYWRkTGF5ZXIobmV3TGF5ZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGFkZExheWVyczogZnVuY3Rpb24gKGlkcykge1xyXG4gICAgZm9yICh2YXIgaSA9IGlkcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcnNbaWRzW2ldXTtcclxuICAgICAgaWYgKGxheWVyKSB7XHJcbiAgICAgICAgdGhpcy5fbWFwLmFkZExheWVyKGxheWVyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHJlbW92ZUxheWVyczogZnVuY3Rpb24gKGlkcywgcGVybWFuZW50KSB7XHJcbiAgICBmb3IgKHZhciBpID0gaWRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIHZhciBpZCA9IGlkc1tpXTtcclxuICAgICAgdmFyIGxheWVyID0gdGhpcy5fbGF5ZXJzW2lkXTtcclxuICAgICAgaWYgKGxheWVyKSB7XHJcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVmZWF0dXJlJywge1xyXG4gICAgICAgICAgZmVhdHVyZTogbGF5ZXIuZmVhdHVyZSxcclxuICAgICAgICAgIHBlcm1hbmVudDogcGVybWFuZW50XHJcbiAgICAgICAgfSwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKGxheWVyKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobGF5ZXIgJiYgcGVybWFuZW50KSB7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX2xheWVyc1tpZF07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjZWxsRW50ZXI6IGZ1bmN0aW9uIChib3VuZHMsIGNvb3Jkcykge1xyXG4gICAgaWYgKHRoaXMuX3Zpc2libGVab29tKCkgJiYgIXRoaXMuX3pvb21pbmcgJiYgdGhpcy5fbWFwKSB7XHJcbiAgICAgIFV0aWwucmVxdWVzdEFuaW1GcmFtZShVdGlsLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjYWNoZUtleSA9IHRoaXMuX2NhY2hlS2V5KGNvb3Jkcyk7XHJcbiAgICAgICAgdmFyIGNlbGxLZXkgPSB0aGlzLl9jZWxsQ29vcmRzVG9LZXkoY29vcmRzKTtcclxuICAgICAgICB2YXIgbGF5ZXJzID0gdGhpcy5fY2FjaGVbY2FjaGVLZXldO1xyXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmVDZWxsc1tjZWxsS2V5XSAmJiBsYXllcnMpIHtcclxuICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzKGxheWVycyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY2VsbExlYXZlOiBmdW5jdGlvbiAoYm91bmRzLCBjb29yZHMpIHtcclxuICAgIGlmICghdGhpcy5fem9vbWluZykge1xyXG4gICAgICBVdGlsLnJlcXVlc3RBbmltRnJhbWUoVXRpbC5iaW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAodGhpcy5fbWFwKSB7XHJcbiAgICAgICAgICB2YXIgY2FjaGVLZXkgPSB0aGlzLl9jYWNoZUtleShjb29yZHMpO1xyXG4gICAgICAgICAgdmFyIGNlbGxLZXkgPSB0aGlzLl9jZWxsQ29vcmRzVG9LZXkoY29vcmRzKTtcclxuICAgICAgICAgIHZhciBsYXllcnMgPSB0aGlzLl9jYWNoZVtjYWNoZUtleV07XHJcbiAgICAgICAgICB2YXIgbWFwQm91bmRzID0gdGhpcy5fbWFwLmdldEJvdW5kcygpO1xyXG4gICAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmVDZWxsc1tjZWxsS2V5XSAmJiBsYXllcnMpIHtcclxuICAgICAgICAgICAgdmFyIHJlbW92YWJsZSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgIHZhciBsYXllciA9IHRoaXMuX2xheWVyc1tsYXllcnNbaV1dO1xyXG4gICAgICAgICAgICAgIGlmIChsYXllciAmJiBsYXllci5nZXRCb3VuZHMgJiYgbWFwQm91bmRzLmludGVyc2VjdHMobGF5ZXIuZ2V0Qm91bmRzKCkpKSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmFibGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZW1vdmFibGUpIHtcclxuICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxheWVycyhsYXllcnMsICF0aGlzLm9wdGlvbnMuY2FjaGVMYXllcnMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jYWNoZUxheWVycyAmJiByZW1vdmFibGUpIHtcclxuICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fY2FjaGVbY2FjaGVLZXldO1xyXG4gICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9jZWxsc1tjZWxsS2V5XTtcclxuICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fYWN0aXZlQ2VsbHNbY2VsbEtleV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBTdHlsaW5nIE1ldGhvZHNcclxuICAgKi9cclxuXHJcbiAgcmVzZXRTdHlsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5vcHRpb25zLnN0eWxlID0gdGhpcy5fb3JpZ2luYWxTdHlsZTtcclxuICAgIHRoaXMuZWFjaEZlYXR1cmUoZnVuY3Rpb24gKGxheWVyKSB7XHJcbiAgICAgIHRoaXMucmVzZXRGZWF0dXJlU3R5bGUobGF5ZXIuZmVhdHVyZS5pZCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIHNldFN0eWxlOiBmdW5jdGlvbiAoc3R5bGUpIHtcclxuICAgIHRoaXMub3B0aW9ucy5zdHlsZSA9IHN0eWxlO1xyXG4gICAgdGhpcy5lYWNoRmVhdHVyZShmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgdGhpcy5zZXRGZWF0dXJlU3R5bGUobGF5ZXIuZmVhdHVyZS5pZCwgc3R5bGUpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICByZXNldEZlYXR1cmVTdHlsZTogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcnNbaWRdO1xyXG4gICAgdmFyIHN0eWxlID0gdGhpcy5fb3JpZ2luYWxTdHlsZSB8fCBMLlBhdGgucHJvdG90eXBlLm9wdGlvbnM7XHJcbiAgICBpZiAobGF5ZXIpIHtcclxuICAgICAgVXRpbC5leHRlbmQobGF5ZXIub3B0aW9ucywgbGF5ZXIuZGVmYXVsdE9wdGlvbnMpO1xyXG4gICAgICB0aGlzLnNldEZlYXR1cmVTdHlsZShpZCwgc3R5bGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgc2V0RmVhdHVyZVN0eWxlOiBmdW5jdGlvbiAoaWQsIHN0eWxlKSB7XHJcbiAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcnNbaWRdO1xyXG4gICAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBzdHlsZSA9IHN0eWxlKGxheWVyLmZlYXR1cmUpO1xyXG4gICAgfVxyXG4gICAgaWYgKGxheWVyLnNldFN0eWxlKSB7XHJcbiAgICAgIGxheWVyLnNldFN0eWxlKHN0eWxlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFV0aWxpdHkgTWV0aG9kc1xyXG4gICAqL1xyXG5cclxuICBlYWNoQWN0aXZlRmVhdHVyZTogZnVuY3Rpb24gKGZuLCBjb250ZXh0KSB7XHJcbiAgICAvLyBmaWd1cmUgb3V0IChyb3VnaGx5KSB3aGljaCBsYXllcnMgYXJlIGluIHZpZXdcclxuICAgIGlmICh0aGlzLl9tYXApIHtcclxuICAgICAgdmFyIGFjdGl2ZUJvdW5kcyA9IHRoaXMuX21hcC5nZXRCb3VuZHMoKTtcclxuICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLl9sYXllcnMpIHtcclxuICAgICAgICBpZiAodGhpcy5fY3VycmVudFNuYXBzaG90LmluZGV4T2YodGhpcy5fbGF5ZXJzW2ldLmZlYXR1cmUuaWQpICE9PSAtMSkge1xyXG4gICAgICAgICAgLy8gYSBzaW1wbGUgcG9pbnQgaW4gcG9seSB0ZXN0IGZvciBwb2ludCBnZW9tZXRyaWVzXHJcbiAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2xheWVyc1tpXS5nZXRMYXRMbmcgPT09ICdmdW5jdGlvbicgJiYgYWN0aXZlQm91bmRzLmNvbnRhaW5zKHRoaXMuX2xheWVyc1tpXS5nZXRMYXRMbmcoKSkpIHtcclxuICAgICAgICAgICAgZm4uY2FsbChjb250ZXh0LCB0aGlzLl9sYXllcnNbaV0pO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5fbGF5ZXJzW2ldLmdldEJvdW5kcyA9PT0gJ2Z1bmN0aW9uJyAmJiBhY3RpdmVCb3VuZHMuaW50ZXJzZWN0cyh0aGlzLl9sYXllcnNbaV0uZ2V0Qm91bmRzKCkpKSB7XHJcbiAgICAgICAgICAgIC8vIGludGVyc2VjdGluZyBib3VuZHMgY2hlY2sgZm9yIHBvbHlsaW5lIGFuZCBwb2x5Z29uIGdlb21ldHJpZXNcclxuICAgICAgICAgICAgZm4uY2FsbChjb250ZXh0LCB0aGlzLl9sYXllcnNbaV0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZWFjaEZlYXR1cmU6IGZ1bmN0aW9uIChmbiwgY29udGV4dCkge1xyXG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLl9sYXllcnMpIHtcclxuICAgICAgZm4uY2FsbChjb250ZXh0LCB0aGlzLl9sYXllcnNbaV0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZ2V0RmVhdHVyZTogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fbGF5ZXJzW2lkXTtcclxuICB9LFxyXG5cclxuICBicmluZ1RvQmFjazogZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5lYWNoRmVhdHVyZShmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgaWYgKGxheWVyLmJyaW5nVG9CYWNrKSB7XHJcbiAgICAgICAgbGF5ZXIuYnJpbmdUb0JhY2soKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgYnJpbmdUb0Zyb250OiBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmVhY2hGZWF0dXJlKGZ1bmN0aW9uIChsYXllcikge1xyXG4gICAgICBpZiAobGF5ZXIuYnJpbmdUb0Zyb250KSB7XHJcbiAgICAgICAgbGF5ZXIuYnJpbmdUb0Zyb250KCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIHJlZHJhdzogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICBpZiAoaWQpIHtcclxuICAgICAgdGhpcy5fcmVkcmF3KGlkKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIF9yZWRyYXc6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgdmFyIGxheWVyID0gdGhpcy5fbGF5ZXJzW2lkXTtcclxuICAgIHZhciBnZW9qc29uID0gbGF5ZXIuZmVhdHVyZTtcclxuXHJcbiAgICAvLyBpZiB0aGlzIGxvb2tzIGxpa2UgYSBtYXJrZXJcclxuICAgIGlmIChsYXllciAmJiBsYXllci5zZXRJY29uICYmIHRoaXMub3B0aW9ucy5wb2ludFRvTGF5ZXIpIHtcclxuICAgICAgLy8gdXBkYXRlIGN1c3RvbSBzeW1ib2xvZ3ksIGlmIG5lY2Vzc2FyeVxyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnBvaW50VG9MYXllcikge1xyXG4gICAgICAgIHZhciBnZXRJY29uID0gdGhpcy5vcHRpb25zLnBvaW50VG9MYXllcihnZW9qc29uLCBsYXRMbmcoZ2VvanNvbi5nZW9tZXRyeS5jb29yZGluYXRlc1sxXSwgZ2VvanNvbi5nZW9tZXRyeS5jb29yZGluYXRlc1swXSkpO1xyXG4gICAgICAgIHZhciB1cGRhdGVkSWNvbiA9IGdldEljb24ub3B0aW9ucy5pY29uO1xyXG4gICAgICAgIGxheWVyLnNldEljb24odXBkYXRlZEljb24pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbG9va3MgbGlrZSBhIHZlY3RvciBtYXJrZXIgKGNpcmNsZU1hcmtlcilcclxuICAgIGlmIChsYXllciAmJiBsYXllci5zZXRTdHlsZSAmJiB0aGlzLm9wdGlvbnMucG9pbnRUb0xheWVyKSB7XHJcbiAgICAgIHZhciBnZXRTdHlsZSA9IHRoaXMub3B0aW9ucy5wb2ludFRvTGF5ZXIoZ2VvanNvbiwgbGF0TG5nKGdlb2pzb24uZ2VvbWV0cnkuY29vcmRpbmF0ZXNbMV0sIGdlb2pzb24uZ2VvbWV0cnkuY29vcmRpbmF0ZXNbMF0pKTtcclxuICAgICAgdmFyIHVwZGF0ZWRTdHlsZSA9IGdldFN0eWxlLm9wdGlvbnM7XHJcbiAgICAgIHRoaXMuc2V0RmVhdHVyZVN0eWxlKGdlb2pzb24uaWQsIHVwZGF0ZWRTdHlsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbG9va3MgbGlrZSBhIHBhdGggKHBvbHlnb24vcG9seWxpbmUpXHJcbiAgICBpZiAobGF5ZXIgJiYgbGF5ZXIuc2V0U3R5bGUgJiYgdGhpcy5vcHRpb25zLnN0eWxlKSB7XHJcbiAgICAgIHRoaXMucmVzZXRTdHlsZShnZW9qc29uLmlkKTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZlYXR1cmVMYXllciAob3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgRmVhdHVyZUxheWVyKG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmZWF0dXJlTGF5ZXI7XHJcbiJdLCJuYW1lcyI6WyJVdGlsIiwiRG9tVXRpbCIsInNoYWxsb3dDbG9uZSIsImFyY2dpc1RvR2VvSlNPTiIsImdlb2pzb25Ub0FyY0dJUyIsImcyYSIsImEyZyIsImxhdExuZyIsImxhdExuZ0JvdW5kcyIsIkxhdExuZ0JvdW5kcyIsIkxhdExuZyIsIkdlb0pTT04iLCJDbGFzcyIsInBvaW50IiwiRXZlbnRlZCIsIlRpbGVMYXllciIsIkltYWdlT3ZlcmxheSIsIkNSUyIsIkxheWVyIiwicG9wdXAiLCJib3VuZHMiLCJMIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0NDQU8sSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxjQUFjLElBQUksaUJBQWlCLElBQUksSUFBSSxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2hHLENBQU8sSUFBSSxhQUFhLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsYUFBYSxLQUFLLEVBQUUsQ0FBQzs7QUFFL0UsQ0FBTyxJQUFJLE9BQU8sR0FBRztBQUNyQixDQUFBLEVBQUUsSUFBSSxFQUFFLElBQUk7QUFDWixDQUFBLEVBQUUsYUFBYSxFQUFFLGFBQWE7QUFDOUIsQ0FBQSxDQUFDLENBQUM7O0NDTkssSUFBSSxPQUFPLEdBQUc7QUFDckIsQ0FBQSxFQUFFLHNCQUFzQixFQUFFLEVBQUU7QUFDNUIsQ0FBQSxDQUFDLENBQUM7O0NDRUYsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDOztBQUVsQixDQUFBLFNBQVMsU0FBUyxFQUFFLE1BQU0sRUFBRTtBQUM1QixDQUFBLEVBQUUsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDOztBQUVoQixDQUFBLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQzs7QUFFaEMsQ0FBQSxFQUFFLEtBQUssSUFBSSxHQUFHLElBQUksTUFBTSxFQUFFO0FBQzFCLENBQUEsSUFBSSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDcEMsQ0FBQSxNQUFNLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM5QixDQUFB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LElBQUksR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQSxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFBLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUNkLENBQUEsR0FBRztBQUNILENBQUEsRUFBRSxPQUFPLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLENBQUEsQ0FBQzs7QUFFRCxDQUFBO0FBQ0EsQ0FBQSxTQUFTLHNCQUFzQixFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtBQUNqRCxDQUFBLEVBQUUsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0RixDQUFBLEVBQUUsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0RixDQUFBLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFckYsQ0FBQSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRTtBQUNoQixDQUFBLElBQUksSUFBSSxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUN0QixDQUFBLElBQUksSUFBSSxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQzs7QUFFdEIsQ0FBQSxJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRTtBQUNsRCxDQUFBLE1BQU0sT0FBTyxJQUFJLENBQUM7QUFDbEIsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUEsQ0FBQzs7QUFFRCxDQUFBO0FBQ0EsQ0FBQSxTQUFTLG9CQUFvQixFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDckMsQ0FBQSxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN6QyxDQUFBLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzNDLENBQUEsTUFBTSxJQUFJLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDbEUsQ0FBQSxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLENBQUEsT0FBTztBQUNQLENBQUEsS0FBSztBQUNMLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFBLENBQUM7O0FBRUQsQ0FBQTtBQUNBLENBQUEsU0FBUyx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFO0FBQ3RELENBQUEsRUFBRSxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDdkIsQ0FBQSxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDdEUsQ0FBQSxJQUFJLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4RSxDQUFBLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FB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R0FBRyxFQUFFLGtCQUFrQjtBQUM3QixDQUFBLE1BQU0sR0FBRyxFQUFFLGtCQUFrQjtBQUM3QixDQUFBLE1BQU0sR0FBRyxFQUFFLGtCQUFrQjtBQUM3QixDQUFBLE1BQU0sR0FBRyxFQUFFLGtCQUFrQjtBQUM3QixDQUFBLE1BQU0sR0FBRyxFQUFFLGtCQUFrQjtBQUM3QixDQUFBLE1BQU0sR0FBRyxFQUFFLGtCQUFrQjtBQUM3QixDQUFBLE1BQU0sR0FBRyxFQUFFLGtCQUFrQjtBQUM3QixDQUFBLE1BQU0sR0FBRyxFQUFFLGtCQUFrQjtBQUM3QixDQUFBLE1BQU0sR0FBRyxFQUFFLGtCQUFrQjtBQUM3QixDQUFBLE1BQU0sR0FBRyxFQUFFLGtCQUFrQjtBQUM3QixDQUFBLE1BQU0sSUFBSSxFQUFFLGdCQUFnQjtBQUM1QixDQUFBLE1BQU0sSUFBSSxFQUFFLGtCQUFrQjtBQUM5QixDQUFBLE1BQU0sSUFBSSxFQUFFLGtCQUFrQjtBQUM5QixDQUFBLE1BQU0sSUFBSSxFQUFFLGtCQUFrQjtBQUM5QixDQUFBLE1BQU0sSUFBSSxFQUFFLGtCQUFrQjtBQUM5QixDQUFBLE1BQU0sSUFBSSxFQUFFLGtCQUFrQjtBQUM5QixDQUFBLE1BQU0sSUFBSSxFQUFFLGdCQUFnQjtBQUM1QixDQUFBLE1BQU0sSUFBSSxFQUFFLGtCQUFrQjtBQUM5QixDQUFBLE1BQU0sSUFBSSxFQUFFLG1CQUFtQjtBQUMvQixDQUFBLE1BQU0sSUFBSSxFQUFFLG1CQUFtQjtBQUMvQixDQUFBLE1BQU0sSUFBSSxFQUFFLGdCQUFnQjtBQUM1QixDQUFBLE1BQU0sSUFBSSxFQUFFLGdCQUFnQjtBQUM1QixDQUFBLE1BQU0sSUFBSSxFQUFFLGtCQUFrQjtBQUM5QixDQUFBLE1BQU0sSUFBSSxFQUFFLGtCQUFrQjtBQUM5QixDQUFBLEtBQUs7QUFDTCxDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLFVBQVUsRUFBRSxVQUFVLE9BQU8sRUFBRTtBQUNqQyxDQUFBLElBQUksT0FBTyxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUMsT0FBTyxD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LElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUM3QixDQUFBLE1BQU0sTUFBTSxDQUFDLE1BQU0sR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzlELENBQUEsS0FBSzs7QUFFTCxDQUFBLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtBQUNoQyxDQUFBLE1BQU0sTUFBTSxDQUFDLFNBQVMsR0FBRyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxLQUFLLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDdEksQ0FBQSxLQUFLOztBQUVMLENBQUEsSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFO0FBQ2xDLENBQUEsTUFBTSxNQUFNLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNwRSxDQUFBLEtBQUs7O0FBRUwsQ0FBQSxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUU7QUFDOUMsQ0FBQSxNQUFNLE1BQU0sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2xGLENBQUEsS0FBSzs7QUFFTCxDQUFBLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7QUFDcEMsQ0FBQSxNQUFNLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxP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QSxLQUFLOztBQUVMLENBQUEsSUFBSSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzVDLENBQUEsSUFBSSxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDOztBQUV4QyxDQUFBLElBQUksSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRTtBQUNwRCxDQUFBLE1BQU0sSUFBSSxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDN0QsQ0FBQSxNQUFNLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUM7QUFDNUMsQ0FBQSxLQUFLOztBQUVMLENBQUEsSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7QUFDcEUsQ0FBQSxNQUFNLElBQUksU0FBUyxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4RSxDQUFBLE1BQU0sSUFBSSxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BFLENBQUEsTUFBTSxPQUFPLENBQUMsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDbEcsQ0FBQSxL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