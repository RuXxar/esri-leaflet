/* esri-leaflet - v2.1.1 - Fri Sep 22 2017 09:33:54 GMT+0200 (W. Europe Summer Time)
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
	  console.log('create request with callback and context', callback);
	  var httpRequest = new window.XMLHttpRequest();

	  httpRequest.onerror = function (e) {
	    console.log('createRequest onerror', e);
	    httpRequest.onreadystatechange = L$1.Util.falseFn;

	    callback.call(context, {
	      error: {
	        code: 500,
	        message: 'XMLHttpRequest error'
	      }
	    }, null);
	  };

	  httpRequest.onreadystatechange = function () {
	    console.log('createRequest onreadystatechange');
	    var response;
	    var error;

	    if (httpRequest.readyState === 4) {
	      console.log('createRequest we got ready state 4!');
	      try {
	        console.log('createRequest try to parse response');
	        response = JSON.parse(httpRequest.responseText);
	        console.log(response);
	      } catch (e) {
	        console.log('createRequest failed to parse response');
	        response = null;
	        error = {
	          code: 500,
	          message: 'Could not parse response as JSON. This could also be caused by a CORS or XMLHttpRequest error.'
	        };
	      }

	      if (!error && response.error) {
	        console.log('createRequest we got a response.error', response.error);
	        error = response.error;
	        response = null;
	      }

	      httpRequest.onerror = L$1.Util.falseFn;

	      console.log('createRequest call the god damn callback');
	      console.log('forget the callback');
	      callback.call(context, error, response);
	      console.log('createRequest called the god damn callback');
	    }
	  };

	  httpRequest.ontimeout = function () {
	    console.log('createRequest we timed out oh noes :(');
	    this.onerror();
	  };

	  return httpRequest;
	}

	function xmlHttpPost (url, params, callback, context) {
	  console.log('xmlhttpPost I am posting url', url, params, callback, context);
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
	  console.log('xmlhttpget send the request', url);
	  httpRequest.send(null);
	  console.log('xmlhttpget sent the request', url);

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
	    console.log('real request 1');
	    httpRequest.open('GET', url + '?' + paramString);
	  } else if (requestLength > 2000 && Support.cors) {
	    console.log('real request 2');
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
	    console.log('real request 3');
	    httpRequest.send(null);

	  // request is more than 2000 characters and the browser supports CORS, make POST request with XMLHttpRequest
	  } else if (requestLength > 2000 && Support.cors) {
	    console.log('real request 4');
	    httpRequest.send(paramString);

	  // request is less  than 2000 characters and the browser does not support CORS, make a JSONP request
	  } else if (requestLength <= 2000 && !Support.cors) {
	    console.log('real request 5');
	    return jsonp(url, params, callback, context);

	  // request is longer then 2000 characters and the browser does not support CORS, log a warning
	  } else {
	    console.log('real request 6');
	    warn('a request to ' + url + ' was longer then 2000 characters and this browser cannot make a cross-domain post request. Please use a proxy http://esri.github.io/esri-leaflet/api-reference/request.html');
	    return;
	  }

	  console.log('return the request...');
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
	      console.log('jsonP bro');
	      return Request.get.JSONP(url, params, callback, context);
	    }

	    console.log('requesting with:', method, params, callback, context);
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
	    console.log('Service.post was called with', path, params, callback, context);
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

	    console.log('FeatureLayerService post addFeature', feature);
	    return this.post('addFeatures', {
	      features: [feature]
	    }, function (error, response) {
	      console.log('addFeature', error, response);
	      var result = (response && response.addResults) ? response.addResults[0] : undefined;
	      if (callback) {
	        callback.call(context, error || response.addResults[0].error, result);
	      }
	    }, context);
	  },

	  updateFeature: function (feature, callback, context) {
	    feature = geojsonToArcGIS(feature, this.options.idAttribute);

	    console.log('FeatureLayerService post updateFeature', feature);
	    return this.post('updateFeatures', {
	      features: [feature]
	    }, function (error, response) {
	      console.log('updateFeature', error, response);
	      var result = (response && response.updateResults) ? response.updateResults[0] : undefined;
	      if (callback) {
	        callback.call(context, error || response.updateResults[0].error, result);
	      }
	    }, context);
	  },

	  deleteFeature: function (id, callback, context) {
	    console.log('FeatureLayerService post deleteFeature', id);
	    return this.post('deleteFeatures', {
	      objectIds: id
	    }, function (error, response) {
	      console.log('deleteFeature', error, response);
	      var result = (response && response.deleteResults) ? response.deleteResults[0] : undefined;
	      if (callback) {
	        callback.call(context, error || response.deleteResults[0].error, result);
	      }
	    }, context);
	  },

	  deleteFeatures: function (ids, callback, context) {
	    console.log('FeatureLayerService post deleteFeatures', ids);
	    return this.post('deleteFeatures', {
	      objectIds: ids
	    }, function (error, response) {
	      console.log('deleteFeatures', error, response);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNyaS1sZWFmbGV0LWRlYnVnLmpzIiwic291cmNlcyI6WyIuLi9wYWNrYWdlLmpzb24iLCIuLi9zcmMvU3VwcG9ydC5qcyIsIi4uL3NyYy9PcHRpb25zLmpzIiwiLi4vc3JjL1JlcXVlc3QuanMiLCIuLi9ub2RlX21vZHVsZXMvYXJjZ2lzLXRvLWdlb2pzb24tdXRpbHMvaW5kZXguanMiLCIuLi9zcmMvVXRpbC5qcyIsIi4uL3NyYy9UYXNrcy9UYXNrLmpzIiwiLi4vc3JjL1Rhc2tzL1F1ZXJ5LmpzIiwiLi4vc3JjL1Rhc2tzL0ZpbmQuanMiLCIuLi9zcmMvVGFza3MvSWRlbnRpZnkuanMiLCIuLi9zcmMvVGFza3MvSWRlbnRpZnlGZWF0dXJlcy5qcyIsIi4uL3NyYy9UYXNrcy9JZGVudGlmeUltYWdlLmpzIiwiLi4vc3JjL1NlcnZpY2VzL1NlcnZpY2UuanMiLCIuLi9zcmMvU2VydmljZXMvTWFwU2VydmljZS5qcyIsIi4uL3NyYy9TZXJ2aWNlcy9JbWFnZVNlcnZpY2UuanMiLCIuLi9zcmMvU2VydmljZXMvRmVhdHVyZUxheWVyU2VydmljZS5qcyIsIi4uL3NyYy9MYXllcnMvQmFzZW1hcExheWVyLmpzIiwiLi4vc3JjL0xheWVycy9UaWxlZE1hcExheWVyLmpzIiwiLi4vc3JjL0xheWVycy9SYXN0ZXJMYXllci5qcyIsIi4uL3NyYy9MYXllcnMvSW1hZ2VNYXBMYXllci5qcyIsIi4uL3NyYy9MYXllcnMvRHluYW1pY01hcExheWVyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xlYWZsZXQtdmlydHVhbC1ncmlkL3NyYy92aXJ0dWFsLWdyaWQuanMiLCIuLi9ub2RlX21vZHVsZXMvdGlueS1iaW5hcnktc2VhcmNoL2luZGV4LmpzIiwiLi4vc3JjL0xheWVycy9GZWF0dXJlTGF5ZXIvRmVhdHVyZU1hbmFnZXIuanMiLCIuLi9zcmMvTGF5ZXJzL0ZlYXR1cmVMYXllci9GZWF0dXJlTGF5ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsie1xyXG4gIFwibmFtZVwiOiBcImVzcmktbGVhZmxldFwiLFxyXG4gIFwiZGVzY3JpcHRpb25cIjogXCJMZWFmbGV0IHBsdWdpbnMgZm9yIGNvbnN1bWluZyBBcmNHSVMgT25saW5lIGFuZCBBcmNHSVMgU2VydmVyIHNlcnZpY2VzLlwiLFxyXG4gIFwidmVyc2lvblwiOiBcIjIuMS4xXCIsXHJcbiAgXCJhdXRob3JcIjogXCJQYXRyaWNrIEFybHQgPHBhcmx0QGVzcmkuY29tPiAoaHR0cDovL3BhdHJpY2thcmx0LmNvbSlcIixcclxuICBcImJyb3dzZXJcIjogXCJkaXN0L2VzcmktbGVhZmxldC1kZWJ1Zy5qc1wiLFxyXG4gIFwiYnVnc1wiOiB7XHJcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9lc3JpL2VzcmktbGVhZmxldC9pc3N1ZXNcIlxyXG4gIH0sXHJcbiAgXCJjb250cmlidXRvcnNcIjogW1xyXG4gICAgXCJQYXRyaWNrIEFybHQgPHBhcmx0QGVzcmkuY29tPiAoaHR0cDovL3BhdHJpY2thcmx0LmNvbSlcIixcclxuICAgIFwiSm9obiBHcmF2b2lzIDxqZ3Jhdm9pc0Blc3JpLmNvbT4gKGh0dHA6Ly9qb2huZ3Jhdm9pcy5jb20pXCJcclxuICBdLFxyXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcclxuICAgIFwiYXJjZ2lzLXRvLWdlb2pzb24tdXRpbHNcIjogXCJeMS4wLjFcIixcclxuICAgIFwibGVhZmxldC12aXJ0dWFsLWdyaWRcIjogXCJeMS4wLjNcIixcclxuICAgIFwidGlueS1iaW5hcnktc2VhcmNoXCI6IFwiXjEuMC4yXCJcclxuICB9LFxyXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcclxuICAgIFwiY2hhaVwiOiBcIjMuNS4wXCIsXHJcbiAgICBcImdoLXJlbGVhc2VcIjogXCJeMi4wLjBcIixcclxuICAgIFwiaGlnaGxpZ2h0LmpzXCI6IFwiXjguMC4wXCIsXHJcbiAgICBcImh0dHAtc2VydmVyXCI6IFwiXjAuOC41XCIsXHJcbiAgICBcImh1c2t5XCI6IFwiXjAuMTIuMFwiLFxyXG4gICAgXCJpc3BhcnRhXCI6IFwiXjQuMC4wXCIsXHJcbiAgICBcImlzdGFuYnVsXCI6IFwiXjAuNC4yXCIsXHJcbiAgICBcImthcm1hXCI6IFwiXjEuNy4wXCIsXHJcbiAgICBcImthcm1hLWNoYWktc2lub25cIjogXCJeMC4xLjNcIixcclxuICAgIFwia2FybWEtY292ZXJhZ2VcIjogXCJeMS4xLjFcIixcclxuICAgIFwia2FybWEtbW9jaGFcIjogXCJeMS4zLjBcIixcclxuICAgIFwia2FybWEtbW9jaGEtcmVwb3J0ZXJcIjogXCJeMi4yLjFcIixcclxuICAgIFwia2FybWEtcGhhbnRvbWpzLWxhdW5jaGVyXCI6IFwiXjAuMi4wXCIsXHJcbiAgICBcImthcm1hLXNvdXJjZW1hcC1sb2FkZXJcIjogXCJeMC4zLjVcIixcclxuICAgIFwibWtkaXJwXCI6IFwiXjAuNS4xXCIsXHJcbiAgICBcIm1vY2hhXCI6IFwiXjMuNC4yXCIsXHJcbiAgICBcIm5wbS1ydW4tYWxsXCI6IFwiXjQuMC4yXCIsXHJcbiAgICBcInBoYW50b21qc1wiOiBcIl4xLjkuOFwiLFxyXG4gICAgXCJyb2xsdXBcIjogXCJeMC4yNS40XCIsXHJcbiAgICBcInJvbGx1cC1wbHVnaW4tanNvblwiOiBcIl4yLjMuMFwiLFxyXG4gICAgXCJyb2xsdXAtcGx1Z2luLW5vZGUtcmVzb2x2ZVwiOiBcIl4xLjQuMFwiLFxyXG4gICAgXCJyb2xsdXAtcGx1Z2luLXVnbGlmeVwiOiBcIl4wLjMuMVwiLFxyXG4gICAgXCJzZW1pc3RhbmRhcmRcIjogXCJeOS4wLjBcIixcclxuICAgIFwic2lub25cIjogXCJeMS4xMS4xXCIsXHJcbiAgICBcInNpbm9uLWNoYWlcIjogXCIyLjguMFwiLFxyXG4gICAgXCJzbmF6enlcIjogXCJeNS4wLjBcIixcclxuICAgIFwidWdsaWZ5LWpzXCI6IFwiXjIuOC4yOVwiLFxyXG4gICAgXCJ3YXRjaFwiOiBcIl4wLjE3LjFcIlxyXG4gIH0sXHJcbiAgXCJob21lcGFnZVwiOiBcImh0dHA6Ly9lc3JpLmdpdGh1Yi5pby9lc3JpLWxlYWZsZXRcIixcclxuICBcIm1vZHVsZVwiOiBcInNyYy9Fc3JpTGVhZmxldC5qc1wiLFxyXG4gIFwianNuZXh0Om1haW5cIjogXCJzcmMvRXNyaUxlYWZsZXQuanNcIixcclxuICBcImpzcG1cIjoge1xyXG4gICAgXCJyZWdpc3RyeVwiOiBcIm5wbVwiLFxyXG4gICAgXCJmb3JtYXRcIjogXCJlczZcIixcclxuICAgIFwibWFpblwiOiBcInNyYy9Fc3JpTGVhZmxldC5qc1wiXHJcbiAgfSxcclxuICBcImtleXdvcmRzXCI6IFtcclxuICAgIFwiYXJjZ2lzXCIsXHJcbiAgICBcImVzcmlcIixcclxuICAgIFwiZXNyaSBsZWFmbGV0XCIsXHJcbiAgICBcImdpc1wiLFxyXG4gICAgXCJsZWFmbGV0IHBsdWdpblwiLFxyXG4gICAgXCJtYXBwaW5nXCJcclxuICBdLFxyXG4gIFwibGljZW5zZVwiOiBcIkFwYWNoZS0yLjBcIixcclxuICBcIm1haW5cIjogXCJkaXN0L2VzcmktbGVhZmxldC1kZWJ1Zy5qc1wiLFxyXG4gIFwicGVlckRlcGVuZGVuY2llc1wiOiB7XHJcbiAgICBcImxlYWZsZXRcIjogXCJ+MS4wLjBcIlxyXG4gIH0sXHJcbiAgXCJyZWFkbWVGaWxlbmFtZVwiOiBcIlJFQURNRS5tZFwiLFxyXG4gIFwicmVwb3NpdG9yeVwiOiB7XHJcbiAgICBcInR5cGVcIjogXCJnaXRcIixcclxuICAgIFwidXJsXCI6IFwiZ2l0QGdpdGh1Yi5jb206RXNyaS9lc3JpLWxlYWZsZXQuZ2l0XCJcclxuICB9LFxyXG4gIFwic2NyaXB0c1wiOiB7XHJcbiAgICBcImJ1aWxkXCI6IFwicm9sbHVwIC1jIHByb2ZpbGVzL2RlYnVnLmpzICYgcm9sbHVwIC1jIHByb2ZpbGVzL3Byb2R1Y3Rpb24uanNcIixcclxuICAgIFwibGludFwiOiBcInNlbWlzdGFuZGFyZCB8IHNuYXp6eVwiLFxyXG4gICAgXCJwcmVidWlsZFwiOiBcIm1rZGlycCBkaXN0XCIsXHJcbiAgICBcInByZXB1Ymxpc2hcIjogXCJucG0gcnVuIGJ1aWxkXCIsXHJcbiAgICBcInByZXRlc3RcIjogXCJucG0gcnVuIGJ1aWxkXCIsXHJcbiAgICBcInByZWNvbW1pdFwiOiBcIm5wbSBydW4gbGludFwiLFxyXG4gICAgXCJyZWxlYXNlXCI6IFwiLi9zY3JpcHRzL3JlbGVhc2Uuc2hcIixcclxuICAgIFwic3RhcnQtd2F0Y2hcIjogXCJ3YXRjaCBcXFwibnBtIHJ1biBidWlsZFxcXCIgc3JjXCIsXHJcbiAgICBcInN0YXJ0XCI6IFwicnVuLXAgc3RhcnQtd2F0Y2ggc2VydmVcIixcclxuICAgIFwic2VydmVcIjogXCJodHRwLXNlcnZlciAtcCA1MDAwIC1jLTEgLW9cIixcclxuICAgIFwidGVzdFwiOiBcIm5wbSBydW4gbGludCAmJiBrYXJtYSBzdGFydFwiXHJcbiAgfSxcclxuICBcInNlbWlzdGFuZGFyZFwiOiB7XHJcbiAgICBcImlnbm9yZVwiOiBbXHJcbiAgICAgIFwiL2Rpc3RcIlxyXG4gICAgXSxcclxuICAgIFwiZ2xvYmFsc1wiOiBbXHJcbiAgICAgIFwiZXhwZWN0XCIsXHJcbiAgICAgIFwiTFwiLFxyXG4gICAgICBcIlhNTEh0dHBSZXF1ZXN0XCIsXHJcbiAgICAgIFwic2lub25cIixcclxuICAgICAgXCJ4aHJcIixcclxuICAgICAgXCJwcm9qNFwiXHJcbiAgICBdXHJcbiAgfVxyXG59XHJcbiIsImV4cG9ydCB2YXIgY29ycyA9ICgod2luZG93LlhNTEh0dHBSZXF1ZXN0ICYmICd3aXRoQ3JlZGVudGlhbHMnIGluIG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3QoKSkpO1xyXG5leHBvcnQgdmFyIHBvaW50ZXJFdmVudHMgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9PT0gJyc7XHJcblxyXG5leHBvcnQgdmFyIFN1cHBvcnQgPSB7XHJcbiAgY29yczogY29ycyxcclxuICBwb2ludGVyRXZlbnRzOiBwb2ludGVyRXZlbnRzXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTdXBwb3J0O1xyXG4iLCJleHBvcnQgdmFyIG9wdGlvbnMgPSB7XHJcbiAgYXR0cmlidXRpb25XaWR0aE9mZnNldDogNTVcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IG9wdGlvbnM7XHJcbiIsImltcG9ydCB7IFV0aWwsIERvbVV0aWwgfSBmcm9tICdsZWFmbGV0JztcclxuaW1wb3J0IFN1cHBvcnQgZnJvbSAnLi9TdXBwb3J0JztcclxuaW1wb3J0IHsgd2FybiB9IGZyb20gJy4vVXRpbCc7XHJcblxyXG52YXIgY2FsbGJhY2tzID0gMDtcclxuXHJcbmZ1bmN0aW9uIHNlcmlhbGl6ZSAocGFyYW1zKSB7XHJcbiAgdmFyIGRhdGEgPSAnJztcclxuXHJcbiAgcGFyYW1zLmYgPSBwYXJhbXMuZiB8fCAnanNvbic7XHJcblxyXG4gIGZvciAodmFyIGtleSBpbiBwYXJhbXMpIHtcclxuICAgIGlmIChwYXJhbXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICB2YXIgcGFyYW0gPSBwYXJhbXNba2V5XTtcclxuICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocGFyYW0pO1xyXG4gICAgICB2YXIgdmFsdWU7XHJcblxyXG4gICAgICBpZiAoZGF0YS5sZW5ndGgpIHtcclxuICAgICAgICBkYXRhICs9ICcmJztcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcclxuICAgICAgICB2YWx1ZSA9IChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocGFyYW1bMF0pID09PSAnW29iamVjdCBPYmplY3RdJykgPyBKU09OLnN0cmluZ2lmeShwYXJhbSkgOiBwYXJhbS5qb2luKCcsJyk7XHJcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcclxuICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHBhcmFtKTtcclxuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnW29iamVjdCBEYXRlXScpIHtcclxuICAgICAgICB2YWx1ZSA9IHBhcmFtLnZhbHVlT2YoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YWx1ZSA9IHBhcmFtO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkYXRhICs9IGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBkYXRhO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVSZXF1ZXN0IChjYWxsYmFjaywgY29udGV4dCkge1xyXG4gIGNvbnNvbGUubG9nKCdjcmVhdGUgcmVxdWVzdCB3aXRoIGNhbGxiYWNrIGFuZCBjb250ZXh0JywgY2FsbGJhY2spO1xyXG4gIHZhciBodHRwUmVxdWVzdCA9IG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3QoKTtcclxuXHJcbiAgaHR0cFJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zb2xlLmxvZygnY3JlYXRlUmVxdWVzdCBvbmVycm9yJywgZSk7XHJcbiAgICBodHRwUmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBVdGlsLmZhbHNlRm47XHJcblxyXG4gICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCB7XHJcbiAgICAgIGVycm9yOiB7XHJcbiAgICAgICAgY29kZTogNTAwLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdYTUxIdHRwUmVxdWVzdCBlcnJvcidcclxuICAgICAgfVxyXG4gICAgfSwgbnVsbCk7XHJcbiAgfTtcclxuXHJcbiAgaHR0cFJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coJ2NyZWF0ZVJlcXVlc3Qgb25yZWFkeXN0YXRlY2hhbmdlJyk7XHJcbiAgICB2YXIgcmVzcG9uc2U7XHJcbiAgICB2YXIgZXJyb3I7XHJcblxyXG4gICAgaWYgKGh0dHBSZXF1ZXN0LnJlYWR5U3RhdGUgPT09IDQpIHtcclxuICAgICAgY29uc29sZS5sb2coJ2NyZWF0ZVJlcXVlc3Qgd2UgZ290IHJlYWR5IHN0YXRlIDQhJyk7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2NyZWF0ZVJlcXVlc3QgdHJ5IHRvIHBhcnNlIHJlc3BvbnNlJyk7XHJcbiAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKGh0dHBSZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2NyZWF0ZVJlcXVlc3QgZmFpbGVkIHRvIHBhcnNlIHJlc3BvbnNlJyk7XHJcbiAgICAgICAgcmVzcG9uc2UgPSBudWxsO1xyXG4gICAgICAgIGVycm9yID0ge1xyXG4gICAgICAgICAgY29kZTogNTAwLFxyXG4gICAgICAgICAgbWVzc2FnZTogJ0NvdWxkIG5vdCBwYXJzZSByZXNwb25zZSBhcyBKU09OLiBUaGlzIGNvdWxkIGFsc28gYmUgY2F1c2VkIGJ5IGEgQ09SUyBvciBYTUxIdHRwUmVxdWVzdCBlcnJvci4nXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFlcnJvciAmJiByZXNwb25zZS5lcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdjcmVhdGVSZXF1ZXN0IHdlIGdvdCBhIHJlc3BvbnNlLmVycm9yJywgcmVzcG9uc2UuZXJyb3IpO1xyXG4gICAgICAgIGVycm9yID0gcmVzcG9uc2UuZXJyb3I7XHJcbiAgICAgICAgcmVzcG9uc2UgPSBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBodHRwUmVxdWVzdC5vbmVycm9yID0gVXRpbC5mYWxzZUZuO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coJ2NyZWF0ZVJlcXVlc3QgY2FsbCB0aGUgZ29kIGRhbW4gY2FsbGJhY2snKTtcclxuICAgICAgY29uc29sZS5sb2coJ2ZvcmdldCB0aGUgY2FsbGJhY2snKTtcclxuICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBlcnJvciwgcmVzcG9uc2UpO1xyXG4gICAgICBjb25zb2xlLmxvZygnY3JlYXRlUmVxdWVzdCBjYWxsZWQgdGhlIGdvZCBkYW1uIGNhbGxiYWNrJyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaHR0cFJlcXVlc3Qub250aW1lb3V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coJ2NyZWF0ZVJlcXVlc3Qgd2UgdGltZWQgb3V0IG9oIG5vZXMgOignKTtcclxuICAgIHRoaXMub25lcnJvcigpO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiBodHRwUmVxdWVzdDtcclxufVxyXG5cclxuZnVuY3Rpb24geG1sSHR0cFBvc3QgKHVybCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gIGNvbnNvbGUubG9nKCd4bWxodHRwUG9zdCBJIGFtIHBvc3RpbmcgdXJsJywgdXJsLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICB2YXIgaHR0cFJlcXVlc3QgPSBjcmVhdGVSZXF1ZXN0KGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICBodHRwUmVxdWVzdC5vcGVuKCdQT1NUJywgdXJsKTtcclxuXHJcbiAgaWYgKHR5cGVvZiBjb250ZXh0ICE9PSAndW5kZWZpbmVkJyAmJiBjb250ZXh0ICE9PSBudWxsKSB7XHJcbiAgICBpZiAodHlwZW9mIGNvbnRleHQub3B0aW9ucyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgaHR0cFJlcXVlc3QudGltZW91dCA9IGNvbnRleHQub3B0aW9ucy50aW1lb3V0O1xyXG4gICAgfVxyXG4gIH1cclxuICBodHRwUmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04Jyk7XHJcbiAgaHR0cFJlcXVlc3Quc2VuZChzZXJpYWxpemUocGFyYW1zKSk7XHJcblxyXG4gIHJldHVybiBodHRwUmVxdWVzdDtcclxufVxyXG5cclxuZnVuY3Rpb24geG1sSHR0cEdldCAodXJsLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgY29uc29sZS5sb2coJ3htbGh0dHBnZXQnLCB1cmwpO1xyXG4gIHZhciBodHRwUmVxdWVzdCA9IGNyZWF0ZVJlcXVlc3QoY2FsbGJhY2ssIGNvbnRleHQpO1xyXG4gIGh0dHBSZXF1ZXN0Lm9wZW4oJ0dFVCcsIHVybCArICc/JyArIHNlcmlhbGl6ZShwYXJhbXMpLCB0cnVlKTtcclxuXHJcbiAgaWYgKHR5cGVvZiBjb250ZXh0ICE9PSAndW5kZWZpbmVkJyAmJiBjb250ZXh0ICE9PSBudWxsKSB7XHJcbiAgICBpZiAodHlwZW9mIGNvbnRleHQub3B0aW9ucyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgaHR0cFJlcXVlc3QudGltZW91dCA9IGNvbnRleHQub3B0aW9ucy50aW1lb3V0O1xyXG4gICAgfVxyXG4gIH1cclxuICBjb25zb2xlLmxvZygneG1saHR0cGdldCBzZW5kIHRoZSByZXF1ZXN0JywgdXJsKTtcclxuICBodHRwUmVxdWVzdC5zZW5kKG51bGwpO1xyXG4gIGNvbnNvbGUubG9nKCd4bWxodHRwZ2V0IHNlbnQgdGhlIHJlcXVlc3QnLCB1cmwpO1xyXG5cclxuICByZXR1cm4gaHR0cFJlcXVlc3Q7XHJcbn1cclxuXHJcbi8vIEFKQVggaGFuZGxlcnMgZm9yIENPUlMgKG1vZGVybiBicm93c2Vycykgb3IgSlNPTlAgKG9sZGVyIGJyb3dzZXJzKVxyXG5leHBvcnQgZnVuY3Rpb24gcmVxdWVzdCAodXJsLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgY29uc29sZS5sb2coJ3JlYWwgcmVxdWVzdCcsIHVybCk7XHJcbiAgdmFyIHBhcmFtU3RyaW5nID0gc2VyaWFsaXplKHBhcmFtcyk7XHJcbiAgdmFyIGh0dHBSZXF1ZXN0ID0gY3JlYXRlUmVxdWVzdChjYWxsYmFjaywgY29udGV4dCk7XHJcbiAgdmFyIHJlcXVlc3RMZW5ndGggPSAodXJsICsgJz8nICsgcGFyYW1TdHJpbmcpLmxlbmd0aDtcclxuXHJcbiAgLy8gaWUxMC8xMSByZXF1aXJlIHRoZSByZXF1ZXN0IGJlIG9wZW5lZCBiZWZvcmUgYSB0aW1lb3V0IGlzIGFwcGxpZWRcclxuICBpZiAocmVxdWVzdExlbmd0aCA8PSAyMDAwICYmIFN1cHBvcnQuY29ycykge1xyXG4gICAgY29uc29sZS5sb2coJ3JlYWwgcmVxdWVzdCAxJyk7XHJcbiAgICBodHRwUmVxdWVzdC5vcGVuKCdHRVQnLCB1cmwgKyAnPycgKyBwYXJhbVN0cmluZyk7XHJcbiAgfSBlbHNlIGlmIChyZXF1ZXN0TGVuZ3RoID4gMjAwMCAmJiBTdXBwb3J0LmNvcnMpIHtcclxuICAgIGNvbnNvbGUubG9nKCdyZWFsIHJlcXVlc3QgMicpO1xyXG4gICAgaHR0cFJlcXVlc3Qub3BlbignUE9TVCcsIHVybCk7XHJcbiAgICBodHRwUmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04Jyk7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGNvbnRleHQgIT09ICd1bmRlZmluZWQnICYmIGNvbnRleHQgIT09IG51bGwpIHtcclxuICAgIGlmICh0eXBlb2YgY29udGV4dC5vcHRpb25zICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICBodHRwUmVxdWVzdC50aW1lb3V0ID0gY29udGV4dC5vcHRpb25zLnRpbWVvdXQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyByZXF1ZXN0IGlzIGxlc3MgdGhhbiAyMDAwIGNoYXJhY3RlcnMgYW5kIHRoZSBicm93c2VyIHN1cHBvcnRzIENPUlMsIG1ha2UgR0VUIHJlcXVlc3Qgd2l0aCBYTUxIdHRwUmVxdWVzdFxyXG4gIGlmIChyZXF1ZXN0TGVuZ3RoIDw9IDIwMDAgJiYgU3VwcG9ydC5jb3JzKSB7XHJcbiAgICBjb25zb2xlLmxvZygncmVhbCByZXF1ZXN0IDMnKTtcclxuICAgIGh0dHBSZXF1ZXN0LnNlbmQobnVsbCk7XHJcblxyXG4gIC8vIHJlcXVlc3QgaXMgbW9yZSB0aGFuIDIwMDAgY2hhcmFjdGVycyBhbmQgdGhlIGJyb3dzZXIgc3VwcG9ydHMgQ09SUywgbWFrZSBQT1NUIHJlcXVlc3Qgd2l0aCBYTUxIdHRwUmVxdWVzdFxyXG4gIH0gZWxzZSBpZiAocmVxdWVzdExlbmd0aCA+IDIwMDAgJiYgU3VwcG9ydC5jb3JzKSB7XHJcbiAgICBjb25zb2xlLmxvZygncmVhbCByZXF1ZXN0IDQnKTtcclxuICAgIGh0dHBSZXF1ZXN0LnNlbmQocGFyYW1TdHJpbmcpO1xyXG5cclxuICAvLyByZXF1ZXN0IGlzIGxlc3MgIHRoYW4gMjAwMCBjaGFyYWN0ZXJzIGFuZCB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IENPUlMsIG1ha2UgYSBKU09OUCByZXF1ZXN0XHJcbiAgfSBlbHNlIGlmIChyZXF1ZXN0TGVuZ3RoIDw9IDIwMDAgJiYgIVN1cHBvcnQuY29ycykge1xyXG4gICAgY29uc29sZS5sb2coJ3JlYWwgcmVxdWVzdCA1Jyk7XHJcbiAgICByZXR1cm4ganNvbnAodXJsLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuXHJcbiAgLy8gcmVxdWVzdCBpcyBsb25nZXIgdGhlbiAyMDAwIGNoYXJhY3RlcnMgYW5kIHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgQ09SUywgbG9nIGEgd2FybmluZ1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zb2xlLmxvZygncmVhbCByZXF1ZXN0IDYnKTtcclxuICAgIHdhcm4oJ2EgcmVxdWVzdCB0byAnICsgdXJsICsgJyB3YXMgbG9uZ2VyIHRoZW4gMjAwMCBjaGFyYWN0ZXJzIGFuZCB0aGlzIGJyb3dzZXIgY2Fubm90IG1ha2UgYSBjcm9zcy1kb21haW4gcG9zdCByZXF1ZXN0LiBQbGVhc2UgdXNlIGEgcHJveHkgaHR0cDovL2VzcmkuZ2l0aHViLmlvL2VzcmktbGVhZmxldC9hcGktcmVmZXJlbmNlL3JlcXVlc3QuaHRtbCcpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc29sZS5sb2coJ3JldHVybiB0aGUgcmVxdWVzdC4uLicpO1xyXG4gIHJldHVybiBodHRwUmVxdWVzdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpzb25wICh1cmwsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICB3aW5kb3cuX0VzcmlMZWFmbGV0Q2FsbGJhY2tzID0gd2luZG93Ll9Fc3JpTGVhZmxldENhbGxiYWNrcyB8fCB7fTtcclxuICB2YXIgY2FsbGJhY2tJZCA9ICdjJyArIGNhbGxiYWNrcztcclxuICBwYXJhbXMuY2FsbGJhY2sgPSAnd2luZG93Ll9Fc3JpTGVhZmxldENhbGxiYWNrcy4nICsgY2FsbGJhY2tJZDtcclxuXHJcbiAgd2luZG93Ll9Fc3JpTGVhZmxldENhbGxiYWNrc1tjYWxsYmFja0lkXSA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgaWYgKHdpbmRvdy5fRXNyaUxlYWZsZXRDYWxsYmFja3NbY2FsbGJhY2tJZF0gIT09IHRydWUpIHtcclxuICAgICAgdmFyIGVycm9yO1xyXG4gICAgICB2YXIgcmVzcG9uc2VUeXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHJlc3BvbnNlKTtcclxuXHJcbiAgICAgIGlmICghKHJlc3BvbnNlVHlwZSA9PT0gJ1tvYmplY3QgT2JqZWN0XScgfHwgcmVzcG9uc2VUeXBlID09PSAnW29iamVjdCBBcnJheV0nKSkge1xyXG4gICAgICAgIGVycm9yID0ge1xyXG4gICAgICAgICAgZXJyb3I6IHtcclxuICAgICAgICAgICAgY29kZTogNTAwLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiAnRXhwZWN0ZWQgYXJyYXkgb3Igb2JqZWN0IGFzIEpTT05QIHJlc3BvbnNlJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmVzcG9uc2UgPSBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIWVycm9yICYmIHJlc3BvbnNlLmVycm9yKSB7XHJcbiAgICAgICAgZXJyb3IgPSByZXNwb25zZTtcclxuICAgICAgICByZXNwb25zZSA9IG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IsIHJlc3BvbnNlKTtcclxuICAgICAgd2luZG93Ll9Fc3JpTGVhZmxldENhbGxiYWNrc1tjYWxsYmFja0lkXSA9IHRydWU7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdmFyIHNjcmlwdCA9IERvbVV0aWwuY3JlYXRlKCdzY3JpcHQnLCBudWxsLCBkb2N1bWVudC5ib2R5KTtcclxuICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xyXG4gIHNjcmlwdC5zcmMgPSB1cmwgKyAnPycgKyBzZXJpYWxpemUocGFyYW1zKTtcclxuICBzY3JpcHQuaWQgPSBjYWxsYmFja0lkO1xyXG5cclxuICBjYWxsYmFja3MrKztcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGlkOiBjYWxsYmFja0lkLFxyXG4gICAgdXJsOiBzY3JpcHQuc3JjLFxyXG4gICAgYWJvcnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgd2luZG93Ll9Fc3JpTGVhZmxldENhbGxiYWNrcy5fY2FsbGJhY2tbY2FsbGJhY2tJZF0oe1xyXG4gICAgICAgIGNvZGU6IDAsXHJcbiAgICAgICAgbWVzc2FnZTogJ1JlcXVlc3QgYWJvcnRlZC4nXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcbn1cclxuXHJcbnZhciBnZXQgPSAoKFN1cHBvcnQuY29ycykgPyB4bWxIdHRwR2V0IDoganNvbnApO1xyXG5nZXQuQ09SUyA9IHhtbEh0dHBHZXQ7XHJcbmdldC5KU09OUCA9IGpzb25wO1xyXG5cclxuLy8gY2hvb3NlIHRoZSBjb3JyZWN0IEFKQVggaGFuZGxlciBkZXBlbmRpbmcgb24gQ09SUyBzdXBwb3J0XHJcbmV4cG9ydCB7IGdldCB9O1xyXG5cclxuLy8gYWx3YXlzIHVzZSBYTUxIdHRwUmVxdWVzdCBmb3IgcG9zdHNcclxuZXhwb3J0IHsgeG1sSHR0cFBvc3QgYXMgcG9zdCB9O1xyXG5cclxuLy8gZXhwb3J0IHRoZSBSZXF1ZXN0IG9iamVjdCB0byBjYWxsIHRoZSBkaWZmZXJlbnQgaGFuZGxlcnMgZm9yIGRlYnVnZ2luZ1xyXG5leHBvcnQgdmFyIFJlcXVlc3QgPSB7XHJcbiAgcmVxdWVzdDogcmVxdWVzdCxcclxuICBnZXQ6IGdldCxcclxuICBwb3N0OiB4bWxIdHRwUG9zdFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgUmVxdWVzdDtcclxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE3IEVzcmlcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gY2hlY2tzIGlmIDIgeCx5IHBvaW50cyBhcmUgZXF1YWxcbmZ1bmN0aW9uIHBvaW50c0VxdWFsIChhLCBiKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBjaGVja3MgaWYgdGhlIGZpcnN0IGFuZCBsYXN0IHBvaW50cyBvZiBhIHJpbmcgYXJlIGVxdWFsIGFuZCBjbG9zZXMgdGhlIHJpbmdcbmZ1bmN0aW9uIGNsb3NlUmluZyAoY29vcmRpbmF0ZXMpIHtcbiAgaWYgKCFwb2ludHNFcXVhbChjb29yZGluYXRlc1swXSwgY29vcmRpbmF0ZXNbY29vcmRpbmF0ZXMubGVuZ3RoIC0gMV0pKSB7XG4gICAgY29vcmRpbmF0ZXMucHVzaChjb29yZGluYXRlc1swXSk7XG4gIH1cbiAgcmV0dXJuIGNvb3JkaW5hdGVzO1xufVxuXG4vLyBkZXRlcm1pbmUgaWYgcG9seWdvbiByaW5nIGNvb3JkaW5hdGVzIGFyZSBjbG9ja3dpc2UuIGNsb2Nrd2lzZSBzaWduaWZpZXMgb3V0ZXIgcmluZywgY291bnRlci1jbG9ja3dpc2UgYW4gaW5uZXIgcmluZ1xuLy8gb3IgaG9sZS4gdGhpcyBsb2dpYyB3YXMgZm91bmQgYXQgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMTY1NjQ3L2hvdy10by1kZXRlcm1pbmUtaWYtYS1saXN0LW9mLXBvbHlnb24tXG4vLyBwb2ludHMtYXJlLWluLWNsb2Nrd2lzZS1vcmRlclxuZnVuY3Rpb24gcmluZ0lzQ2xvY2t3aXNlIChyaW5nVG9UZXN0KSB7XG4gIHZhciB0b3RhbCA9IDA7XG4gIHZhciBpID0gMDtcbiAgdmFyIHJMZW5ndGggPSByaW5nVG9UZXN0Lmxlbmd0aDtcbiAgdmFyIHB0MSA9IHJpbmdUb1Rlc3RbaV07XG4gIHZhciBwdDI7XG4gIGZvciAoaTsgaSA8IHJMZW5ndGggLSAxOyBpKyspIHtcbiAgICBwdDIgPSByaW5nVG9UZXN0W2kgKyAxXTtcbiAgICB0b3RhbCArPSAocHQyWzBdIC0gcHQxWzBdKSAqIChwdDJbMV0gKyBwdDFbMV0pO1xuICAgIHB0MSA9IHB0MjtcbiAgfVxuICByZXR1cm4gKHRvdGFsID49IDApO1xufVxuXG4vLyBwb3J0ZWQgZnJvbSB0ZXJyYWZvcm1lci5qcyBodHRwczovL2dpdGh1Yi5jb20vRXNyaS9UZXJyYWZvcm1lci9ibG9iL21hc3Rlci90ZXJyYWZvcm1lci5qcyNMNTA0LUw1MTlcbmZ1bmN0aW9uIHZlcnRleEludGVyc2VjdHNWZXJ0ZXggKGExLCBhMiwgYjEsIGIyKSB7XG4gIHZhciB1YVQgPSAoKGIyWzBdIC0gYjFbMF0pICogKGExWzFdIC0gYjFbMV0pKSAtICgoYjJbMV0gLSBiMVsxXSkgKiAoYTFbMF0gLSBiMVswXSkpO1xuICB2YXIgdWJUID0gKChhMlswXSAtIGExWzBdKSAqIChhMVsxXSAtIGIxWzFdKSkgLSAoKGEyWzFdIC0gYTFbMV0pICogKGExWzBdIC0gYjFbMF0pKTtcbiAgdmFyIHVCID0gKChiMlsxXSAtIGIxWzFdKSAqIChhMlswXSAtIGExWzBdKSkgLSAoKGIyWzBdIC0gYjFbMF0pICogKGEyWzFdIC0gYTFbMV0pKTtcblxuICBpZiAodUIgIT09IDApIHtcbiAgICB2YXIgdWEgPSB1YVQgLyB1QjtcbiAgICB2YXIgdWIgPSB1YlQgLyB1QjtcblxuICAgIGlmICh1YSA+PSAwICYmIHVhIDw9IDEgJiYgdWIgPj0gMCAmJiB1YiA8PSAxKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIHBvcnRlZCBmcm9tIHRlcnJhZm9ybWVyLmpzIGh0dHBzOi8vZ2l0aHViLmNvbS9Fc3JpL1RlcnJhZm9ybWVyL2Jsb2IvbWFzdGVyL3RlcnJhZm9ybWVyLmpzI0w1MjEtTDUzMVxuZnVuY3Rpb24gYXJyYXlJbnRlcnNlY3RzQXJyYXkgKGEsIGIpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgYi5sZW5ndGggLSAxOyBqKyspIHtcbiAgICAgIGlmICh2ZXJ0ZXhJbnRlcnNlY3RzVmVydGV4KGFbaV0sIGFbaSArIDFdLCBiW2pdLCBiW2ogKyAxXSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vLyBwb3J0ZWQgZnJvbSB0ZXJyYWZvcm1lci5qcyBodHRwczovL2dpdGh1Yi5jb20vRXNyaS9UZXJyYWZvcm1lci9ibG9iL21hc3Rlci90ZXJyYWZvcm1lci5qcyNMNDcwLUw0ODBcbmZ1bmN0aW9uIGNvb3JkaW5hdGVzQ29udGFpblBvaW50IChjb29yZGluYXRlcywgcG9pbnQpIHtcbiAgdmFyIGNvbnRhaW5zID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSAtMSwgbCA9IGNvb3JkaW5hdGVzLmxlbmd0aCwgaiA9IGwgLSAxOyArK2kgPCBsOyBqID0gaSkge1xuICAgIGlmICgoKGNvb3JkaW5hdGVzW2ldWzFdIDw9IHBvaW50WzFdICYmIHBvaW50WzFdIDwgY29vcmRpbmF0ZXNbal1bMV0pIHx8XG4gICAgICAgICAoY29vcmRpbmF0ZXNbal1bMV0gPD0gcG9pbnRbMV0gJiYgcG9pbnRbMV0gPCBjb29yZGluYXRlc1tpXVsxXSkpICYmXG4gICAgICAgIChwb2ludFswXSA8ICgoKGNvb3JkaW5hdGVzW2pdWzBdIC0gY29vcmRpbmF0ZXNbaV1bMF0pICogKHBvaW50WzFdIC0gY29vcmRpbmF0ZXNbaV1bMV0pKSAvIChjb29yZGluYXRlc1tqXVsxXSAtIGNvb3JkaW5hdGVzW2ldWzFdKSkgKyBjb29yZGluYXRlc1tpXVswXSkpIHtcbiAgICAgIGNvbnRhaW5zID0gIWNvbnRhaW5zO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29udGFpbnM7XG59XG5cbi8vIHBvcnRlZCBmcm9tIHRlcnJhZm9ybWVyLWFyY2dpcy1wYXJzZXIuanMgaHR0cHM6Ly9naXRodWIuY29tL0VzcmkvdGVycmFmb3JtZXItYXJjZ2lzLXBhcnNlci9ibG9iL21hc3Rlci90ZXJyYWZvcm1lci1hcmNnaXMtcGFyc2VyLmpzI0wxMDYtTDExM1xuZnVuY3Rpb24gY29vcmRpbmF0ZXNDb250YWluQ29vcmRpbmF0ZXMgKG91dGVyLCBpbm5lcikge1xuICB2YXIgaW50ZXJzZWN0cyA9IGFycmF5SW50ZXJzZWN0c0FycmF5KG91dGVyLCBpbm5lcik7XG4gIHZhciBjb250YWlucyA9IGNvb3JkaW5hdGVzQ29udGFpblBvaW50KG91dGVyLCBpbm5lclswXSk7XG4gIGlmICghaW50ZXJzZWN0cyAmJiBjb250YWlucykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gZG8gYW55IHBvbHlnb25zIGluIHRoaXMgYXJyYXkgY29udGFpbiBhbnkgb3RoZXIgcG9seWdvbnMgaW4gdGhpcyBhcnJheT9cbi8vIHVzZWQgZm9yIGNoZWNraW5nIGZvciBob2xlcyBpbiBhcmNnaXMgcmluZ3Ncbi8vIHBvcnRlZCBmcm9tIHRlcnJhZm9ybWVyLWFyY2dpcy1wYXJzZXIuanMgaHR0cHM6Ly9naXRodWIuY29tL0VzcmkvdGVycmFmb3JtZXItYXJjZ2lzLXBhcnNlci9ibG9iL21hc3Rlci90ZXJyYWZvcm1lci1hcmNnaXMtcGFyc2VyLmpzI0wxMTctTDE3MlxuZnVuY3Rpb24gY29udmVydFJpbmdzVG9HZW9KU09OIChyaW5ncykge1xuICB2YXIgb3V0ZXJSaW5ncyA9IFtdO1xuICB2YXIgaG9sZXMgPSBbXTtcbiAgdmFyIHg7IC8vIGl0ZXJhdG9yXG4gIHZhciBvdXRlclJpbmc7IC8vIGN1cnJlbnQgb3V0ZXIgcmluZyBiZWluZyBldmFsdWF0ZWRcbiAgdmFyIGhvbGU7IC8vIGN1cnJlbnQgaG9sZSBiZWluZyBldmFsdWF0ZWRcblxuICAvLyBmb3IgZWFjaCByaW5nXG4gIGZvciAodmFyIHIgPSAwOyByIDwgcmluZ3MubGVuZ3RoOyByKyspIHtcbiAgICB2YXIgcmluZyA9IGNsb3NlUmluZyhyaW5nc1tyXS5zbGljZSgwKSk7XG4gICAgaWYgKHJpbmcubGVuZ3RoIDwgNCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIC8vIGlzIHRoaXMgcmluZyBhbiBvdXRlciByaW5nPyBpcyBpdCBjbG9ja3dpc2U/XG4gICAgaWYgKHJpbmdJc0Nsb2Nrd2lzZShyaW5nKSkge1xuICAgICAgdmFyIHBvbHlnb24gPSBbIHJpbmcgXTtcbiAgICAgIG91dGVyUmluZ3MucHVzaChwb2x5Z29uKTsgLy8gcHVzaCB0byBvdXRlciByaW5nc1xuICAgIH0gZWxzZSB7XG4gICAgICBob2xlcy5wdXNoKHJpbmcpOyAvLyBjb3VudGVyY2xvY2t3aXNlIHB1c2ggdG8gaG9sZXNcbiAgICB9XG4gIH1cblxuICB2YXIgdW5jb250YWluZWRIb2xlcyA9IFtdO1xuXG4gIC8vIHdoaWxlIHRoZXJlIGFyZSBob2xlcyBsZWZ0Li4uXG4gIHdoaWxlIChob2xlcy5sZW5ndGgpIHtcbiAgICAvLyBwb3AgYSBob2xlIG9mZiBvdXQgc3RhY2tcbiAgICBob2xlID0gaG9sZXMucG9wKCk7XG5cbiAgICAvLyBsb29wIG92ZXIgYWxsIG91dGVyIHJpbmdzIGFuZCBzZWUgaWYgdGhleSBjb250YWluIG91ciBob2xlLlxuICAgIHZhciBjb250YWluZWQgPSBmYWxzZTtcbiAgICBmb3IgKHggPSBvdXRlclJpbmdzLmxlbmd0aCAtIDE7IHggPj0gMDsgeC0tKSB7XG4gICAgICBvdXRlclJpbmcgPSBvdXRlclJpbmdzW3hdWzBdO1xuICAgICAgaWYgKGNvb3JkaW5hdGVzQ29udGFpbkNvb3JkaW5hdGVzKG91dGVyUmluZywgaG9sZSkpIHtcbiAgICAgICAgLy8gdGhlIGhvbGUgaXMgY29udGFpbmVkIHB1c2ggaXQgaW50byBvdXIgcG9seWdvblxuICAgICAgICBvdXRlclJpbmdzW3hdLnB1c2goaG9sZSk7XG4gICAgICAgIGNvbnRhaW5lZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJpbmcgaXMgbm90IGNvbnRhaW5lZCBpbiBhbnkgb3V0ZXIgcmluZ1xuICAgIC8vIHNvbWV0aW1lcyB0aGlzIGhhcHBlbnMgaHR0cHM6Ly9naXRodWIuY29tL0VzcmkvZXNyaS1sZWFmbGV0L2lzc3Vlcy8zMjBcbiAgICBpZiAoIWNvbnRhaW5lZCkge1xuICAgICAgdW5jb250YWluZWRIb2xlcy5wdXNoKGhvbGUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHdlIGNvdWxkbid0IG1hdGNoIGFueSBob2xlcyB1c2luZyBjb250YWlucyB3ZSBjYW4gdHJ5IGludGVyc2VjdHMuLi5cbiAgd2hpbGUgKHVuY29udGFpbmVkSG9sZXMubGVuZ3RoKSB7XG4gICAgLy8gcG9wIGEgaG9sZSBvZmYgb3V0IHN0YWNrXG4gICAgaG9sZSA9IHVuY29udGFpbmVkSG9sZXMucG9wKCk7XG5cbiAgICAvLyBsb29wIG92ZXIgYWxsIG91dGVyIHJpbmdzIGFuZCBzZWUgaWYgYW55IGludGVyc2VjdCBvdXIgaG9sZS5cbiAgICB2YXIgaW50ZXJzZWN0cyA9IGZhbHNlO1xuXG4gICAgZm9yICh4ID0gb3V0ZXJSaW5ncy5sZW5ndGggLSAxOyB4ID49IDA7IHgtLSkge1xuICAgICAgb3V0ZXJSaW5nID0gb3V0ZXJSaW5nc1t4XVswXTtcbiAgICAgIGlmIChhcnJheUludGVyc2VjdHNBcnJheShvdXRlclJpbmcsIGhvbGUpKSB7XG4gICAgICAgIC8vIHRoZSBob2xlIGlzIGNvbnRhaW5lZCBwdXNoIGl0IGludG8gb3VyIHBvbHlnb25cbiAgICAgICAgb3V0ZXJSaW5nc1t4XS5wdXNoKGhvbGUpO1xuICAgICAgICBpbnRlcnNlY3RzID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFpbnRlcnNlY3RzKSB7XG4gICAgICBvdXRlclJpbmdzLnB1c2goW2hvbGUucmV2ZXJzZSgpXSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG91dGVyUmluZ3MubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdQb2x5Z29uJyxcbiAgICAgIGNvb3JkaW5hdGVzOiBvdXRlclJpbmdzWzBdXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ011bHRpUG9seWdvbicsXG4gICAgICBjb29yZGluYXRlczogb3V0ZXJSaW5nc1xuICAgIH07XG4gIH1cbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBlbnN1cmVzIHRoYXQgcmluZ3MgYXJlIG9yaWVudGVkIGluIHRoZSByaWdodCBkaXJlY3Rpb25zXG4vLyBvdXRlciByaW5ncyBhcmUgY2xvY2t3aXNlLCBob2xlcyBhcmUgY291bnRlcmNsb2Nrd2lzZVxuLy8gdXNlZCBmb3IgY29udmVydGluZyBHZW9KU09OIFBvbHlnb25zIHRvIEFyY0dJUyBQb2x5Z29uc1xuZnVuY3Rpb24gb3JpZW50UmluZ3MgKHBvbHkpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICB2YXIgcG9seWdvbiA9IHBvbHkuc2xpY2UoMCk7XG4gIHZhciBvdXRlclJpbmcgPSBjbG9zZVJpbmcocG9seWdvbi5zaGlmdCgpLnNsaWNlKDApKTtcbiAgaWYgKG91dGVyUmluZy5sZW5ndGggPj0gNCkge1xuICAgIGlmICghcmluZ0lzQ2xvY2t3aXNlKG91dGVyUmluZykpIHtcbiAgICAgIG91dGVyUmluZy5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgb3V0cHV0LnB1c2gob3V0ZXJSaW5nKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9seWdvbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGhvbGUgPSBjbG9zZVJpbmcocG9seWdvbltpXS5zbGljZSgwKSk7XG4gICAgICBpZiAoaG9sZS5sZW5ndGggPj0gNCkge1xuICAgICAgICBpZiAocmluZ0lzQ2xvY2t3aXNlKGhvbGUpKSB7XG4gICAgICAgICAgaG9sZS5yZXZlcnNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgb3V0cHV0LnB1c2goaG9sZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBmbGF0dGVucyBob2xlcyBpbiBtdWx0aXBvbHlnb25zIHRvIG9uZSBhcnJheSBvZiBwb2x5Z29uc1xuLy8gdXNlZCBmb3IgY29udmVydGluZyBHZW9KU09OIFBvbHlnb25zIHRvIEFyY0dJUyBQb2x5Z29uc1xuZnVuY3Rpb24gZmxhdHRlbk11bHRpUG9seWdvblJpbmdzIChyaW5ncykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcG9seWdvbiA9IG9yaWVudFJpbmdzKHJpbmdzW2ldKTtcbiAgICBmb3IgKHZhciB4ID0gcG9seWdvbi5sZW5ndGggLSAxOyB4ID49IDA7IHgtLSkge1xuICAgICAgdmFyIHJpbmcgPSBwb2x5Z29uW3hdLnNsaWNlKDApO1xuICAgICAgb3V0cHV0LnB1c2gocmluZyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbi8vIHNoYWxsb3cgb2JqZWN0IGNsb25lIGZvciBmZWF0dXJlIHByb3BlcnRpZXMgYW5kIGF0dHJpYnV0ZXNcbi8vIGZyb20gaHR0cDovL2pzcGVyZi5jb20vY2xvbmluZy1hbi1vYmplY3QvMlxuZnVuY3Rpb24gc2hhbGxvd0Nsb25lIChvYmopIHtcbiAgdmFyIHRhcmdldCA9IHt9O1xuICBmb3IgKHZhciBpIGluIG9iaikge1xuICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgIHRhcmdldFtpXSA9IG9ialtpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFyY2dpc1RvR2VvSlNPTiAoYXJjZ2lzLCBpZEF0dHJpYnV0ZSkge1xuICB2YXIgZ2VvanNvbiA9IHt9O1xuXG4gIGlmICh0eXBlb2YgYXJjZ2lzLnggPT09ICdudW1iZXInICYmIHR5cGVvZiBhcmNnaXMueSA9PT0gJ251bWJlcicpIHtcbiAgICBnZW9qc29uLnR5cGUgPSAnUG9pbnQnO1xuICAgIGdlb2pzb24uY29vcmRpbmF0ZXMgPSBbYXJjZ2lzLngsIGFyY2dpcy55XTtcbiAgfVxuXG4gIGlmIChhcmNnaXMucG9pbnRzKSB7XG4gICAgZ2VvanNvbi50eXBlID0gJ011bHRpUG9pbnQnO1xuICAgIGdlb2pzb24uY29vcmRpbmF0ZXMgPSBhcmNnaXMucG9pbnRzLnNsaWNlKDApO1xuICB9XG5cbiAgaWYgKGFyY2dpcy5wYXRocykge1xuICAgIGlmIChhcmNnaXMucGF0aHMubGVuZ3RoID09PSAxKSB7XG4gICAgICBnZW9qc29uLnR5cGUgPSAnTGluZVN0cmluZyc7XG4gICAgICBnZW9qc29uLmNvb3JkaW5hdGVzID0gYXJjZ2lzLnBhdGhzWzBdLnNsaWNlKDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBnZW9qc29uLnR5cGUgPSAnTXVsdGlMaW5lU3RyaW5nJztcbiAgICAgIGdlb2pzb24uY29vcmRpbmF0ZXMgPSBhcmNnaXMucGF0aHMuc2xpY2UoMCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGFyY2dpcy5yaW5ncykge1xuICAgIGdlb2pzb24gPSBjb252ZXJ0UmluZ3NUb0dlb0pTT04oYXJjZ2lzLnJpbmdzLnNsaWNlKDApKTtcbiAgfVxuXG4gIGlmIChhcmNnaXMuZ2VvbWV0cnkgfHwgYXJjZ2lzLmF0dHJpYnV0ZXMpIHtcbiAgICBnZW9qc29uLnR5cGUgPSAnRmVhdHVyZSc7XG4gICAgZ2VvanNvbi5nZW9tZXRyeSA9IChhcmNnaXMuZ2VvbWV0cnkpID8gYXJjZ2lzVG9HZW9KU09OKGFyY2dpcy5nZW9tZXRyeSkgOiBudWxsO1xuICAgIGdlb2pzb24ucHJvcGVydGllcyA9IChhcmNnaXMuYXR0cmlidXRlcykgPyBzaGFsbG93Q2xvbmUoYXJjZ2lzLmF0dHJpYnV0ZXMpIDogbnVsbDtcbiAgICBpZiAoYXJjZ2lzLmF0dHJpYnV0ZXMpIHtcbiAgICAgIGdlb2pzb24uaWQgPSBhcmNnaXMuYXR0cmlidXRlc1tpZEF0dHJpYnV0ZV0gfHwgYXJjZ2lzLmF0dHJpYnV0ZXMuT0JKRUNUSUQgfHwgYXJjZ2lzLmF0dHJpYnV0ZXMuRklEO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIG5vIHZhbGlkIGdlb21ldHJ5IHdhcyBlbmNvdW50ZXJlZFxuICBpZiAoSlNPTi5zdHJpbmdpZnkoZ2VvanNvbi5nZW9tZXRyeSkgPT09IEpTT04uc3RyaW5naWZ5KHt9KSkge1xuICAgIGdlb2pzb24uZ2VvbWV0cnkgPSBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGdlb2pzb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW9qc29uVG9BcmNHSVMgKGdlb2pzb24sIGlkQXR0cmlidXRlKSB7XG4gIGlkQXR0cmlidXRlID0gaWRBdHRyaWJ1dGUgfHwgJ09CSkVDVElEJztcbiAgdmFyIHNwYXRpYWxSZWZlcmVuY2UgPSB7IHdraWQ6IDQzMjYgfTtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICB2YXIgaTtcblxuICBzd2l0Y2ggKGdlb2pzb24udHlwZSkge1xuICAgIGNhc2UgJ1BvaW50JzpcbiAgICAgIHJlc3VsdC54ID0gZ2VvanNvbi5jb29yZGluYXRlc1swXTtcbiAgICAgIHJlc3VsdC55ID0gZ2VvanNvbi5jb29yZGluYXRlc1sxXTtcbiAgICAgIHJlc3VsdC5zcGF0aWFsUmVmZXJlbmNlID0gc3BhdGlhbFJlZmVyZW5jZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ011bHRpUG9pbnQnOlxuICAgICAgcmVzdWx0LnBvaW50cyA9IGdlb2pzb24uY29vcmRpbmF0ZXMuc2xpY2UoMCk7XG4gICAgICByZXN1bHQuc3BhdGlhbFJlZmVyZW5jZSA9IHNwYXRpYWxSZWZlcmVuY2U7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdMaW5lU3RyaW5nJzpcbiAgICAgIHJlc3VsdC5wYXRocyA9IFtnZW9qc29uLmNvb3JkaW5hdGVzLnNsaWNlKDApXTtcbiAgICAgIHJlc3VsdC5zcGF0aWFsUmVmZXJlbmNlID0gc3BhdGlhbFJlZmVyZW5jZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ011bHRpTGluZVN0cmluZyc6XG4gICAgICByZXN1bHQucGF0aHMgPSBnZW9qc29uLmNvb3JkaW5hdGVzLnNsaWNlKDApO1xuICAgICAgcmVzdWx0LnNwYXRpYWxSZWZlcmVuY2UgPSBzcGF0aWFsUmVmZXJlbmNlO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnUG9seWdvbic6XG4gICAgICByZXN1bHQucmluZ3MgPSBvcmllbnRSaW5ncyhnZW9qc29uLmNvb3JkaW5hdGVzLnNsaWNlKDApKTtcbiAgICAgIHJlc3VsdC5zcGF0aWFsUmVmZXJlbmNlID0gc3BhdGlhbFJlZmVyZW5jZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ011bHRpUG9seWdvbic6XG4gICAgICByZXN1bHQucmluZ3MgPSBmbGF0dGVuTXVsdGlQb2x5Z29uUmluZ3MoZ2VvanNvbi5jb29yZGluYXRlcy5zbGljZSgwKSk7XG4gICAgICByZXN1bHQuc3BhdGlhbFJlZmVyZW5jZSA9IHNwYXRpYWxSZWZlcmVuY2U7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdGZWF0dXJlJzpcbiAgICAgIGlmIChnZW9qc29uLmdlb21ldHJ5KSB7XG4gICAgICAgIHJlc3VsdC5nZW9tZXRyeSA9IGdlb2pzb25Ub0FyY0dJUyhnZW9qc29uLmdlb21ldHJ5LCBpZEF0dHJpYnV0ZSk7XG4gICAgICB9XG4gICAgICByZXN1bHQuYXR0cmlidXRlcyA9IChnZW9qc29uLnByb3BlcnRpZXMpID8gc2hhbGxvd0Nsb25lKGdlb2pzb24ucHJvcGVydGllcykgOiB7fTtcbiAgICAgIGlmIChnZW9qc29uLmlkKSB7XG4gICAgICAgIHJlc3VsdC5hdHRyaWJ1dGVzW2lkQXR0cmlidXRlXSA9IGdlb2pzb24uaWQ7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdGZWF0dXJlQ29sbGVjdGlvbic6XG4gICAgICByZXN1bHQgPSBbXTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBnZW9qc29uLmZlYXR1cmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGdlb2pzb25Ub0FyY0dJUyhnZW9qc29uLmZlYXR1cmVzW2ldLCBpZEF0dHJpYnV0ZSkpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnR2VvbWV0cnlDb2xsZWN0aW9uJzpcbiAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGdlb2pzb24uZ2VvbWV0cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZXN1bHQucHVzaChnZW9qc29uVG9BcmNHSVMoZ2VvanNvbi5nZW9tZXRyaWVzW2ldLCBpZEF0dHJpYnV0ZSkpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZGVmYXVsdCB7IGFyY2dpc1RvR2VvSlNPTiwgZ2VvanNvblRvQXJjR0lTIH07XG4iLCJpbXBvcnQgeyBsYXRMbmcsIGxhdExuZ0JvdW5kcywgTGF0TG5nLCBMYXRMbmdCb3VuZHMsIFV0aWwsIERvbVV0aWwsIEdlb0pTT04gfSBmcm9tICdsZWFmbGV0JztcclxuaW1wb3J0IHsganNvbnAgfSBmcm9tICcuL1JlcXVlc3QnO1xyXG5pbXBvcnQgeyBvcHRpb25zIH0gZnJvbSAnLi9PcHRpb25zJztcclxuXHJcbmltcG9ydCB7XHJcbiAgZ2VvanNvblRvQXJjR0lTIGFzIGcyYSxcclxuICBhcmNnaXNUb0dlb0pTT04gYXMgYTJnXHJcbn0gZnJvbSAnYXJjZ2lzLXRvLWdlb2pzb24tdXRpbHMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlb2pzb25Ub0FyY0dJUyAoZ2VvanNvbiwgaWRBdHRyKSB7XHJcbiAgcmV0dXJuIGcyYShnZW9qc29uLCBpZEF0dHIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXJjZ2lzVG9HZW9KU09OIChhcmNnaXMsIGlkQXR0cikge1xyXG4gIHJldHVybiBhMmcoYXJjZ2lzLCBpZEF0dHIpO1xyXG59XHJcblxyXG4vLyBzaGFsbG93IG9iamVjdCBjbG9uZSBmb3IgZmVhdHVyZSBwcm9wZXJ0aWVzIGFuZCBhdHRyaWJ1dGVzXHJcbi8vIGZyb20gaHR0cDovL2pzcGVyZi5jb20vY2xvbmluZy1hbi1vYmplY3QvMlxyXG5leHBvcnQgZnVuY3Rpb24gc2hhbGxvd0Nsb25lIChvYmopIHtcclxuICB2YXIgdGFyZ2V0ID0ge307XHJcbiAgZm9yICh2YXIgaSBpbiBvYmopIHtcclxuICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaSkpIHtcclxuICAgICAgdGFyZ2V0W2ldID0gb2JqW2ldO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gdGFyZ2V0O1xyXG59XHJcblxyXG4vLyBjb252ZXJ0IGFuIGV4dGVudCAoQXJjR0lTKSB0byBMYXRMbmdCb3VuZHMgKExlYWZsZXQpXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRlbnRUb0JvdW5kcyAoZXh0ZW50KSB7XHJcbiAgLy8gXCJOYU5cIiBjb29yZGluYXRlcyBmcm9tIEFyY0dJUyBTZXJ2ZXIgaW5kaWNhdGUgYSBudWxsIGdlb21ldHJ5XHJcbiAgaWYgKGV4dGVudC54bWluICE9PSAnTmFOJyAmJiBleHRlbnQueW1pbiAhPT0gJ05hTicgJiYgZXh0ZW50LnhtYXggIT09ICdOYU4nICYmIGV4dGVudC55bWF4ICE9PSAnTmFOJykge1xyXG4gICAgdmFyIHN3ID0gbGF0TG5nKGV4dGVudC55bWluLCBleHRlbnQueG1pbik7XHJcbiAgICB2YXIgbmUgPSBsYXRMbmcoZXh0ZW50LnltYXgsIGV4dGVudC54bWF4KTtcclxuICAgIHJldHVybiBsYXRMbmdCb3VuZHMoc3csIG5lKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBjb252ZXJ0IGFuIExhdExuZ0JvdW5kcyAoTGVhZmxldCkgdG8gZXh0ZW50IChBcmNHSVMpXHJcbmV4cG9ydCBmdW5jdGlvbiBib3VuZHNUb0V4dGVudCAoYm91bmRzKSB7XHJcbiAgYm91bmRzID0gbGF0TG5nQm91bmRzKGJvdW5kcyk7XHJcbiAgcmV0dXJuIHtcclxuICAgICd4bWluJzogYm91bmRzLmdldFNvdXRoV2VzdCgpLmxuZyxcclxuICAgICd5bWluJzogYm91bmRzLmdldFNvdXRoV2VzdCgpLmxhdCxcclxuICAgICd4bWF4JzogYm91bmRzLmdldE5vcnRoRWFzdCgpLmxuZyxcclxuICAgICd5bWF4JzogYm91bmRzLmdldE5vcnRoRWFzdCgpLmxhdCxcclxuICAgICdzcGF0aWFsUmVmZXJlbmNlJzoge1xyXG4gICAgICAnd2tpZCc6IDQzMjZcclxuICAgIH1cclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVzcG9uc2VUb0ZlYXR1cmVDb2xsZWN0aW9uIChyZXNwb25zZSwgaWRBdHRyaWJ1dGUpIHtcclxuICB2YXIgb2JqZWN0SWRGaWVsZDtcclxuICB2YXIgZmVhdHVyZXMgPSByZXNwb25zZS5mZWF0dXJlcyB8fCByZXNwb25zZS5yZXN1bHRzO1xyXG4gIHZhciBjb3VudCA9IGZlYXR1cmVzLmxlbmd0aDtcclxuXHJcbiAgaWYgKGlkQXR0cmlidXRlKSB7XHJcbiAgICBvYmplY3RJZEZpZWxkID0gaWRBdHRyaWJ1dGU7XHJcbiAgfSBlbHNlIGlmIChyZXNwb25zZS5vYmplY3RJZEZpZWxkTmFtZSkge1xyXG4gICAgb2JqZWN0SWRGaWVsZCA9IHJlc3BvbnNlLm9iamVjdElkRmllbGROYW1lO1xyXG4gIH0gZWxzZSBpZiAocmVzcG9uc2UuZmllbGRzKSB7XHJcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8PSByZXNwb25zZS5maWVsZHMubGVuZ3RoIC0gMTsgaisrKSB7XHJcbiAgICAgIGlmIChyZXNwb25zZS5maWVsZHNbal0udHlwZSA9PT0gJ2VzcmlGaWVsZFR5cGVPSUQnKSB7XHJcbiAgICAgICAgb2JqZWN0SWRGaWVsZCA9IHJlc3BvbnNlLmZpZWxkc1tqXS5uYW1lO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmIChjb3VudCkge1xyXG4gICAgLyogYXMgYSBsYXN0IHJlc29ydCwgY2hlY2sgZm9yIGNvbW1vbiBJRCBmaWVsZG5hbWVzIGluIHRoZSBmaXJzdCBmZWF0dXJlIHJldHVybmVkXHJcbiAgICBub3QgZm9vbHByb29mLiBpZGVudGlmeUZlYXR1cmVzIGNhbiByZXR1cm5lZCBhIG1peGVkIGFycmF5IG9mIGZlYXR1cmVzLiAqL1xyXG4gICAgZm9yICh2YXIga2V5IGluIGZlYXR1cmVzWzBdLmF0dHJpYnV0ZXMpIHtcclxuICAgICAgaWYgKGtleS5tYXRjaCgvXihPQkpFQ1RJRHxGSUR8T0lEfElEKSQvaSkpIHtcclxuICAgICAgICBvYmplY3RJZEZpZWxkID0ga2V5O1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgZmVhdHVyZUNvbGxlY3Rpb24gPSB7XHJcbiAgICB0eXBlOiAnRmVhdHVyZUNvbGxlY3Rpb24nLFxyXG4gICAgZmVhdHVyZXM6IFtdXHJcbiAgfTtcclxuXHJcbiAgaWYgKGNvdW50KSB7XHJcbiAgICBmb3IgKHZhciBpID0gZmVhdHVyZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgdmFyIGZlYXR1cmUgPSBhcmNnaXNUb0dlb0pTT04oZmVhdHVyZXNbaV0sIG9iamVjdElkRmllbGQpO1xyXG4gICAgICBmZWF0dXJlQ29sbGVjdGlvbi5mZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGZlYXR1cmVDb2xsZWN0aW9uO1xyXG59XHJcblxyXG4gIC8vIHRyaW0gdXJsIHdoaXRlc3BhY2UgYW5kIGFkZCBhIHRyYWlsaW5nIHNsYXNoIGlmIG5lZWRlZFxyXG5leHBvcnQgZnVuY3Rpb24gY2xlYW5VcmwgKHVybCkge1xyXG4gIC8vIHRyaW0gbGVhZGluZyBhbmQgdHJhaWxpbmcgc3BhY2VzLCBidXQgbm90IHNwYWNlcyBpbnNpZGUgdGhlIHVybFxyXG4gIHVybCA9IFV0aWwudHJpbSh1cmwpO1xyXG5cclxuICAvLyBhZGQgYSB0cmFpbGluZyBzbGFzaCB0byB0aGUgdXJsIGlmIHRoZSB1c2VyIG9taXR0ZWQgaXRcclxuICBpZiAodXJsW3VybC5sZW5ndGggLSAxXSAhPT0gJy8nKSB7XHJcbiAgICB1cmwgKz0gJy8nO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHVybDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQXJjZ2lzT25saW5lICh1cmwpIHtcclxuICAvKiBob3N0ZWQgZmVhdHVyZSBzZXJ2aWNlcyBzdXBwb3J0IGdlb2pzb24gYXMgYW4gb3V0cHV0IGZvcm1hdFxyXG4gIHV0aWxpdHkuYXJjZ2lzLmNvbSBzZXJ2aWNlcyBhcmUgcHJveGllZCBmcm9tIGEgdmFyaWV0eSBvZiBBcmNHSVMgU2VydmVyIHZpbnRhZ2VzLCBhbmQgbWF5IG5vdCAqL1xyXG4gIHJldHVybiAoL14oPyEuKnV0aWxpdHlcXC5hcmNnaXNcXC5jb20pLipcXC5hcmNnaXNcXC5jb20uKkZlYXR1cmVTZXJ2ZXIvaSkudGVzdCh1cmwpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VvanNvblR5cGVUb0FyY0dJUyAoZ2VvSnNvblR5cGUpIHtcclxuICB2YXIgYXJjZ2lzR2VvbWV0cnlUeXBlO1xyXG4gIHN3aXRjaCAoZ2VvSnNvblR5cGUpIHtcclxuICAgIGNhc2UgJ1BvaW50JzpcclxuICAgICAgYXJjZ2lzR2VvbWV0cnlUeXBlID0gJ2VzcmlHZW9tZXRyeVBvaW50JztcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdNdWx0aVBvaW50JzpcclxuICAgICAgYXJjZ2lzR2VvbWV0cnlUeXBlID0gJ2VzcmlHZW9tZXRyeU11bHRpcG9pbnQnO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ0xpbmVTdHJpbmcnOlxyXG4gICAgICBhcmNnaXNHZW9tZXRyeVR5cGUgPSAnZXNyaUdlb21ldHJ5UG9seWxpbmUnO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ011bHRpTGluZVN0cmluZyc6XHJcbiAgICAgIGFyY2dpc0dlb21ldHJ5VHlwZSA9ICdlc3JpR2VvbWV0cnlQb2x5bGluZSc7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAnUG9seWdvbic6XHJcbiAgICAgIGFyY2dpc0dlb21ldHJ5VHlwZSA9ICdlc3JpR2VvbWV0cnlQb2x5Z29uJztcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdNdWx0aVBvbHlnb24nOlxyXG4gICAgICBhcmNnaXNHZW9tZXRyeVR5cGUgPSAnZXNyaUdlb21ldHJ5UG9seWdvbic7XHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGFyY2dpc0dlb21ldHJ5VHlwZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHdhcm4gKCkge1xyXG4gIGlmIChjb25zb2xlICYmIGNvbnNvbGUud2Fybikge1xyXG4gICAgY29uc29sZS53YXJuLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2FsY0F0dHJpYnV0aW9uV2lkdGggKG1hcCkge1xyXG4gIC8vIGVpdGhlciBjcm9wIGF0IDU1cHggb3IgdXNlciBkZWZpbmVkIGJ1ZmZlclxyXG4gIHJldHVybiAobWFwLmdldFNpemUoKS54IC0gb3B0aW9ucy5hdHRyaWJ1dGlvbldpZHRoT2Zmc2V0KSArICdweCc7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRFc3JpQXR0cmlidXRpb24gKG1hcCkge1xyXG4gIGlmIChtYXAuYXR0cmlidXRpb25Db250cm9sICYmICFtYXAuYXR0cmlidXRpb25Db250cm9sLl9lc3JpQXR0cmlidXRpb25BZGRlZCkge1xyXG4gICAgbWFwLmF0dHJpYnV0aW9uQ29udHJvbC5zZXRQcmVmaXgoJzxhIGhyZWY9XCJodHRwOi8vbGVhZmxldGpzLmNvbVwiIHRpdGxlPVwiQSBKUyBsaWJyYXJ5IGZvciBpbnRlcmFjdGl2ZSBtYXBzXCI+TGVhZmxldDwvYT4gfCBQb3dlcmVkIGJ5IDxhIGhyZWY9XCJodHRwczovL3d3dy5lc3JpLmNvbVwiPkVzcmk8L2E+Jyk7XHJcblxyXG4gICAgdmFyIGhvdmVyQXR0cmlidXRpb25TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICBob3ZlckF0dHJpYnV0aW9uU3R5bGUudHlwZSA9ICd0ZXh0L2Nzcyc7XHJcbiAgICBob3ZlckF0dHJpYnV0aW9uU3R5bGUuaW5uZXJIVE1MID0gJy5lc3JpLXRydW5jYXRlZC1hdHRyaWJ1dGlvbjpob3ZlciB7JyArXHJcbiAgICAgICd3aGl0ZS1zcGFjZTogbm9ybWFsOycgK1xyXG4gICAgJ30nO1xyXG5cclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoaG92ZXJBdHRyaWJ1dGlvblN0eWxlKTtcclxuICAgIERvbVV0aWwuYWRkQ2xhc3MobWFwLmF0dHJpYnV0aW9uQ29udHJvbC5fY29udGFpbmVyLCAnZXNyaS10cnVuY2F0ZWQtYXR0cmlidXRpb246aG92ZXInKTtcclxuXHJcbiAgICAvLyBkZWZpbmUgYSBuZXcgY3NzIGNsYXNzIGluIEpTIHRvIHRyaW0gYXR0cmlidXRpb24gaW50byBhIHNpbmdsZSBsaW5lXHJcbiAgICB2YXIgYXR0cmlidXRpb25TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICBhdHRyaWJ1dGlvblN0eWxlLnR5cGUgPSAndGV4dC9jc3MnO1xyXG4gICAgYXR0cmlidXRpb25TdHlsZS5pbm5lckhUTUwgPSAnLmVzcmktdHJ1bmNhdGVkLWF0dHJpYnV0aW9uIHsnICtcclxuICAgICAgJ3ZlcnRpY2FsLWFsaWduOiAtM3B4OycgK1xyXG4gICAgICAnd2hpdGUtc3BhY2U6IG5vd3JhcDsnICtcclxuICAgICAgJ292ZXJmbG93OiBoaWRkZW47JyArXHJcbiAgICAgICd0ZXh0LW92ZXJmbG93OiBlbGxpcHNpczsnICtcclxuICAgICAgJ2Rpc3BsYXk6IGlubGluZS1ibG9jazsnICtcclxuICAgICAgJ3RyYW5zaXRpb246IDBzIHdoaXRlLXNwYWNlOycgK1xyXG4gICAgICAndHJhbnNpdGlvbi1kZWxheTogMXM7JyArXHJcbiAgICAgICdtYXgtd2lkdGg6ICcgKyBjYWxjQXR0cmlidXRpb25XaWR0aChtYXApICsgJzsnICtcclxuICAgICd9JztcclxuXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGF0dHJpYnV0aW9uU3R5bGUpO1xyXG4gICAgRG9tVXRpbC5hZGRDbGFzcyhtYXAuYXR0cmlidXRpb25Db250cm9sLl9jb250YWluZXIsICdlc3JpLXRydW5jYXRlZC1hdHRyaWJ1dGlvbicpO1xyXG5cclxuICAgIC8vIHVwZGF0ZSB0aGUgd2lkdGggdXNlZCB0byB0cnVuY2F0ZSB3aGVuIHRoZSBtYXAgaXRzZWxmIGlzIHJlc2l6ZWRcclxuICAgIG1hcC5vbigncmVzaXplJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgbWFwLmF0dHJpYnV0aW9uQ29udHJvbC5fY29udGFpbmVyLnN0eWxlLm1heFdpZHRoID0gY2FsY0F0dHJpYnV0aW9uV2lkdGgoZS50YXJnZXQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgbWFwLmF0dHJpYnV0aW9uQ29udHJvbC5fZXNyaUF0dHJpYnV0aW9uQWRkZWQgPSB0cnVlO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9zZXRHZW9tZXRyeSAoZ2VvbWV0cnkpIHtcclxuICB2YXIgcGFyYW1zID0ge1xyXG4gICAgZ2VvbWV0cnk6IG51bGwsXHJcbiAgICBnZW9tZXRyeVR5cGU6IG51bGxcclxuICB9O1xyXG5cclxuICAvLyBjb252ZXJ0IGJvdW5kcyB0byBleHRlbnQgYW5kIGZpbmlzaFxyXG4gIGlmIChnZW9tZXRyeSBpbnN0YW5jZW9mIExhdExuZ0JvdW5kcykge1xyXG4gICAgLy8gc2V0IGdlb21ldHJ5ICsgZ2VvbWV0cnlUeXBlXHJcbiAgICBwYXJhbXMuZ2VvbWV0cnkgPSBib3VuZHNUb0V4dGVudChnZW9tZXRyeSk7XHJcbiAgICBwYXJhbXMuZ2VvbWV0cnlUeXBlID0gJ2VzcmlHZW9tZXRyeUVudmVsb3BlJztcclxuICAgIHJldHVybiBwYXJhbXM7XHJcbiAgfVxyXG5cclxuICAvLyBjb252ZXJ0IEwuTWFya2VyID4gTC5MYXRMbmdcclxuICBpZiAoZ2VvbWV0cnkuZ2V0TGF0TG5nKSB7XHJcbiAgICBnZW9tZXRyeSA9IGdlb21ldHJ5LmdldExhdExuZygpO1xyXG4gIH1cclxuXHJcbiAgLy8gY29udmVydCBMLkxhdExuZyB0byBhIGdlb2pzb24gcG9pbnQgYW5kIGNvbnRpbnVlO1xyXG4gIGlmIChnZW9tZXRyeSBpbnN0YW5jZW9mIExhdExuZykge1xyXG4gICAgZ2VvbWV0cnkgPSB7XHJcbiAgICAgIHR5cGU6ICdQb2ludCcsXHJcbiAgICAgIGNvb3JkaW5hdGVzOiBbZ2VvbWV0cnkubG5nLCBnZW9tZXRyeS5sYXRdXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gaGFuZGxlIEwuR2VvSlNPTiwgcHVsbCBvdXQgdGhlIGZpcnN0IGdlb21ldHJ5XHJcbiAgaWYgKGdlb21ldHJ5IGluc3RhbmNlb2YgR2VvSlNPTikge1xyXG4gICAgLy8gcmVhc3NpZ24gZ2VvbWV0cnkgdG8gdGhlIEdlb0pTT04gdmFsdWUgICh3ZSBhcmUgYXNzdW1pbmcgdGhhdCBvbmx5IG9uZSBmZWF0dXJlIGlzIHByZXNlbnQpXHJcbiAgICBnZW9tZXRyeSA9IGdlb21ldHJ5LmdldExheWVycygpWzBdLmZlYXR1cmUuZ2VvbWV0cnk7XHJcbiAgICBwYXJhbXMuZ2VvbWV0cnkgPSBnZW9qc29uVG9BcmNHSVMoZ2VvbWV0cnkpO1xyXG4gICAgcGFyYW1zLmdlb21ldHJ5VHlwZSA9IGdlb2pzb25UeXBlVG9BcmNHSVMoZ2VvbWV0cnkudHlwZSk7XHJcbiAgfVxyXG5cclxuICAvLyBIYW5kbGUgTC5Qb2x5bGluZSBhbmQgTC5Qb2x5Z29uXHJcbiAgaWYgKGdlb21ldHJ5LnRvR2VvSlNPTikge1xyXG4gICAgZ2VvbWV0cnkgPSBnZW9tZXRyeS50b0dlb0pTT04oKTtcclxuICB9XHJcblxyXG4gIC8vIGhhbmRsZSBHZW9KU09OIGZlYXR1cmUgYnkgcHVsbGluZyBvdXQgdGhlIGdlb21ldHJ5XHJcbiAgaWYgKGdlb21ldHJ5LnR5cGUgPT09ICdGZWF0dXJlJykge1xyXG4gICAgLy8gZ2V0IHRoZSBnZW9tZXRyeSBvZiB0aGUgZ2VvanNvbiBmZWF0dXJlXHJcbiAgICBnZW9tZXRyeSA9IGdlb21ldHJ5Lmdlb21ldHJ5O1xyXG4gIH1cclxuXHJcbiAgLy8gY29uZmlybSB0aGF0IG91ciBHZW9KU09OIGlzIGEgcG9pbnQsIGxpbmUgb3IgcG9seWdvblxyXG4gIGlmIChnZW9tZXRyeS50eXBlID09PSAnUG9pbnQnIHx8IGdlb21ldHJ5LnR5cGUgPT09ICdMaW5lU3RyaW5nJyB8fCBnZW9tZXRyeS50eXBlID09PSAnUG9seWdvbicgfHwgZ2VvbWV0cnkudHlwZSA9PT0gJ011bHRpUG9seWdvbicpIHtcclxuICAgIHBhcmFtcy5nZW9tZXRyeSA9IGdlb2pzb25Ub0FyY0dJUyhnZW9tZXRyeSk7XHJcbiAgICBwYXJhbXMuZ2VvbWV0cnlUeXBlID0gZ2VvanNvblR5cGVUb0FyY0dJUyhnZW9tZXRyeS50eXBlKTtcclxuICAgIHJldHVybiBwYXJhbXM7XHJcbiAgfVxyXG5cclxuICAvLyB3YXJuIHRoZSB1c2VyIGlmIHdlIGhhdm4ndCBmb3VuZCBhbiBhcHByb3ByaWF0ZSBvYmplY3RcclxuICB3YXJuKCdpbnZhbGlkIGdlb21ldHJ5IHBhc3NlZCB0byBzcGF0aWFsIHF1ZXJ5LiBTaG91bGQgYmUgTC5MYXRMbmcsIEwuTGF0TG5nQm91bmRzLCBMLk1hcmtlciBvciBhIEdlb0pTT04gUG9pbnQsIExpbmUsIFBvbHlnb24gb3IgTXVsdGlQb2x5Z29uIG9iamVjdCcpO1xyXG5cclxuICByZXR1cm47XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfZ2V0QXR0cmlidXRpb25EYXRhICh1cmwsIG1hcCkge1xyXG4gIGpzb25wKHVybCwge30sIFV0aWwuYmluZChmdW5jdGlvbiAoZXJyb3IsIGF0dHJpYnV0aW9ucykge1xyXG4gICAgaWYgKGVycm9yKSB7IHJldHVybjsgfVxyXG4gICAgbWFwLl9lc3JpQXR0cmlidXRpb25zID0gW107XHJcbiAgICBmb3IgKHZhciBjID0gMDsgYyA8IGF0dHJpYnV0aW9ucy5jb250cmlidXRvcnMubGVuZ3RoOyBjKyspIHtcclxuICAgICAgdmFyIGNvbnRyaWJ1dG9yID0gYXR0cmlidXRpb25zLmNvbnRyaWJ1dG9yc1tjXTtcclxuXHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udHJpYnV0b3IuY292ZXJhZ2VBcmVhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBjb3ZlcmFnZUFyZWEgPSBjb250cmlidXRvci5jb3ZlcmFnZUFyZWFzW2ldO1xyXG4gICAgICAgIHZhciBzb3V0aFdlc3QgPSBsYXRMbmcoY292ZXJhZ2VBcmVhLmJib3hbMF0sIGNvdmVyYWdlQXJlYS5iYm94WzFdKTtcclxuICAgICAgICB2YXIgbm9ydGhFYXN0ID0gbGF0TG5nKGNvdmVyYWdlQXJlYS5iYm94WzJdLCBjb3ZlcmFnZUFyZWEuYmJveFszXSk7XHJcbiAgICAgICAgbWFwLl9lc3JpQXR0cmlidXRpb25zLnB1c2goe1xyXG4gICAgICAgICAgYXR0cmlidXRpb246IGNvbnRyaWJ1dG9yLmF0dHJpYnV0aW9uLFxyXG4gICAgICAgICAgc2NvcmU6IGNvdmVyYWdlQXJlYS5zY29yZSxcclxuICAgICAgICAgIGJvdW5kczogbGF0TG5nQm91bmRzKHNvdXRoV2VzdCwgbm9ydGhFYXN0KSxcclxuICAgICAgICAgIG1pblpvb206IGNvdmVyYWdlQXJlYS56b29tTWluLFxyXG4gICAgICAgICAgbWF4Wm9vbTogY292ZXJhZ2VBcmVhLnpvb21NYXhcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1hcC5fZXNyaUF0dHJpYnV0aW9ucy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgIHJldHVybiBiLnNjb3JlIC0gYS5zY29yZTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIHBhc3MgdGhlIHNhbWUgYXJndW1lbnQgYXMgdGhlIG1hcCdzICdtb3ZlZW5kJyBldmVudFxyXG4gICAgdmFyIG9iaiA9IHsgdGFyZ2V0OiBtYXAgfTtcclxuICAgIF91cGRhdGVNYXBBdHRyaWJ1dGlvbihvYmopO1xyXG4gIH0sIHRoaXMpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF91cGRhdGVNYXBBdHRyaWJ1dGlvbiAoZXZ0KSB7XHJcbiAgdmFyIG1hcCA9IGV2dC50YXJnZXQ7XHJcbiAgdmFyIG9sZEF0dHJpYnV0aW9ucyA9IG1hcC5fZXNyaUF0dHJpYnV0aW9ucztcclxuXHJcbiAgaWYgKG1hcCAmJiBtYXAuYXR0cmlidXRpb25Db250cm9sICYmIG9sZEF0dHJpYnV0aW9ucykge1xyXG4gICAgdmFyIG5ld0F0dHJpYnV0aW9ucyA9ICcnO1xyXG4gICAgdmFyIGJvdW5kcyA9IG1hcC5nZXRCb3VuZHMoKTtcclxuICAgIHZhciB3cmFwcGVkQm91bmRzID0gbGF0TG5nQm91bmRzKFxyXG4gICAgICBib3VuZHMuZ2V0U291dGhXZXN0KCkud3JhcCgpLFxyXG4gICAgICBib3VuZHMuZ2V0Tm9ydGhFYXN0KCkud3JhcCgpXHJcbiAgICApO1xyXG4gICAgdmFyIHpvb20gPSBtYXAuZ2V0Wm9vbSgpO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2xkQXR0cmlidXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBhdHRyaWJ1dGlvbiA9IG9sZEF0dHJpYnV0aW9uc1tpXTtcclxuICAgICAgdmFyIHRleHQgPSBhdHRyaWJ1dGlvbi5hdHRyaWJ1dGlvbjtcclxuXHJcbiAgICAgIGlmICghbmV3QXR0cmlidXRpb25zLm1hdGNoKHRleHQpICYmIGF0dHJpYnV0aW9uLmJvdW5kcy5pbnRlcnNlY3RzKHdyYXBwZWRCb3VuZHMpICYmIHpvb20gPj0gYXR0cmlidXRpb24ubWluWm9vbSAmJiB6b29tIDw9IGF0dHJpYnV0aW9uLm1heFpvb20pIHtcclxuICAgICAgICBuZXdBdHRyaWJ1dGlvbnMgKz0gKCcsICcgKyB0ZXh0KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG5ld0F0dHJpYnV0aW9ucyA9IG5ld0F0dHJpYnV0aW9ucy5zdWJzdHIoMik7XHJcbiAgICB2YXIgYXR0cmlidXRpb25FbGVtZW50ID0gbWFwLmF0dHJpYnV0aW9uQ29udHJvbC5fY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5lc3JpLWR5bmFtaWMtYXR0cmlidXRpb24nKTtcclxuXHJcbiAgICBhdHRyaWJ1dGlvbkVsZW1lbnQuaW5uZXJIVE1MID0gbmV3QXR0cmlidXRpb25zO1xyXG4gICAgYXR0cmlidXRpb25FbGVtZW50LnN0eWxlLm1heFdpZHRoID0gY2FsY0F0dHJpYnV0aW9uV2lkdGgobWFwKTtcclxuXHJcbiAgICBtYXAuZmlyZSgnYXR0cmlidXRpb251cGRhdGVkJywge1xyXG4gICAgICBhdHRyaWJ1dGlvbjogbmV3QXR0cmlidXRpb25zXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgRXNyaVV0aWwgPSB7XHJcbiAgc2hhbGxvd0Nsb25lOiBzaGFsbG93Q2xvbmUsXHJcbiAgd2Fybjogd2FybixcclxuICBjbGVhblVybDogY2xlYW5VcmwsXHJcbiAgaXNBcmNnaXNPbmxpbmU6IGlzQXJjZ2lzT25saW5lLFxyXG4gIGdlb2pzb25UeXBlVG9BcmNHSVM6IGdlb2pzb25UeXBlVG9BcmNHSVMsXHJcbiAgcmVzcG9uc2VUb0ZlYXR1cmVDb2xsZWN0aW9uOiByZXNwb25zZVRvRmVhdHVyZUNvbGxlY3Rpb24sXHJcbiAgZ2VvanNvblRvQXJjR0lTOiBnZW9qc29uVG9BcmNHSVMsXHJcbiAgYXJjZ2lzVG9HZW9KU09OOiBhcmNnaXNUb0dlb0pTT04sXHJcbiAgYm91bmRzVG9FeHRlbnQ6IGJvdW5kc1RvRXh0ZW50LFxyXG4gIGV4dGVudFRvQm91bmRzOiBleHRlbnRUb0JvdW5kcyxcclxuICBjYWxjQXR0cmlidXRpb25XaWR0aDogY2FsY0F0dHJpYnV0aW9uV2lkdGgsXHJcbiAgc2V0RXNyaUF0dHJpYnV0aW9uOiBzZXRFc3JpQXR0cmlidXRpb24sXHJcbiAgX3NldEdlb21ldHJ5OiBfc2V0R2VvbWV0cnksXHJcbiAgX2dldEF0dHJpYnV0aW9uRGF0YTogX2dldEF0dHJpYnV0aW9uRGF0YSxcclxuICBfdXBkYXRlTWFwQXR0cmlidXRpb246IF91cGRhdGVNYXBBdHRyaWJ1dGlvblxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgRXNyaVV0aWw7XHJcbiIsImltcG9ydCB7IENsYXNzLCBVdGlsIH0gZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCB7Y29yc30gZnJvbSAnLi4vU3VwcG9ydCc7XHJcbmltcG9ydCB7Y2xlYW5Vcmx9IGZyb20gJy4uL1V0aWwnO1xyXG5pbXBvcnQgUmVxdWVzdCBmcm9tICcuLi9SZXF1ZXN0JztcclxuXHJcbmV4cG9ydCB2YXIgVGFzayA9IENsYXNzLmV4dGVuZCh7XHJcblxyXG4gIG9wdGlvbnM6IHtcclxuICAgIHByb3h5OiBmYWxzZSxcclxuICAgIHVzZUNvcnM6IGNvcnNcclxuICB9LFxyXG5cclxuICAvLyBHZW5lcmF0ZSBhIG1ldGhvZCBmb3IgZWFjaCBtZXRob2ROYW1lOnBhcmFtTmFtZSBpbiB0aGUgc2V0dGVycyBmb3IgdGhpcyB0YXNrLlxyXG4gIGdlbmVyYXRlU2V0dGVyOiBmdW5jdGlvbiAocGFyYW0sIGNvbnRleHQpIHtcclxuICAgIHJldHVybiBVdGlsLmJpbmQoZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgIHRoaXMucGFyYW1zW3BhcmFtXSA9IHZhbHVlO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sIGNvbnRleHQpO1xyXG4gIH0sXHJcblxyXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChlbmRwb2ludCkge1xyXG4gICAgY29uc29sZS5sb2coJ2luaXRpYWxpemluZyB3aXRoIGVuZHBvaW50JywgZW5kcG9pbnQpO1xyXG5cclxuICAgIC8vIGVuZHBvaW50IGNhbiBiZSBlaXRoZXIgYSB1cmwgKGFuZCBvcHRpb25zKSBmb3IgYW4gQXJjR0lTIFJlc3QgU2VydmljZSBvciBhbiBpbnN0YW5jZSBvZiBFc3JpTGVhZmxldC5TZXJ2aWNlXHJcbiAgICBpZiAoZW5kcG9pbnQucmVxdWVzdCAmJiBlbmRwb2ludC5vcHRpb25zKSB7XHJcbiAgICAgIHRoaXMuX3NlcnZpY2UgPSBlbmRwb2ludDtcclxuICAgICAgVXRpbC5zZXRPcHRpb25zKHRoaXMsIGVuZHBvaW50Lm9wdGlvbnMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgVXRpbC5zZXRPcHRpb25zKHRoaXMsIGVuZHBvaW50KTtcclxuICAgICAgdGhpcy5vcHRpb25zLnVybCA9IGNsZWFuVXJsKGVuZHBvaW50LnVybCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2xvbmUgZGVmYXVsdCBwYXJhbXMgaW50byB0aGlzIG9iamVjdFxyXG4gICAgdGhpcy5wYXJhbXMgPSBVdGlsLmV4dGVuZCh7fSwgdGhpcy5wYXJhbXMgfHwge30pO1xyXG5cclxuICAgIC8vIGdlbmVyYXRlIHNldHRlciBtZXRob2RzIGJhc2VkIG9uIHRoZSBzZXR0ZXJzIG9iamVjdCBpbXBsaW1lbnRlZCBhIGNoaWxkIGNsYXNzXHJcbiAgICBpZiAodGhpcy5zZXR0ZXJzKSB7XHJcbiAgICAgIGZvciAodmFyIHNldHRlciBpbiB0aGlzLnNldHRlcnMpIHtcclxuICAgICAgICB2YXIgcGFyYW0gPSB0aGlzLnNldHRlcnNbc2V0dGVyXTtcclxuICAgICAgICB0aGlzW3NldHRlcl0gPSB0aGlzLmdlbmVyYXRlU2V0dGVyKHBhcmFtLCB0aGlzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdpbml0aWFsaXplJywgdGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgdG9rZW46IGZ1bmN0aW9uICh0b2tlbikge1xyXG4gICAgaWYgKHRoaXMuX3NlcnZpY2UpIHtcclxuICAgICAgdGhpcy5fc2VydmljZS5hdXRoZW50aWNhdGUodG9rZW4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5wYXJhbXMudG9rZW4gPSB0b2tlbjtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIC8vIEFyY0dJUyBTZXJ2ZXIgRmluZC9JZGVudGlmeSAxMC41K1xyXG4gIGZvcm1hdDogZnVuY3Rpb24gKGJvb2xlYW4pIHtcclxuICAgIC8vIHVzZSBkb3VibGUgbmVnYXRpdmUgdG8gZXhwb3NlIGEgbW9yZSBpbnR1aXRpdmUgcG9zaXRpdmUgbWV0aG9kIG5hbWVcclxuICAgIHRoaXMucGFyYW1zLnJldHVyblVuZm9ybWF0dGVkVmFsdWVzID0gIWJvb2xlYW47XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICByZXF1ZXN0OiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIGNvbnNvbGUubG9nKCdyZXF1ZXN0IGNhbGxiYWNrJywgY2FsbGJhY2spO1xyXG4gICAgY29uc29sZS5sb2coJ3JlcXVlc3QgY29udGV4dCcsIGNhbGxiYWNrKTtcclxuICAgIGNvbnNvbGUubG9nKCdyZXF1ZXN0IHRoaXMnLCB0aGlzKTtcclxuICAgIGlmICh0aGlzLl9zZXJ2aWNlKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdoYXMgc2VydmljZScsIHRoaXMuX3NlcnZpY2UpO1xyXG4gICAgICByZXR1cm4gdGhpcy5fc2VydmljZS5yZXF1ZXN0KHRoaXMucGF0aCwgdGhpcy5wYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmxvZygnbm8gc2VydmljZScpO1xyXG4gICAgcmV0dXJuIHRoaXMuX3JlcXVlc3QoJ3JlcXVlc3QnLCB0aGlzLnBhdGgsIHRoaXMucGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCk7XHJcbiAgfSxcclxuXHJcbiAgX3JlcXVlc3Q6IGZ1bmN0aW9uIChtZXRob2QsIHBhdGgsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIGNvbnNvbGUubG9nKCd1c2luZyBpbnRlcm5hbCByZXF1ZXN0IScpO1xyXG4gICAgdmFyIHVybCA9ICh0aGlzLm9wdGlvbnMucHJveHkpID8gdGhpcy5vcHRpb25zLnByb3h5ICsgJz8nICsgdGhpcy5vcHRpb25zLnVybCArIHBhdGggOiB0aGlzLm9wdGlvbnMudXJsICsgcGF0aDtcclxuXHJcbiAgICBjb25zb2xlLmxvZygndGhpcyBpcyB0aGUgdXJsIScsIHVybCk7XHJcblxyXG4gICAgaWYgKChtZXRob2QgPT09ICdnZXQnIHx8IG1ldGhvZCA9PT0gJ3JlcXVlc3QnKSAmJiAhdGhpcy5vcHRpb25zLnVzZUNvcnMpIHtcclxuICAgICAgY29uc29sZS5sb2coJ2pzb25QIGJybycpO1xyXG4gICAgICByZXR1cm4gUmVxdWVzdC5nZXQuSlNPTlAodXJsLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmxvZygncmVxdWVzdGluZyB3aXRoOicsIG1ldGhvZCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCk7XHJcbiAgICByZXR1cm4gUmVxdWVzdFttZXRob2RdKHVybCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCk7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0YXNrIChvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBUYXNrKG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB0YXNrO1xyXG4iLCJpbXBvcnQgeyBwb2ludCwgbGF0TG5nIH0gZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCB7IFRhc2sgfSBmcm9tICcuL1Rhc2snO1xyXG5pbXBvcnQge1xyXG4gIHdhcm4sXHJcbiAgcmVzcG9uc2VUb0ZlYXR1cmVDb2xsZWN0aW9uLFxyXG4gIGlzQXJjZ2lzT25saW5lLFxyXG4gIGV4dGVudFRvQm91bmRzLFxyXG4gIF9zZXRHZW9tZXRyeVxyXG59IGZyb20gJy4uL1V0aWwnO1xyXG5cclxuZXhwb3J0IHZhciBRdWVyeSA9IFRhc2suZXh0ZW5kKHtcclxuICBzZXR0ZXJzOiB7XHJcbiAgICAnb2Zmc2V0JzogJ3Jlc3VsdE9mZnNldCcsXHJcbiAgICAnbGltaXQnOiAncmVzdWx0UmVjb3JkQ291bnQnLFxyXG4gICAgJ2ZpZWxkcyc6ICdvdXRGaWVsZHMnLFxyXG4gICAgJ3ByZWNpc2lvbic6ICdnZW9tZXRyeVByZWNpc2lvbicsXHJcbiAgICAnZmVhdHVyZUlkcyc6ICdvYmplY3RJZHMnLFxyXG4gICAgJ3JldHVybkdlb21ldHJ5JzogJ3JldHVybkdlb21ldHJ5JyxcclxuICAgICdyZXR1cm5NJzogJ3JldHVybk0nLFxyXG4gICAgJ3RyYW5zZm9ybSc6ICdkYXR1bVRyYW5zZm9ybWF0aW9uJyxcclxuICAgICd0b2tlbic6ICd0b2tlbidcclxuICB9LFxyXG5cclxuICBwYXRoOiAncXVlcnknLFxyXG5cclxuICBwYXJhbXM6IHtcclxuICAgIHJldHVybkdlb21ldHJ5OiB0cnVlLFxyXG4gICAgd2hlcmU6ICcxPTEnLFxyXG4gICAgb3V0U3I6IDQzMjYsXHJcbiAgICBvdXRGaWVsZHM6ICcqJ1xyXG4gIH0sXHJcblxyXG4gIC8vIFJldHVybnMgYSBmZWF0dXJlIGlmIGl0cyBzaGFwZSBpcyB3aG9sbHkgY29udGFpbmVkIHdpdGhpbiB0aGUgc2VhcmNoIGdlb21ldHJ5LiBWYWxpZCBmb3IgYWxsIHNoYXBlIHR5cGUgY29tYmluYXRpb25zLlxyXG4gIHdpdGhpbjogZnVuY3Rpb24gKGdlb21ldHJ5KSB7XHJcbiAgICB0aGlzLl9zZXRHZW9tZXRyeVBhcmFtcyhnZW9tZXRyeSk7XHJcbiAgICB0aGlzLnBhcmFtcy5zcGF0aWFsUmVsID0gJ2VzcmlTcGF0aWFsUmVsQ29udGFpbnMnOyAvLyB0byB0aGUgUkVTVCBhcGkgdGhpcyByZWFkcyBnZW9tZXRyeSAqKmNvbnRhaW5zKiogbGF5ZXJcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIC8vIFJldHVybnMgYSBmZWF0dXJlIGlmIGFueSBzcGF0aWFsIHJlbGF0aW9uc2hpcCBpcyBmb3VuZC4gQXBwbGllcyB0byBhbGwgc2hhcGUgdHlwZSBjb21iaW5hdGlvbnMuXHJcbiAgaW50ZXJzZWN0czogZnVuY3Rpb24gKGdlb21ldHJ5KSB7XHJcbiAgICB0aGlzLl9zZXRHZW9tZXRyeVBhcmFtcyhnZW9tZXRyeSk7XHJcbiAgICB0aGlzLnBhcmFtcy5zcGF0aWFsUmVsID0gJ2VzcmlTcGF0aWFsUmVsSW50ZXJzZWN0cyc7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICAvLyBSZXR1cm5zIGEgZmVhdHVyZSBpZiBpdHMgc2hhcGUgd2hvbGx5IGNvbnRhaW5zIHRoZSBzZWFyY2ggZ2VvbWV0cnkuIFZhbGlkIGZvciBhbGwgc2hhcGUgdHlwZSBjb21iaW5hdGlvbnMuXHJcbiAgY29udGFpbnM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xyXG4gICAgdGhpcy5fc2V0R2VvbWV0cnlQYXJhbXMoZ2VvbWV0cnkpO1xyXG4gICAgdGhpcy5wYXJhbXMuc3BhdGlhbFJlbCA9ICdlc3JpU3BhdGlhbFJlbFdpdGhpbic7IC8vIHRvIHRoZSBSRVNUIGFwaSB0aGlzIHJlYWRzIGdlb21ldHJ5ICoqd2l0aGluKiogbGF5ZXJcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIC8vIFJldHVybnMgYSBmZWF0dXJlIGlmIHRoZSBpbnRlcnNlY3Rpb24gb2YgdGhlIGludGVyaW9ycyBvZiB0aGUgdHdvIHNoYXBlcyBpcyBub3QgZW1wdHkgYW5kIGhhcyBhIGxvd2VyIGRpbWVuc2lvbiB0aGFuIHRoZSBtYXhpbXVtIGRpbWVuc2lvbiBvZiB0aGUgdHdvIHNoYXBlcy4gVHdvIGxpbmVzIHRoYXQgc2hhcmUgYW4gZW5kcG9pbnQgaW4gY29tbW9uIGRvIG5vdCBjcm9zcy4gVmFsaWQgZm9yIExpbmUvTGluZSwgTGluZS9BcmVhLCBNdWx0aS1wb2ludC9BcmVhLCBhbmQgTXVsdGktcG9pbnQvTGluZSBzaGFwZSB0eXBlIGNvbWJpbmF0aW9ucy5cclxuICBjcm9zc2VzOiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcclxuICAgIHRoaXMuX3NldEdlb21ldHJ5UGFyYW1zKGdlb21ldHJ5KTtcclxuICAgIHRoaXMucGFyYW1zLnNwYXRpYWxSZWwgPSAnZXNyaVNwYXRpYWxSZWxDcm9zc2VzJztcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIC8vIFJldHVybnMgYSBmZWF0dXJlIGlmIHRoZSB0d28gc2hhcGVzIHNoYXJlIGEgY29tbW9uIGJvdW5kYXJ5LiBIb3dldmVyLCB0aGUgaW50ZXJzZWN0aW9uIG9mIHRoZSBpbnRlcmlvcnMgb2YgdGhlIHR3byBzaGFwZXMgbXVzdCBiZSBlbXB0eS4gSW4gdGhlIFBvaW50L0xpbmUgY2FzZSwgdGhlIHBvaW50IG1heSB0b3VjaCBhbiBlbmRwb2ludCBvbmx5IG9mIHRoZSBsaW5lLiBBcHBsaWVzIHRvIGFsbCBjb21iaW5hdGlvbnMgZXhjZXB0IFBvaW50L1BvaW50LlxyXG4gIHRvdWNoZXM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xyXG4gICAgdGhpcy5fc2V0R2VvbWV0cnlQYXJhbXMoZ2VvbWV0cnkpO1xyXG4gICAgdGhpcy5wYXJhbXMuc3BhdGlhbFJlbCA9ICdlc3JpU3BhdGlhbFJlbFRvdWNoZXMnO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgLy8gUmV0dXJucyBhIGZlYXR1cmUgaWYgdGhlIGludGVyc2VjdGlvbiBvZiB0aGUgdHdvIHNoYXBlcyByZXN1bHRzIGluIGFuIG9iamVjdCBvZiB0aGUgc2FtZSBkaW1lbnNpb24sIGJ1dCBkaWZmZXJlbnQgZnJvbSBib3RoIG9mIHRoZSBzaGFwZXMuIEFwcGxpZXMgdG8gQXJlYS9BcmVhLCBMaW5lL0xpbmUsIGFuZCBNdWx0aS1wb2ludC9NdWx0aS1wb2ludCBzaGFwZSB0eXBlIGNvbWJpbmF0aW9ucy5cclxuICBvdmVybGFwczogZnVuY3Rpb24gKGdlb21ldHJ5KSB7XHJcbiAgICB0aGlzLl9zZXRHZW9tZXRyeVBhcmFtcyhnZW9tZXRyeSk7XHJcbiAgICB0aGlzLnBhcmFtcy5zcGF0aWFsUmVsID0gJ2VzcmlTcGF0aWFsUmVsT3ZlcmxhcHMnO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgLy8gUmV0dXJucyBhIGZlYXR1cmUgaWYgdGhlIGVudmVsb3BlIG9mIHRoZSB0d28gc2hhcGVzIGludGVyc2VjdHMuXHJcbiAgYmJveEludGVyc2VjdHM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xyXG4gICAgdGhpcy5fc2V0R2VvbWV0cnlQYXJhbXMoZ2VvbWV0cnkpO1xyXG4gICAgdGhpcy5wYXJhbXMuc3BhdGlhbFJlbCA9ICdlc3JpU3BhdGlhbFJlbEVudmVsb3BlSW50ZXJzZWN0cyc7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICAvLyBpZiBzb21lb25lIGNhbiBoZWxwIGRlY2lwaGVyIHRoZSBBcmNPYmplY3RzIGV4cGxhbmF0aW9uIGFuZCB0cmFuc2xhdGUgdG8gcGxhaW4gc3BlYWssIHdlIHNob3VsZCBtZW50aW9uIHRoaXMgbWV0aG9kIGluIHRoZSBkb2NcclxuICBpbmRleEludGVyc2VjdHM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xyXG4gICAgdGhpcy5fc2V0R2VvbWV0cnlQYXJhbXMoZ2VvbWV0cnkpO1xyXG4gICAgdGhpcy5wYXJhbXMuc3BhdGlhbFJlbCA9ICdlc3JpU3BhdGlhbFJlbEluZGV4SW50ZXJzZWN0cyc7IC8vIFJldHVybnMgYSBmZWF0dXJlIGlmIHRoZSBlbnZlbG9wZSBvZiB0aGUgcXVlcnkgZ2VvbWV0cnkgaW50ZXJzZWN0cyB0aGUgaW5kZXggZW50cnkgZm9yIHRoZSB0YXJnZXQgZ2VvbWV0cnlcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIC8vIG9ubHkgdmFsaWQgZm9yIEZlYXR1cmUgU2VydmljZXMgcnVubmluZyBvbiBBcmNHSVMgU2VydmVyIDEwLjMrIG9yIEFyY0dJUyBPbmxpbmVcclxuICBuZWFyYnk6IGZ1bmN0aW9uIChsYXRsbmcsIHJhZGl1cykge1xyXG4gICAgbGF0bG5nID0gbGF0TG5nKGxhdGxuZyk7XHJcbiAgICB0aGlzLnBhcmFtcy5nZW9tZXRyeSA9IFtsYXRsbmcubG5nLCBsYXRsbmcubGF0XTtcclxuICAgIHRoaXMucGFyYW1zLmdlb21ldHJ5VHlwZSA9ICdlc3JpR2VvbWV0cnlQb2ludCc7XHJcbiAgICB0aGlzLnBhcmFtcy5zcGF0aWFsUmVsID0gJ2VzcmlTcGF0aWFsUmVsSW50ZXJzZWN0cyc7XHJcbiAgICB0aGlzLnBhcmFtcy51bml0cyA9ICdlc3JpU1JVbml0X01ldGVyJztcclxuICAgIHRoaXMucGFyYW1zLmRpc3RhbmNlID0gcmFkaXVzO1xyXG4gICAgdGhpcy5wYXJhbXMuaW5TciA9IDQzMjY7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICB3aGVyZTogZnVuY3Rpb24gKHN0cmluZykge1xyXG4gICAgLy8gaW5zdGVhZCBvZiBjb252ZXJ0aW5nIGRvdWJsZS1xdW90ZXMgdG8gc2luZ2xlIHF1b3RlcywgcGFzcyBhcyBpcywgYW5kIHByb3ZpZGUgYSBtb3JlIGluZm9ybWF0aXZlIG1lc3NhZ2UgaWYgYSA0MDAgaXMgZW5jb3VudGVyZWRcclxuICAgIHRoaXMucGFyYW1zLndoZXJlID0gc3RyaW5nO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgYmV0d2VlbjogZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcclxuICAgIHRoaXMucGFyYW1zLnRpbWUgPSBbc3RhcnQudmFsdWVPZigpLCBlbmQudmFsdWVPZigpXTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIHNpbXBsaWZ5OiBmdW5jdGlvbiAobWFwLCBmYWN0b3IpIHtcclxuICAgIHZhciBtYXBXaWR0aCA9IE1hdGguYWJzKG1hcC5nZXRCb3VuZHMoKS5nZXRXZXN0KCkgLSBtYXAuZ2V0Qm91bmRzKCkuZ2V0RWFzdCgpKTtcclxuICAgIHRoaXMucGFyYW1zLm1heEFsbG93YWJsZU9mZnNldCA9IChtYXBXaWR0aCAvIG1hcC5nZXRTaXplKCkueSkgKiBmYWN0b3I7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBvcmRlckJ5OiBmdW5jdGlvbiAoZmllbGROYW1lLCBvcmRlcikge1xyXG4gICAgb3JkZXIgPSBvcmRlciB8fCAnQVNDJztcclxuICAgIHRoaXMucGFyYW1zLm9yZGVyQnlGaWVsZHMgPSAodGhpcy5wYXJhbXMub3JkZXJCeUZpZWxkcykgPyB0aGlzLnBhcmFtcy5vcmRlckJ5RmllbGRzICsgJywnIDogJyc7XHJcbiAgICB0aGlzLnBhcmFtcy5vcmRlckJ5RmllbGRzICs9IChbZmllbGROYW1lLCBvcmRlcl0pLmpvaW4oJyAnKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIHJ1bjogZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICBjb25zb2xlLmxvZygncnVuIHNvbWUgc3R1ZmYnKTtcclxuICAgIGNvbnNvbGUubG9nKHRoaXMpO1xyXG4gICAgY29uc29sZS5sb2codGhpcy5vcHRpb25zKTtcclxuICAgIGNvbnNvbGUubG9nKHRoaXMucGFyYW1zKTtcclxuICAgIHRoaXMuX2NsZWFuUGFyYW1zKCk7XHJcblxyXG4gICAgLy8gc2VydmljZXMgaG9zdGVkIG9uIEFyY0dJUyBPbmxpbmUgYW5kIEFyY0dJUyBTZXJ2ZXIgMTAuMy4xKyBzdXBwb3J0IHJlcXVlc3RpbmcgZ2VvanNvbiBkaXJlY3RseVxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5pc01vZGVybiB8fCBpc0FyY2dpc09ubGluZSh0aGlzLm9wdGlvbnMudXJsKSkge1xyXG4gICAgICBjb25zb2xlLmxvZygneWVzIGl0cyBtb2Rlcm4nKTtcclxuICAgICAgdGhpcy5wYXJhbXMuZiA9ICdnZW9qc29uJztcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLnJlcXVlc3QoZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdyZXF1ZXN0IGlzIGNvbXBsZXRlJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICB0aGlzLl90cmFwU1FMZXJyb3JzKGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yLCByZXNwb25zZSwgcmVzcG9uc2UpO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAvLyBvdGhlcndpc2UgY29udmVydCBpdCBpbiB0aGUgY2FsbGJhY2sgdGhlbiBwYXNzIGl0IG9uXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZygnbm8gaXRzIG5vdCBtb2Rlcm4nKTtcclxuICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdChmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ3JlcXVlc3QgaXMgY29tcGxldGUnKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgIHRoaXMuX3RyYXBTUUxlcnJvcnMoZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IsIChyZXNwb25zZSAmJiByZXNwb25zZVRvRmVhdHVyZUNvbGxlY3Rpb24ocmVzcG9uc2UpKSwgcmVzcG9uc2UpO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjb3VudDogZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICB0aGlzLl9jbGVhblBhcmFtcygpO1xyXG4gICAgdGhpcy5wYXJhbXMucmV0dXJuQ291bnRPbmx5ID0gdHJ1ZTtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXMsIGVycm9yLCAocmVzcG9uc2UgJiYgcmVzcG9uc2UuY291bnQpLCByZXNwb25zZSk7XHJcbiAgICB9LCBjb250ZXh0KTtcclxuICB9LFxyXG5cclxuICBpZHM6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5fY2xlYW5QYXJhbXMoKTtcclxuICAgIHRoaXMucGFyYW1zLnJldHVybklkc09ubHkgPSB0cnVlO1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XHJcbiAgICAgIGNhbGxiYWNrLmNhbGwodGhpcywgZXJyb3IsIChyZXNwb25zZSAmJiByZXNwb25zZS5vYmplY3RJZHMpLCByZXNwb25zZSk7XHJcbiAgICB9LCBjb250ZXh0KTtcclxuICB9LFxyXG5cclxuICAvLyBvbmx5IHZhbGlkIGZvciBGZWF0dXJlIFNlcnZpY2VzIHJ1bm5pbmcgb24gQXJjR0lTIFNlcnZlciAxMC4zKyBvciBBcmNHSVMgT25saW5lXHJcbiAgYm91bmRzOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIHRoaXMuX2NsZWFuUGFyYW1zKCk7XHJcbiAgICB0aGlzLnBhcmFtcy5yZXR1cm5FeHRlbnRPbmx5ID0gdHJ1ZTtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuZXh0ZW50ICYmIGV4dGVudFRvQm91bmRzKHJlc3BvbnNlLmV4dGVudCkpIHtcclxuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yLCBleHRlbnRUb0JvdW5kcyhyZXNwb25zZS5leHRlbnQpLCByZXNwb25zZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZXJyb3IgPSB7XHJcbiAgICAgICAgICBtZXNzYWdlOiAnSW52YWxpZCBCb3VuZHMnXHJcbiAgICAgICAgfTtcclxuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yLCBudWxsLCByZXNwb25zZSk7XHJcbiAgICAgIH1cclxuICAgIH0sIGNvbnRleHQpO1xyXG4gIH0sXHJcblxyXG4gIC8vIG9ubHkgdmFsaWQgZm9yIGltYWdlIHNlcnZpY2VzXHJcbiAgcGl4ZWxTaXplOiBmdW5jdGlvbiAocmF3UG9pbnQpIHtcclxuICAgIHZhciBjYXN0UG9pbnQgPSBwb2ludChyYXdQb2ludCk7XHJcbiAgICB0aGlzLnBhcmFtcy5waXhlbFNpemUgPSBbY2FzdFBvaW50LngsIGNhc3RQb2ludC55XTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIC8vIG9ubHkgdmFsaWQgZm9yIG1hcCBzZXJ2aWNlc1xyXG4gIGxheWVyOiBmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgIHRoaXMucGF0aCA9IGxheWVyICsgJy9xdWVyeSc7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBfdHJhcFNRTGVycm9yczogZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgaWYgKGVycm9yLmNvZGUgPT09ICc0MDAnKSB7XHJcbiAgICAgICAgd2Fybignb25lIGNvbW1vbiBzeW50YXggZXJyb3IgaW4gcXVlcnkgcmVxdWVzdHMgaXMgZW5jYXNpbmcgc3RyaW5nIHZhbHVlcyBpbiBkb3VibGUgcXVvdGVzIGluc3RlYWQgb2Ygc2luZ2xlIHF1b3RlcycpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgX2NsZWFuUGFyYW1zOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBkZWxldGUgdGhpcy5wYXJhbXMucmV0dXJuSWRzT25seTtcclxuICAgIGRlbGV0ZSB0aGlzLnBhcmFtcy5yZXR1cm5FeHRlbnRPbmx5O1xyXG4gICAgZGVsZXRlIHRoaXMucGFyYW1zLnJldHVybkNvdW50T25seTtcclxuICB9LFxyXG5cclxuICBfc2V0R2VvbWV0cnlQYXJhbXM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xyXG4gICAgdGhpcy5wYXJhbXMuaW5TciA9IDQzMjY7XHJcbiAgICB2YXIgY29udmVydGVkID0gX3NldEdlb21ldHJ5KGdlb21ldHJ5KTtcclxuICAgIHRoaXMucGFyYW1zLmdlb21ldHJ5ID0gY29udmVydGVkLmdlb21ldHJ5O1xyXG4gICAgdGhpcy5wYXJhbXMuZ2VvbWV0cnlUeXBlID0gY29udmVydGVkLmdlb21ldHJ5VHlwZTtcclxuICB9XHJcblxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBxdWVyeSAob3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgUXVlcnkob3B0aW9ucyk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHF1ZXJ5O1xyXG4iLCJpbXBvcnQgeyBUYXNrIH0gZnJvbSAnLi9UYXNrJztcclxuaW1wb3J0IHsgcmVzcG9uc2VUb0ZlYXR1cmVDb2xsZWN0aW9uIH0gZnJvbSAnLi4vVXRpbCc7XHJcblxyXG5leHBvcnQgdmFyIEZpbmQgPSBUYXNrLmV4dGVuZCh7XHJcbiAgc2V0dGVyczoge1xyXG4gICAgLy8gbWV0aG9kIG5hbWUgPiBwYXJhbSBuYW1lXHJcbiAgICAnY29udGFpbnMnOiAnY29udGFpbnMnLFxyXG4gICAgJ3RleHQnOiAnc2VhcmNoVGV4dCcsXHJcbiAgICAnZmllbGRzJzogJ3NlYXJjaEZpZWxkcycsIC8vIGRlbm90ZSBhbiBhcnJheSBvciBzaW5nbGUgc3RyaW5nXHJcbiAgICAnc3BhdGlhbFJlZmVyZW5jZSc6ICdzcicsXHJcbiAgICAnc3InOiAnc3InLFxyXG4gICAgJ2xheWVycyc6ICdsYXllcnMnLFxyXG4gICAgJ3JldHVybkdlb21ldHJ5JzogJ3JldHVybkdlb21ldHJ5JyxcclxuICAgICdtYXhBbGxvd2FibGVPZmZzZXQnOiAnbWF4QWxsb3dhYmxlT2Zmc2V0JyxcclxuICAgICdwcmVjaXNpb24nOiAnZ2VvbWV0cnlQcmVjaXNpb24nLFxyXG4gICAgJ2R5bmFtaWNMYXllcnMnOiAnZHluYW1pY0xheWVycycsXHJcbiAgICAncmV0dXJuWic6ICdyZXR1cm5aJyxcclxuICAgICdyZXR1cm5NJzogJ3JldHVybk0nLFxyXG4gICAgJ2dkYlZlcnNpb24nOiAnZ2RiVmVyc2lvbicsXHJcbiAgICAvLyBza2lwcGVkIGltcGxlbWVudGluZyB0aGlzIChmb3Igbm93KSBiZWNhdXNlIHRoZSBSRVNUIHNlcnZpY2UgaW1wbGVtZW50YXRpb24gaXNudCBjb25zaXN0ZW50IGJldHdlZW4gb3BlcmF0aW9uc1xyXG4gICAgLy8gJ3RyYW5zZm9ybSc6ICdkYXR1bVRyYW5zZm9ybWF0aW9ucycsXHJcbiAgICAndG9rZW4nOiAndG9rZW4nXHJcbiAgfSxcclxuXHJcbiAgcGF0aDogJ2ZpbmQnLFxyXG5cclxuICBwYXJhbXM6IHtcclxuICAgIHNyOiA0MzI2LFxyXG4gICAgY29udGFpbnM6IHRydWUsXHJcbiAgICByZXR1cm5HZW9tZXRyeTogdHJ1ZSxcclxuICAgIHJldHVyblo6IHRydWUsXHJcbiAgICByZXR1cm5NOiBmYWxzZVxyXG4gIH0sXHJcblxyXG4gIGxheWVyRGVmczogZnVuY3Rpb24gKGlkLCB3aGVyZSkge1xyXG4gICAgdGhpcy5wYXJhbXMubGF5ZXJEZWZzID0gKHRoaXMucGFyYW1zLmxheWVyRGVmcykgPyB0aGlzLnBhcmFtcy5sYXllckRlZnMgKyAnOycgOiAnJztcclxuICAgIHRoaXMucGFyYW1zLmxheWVyRGVmcyArPSAoW2lkLCB3aGVyZV0pLmpvaW4oJzonKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIHNpbXBsaWZ5OiBmdW5jdGlvbiAobWFwLCBmYWN0b3IpIHtcclxuICAgIHZhciBtYXBXaWR0aCA9IE1hdGguYWJzKG1hcC5nZXRCb3VuZHMoKS5nZXRXZXN0KCkgLSBtYXAuZ2V0Qm91bmRzKCkuZ2V0RWFzdCgpKTtcclxuICAgIHRoaXMucGFyYW1zLm1heEFsbG93YWJsZU9mZnNldCA9IChtYXBXaWR0aCAvIG1hcC5nZXRTaXplKCkueSkgKiBmYWN0b3I7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBydW46IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XHJcbiAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IsIChyZXNwb25zZSAmJiByZXNwb25zZVRvRmVhdHVyZUNvbGxlY3Rpb24ocmVzcG9uc2UpKSwgcmVzcG9uc2UpO1xyXG4gICAgfSwgY29udGV4dCk7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kIChvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBGaW5kKG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmaW5kO1xyXG4iLCJpbXBvcnQgeyBUYXNrIH0gZnJvbSAnLi9UYXNrJztcclxuXHJcbmV4cG9ydCB2YXIgSWRlbnRpZnkgPSBUYXNrLmV4dGVuZCh7XHJcbiAgcGF0aDogJ2lkZW50aWZ5JyxcclxuXHJcbiAgYmV0d2VlbjogZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcclxuICAgIHRoaXMucGFyYW1zLnRpbWUgPSBbc3RhcnQudmFsdWVPZigpLCBlbmQudmFsdWVPZigpXTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaWRlbnRpZnkgKG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IElkZW50aWZ5KG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpZGVudGlmeTtcclxuIiwiaW1wb3J0IHsgbGF0TG5nIH0gZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCB7IElkZW50aWZ5IH0gZnJvbSAnLi9JZGVudGlmeSc7XHJcbmltcG9ydCB7IHJlc3BvbnNlVG9GZWF0dXJlQ29sbGVjdGlvbixcclxuICBib3VuZHNUb0V4dGVudCxcclxuICBfc2V0R2VvbWV0cnlcclxufSBmcm9tICcuLi9VdGlsJztcclxuXHJcbmV4cG9ydCB2YXIgSWRlbnRpZnlGZWF0dXJlcyA9IElkZW50aWZ5LmV4dGVuZCh7XHJcbiAgc2V0dGVyczoge1xyXG4gICAgJ2xheWVycyc6ICdsYXllcnMnLFxyXG4gICAgJ3ByZWNpc2lvbic6ICdnZW9tZXRyeVByZWNpc2lvbicsXHJcbiAgICAndG9sZXJhbmNlJzogJ3RvbGVyYW5jZScsXHJcbiAgICAvLyBza2lwcGVkIGltcGxlbWVudGluZyB0aGlzIChmb3Igbm93KSBiZWNhdXNlIHRoZSBSRVNUIHNlcnZpY2UgaW1wbGVtZW50YXRpb24gaXNudCBjb25zaXN0ZW50IGJldHdlZW4gb3BlcmF0aW9ucy5cclxuICAgIC8vICd0cmFuc2Zvcm0nOiAnZGF0dW1UcmFuc2Zvcm1hdGlvbnMnXHJcbiAgICAncmV0dXJuR2VvbWV0cnknOiAncmV0dXJuR2VvbWV0cnknXHJcbiAgfSxcclxuXHJcbiAgcGFyYW1zOiB7XHJcbiAgICBzcjogNDMyNixcclxuICAgIGxheWVyczogJ2FsbCcsXHJcbiAgICB0b2xlcmFuY2U6IDMsXHJcbiAgICByZXR1cm5HZW9tZXRyeTogdHJ1ZVxyXG4gIH0sXHJcblxyXG4gIG9uOiBmdW5jdGlvbiAobWFwKSB7XHJcbiAgICB2YXIgZXh0ZW50ID0gYm91bmRzVG9FeHRlbnQobWFwLmdldEJvdW5kcygpKTtcclxuICAgIHZhciBzaXplID0gbWFwLmdldFNpemUoKTtcclxuICAgIHRoaXMucGFyYW1zLmltYWdlRGlzcGxheSA9IFtzaXplLngsIHNpemUueSwgOTZdO1xyXG4gICAgdGhpcy5wYXJhbXMubWFwRXh0ZW50ID0gW2V4dGVudC54bWluLCBleHRlbnQueW1pbiwgZXh0ZW50LnhtYXgsIGV4dGVudC55bWF4XTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGF0OiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcclxuICAgIC8vIGNhc3QgbGF0LCBsb25nIHBhaXJzIGluIHJhdyBhcnJheSBmb3JtIG1hbnVhbGx5XHJcbiAgICBpZiAoZ2VvbWV0cnkubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgIGdlb21ldHJ5ID0gbGF0TG5nKGdlb21ldHJ5KTtcclxuICAgIH1cclxuICAgIHRoaXMuX3NldEdlb21ldHJ5UGFyYW1zKGdlb21ldHJ5KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGxheWVyRGVmOiBmdW5jdGlvbiAoaWQsIHdoZXJlKSB7XHJcbiAgICB0aGlzLnBhcmFtcy5sYXllckRlZnMgPSAodGhpcy5wYXJhbXMubGF5ZXJEZWZzKSA/IHRoaXMucGFyYW1zLmxheWVyRGVmcyArICc7JyA6ICcnO1xyXG4gICAgdGhpcy5wYXJhbXMubGF5ZXJEZWZzICs9IChbaWQsIHdoZXJlXSkuam9pbignOicpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgc2ltcGxpZnk6IGZ1bmN0aW9uIChtYXAsIGZhY3Rvcikge1xyXG4gICAgdmFyIG1hcFdpZHRoID0gTWF0aC5hYnMobWFwLmdldEJvdW5kcygpLmdldFdlc3QoKSAtIG1hcC5nZXRCb3VuZHMoKS5nZXRFYXN0KCkpO1xyXG4gICAgdGhpcy5wYXJhbXMubWF4QWxsb3dhYmxlT2Zmc2V0ID0gKG1hcFdpZHRoIC8gbWFwLmdldFNpemUoKS55KSAqIGZhY3RvcjtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIHJ1bjogZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgLy8gaW1tZWRpYXRlbHkgaW52b2tlIHdpdGggYW4gZXJyb3JcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBlcnJvciwgdW5kZWZpbmVkLCByZXNwb25zZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgLy8gb2sgbm8gZXJyb3IgbGV0cyBqdXN0IGFzc3VtZSB3ZSBoYXZlIGZlYXR1cmVzLi4uXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIGZlYXR1cmVDb2xsZWN0aW9uID0gcmVzcG9uc2VUb0ZlYXR1cmVDb2xsZWN0aW9uKHJlc3BvbnNlKTtcclxuICAgICAgICByZXNwb25zZS5yZXN1bHRzID0gcmVzcG9uc2UucmVzdWx0cy5yZXZlcnNlKCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmZWF0dXJlQ29sbGVjdGlvbi5mZWF0dXJlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgdmFyIGZlYXR1cmUgPSBmZWF0dXJlQ29sbGVjdGlvbi5mZWF0dXJlc1tpXTtcclxuICAgICAgICAgIGZlYXR1cmUubGF5ZXJJZCA9IHJlc3BvbnNlLnJlc3VsdHNbaV0ubGF5ZXJJZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCB1bmRlZmluZWQsIGZlYXR1cmVDb2xsZWN0aW9uLCByZXNwb25zZSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIF9zZXRHZW9tZXRyeVBhcmFtczogZnVuY3Rpb24gKGdlb21ldHJ5KSB7XHJcbiAgICB2YXIgY29udmVydGVkID0gX3NldEdlb21ldHJ5KGdlb21ldHJ5KTtcclxuICAgIHRoaXMucGFyYW1zLmdlb21ldHJ5ID0gY29udmVydGVkLmdlb21ldHJ5O1xyXG4gICAgdGhpcy5wYXJhbXMuZ2VvbWV0cnlUeXBlID0gY29udmVydGVkLmdlb21ldHJ5VHlwZTtcclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlkZW50aWZ5RmVhdHVyZXMgKG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IElkZW50aWZ5RmVhdHVyZXMob3B0aW9ucyk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGlkZW50aWZ5RmVhdHVyZXM7XHJcbiIsImltcG9ydCB7IGxhdExuZyB9IGZyb20gJ2xlYWZsZXQnO1xyXG5pbXBvcnQgeyBJZGVudGlmeSB9IGZyb20gJy4vSWRlbnRpZnknO1xyXG5pbXBvcnQgeyByZXNwb25zZVRvRmVhdHVyZUNvbGxlY3Rpb24gfSBmcm9tICcuLi9VdGlsJztcclxuXHJcbmV4cG9ydCB2YXIgSWRlbnRpZnlJbWFnZSA9IElkZW50aWZ5LmV4dGVuZCh7XHJcbiAgc2V0dGVyczoge1xyXG4gICAgJ3NldE1vc2FpY1J1bGUnOiAnbW9zYWljUnVsZScsXHJcbiAgICAnc2V0UmVuZGVyaW5nUnVsZSc6ICdyZW5kZXJpbmdSdWxlJyxcclxuICAgICdzZXRQaXhlbFNpemUnOiAncGl4ZWxTaXplJyxcclxuICAgICdyZXR1cm5DYXRhbG9nSXRlbXMnOiAncmV0dXJuQ2F0YWxvZ0l0ZW1zJyxcclxuICAgICdyZXR1cm5HZW9tZXRyeSc6ICdyZXR1cm5HZW9tZXRyeSdcclxuICB9LFxyXG5cclxuICBwYXJhbXM6IHtcclxuICAgIHJldHVybkdlb21ldHJ5OiBmYWxzZVxyXG4gIH0sXHJcblxyXG4gIGF0OiBmdW5jdGlvbiAobGF0bG5nKSB7XHJcbiAgICBsYXRsbmcgPSBsYXRMbmcobGF0bG5nKTtcclxuICAgIHRoaXMucGFyYW1zLmdlb21ldHJ5ID0gSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICB4OiBsYXRsbmcubG5nLFxyXG4gICAgICB5OiBsYXRsbmcubGF0LFxyXG4gICAgICBzcGF0aWFsUmVmZXJlbmNlOiB7XHJcbiAgICAgICAgd2tpZDogNDMyNlxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHRoaXMucGFyYW1zLmdlb21ldHJ5VHlwZSA9ICdlc3JpR2VvbWV0cnlQb2ludCc7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBnZXRNb3NhaWNSdWxlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJhbXMubW9zYWljUnVsZTtcclxuICB9LFxyXG5cclxuICBnZXRSZW5kZXJpbmdSdWxlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJhbXMucmVuZGVyaW5nUnVsZTtcclxuICB9LFxyXG5cclxuICBnZXRQaXhlbFNpemU6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnBhcmFtcy5waXhlbFNpemU7XHJcbiAgfSxcclxuXHJcbiAgcnVuOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yLCAocmVzcG9uc2UgJiYgdGhpcy5fcmVzcG9uc2VUb0dlb0pTT04ocmVzcG9uc2UpKSwgcmVzcG9uc2UpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgLy8gZ2V0IHBpeGVsIGRhdGEgYW5kIHJldHVybiBhcyBnZW9KU09OIHBvaW50XHJcbiAgLy8gcG9wdWxhdGUgY2F0YWxvZyBpdGVtcyAoaWYgYW55KVxyXG4gIC8vIG1lcmdpbmcgaW4gYW55IGNhdGFsb2dJdGVtVmlzaWJpbGl0aWVzIGFzIGEgcHJvcGVyeSBvZiBlYWNoIGZlYXR1cmVcclxuICBfcmVzcG9uc2VUb0dlb0pTT046IGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgdmFyIGxvY2F0aW9uID0gcmVzcG9uc2UubG9jYXRpb247XHJcbiAgICB2YXIgY2F0YWxvZ0l0ZW1zID0gcmVzcG9uc2UuY2F0YWxvZ0l0ZW1zO1xyXG4gICAgdmFyIGNhdGFsb2dJdGVtVmlzaWJpbGl0aWVzID0gcmVzcG9uc2UuY2F0YWxvZ0l0ZW1WaXNpYmlsaXRpZXM7XHJcbiAgICB2YXIgZ2VvSlNPTiA9IHtcclxuICAgICAgJ3BpeGVsJzoge1xyXG4gICAgICAgICd0eXBlJzogJ0ZlYXR1cmUnLFxyXG4gICAgICAgICdnZW9tZXRyeSc6IHtcclxuICAgICAgICAgICd0eXBlJzogJ1BvaW50JyxcclxuICAgICAgICAgICdjb29yZGluYXRlcyc6IFtsb2NhdGlvbi54LCBsb2NhdGlvbi55XVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ2Nycyc6IHtcclxuICAgICAgICAgICd0eXBlJzogJ0VQU0cnLFxyXG4gICAgICAgICAgJ3Byb3BlcnRpZXMnOiB7XHJcbiAgICAgICAgICAgICdjb2RlJzogbG9jYXRpb24uc3BhdGlhbFJlZmVyZW5jZS53a2lkXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICAncHJvcGVydGllcyc6IHtcclxuICAgICAgICAgICdPQkpFQ1RJRCc6IHJlc3BvbnNlLm9iamVjdElkLFxyXG4gICAgICAgICAgJ25hbWUnOiByZXNwb25zZS5uYW1lLFxyXG4gICAgICAgICAgJ3ZhbHVlJzogcmVzcG9uc2UudmFsdWVcclxuICAgICAgICB9LFxyXG4gICAgICAgICdpZCc6IHJlc3BvbnNlLm9iamVjdElkXHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgaWYgKHJlc3BvbnNlLnByb3BlcnRpZXMgJiYgcmVzcG9uc2UucHJvcGVydGllcy5WYWx1ZXMpIHtcclxuICAgICAgZ2VvSlNPTi5waXhlbC5wcm9wZXJ0aWVzLnZhbHVlcyA9IHJlc3BvbnNlLnByb3BlcnRpZXMuVmFsdWVzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjYXRhbG9nSXRlbXMgJiYgY2F0YWxvZ0l0ZW1zLmZlYXR1cmVzKSB7XHJcbiAgICAgIGdlb0pTT04uY2F0YWxvZ0l0ZW1zID0gcmVzcG9uc2VUb0ZlYXR1cmVDb2xsZWN0aW9uKGNhdGFsb2dJdGVtcyk7XHJcbiAgICAgIGlmIChjYXRhbG9nSXRlbVZpc2liaWxpdGllcyAmJiBjYXRhbG9nSXRlbVZpc2liaWxpdGllcy5sZW5ndGggPT09IGdlb0pTT04uY2F0YWxvZ0l0ZW1zLmZlYXR1cmVzLmxlbmd0aCkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSBjYXRhbG9nSXRlbVZpc2liaWxpdGllcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgZ2VvSlNPTi5jYXRhbG9nSXRlbXMuZmVhdHVyZXNbaV0ucHJvcGVydGllcy5jYXRhbG9nSXRlbVZpc2liaWxpdHkgPSBjYXRhbG9nSXRlbVZpc2liaWxpdGllc1tpXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBnZW9KU09OO1xyXG4gIH1cclxuXHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlkZW50aWZ5SW1hZ2UgKHBhcmFtcykge1xyXG4gIHJldHVybiBuZXcgSWRlbnRpZnlJbWFnZShwYXJhbXMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpZGVudGlmeUltYWdlO1xyXG4iLCJpbXBvcnQgeyBVdGlsLCBFdmVudGVkIH0gZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCB7Y29yc30gZnJvbSAnLi4vU3VwcG9ydCc7XHJcbmltcG9ydCB7Y2xlYW5Vcmx9IGZyb20gJy4uL1V0aWwnO1xyXG5pbXBvcnQgUmVxdWVzdCBmcm9tICcuLi9SZXF1ZXN0JztcclxuXHJcbmV4cG9ydCB2YXIgU2VydmljZSA9IEV2ZW50ZWQuZXh0ZW5kKHtcclxuXHJcbiAgb3B0aW9uczoge1xyXG4gICAgcHJveHk6IGZhbHNlLFxyXG4gICAgdXNlQ29yczogY29ycyxcclxuICAgIHRpbWVvdXQ6IDBcclxuICB9LFxyXG5cclxuICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLl9yZXF1ZXN0UXVldWUgPSBbXTtcclxuICAgIHRoaXMuX2F1dGhlbnRpY2F0aW5nID0gZmFsc2U7XHJcbiAgICBVdGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XHJcbiAgICB0aGlzLm9wdGlvbnMudXJsID0gY2xlYW5VcmwodGhpcy5vcHRpb25zLnVybCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0OiBmdW5jdGlvbiAocGF0aCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3JlcXVlc3QoJ2dldCcsIHBhdGgsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHQpO1xyXG4gIH0sXHJcblxyXG4gIHBvc3Q6IGZ1bmN0aW9uIChwYXRoLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICBjb25zb2xlLmxvZygnU2VydmljZS5wb3N0IHdhcyBjYWxsZWQgd2l0aCcsIHBhdGgsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHQpO1xyXG4gICAgcmV0dXJuIHRoaXMuX3JlcXVlc3QoJ3Bvc3QnLCBwYXRoLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICB9LFxyXG5cclxuICByZXF1ZXN0OiBmdW5jdGlvbiAocGF0aCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3JlcXVlc3QoJ3JlcXVlc3QnLCBwYXRoLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICB9LFxyXG5cclxuICBtZXRhZGF0YTogZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcmVxdWVzdCgnZ2V0JywgJycsIHt9LCBjYWxsYmFjaywgY29udGV4dCk7XHJcbiAgfSxcclxuXHJcbiAgYXV0aGVudGljYXRlOiBmdW5jdGlvbiAodG9rZW4pIHtcclxuICAgIHRoaXMuX2F1dGhlbnRpY2F0aW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLm9wdGlvbnMudG9rZW4gPSB0b2tlbjtcclxuICAgIHRoaXMuX3J1blF1ZXVlKCk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBnZXRUaW1lb3V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnRpbWVvdXQ7XHJcbiAgfSxcclxuXHJcbiAgc2V0VGltZW91dDogZnVuY3Rpb24gKHRpbWVvdXQpIHtcclxuICAgIHRoaXMub3B0aW9ucy50aW1lb3V0ID0gdGltZW91dDtcclxuICB9LFxyXG5cclxuICBfcmVxdWVzdDogZnVuY3Rpb24gKG1ldGhvZCwgcGF0aCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5maXJlKCdyZXF1ZXN0c3RhcnQnLCB7XHJcbiAgICAgIHVybDogdGhpcy5vcHRpb25zLnVybCArIHBhdGgsXHJcbiAgICAgIHBhcmFtczogcGFyYW1zLFxyXG4gICAgICBtZXRob2Q6IG1ldGhvZFxyXG4gICAgfSwgdHJ1ZSk7XHJcblxyXG4gICAgdmFyIHdyYXBwZWRDYWxsYmFjayA9IHRoaXMuX2NyZWF0ZVNlcnZpY2VDYWxsYmFjayhtZXRob2QsIHBhdGgsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHQpO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudG9rZW4pIHtcclxuICAgICAgcGFyYW1zLnRva2VuID0gdGhpcy5vcHRpb25zLnRva2VuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLl9hdXRoZW50aWNhdGluZykge1xyXG4gICAgICB0aGlzLl9yZXF1ZXN0UXVldWUucHVzaChbbWV0aG9kLCBwYXRoLCBwYXJhbXMsIGNhbGxiYWNrLCBjb250ZXh0XSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciB1cmwgPSAodGhpcy5vcHRpb25zLnByb3h5KSA/IHRoaXMub3B0aW9ucy5wcm94eSArICc/JyArIHRoaXMub3B0aW9ucy51cmwgKyBwYXRoIDogdGhpcy5vcHRpb25zLnVybCArIHBhdGg7XHJcblxyXG4gICAgICBpZiAoKG1ldGhvZCA9PT0gJ2dldCcgfHwgbWV0aG9kID09PSAncmVxdWVzdCcpICYmICF0aGlzLm9wdGlvbnMudXNlQ29ycykge1xyXG4gICAgICAgIHJldHVybiBSZXF1ZXN0LmdldC5KU09OUCh1cmwsIHBhcmFtcywgd3JhcHBlZENhbGxiYWNrLCBjb250ZXh0KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gUmVxdWVzdFttZXRob2RdKHVybCwgcGFyYW1zLCB3cmFwcGVkQ2FsbGJhY2ssIGNvbnRleHQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgX2NyZWF0ZVNlcnZpY2VDYWxsYmFjazogZnVuY3Rpb24gKG1ldGhvZCwgcGF0aCwgcGFyYW1zLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuIFV0aWwuYmluZChmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmIChlcnJvciAmJiAoZXJyb3IuY29kZSA9PT0gNDk5IHx8IGVycm9yLmNvZGUgPT09IDQ5OCkpIHtcclxuICAgICAgICB0aGlzLl9hdXRoZW50aWNhdGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHRoaXMuX3JlcXVlc3RRdWV1ZS5wdXNoKFttZXRob2QsIHBhdGgsIHBhcmFtcywgY2FsbGJhY2ssIGNvbnRleHRdKTtcclxuXHJcbiAgICAgICAgLy8gZmlyZSBhbiBldmVudCBmb3IgdXNlcnMgdG8gaGFuZGxlIGFuZCByZS1hdXRoZW50aWNhdGVcclxuICAgICAgICB0aGlzLmZpcmUoJ2F1dGhlbnRpY2F0aW9ucmVxdWlyZWQnLCB7XHJcbiAgICAgICAgICBhdXRoZW50aWNhdGU6IFV0aWwuYmluZCh0aGlzLmF1dGhlbnRpY2F0ZSwgdGhpcylcclxuICAgICAgICB9LCB0cnVlKTtcclxuXHJcbiAgICAgICAgLy8gaWYgdGhlIHVzZXIgaGFzIGFjY2VzcyB0byBhIGNhbGxiYWNrIHRoZXkgY2FuIGhhbmRsZSB0aGUgYXV0aCBlcnJvclxyXG4gICAgICAgIGVycm9yLmF1dGhlbnRpY2F0ZSA9IFV0aWwuYmluZCh0aGlzLmF1dGhlbnRpY2F0ZSwgdGhpcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IsIHJlc3BvbnNlKTtcclxuXHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIHRoaXMuZmlyZSgncmVxdWVzdGVycm9yJywge1xyXG4gICAgICAgICAgdXJsOiB0aGlzLm9wdGlvbnMudXJsICsgcGF0aCxcclxuICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxyXG4gICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcclxuICAgICAgICAgIGNvZGU6IGVycm9yLmNvZGUsXHJcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZFxyXG4gICAgICAgIH0sIHRydWUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZmlyZSgncmVxdWVzdHN1Y2Nlc3MnLCB7XHJcbiAgICAgICAgICB1cmw6IHRoaXMub3B0aW9ucy51cmwgKyBwYXRoLFxyXG4gICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXHJcbiAgICAgICAgICByZXNwb25zZTogcmVzcG9uc2UsXHJcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZFxyXG4gICAgICAgIH0sIHRydWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmZpcmUoJ3JlcXVlc3RlbmQnLCB7XHJcbiAgICAgICAgdXJsOiB0aGlzLm9wdGlvbnMudXJsICsgcGF0aCxcclxuICAgICAgICBwYXJhbXM6IHBhcmFtcyxcclxuICAgICAgICBtZXRob2Q6IG1ldGhvZFxyXG4gICAgICB9LCB0cnVlKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gIH0sXHJcblxyXG4gIF9ydW5RdWV1ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgZm9yICh2YXIgaSA9IHRoaXMuX3JlcXVlc3RRdWV1ZS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICB2YXIgcmVxdWVzdCA9IHRoaXMuX3JlcXVlc3RRdWV1ZVtpXTtcclxuICAgICAgdmFyIG1ldGhvZCA9IHJlcXVlc3Quc2hpZnQoKTtcclxuICAgICAgdGhpc1ttZXRob2RdLmFwcGx5KHRoaXMsIHJlcXVlc3QpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fcmVxdWVzdFF1ZXVlID0gW107XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXJ2aWNlIChvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBTZXJ2aWNlKG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzZXJ2aWNlO1xyXG4iLCJpbXBvcnQgeyBTZXJ2aWNlIH0gZnJvbSAnLi9TZXJ2aWNlJztcclxuaW1wb3J0IGlkZW50aWZ5RmVhdHVyZXMgZnJvbSAnLi4vVGFza3MvSWRlbnRpZnlGZWF0dXJlcyc7XHJcbmltcG9ydCBxdWVyeSBmcm9tICcuLi9UYXNrcy9RdWVyeSc7XHJcbmltcG9ydCBmaW5kIGZyb20gJy4uL1Rhc2tzL0ZpbmQnO1xyXG5cclxuZXhwb3J0IHZhciBNYXBTZXJ2aWNlID0gU2VydmljZS5leHRlbmQoe1xyXG5cclxuICBpZGVudGlmeTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIGlkZW50aWZ5RmVhdHVyZXModGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgZmluZDogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIGZpbmQodGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgcXVlcnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBxdWVyeSh0aGlzKTtcclxuICB9XHJcblxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYXBTZXJ2aWNlIChvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBNYXBTZXJ2aWNlKG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBtYXBTZXJ2aWNlO1xyXG4iLCJpbXBvcnQgeyBTZXJ2aWNlIH0gZnJvbSAnLi9TZXJ2aWNlJztcclxuaW1wb3J0IGlkZW50aWZ5SW1hZ2UgZnJvbSAnLi4vVGFza3MvSWRlbnRpZnlJbWFnZSc7XHJcbmltcG9ydCBxdWVyeSBmcm9tICcuLi9UYXNrcy9RdWVyeSc7XHJcblxyXG5leHBvcnQgdmFyIEltYWdlU2VydmljZSA9IFNlcnZpY2UuZXh0ZW5kKHtcclxuXHJcbiAgcXVlcnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBxdWVyeSh0aGlzKTtcclxuICB9LFxyXG5cclxuICBpZGVudGlmeTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIGlkZW50aWZ5SW1hZ2UodGhpcyk7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbWFnZVNlcnZpY2UgKG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IEltYWdlU2VydmljZShvcHRpb25zKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaW1hZ2VTZXJ2aWNlO1xyXG4iLCJpbXBvcnQgeyBTZXJ2aWNlIH0gZnJvbSAnLi9TZXJ2aWNlJztcclxuaW1wb3J0IHF1ZXJ5IGZyb20gJy4uL1Rhc2tzL1F1ZXJ5JztcclxuaW1wb3J0IHsgZ2VvanNvblRvQXJjR0lTIH0gZnJvbSAnLi4vVXRpbCc7XHJcblxyXG5leHBvcnQgdmFyIEZlYXR1cmVMYXllclNlcnZpY2UgPSBTZXJ2aWNlLmV4dGVuZCh7XHJcblxyXG4gIG9wdGlvbnM6IHtcclxuICAgIGlkQXR0cmlidXRlOiAnT0JKRUNUSUQnXHJcbiAgfSxcclxuXHJcbiAgcXVlcnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBxdWVyeSh0aGlzKTtcclxuICB9LFxyXG5cclxuICBhZGRGZWF0dXJlOiBmdW5jdGlvbiAoZmVhdHVyZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIGRlbGV0ZSBmZWF0dXJlLmlkO1xyXG5cclxuICAgIGZlYXR1cmUgPSBnZW9qc29uVG9BcmNHSVMoZmVhdHVyZSk7XHJcblxyXG4gICAgY29uc29sZS5sb2coJ0ZlYXR1cmVMYXllclNlcnZpY2UgcG9zdCBhZGRGZWF0dXJlJywgZmVhdHVyZSk7XHJcbiAgICByZXR1cm4gdGhpcy5wb3N0KCdhZGRGZWF0dXJlcycsIHtcclxuICAgICAgZmVhdHVyZXM6IFtmZWF0dXJlXVxyXG4gICAgfSwgZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnYWRkRmVhdHVyZScsIGVycm9yLCByZXNwb25zZSk7XHJcbiAgICAgIHZhciByZXN1bHQgPSAocmVzcG9uc2UgJiYgcmVzcG9uc2UuYWRkUmVzdWx0cykgPyByZXNwb25zZS5hZGRSZXN1bHRzWzBdIDogdW5kZWZpbmVkO1xyXG4gICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yIHx8IHJlc3BvbnNlLmFkZFJlc3VsdHNbMF0uZXJyb3IsIHJlc3VsdCk7XHJcbiAgICAgIH1cclxuICAgIH0sIGNvbnRleHQpO1xyXG4gIH0sXHJcblxyXG4gIHVwZGF0ZUZlYXR1cmU6IGZ1bmN0aW9uIChmZWF0dXJlLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgZmVhdHVyZSA9IGdlb2pzb25Ub0FyY0dJUyhmZWF0dXJlLCB0aGlzLm9wdGlvbnMuaWRBdHRyaWJ1dGUpO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdGZWF0dXJlTGF5ZXJTZXJ2aWNlIHBvc3QgdXBkYXRlRmVhdHVyZScsIGZlYXR1cmUpO1xyXG4gICAgcmV0dXJuIHRoaXMucG9zdCgndXBkYXRlRmVhdHVyZXMnLCB7XHJcbiAgICAgIGZlYXR1cmVzOiBbZmVhdHVyZV1cclxuICAgIH0sIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgY29uc29sZS5sb2coJ3VwZGF0ZUZlYXR1cmUnLCBlcnJvciwgcmVzcG9uc2UpO1xyXG4gICAgICB2YXIgcmVzdWx0ID0gKHJlc3BvbnNlICYmIHJlc3BvbnNlLnVwZGF0ZVJlc3VsdHMpID8gcmVzcG9uc2UudXBkYXRlUmVzdWx0c1swXSA6IHVuZGVmaW5lZDtcclxuICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBlcnJvciB8fCByZXNwb25zZS51cGRhdGVSZXN1bHRzWzBdLmVycm9yLCByZXN1bHQpO1xyXG4gICAgICB9XHJcbiAgICB9LCBjb250ZXh0KTtcclxuICB9LFxyXG5cclxuICBkZWxldGVGZWF0dXJlOiBmdW5jdGlvbiAoaWQsIGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICBjb25zb2xlLmxvZygnRmVhdHVyZUxheWVyU2VydmljZSBwb3N0IGRlbGV0ZUZlYXR1cmUnLCBpZCk7XHJcbiAgICByZXR1cm4gdGhpcy5wb3N0KCdkZWxldGVGZWF0dXJlcycsIHtcclxuICAgICAgb2JqZWN0SWRzOiBpZFxyXG4gICAgfSwgZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICBjb25zb2xlLmxvZygnZGVsZXRlRmVhdHVyZScsIGVycm9yLCByZXNwb25zZSk7XHJcbiAgICAgIHZhciByZXN1bHQgPSAocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGVsZXRlUmVzdWx0cykgPyByZXNwb25zZS5kZWxldGVSZXN1bHRzWzBdIDogdW5kZWZpbmVkO1xyXG4gICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yIHx8IHJlc3BvbnNlLmRlbGV0ZVJlc3VsdHNbMF0uZXJyb3IsIHJlc3VsdCk7XHJcbiAgICAgIH1cclxuICAgIH0sIGNvbnRleHQpO1xyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZUZlYXR1cmVzOiBmdW5jdGlvbiAoaWRzLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgY29uc29sZS5sb2coJ0ZlYXR1cmVMYXllclNlcnZpY2UgcG9zdCBkZWxldGVGZWF0dXJlcycsIGlkcyk7XHJcbiAgICByZXR1cm4gdGhpcy5wb3N0KCdkZWxldGVGZWF0dXJlcycsIHtcclxuICAgICAgb2JqZWN0SWRzOiBpZHNcclxuICAgIH0sIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgY29uc29sZS5sb2coJ2RlbGV0ZUZlYXR1cmVzJywgZXJyb3IsIHJlc3BvbnNlKTtcclxuICAgICAgLy8gcGFzcyBiYWNrIHRoZSBlbnRpcmUgYXJyYXlcclxuICAgICAgdmFyIHJlc3VsdCA9IChyZXNwb25zZSAmJiByZXNwb25zZS5kZWxldGVSZXN1bHRzKSA/IHJlc3BvbnNlLmRlbGV0ZVJlc3VsdHMgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IgfHwgcmVzcG9uc2UuZGVsZXRlUmVzdWx0c1swXS5lcnJvciwgcmVzdWx0KTtcclxuICAgICAgfVxyXG4gICAgfSwgY29udGV4dCk7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmZWF0dXJlTGF5ZXJTZXJ2aWNlIChvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBGZWF0dXJlTGF5ZXJTZXJ2aWNlKG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmZWF0dXJlTGF5ZXJTZXJ2aWNlO1xyXG4iLCJpbXBvcnQgeyBUaWxlTGF5ZXIsIFV0aWwgfSBmcm9tICdsZWFmbGV0JztcclxuaW1wb3J0IHsgcG9pbnRlckV2ZW50cyB9IGZyb20gJy4uL1N1cHBvcnQnO1xyXG5pbXBvcnQge1xyXG4gIHNldEVzcmlBdHRyaWJ1dGlvbixcclxuICBfZ2V0QXR0cmlidXRpb25EYXRhLFxyXG4gIF91cGRhdGVNYXBBdHRyaWJ1dGlvblxyXG59IGZyb20gJy4uL1V0aWwnO1xyXG5cclxudmFyIHRpbGVQcm90b2NvbCA9ICh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgIT09ICdodHRwczonKSA/ICdodHRwOicgOiAnaHR0cHM6JztcclxuXHJcbmV4cG9ydCB2YXIgQmFzZW1hcExheWVyID0gVGlsZUxheWVyLmV4dGVuZCh7XHJcbiAgc3RhdGljczoge1xyXG4gICAgVElMRVM6IHtcclxuICAgICAgU3RyZWV0czoge1xyXG4gICAgICAgIHVybFRlbXBsYXRlOiB0aWxlUHJvdG9jb2wgKyAnLy97c30uYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9Xb3JsZF9TdHJlZXRfTWFwL01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9JyxcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICBtaW5ab29tOiAxLFxyXG4gICAgICAgICAgbWF4Wm9vbTogMTksXHJcbiAgICAgICAgICBzdWJkb21haW5zOiBbJ3NlcnZlcicsICdzZXJ2aWNlcyddLFxyXG4gICAgICAgICAgYXR0cmlidXRpb246ICdVU0dTLCBOT0FBJyxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uVXJsOiAnaHR0cHM6Ly9zdGF0aWMuYXJjZ2lzLmNvbS9hdHRyaWJ1dGlvbi9Xb3JsZF9TdHJlZXRfTWFwJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgVG9wb2dyYXBoaWM6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvV29ybGRfVG9wb19NYXAvTWFwU2VydmVyL3RpbGUve3p9L3t5fS97eH0nLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgIG1pblpvb206IDEsXHJcbiAgICAgICAgICBtYXhab29tOiAxOSxcclxuICAgICAgICAgIHN1YmRvbWFpbnM6IFsnc2VydmVyJywgJ3NlcnZpY2VzJ10sXHJcbiAgICAgICAgICBhdHRyaWJ1dGlvbjogJ1VTR1MsIE5PQUEnLFxyXG4gICAgICAgICAgYXR0cmlidXRpb25Vcmw6ICdodHRwczovL3N0YXRpYy5hcmNnaXMuY29tL2F0dHJpYnV0aW9uL1dvcmxkX1RvcG9fTWFwJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgT2NlYW5zOiB7XHJcbiAgICAgICAgdXJsVGVtcGxhdGU6IHRpbGVQcm90b2NvbCArICcvL3tzfS5hcmNnaXNvbmxpbmUuY29tL2FyY2dpcy9yZXN0L3NlcnZpY2VzL09jZWFuL1dvcmxkX09jZWFuX0Jhc2UvTWFwU2VydmVyL3RpbGUve3p9L3t5fS97eH0nLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgIG1pblpvb206IDEsXHJcbiAgICAgICAgICBtYXhab29tOiAxNixcclxuICAgICAgICAgIHN1YmRvbWFpbnM6IFsnc2VydmVyJywgJ3NlcnZpY2VzJ10sXHJcbiAgICAgICAgICBhdHRyaWJ1dGlvbjogJ1VTR1MsIE5PQUEnLFxyXG4gICAgICAgICAgYXR0cmlidXRpb25Vcmw6ICdodHRwczovL3N0YXRpYy5hcmNnaXMuY29tL2F0dHJpYnV0aW9uL09jZWFuX0Jhc2VtYXAnXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBPY2VhbnNMYWJlbHM6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vYXJjZ2lzL3Jlc3Qvc2VydmljZXMvT2NlYW4vV29ybGRfT2NlYW5fUmVmZXJlbmNlL01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9JyxcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICBtaW5ab29tOiAxLFxyXG4gICAgICAgICAgbWF4Wm9vbTogMTYsXHJcbiAgICAgICAgICBzdWJkb21haW5zOiBbJ3NlcnZlcicsICdzZXJ2aWNlcyddLFxyXG4gICAgICAgICAgcGFuZTogKHBvaW50ZXJFdmVudHMpID8gJ2VzcmktbGFiZWxzJyA6ICd0aWxlUGFuZSdcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIE5hdGlvbmFsR2VvZ3JhcGhpYzoge1xyXG4gICAgICAgIHVybFRlbXBsYXRlOiB0aWxlUHJvdG9jb2wgKyAnLy97c30uYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9OYXRHZW9fV29ybGRfTWFwL01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9JyxcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICBtaW5ab29tOiAxLFxyXG4gICAgICAgICAgbWF4Wm9vbTogMTYsXHJcbiAgICAgICAgICBzdWJkb21haW5zOiBbJ3NlcnZlcicsICdzZXJ2aWNlcyddLFxyXG4gICAgICAgICAgYXR0cmlidXRpb246ICdOYXRpb25hbCBHZW9ncmFwaGljLCBEZUxvcm1lLCBIRVJFLCBVTkVQLVdDTUMsIFVTR1MsIE5BU0EsIEVTQSwgTUVUSSwgTlJDQU4sIEdFQkNPLCBOT0FBLCBpbmNyZW1lbnQgUCBDb3JwLidcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIERhcmtHcmF5OiB7XHJcbiAgICAgICAgdXJsVGVtcGxhdGU6IHRpbGVQcm90b2NvbCArICcvL3tzfS5hcmNnaXNvbmxpbmUuY29tL0FyY0dJUy9yZXN0L3NlcnZpY2VzL0NhbnZhcy9Xb3JsZF9EYXJrX0dyYXlfQmFzZS9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDE2LFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnSEVSRSwgRGVMb3JtZSwgTWFwbXlJbmRpYSwgJmNvcHk7IE9wZW5TdHJlZXRNYXAgY29udHJpYnV0b3JzJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgRGFya0dyYXlMYWJlbHM6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvQ2FudmFzL1dvcmxkX0RhcmtfR3JheV9SZWZlcmVuY2UvTWFwU2VydmVyL3RpbGUve3p9L3t5fS97eH0nLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgIG1pblpvb206IDEsXHJcbiAgICAgICAgICBtYXhab29tOiAxNixcclxuICAgICAgICAgIHN1YmRvbWFpbnM6IFsnc2VydmVyJywgJ3NlcnZpY2VzJ10sXHJcbiAgICAgICAgICBwYW5lOiAocG9pbnRlckV2ZW50cykgPyAnZXNyaS1sYWJlbHMnIDogJ3RpbGVQYW5lJyxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnJ1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIEdyYXk6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvQ2FudmFzL1dvcmxkX0xpZ2h0X0dyYXlfQmFzZS9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDE2LFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnSEVSRSwgRGVMb3JtZSwgTWFwbXlJbmRpYSwgJmNvcHk7IE9wZW5TdHJlZXRNYXAgY29udHJpYnV0b3JzJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgR3JheUxhYmVsczoge1xyXG4gICAgICAgIHVybFRlbXBsYXRlOiB0aWxlUHJvdG9jb2wgKyAnLy97c30uYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9DYW52YXMvV29ybGRfTGlnaHRfR3JheV9SZWZlcmVuY2UvTWFwU2VydmVyL3RpbGUve3p9L3t5fS97eH0nLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgIG1pblpvb206IDEsXHJcbiAgICAgICAgICBtYXhab29tOiAxNixcclxuICAgICAgICAgIHN1YmRvbWFpbnM6IFsnc2VydmVyJywgJ3NlcnZpY2VzJ10sXHJcbiAgICAgICAgICBwYW5lOiAocG9pbnRlckV2ZW50cykgPyAnZXNyaS1sYWJlbHMnIDogJ3RpbGVQYW5lJyxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgSW1hZ2VyeToge1xyXG4gICAgICAgIHVybFRlbXBsYXRlOiB0aWxlUHJvdG9jb2wgKyAnLy97c30uYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9Xb3JsZF9JbWFnZXJ5L01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9JyxcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICBtaW5ab29tOiAxLFxyXG4gICAgICAgICAgbWF4Wm9vbTogMTksXHJcbiAgICAgICAgICBzdWJkb21haW5zOiBbJ3NlcnZlcicsICdzZXJ2aWNlcyddLFxyXG4gICAgICAgICAgYXR0cmlidXRpb246ICdEaWdpdGFsR2xvYmUsIEdlb0V5ZSwgaS1jdWJlZCwgVVNEQSwgVVNHUywgQUVYLCBHZXRtYXBwaW5nLCBBZXJvZ3JpZCwgSUdOLCBJR1AsIHN3aXNzdG9wbywgYW5kIHRoZSBHSVMgVXNlciBDb21tdW5pdHknXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBJbWFnZXJ5TGFiZWxzOiB7XHJcbiAgICAgICAgdXJsVGVtcGxhdGU6IHRpbGVQcm90b2NvbCArICcvL3tzfS5hcmNnaXNvbmxpbmUuY29tL0FyY0dJUy9yZXN0L3NlcnZpY2VzL1JlZmVyZW5jZS9Xb3JsZF9Cb3VuZGFyaWVzX2FuZF9QbGFjZXMvTWFwU2VydmVyL3RpbGUve3p9L3t5fS97eH0nLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgIG1pblpvb206IDEsXHJcbiAgICAgICAgICBtYXhab29tOiAxOSxcclxuICAgICAgICAgIHN1YmRvbWFpbnM6IFsnc2VydmVyJywgJ3NlcnZpY2VzJ10sXHJcbiAgICAgICAgICBwYW5lOiAocG9pbnRlckV2ZW50cykgPyAnZXNyaS1sYWJlbHMnIDogJ3RpbGVQYW5lJyxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgSW1hZ2VyeVRyYW5zcG9ydGF0aW9uOiB7XHJcbiAgICAgICAgdXJsVGVtcGxhdGU6IHRpbGVQcm90b2NvbCArICcvL3tzfS5hcmNnaXNvbmxpbmUuY29tL0FyY0dJUy9yZXN0L3NlcnZpY2VzL1JlZmVyZW5jZS9Xb3JsZF9UcmFuc3BvcnRhdGlvbi9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDE5LFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIHBhbmU6IChwb2ludGVyRXZlbnRzKSA/ICdlc3JpLWxhYmVscycgOiAndGlsZVBhbmUnXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBTaGFkZWRSZWxpZWY6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvV29ybGRfU2hhZGVkX1JlbGllZi9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDEzLFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnVVNHUydcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIFNoYWRlZFJlbGllZkxhYmVsczoge1xyXG4gICAgICAgIHVybFRlbXBsYXRlOiB0aWxlUHJvdG9jb2wgKyAnLy97c30uYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9SZWZlcmVuY2UvV29ybGRfQm91bmRhcmllc19hbmRfUGxhY2VzX0FsdGVybmF0ZS9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDEyLFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIHBhbmU6IChwb2ludGVyRXZlbnRzKSA/ICdlc3JpLWxhYmVscycgOiAndGlsZVBhbmUnLFxyXG4gICAgICAgICAgYXR0cmlidXRpb246ICcnXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBUZXJyYWluOiB7XHJcbiAgICAgICAgdXJsVGVtcGxhdGU6IHRpbGVQcm90b2NvbCArICcvL3tzfS5hcmNnaXNvbmxpbmUuY29tL0FyY0dJUy9yZXN0L3NlcnZpY2VzL1dvcmxkX1RlcnJhaW5fQmFzZS9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDEzLFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnVVNHUywgTk9BQSdcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIFRlcnJhaW5MYWJlbHM6IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvUmVmZXJlbmNlL1dvcmxkX1JlZmVyZW5jZV9PdmVybGF5L01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9JyxcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICBtaW5ab29tOiAxLFxyXG4gICAgICAgICAgbWF4Wm9vbTogMTMsXHJcbiAgICAgICAgICBzdWJkb21haW5zOiBbJ3NlcnZlcicsICdzZXJ2aWNlcyddLFxyXG4gICAgICAgICAgcGFuZTogKHBvaW50ZXJFdmVudHMpID8gJ2VzcmktbGFiZWxzJyA6ICd0aWxlUGFuZScsXHJcbiAgICAgICAgICBhdHRyaWJ1dGlvbjogJydcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIFVTQVRvcG86IHtcclxuICAgICAgICB1cmxUZW1wbGF0ZTogdGlsZVByb3RvY29sICsgJy8ve3N9LmFyY2dpc29ubGluZS5jb20vQXJjR0lTL3Jlc3Qvc2VydmljZXMvVVNBX1RvcG9fTWFwcy9NYXBTZXJ2ZXIvdGlsZS97en0ve3l9L3t4fScsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgbWluWm9vbTogMSxcclxuICAgICAgICAgIG1heFpvb206IDE1LFxyXG4gICAgICAgICAgc3ViZG9tYWluczogWydzZXJ2ZXInLCAnc2VydmljZXMnXSxcclxuICAgICAgICAgIGF0dHJpYnV0aW9uOiAnVVNHUywgTmF0aW9uYWwgR2VvZ3JhcGhpYyBTb2NpZXR5LCBpLWN1YmVkJ1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChrZXksIG9wdGlvbnMpIHtcclxuICAgIHZhciBjb25maWc7XHJcblxyXG4gICAgLy8gc2V0IHRoZSBjb25maWcgdmFyaWFibGUgd2l0aCB0aGUgYXBwcm9wcmlhdGUgY29uZmlnIG9iamVjdFxyXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmIGtleS51cmxUZW1wbGF0ZSAmJiBrZXkub3B0aW9ucykge1xyXG4gICAgICBjb25maWcgPSBrZXk7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIEJhc2VtYXBMYXllci5USUxFU1trZXldKSB7XHJcbiAgICAgIGNvbmZpZyA9IEJhc2VtYXBMYXllci5USUxFU1trZXldO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdMLmVzcmkuQmFzZW1hcExheWVyOiBJbnZhbGlkIHBhcmFtZXRlci4gVXNlIG9uZSBvZiBcIlN0cmVldHNcIiwgXCJUb3BvZ3JhcGhpY1wiLCBcIk9jZWFuc1wiLCBcIk9jZWFuc0xhYmVsc1wiLCBcIk5hdGlvbmFsR2VvZ3JhcGhpY1wiLCBcIkdyYXlcIiwgXCJHcmF5TGFiZWxzXCIsIFwiRGFya0dyYXlcIiwgXCJEYXJrR3JheUxhYmVsc1wiLCBcIkltYWdlcnlcIiwgXCJJbWFnZXJ5TGFiZWxzXCIsIFwiSW1hZ2VyeVRyYW5zcG9ydGF0aW9uXCIsIFwiU2hhZGVkUmVsaWVmXCIsIFwiU2hhZGVkUmVsaWVmTGFiZWxzXCIsIFwiVGVycmFpblwiLCBcIlRlcnJhaW5MYWJlbHNcIiBvciBcIlVTQVRvcG9cIicpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG1lcmdlIHBhc3NlZCBvcHRpb25zIGludG8gdGhlIGNvbmZpZyBvcHRpb25zXHJcbiAgICB2YXIgdGlsZU9wdGlvbnMgPSBVdGlsLmV4dGVuZChjb25maWcub3B0aW9ucywgb3B0aW9ucyk7XHJcblxyXG4gICAgVXRpbC5zZXRPcHRpb25zKHRoaXMsIHRpbGVPcHRpb25zKTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRva2VuKSB7XHJcbiAgICAgIGNvbmZpZy51cmxUZW1wbGF0ZSArPSAoJz90b2tlbj0nICsgdGhpcy5vcHRpb25zLnRva2VuKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjYWxsIHRoZSBpbml0aWFsaXplIG1ldGhvZCBvbiBMLlRpbGVMYXllciB0byBzZXQgZXZlcnl0aGluZyB1cFxyXG4gICAgVGlsZUxheWVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgY29uZmlnLnVybFRlbXBsYXRlLCB0aWxlT3B0aW9ucyk7XHJcbiAgfSxcclxuXHJcbiAgb25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIC8vIGluY2x1ZGUgJ1Bvd2VyZWQgYnkgRXNyaScgaW4gbWFwIGF0dHJpYnV0aW9uXHJcbiAgICBzZXRFc3JpQXR0cmlidXRpb24obWFwKTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnBhbmUgPT09ICdlc3JpLWxhYmVscycpIHtcclxuICAgICAgdGhpcy5faW5pdFBhbmUoKTtcclxuICAgIH1cclxuICAgIC8vIHNvbWUgYmFzZW1hcHMgY2FuIHN1cHBseSBkeW5hbWljIGF0dHJpYnV0aW9uXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmF0dHJpYnV0aW9uVXJsKSB7XHJcbiAgICAgIF9nZXRBdHRyaWJ1dGlvbkRhdGEodGhpcy5vcHRpb25zLmF0dHJpYnV0aW9uVXJsLCBtYXApO1xyXG4gICAgfVxyXG5cclxuICAgIG1hcC5vbignbW92ZWVuZCcsIF91cGRhdGVNYXBBdHRyaWJ1dGlvbik7XHJcblxyXG4gICAgVGlsZUxheWVyLnByb3RvdHlwZS5vbkFkZC5jYWxsKHRoaXMsIG1hcCk7XHJcbiAgfSxcclxuXHJcbiAgb25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIG1hcC5vZmYoJ21vdmVlbmQnLCBfdXBkYXRlTWFwQXR0cmlidXRpb24pO1xyXG4gICAgVGlsZUxheWVyLnByb3RvdHlwZS5vblJlbW92ZS5jYWxsKHRoaXMsIG1hcCk7XHJcbiAgfSxcclxuXHJcbiAgX2luaXRQYW5lOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXRoaXMuX21hcC5nZXRQYW5lKHRoaXMub3B0aW9ucy5wYW5lKSkge1xyXG4gICAgICB2YXIgcGFuZSA9IHRoaXMuX21hcC5jcmVhdGVQYW5lKHRoaXMub3B0aW9ucy5wYW5lKTtcclxuICAgICAgcGFuZS5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xyXG4gICAgICBwYW5lLnN0eWxlLnpJbmRleCA9IDUwMDtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBnZXRBdHRyaWJ1dGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdHRyaWJ1dGlvbikge1xyXG4gICAgICB2YXIgYXR0cmlidXRpb24gPSAnPHNwYW4gY2xhc3M9XCJlc3JpLWR5bmFtaWMtYXR0cmlidXRpb25cIj4nICsgdGhpcy5vcHRpb25zLmF0dHJpYnV0aW9uICsgJzwvc3Bhbj4nO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGF0dHJpYnV0aW9uO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYmFzZW1hcExheWVyIChrZXksIG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IEJhc2VtYXBMYXllcihrZXksIG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBiYXNlbWFwTGF5ZXI7XHJcbiIsImltcG9ydCB7IFRpbGVMYXllciwgVXRpbCB9IGZyb20gJ2xlYWZsZXQnO1xyXG5pbXBvcnQgeyB3YXJuLCBjbGVhblVybCwgc2V0RXNyaUF0dHJpYnV0aW9uIH0gZnJvbSAnLi4vVXRpbCc7XHJcbmltcG9ydCBtYXBTZXJ2aWNlIGZyb20gJy4uL1NlcnZpY2VzL01hcFNlcnZpY2UnO1xyXG5cclxuZXhwb3J0IHZhciBUaWxlZE1hcExheWVyID0gVGlsZUxheWVyLmV4dGVuZCh7XHJcbiAgb3B0aW9uczoge1xyXG4gICAgem9vbU9mZnNldEFsbG93YW5jZTogMC4xLFxyXG4gICAgZXJyb3JUaWxlVXJsOiAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFRQUFBQUVBQkFNQUFBQ3VYTFZWQUFBQUExQk1WRVV6TkRWc3psSEhBQUFBQVhSU1RsTUFRT2JZWmdBQUFBbHdTRmx6QUFBQUFBQUFBQUFCNm1VV3BBQUFBRFpKUkVGVWVKenR3UUVCQUFBQWdpRC9yMjVJUUFFQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUE3d2FCQUFBQncwOFJ3QUFBQUFCSlJVNUVya0pnZ2c9PSdcclxuICB9LFxyXG5cclxuICBzdGF0aWNzOiB7XHJcbiAgICBNZXJjYXRvclpvb21MZXZlbHM6IHtcclxuICAgICAgJzAnOiAxNTY1NDMuMDMzOTI3OTk5OTksXHJcbiAgICAgICcxJzogNzgyNzEuNTE2OTYzOTk5ODkzLFxyXG4gICAgICAnMic6IDM5MTM1Ljc1ODQ4MjAwMDA5OSxcclxuICAgICAgJzMnOiAxOTU2Ny44NzkyNDA5OTk5MDEsXHJcbiAgICAgICc0JzogOTc4My45Mzk2MjA0OTk5NTkzLFxyXG4gICAgICAnNSc6IDQ4OTEuOTY5ODEwMjQ5OTc5NyxcclxuICAgICAgJzYnOiAyNDQ1Ljk4NDkwNTEyNDk4OTgsXHJcbiAgICAgICc3JzogMTIyMi45OTI0NTI1NjI0ODk5LFxyXG4gICAgICAnOCc6IDYxMS40OTYyMjYyODEzODAwMixcclxuICAgICAgJzknOiAzMDUuNzQ4MTEzMTQwNTU4MDIsXHJcbiAgICAgICcxMCc6IDE1Mi44NzQwNTY1NzA0MTEsXHJcbiAgICAgICcxMSc6IDc2LjQzNzAyODI4NTA3MzE5NyxcclxuICAgICAgJzEyJzogMzguMjE4NTE0MTQyNTM2NTk4LFxyXG4gICAgICAnMTMnOiAxOS4xMDkyNTcwNzEyNjgyOTksXHJcbiAgICAgICcxNCc6IDkuNTU0NjI4NTM1NjM0MTQ5NixcclxuICAgICAgJzE1JzogNC43NzczMTQyNjc5NDkzNjk5LFxyXG4gICAgICAnMTYnOiAyLjM4ODY1NzEzMzk3NDY4LFxyXG4gICAgICAnMTcnOiAxLjE5NDMyODU2Njg1NTA1MDEsXHJcbiAgICAgICcxOCc6IDAuNTk3MTY0MjgzNTU5ODE2OTksXHJcbiAgICAgICcxOSc6IDAuMjk4NTgyMTQxNjQ3NjE2OTgsXHJcbiAgICAgICcyMCc6IDAuMTQ5MjkxMDcwODIzODEsXHJcbiAgICAgICcyMSc6IDAuMDc0NjQ1NTM1NDExOTEsXHJcbiAgICAgICcyMic6IDAuMDM3MzIyNzY3NzA1OTUyNSxcclxuICAgICAgJzIzJzogMC4wMTg2NjEzODM4NTI5NzYzXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMudXJsID0gY2xlYW5Vcmwob3B0aW9ucy51cmwpO1xyXG4gICAgb3B0aW9ucyA9IFV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcclxuXHJcbiAgICAvLyBzZXQgdGhlIHVybHNcclxuICAgIHRoaXMudGlsZVVybCA9IG9wdGlvbnMudXJsICsgJ3RpbGUve3p9L3t5fS97eH0nO1xyXG4gICAgLy8gUmVtb3ZlIHN1YmRvbWFpbiBpbiB1cmxcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9Fc3JpL2VzcmktbGVhZmxldC9pc3N1ZXMvOTkxXHJcbiAgICBpZiAob3B0aW9ucy51cmwuaW5kZXhPZigne3N9JykgIT09IC0xICYmIG9wdGlvbnMuc3ViZG9tYWlucykge1xyXG4gICAgICBvcHRpb25zLnVybCA9IG9wdGlvbnMudXJsLnJlcGxhY2UoJ3tzfScsIG9wdGlvbnMuc3ViZG9tYWluc1swXSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnNlcnZpY2UgPSBtYXBTZXJ2aWNlKG9wdGlvbnMpO1xyXG4gICAgdGhpcy5zZXJ2aWNlLmFkZEV2ZW50UGFyZW50KHRoaXMpO1xyXG5cclxuICAgIHZhciBhcmNnaXNvbmxpbmUgPSBuZXcgUmVnRXhwKC90aWxlcy5hcmNnaXMob25saW5lKT9cXC5jb20vZyk7XHJcbiAgICBpZiAoYXJjZ2lzb25saW5lLnRlc3Qob3B0aW9ucy51cmwpKSB7XHJcbiAgICAgIHRoaXMudGlsZVVybCA9IHRoaXMudGlsZVVybC5yZXBsYWNlKCc6Ly90aWxlcycsICc6Ly90aWxlc3tzfScpO1xyXG4gICAgICBvcHRpb25zLnN1YmRvbWFpbnMgPSBbJzEnLCAnMicsICczJywgJzQnXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRva2VuKSB7XHJcbiAgICAgIHRoaXMudGlsZVVybCArPSAoJz90b2tlbj0nICsgdGhpcy5vcHRpb25zLnRva2VuKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpbml0IGxheWVyIGJ5IGNhbGxpbmcgVGlsZUxheWVycyBpbml0aWFsaXplIG1ldGhvZFxyXG4gICAgVGlsZUxheWVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgdGhpcy50aWxlVXJsLCBvcHRpb25zKTtcclxuICB9LFxyXG5cclxuICBnZXRUaWxlVXJsOiBmdW5jdGlvbiAodGlsZVBvaW50KSB7XHJcbiAgICB2YXIgem9vbSA9IHRoaXMuX2dldFpvb21Gb3JVcmwoKTtcclxuXHJcbiAgICByZXR1cm4gVXRpbC50ZW1wbGF0ZSh0aGlzLnRpbGVVcmwsIFV0aWwuZXh0ZW5kKHtcclxuICAgICAgczogdGhpcy5fZ2V0U3ViZG9tYWluKHRpbGVQb2ludCksXHJcbiAgICAgIHg6IHRpbGVQb2ludC54LFxyXG4gICAgICB5OiB0aWxlUG9pbnQueSxcclxuICAgICAgLy8gdHJ5IGxvZCBtYXAgZmlyc3QsIHRoZW4ganVzdCBkZWZhdWx0IHRvIHpvb20gbGV2ZWxcclxuICAgICAgejogKHRoaXMuX2xvZE1hcCAmJiB0aGlzLl9sb2RNYXBbem9vbV0pID8gdGhpcy5fbG9kTWFwW3pvb21dIDogem9vbVxyXG4gICAgfSwgdGhpcy5vcHRpb25zKSk7XHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlVGlsZTogZnVuY3Rpb24gKGNvb3JkcywgZG9uZSkge1xyXG4gICAgdmFyIHRpbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuXHJcbiAgICBMLkRvbUV2ZW50Lm9uKHRpbGUsICdsb2FkJywgTC5iaW5kKHRoaXMuX3RpbGVPbkxvYWQsIHRoaXMsIGRvbmUsIHRpbGUpKTtcclxuICAgIEwuRG9tRXZlbnQub24odGlsZSwgJ2Vycm9yJywgTC5iaW5kKHRoaXMuX3RpbGVPbkVycm9yLCB0aGlzLCBkb25lLCB0aWxlKSk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jcm9zc09yaWdpbikge1xyXG4gICAgICB0aWxlLmNyb3NzT3JpZ2luID0gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICBBbHQgdGFnIGlzIHNldCB0byBlbXB0eSBzdHJpbmcgdG8ga2VlcCBzY3JlZW4gcmVhZGVycyBmcm9tIHJlYWRpbmcgVVJMIGFuZCBmb3IgY29tcGxpYW5jZSByZWFzb25zXHJcbiAgICAgaHR0cDovL3d3dy53My5vcmcvVFIvV0NBRzIwLVRFQ0hTL0g2N1xyXG4gICAgKi9cclxuICAgIHRpbGUuYWx0ID0gJyc7XHJcblxyXG4gICAgLy8gaWYgdGhlcmUgaXMgbm8gbG9kIG1hcCBvciBhbiBsb2QgbWFwIHdpdGggYSBwcm9wZXIgem9vbSBsb2FkIHRoZSB0aWxlXHJcbiAgICAvLyBvdGhlcndpc2Ugd2FpdCBmb3IgdGhlIGxvZCBtYXAgdG8gYmVjb21lIGF2YWlsYWJsZVxyXG4gICAgaWYgKCF0aGlzLl9sb2RNYXAgfHwgKHRoaXMuX2xvZE1hcCAmJiB0aGlzLl9sb2RNYXBbdGhpcy5fZ2V0Wm9vbUZvclVybCgpXSkpIHtcclxuICAgICAgdGlsZS5zcmMgPSB0aGlzLmdldFRpbGVVcmwoY29vcmRzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMub25jZSgnbG9kbWFwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRpbGUuc3JjID0gdGhpcy5nZXRUaWxlVXJsKGNvb3Jkcyk7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aWxlO1xyXG4gIH0sXHJcblxyXG4gIG9uQWRkOiBmdW5jdGlvbiAobWFwKSB7XHJcbiAgICAvLyBpbmNsdWRlICdQb3dlcmVkIGJ5IEVzcmknIGluIG1hcCBhdHRyaWJ1dGlvblxyXG4gICAgc2V0RXNyaUF0dHJpYnV0aW9uKG1hcCk7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9sb2RNYXApIHtcclxuICAgICAgdGhpcy5tZXRhZGF0YShmdW5jdGlvbiAoZXJyb3IsIG1ldGFkYXRhKSB7XHJcbiAgICAgICAgaWYgKCFlcnJvciAmJiBtZXRhZGF0YS5zcGF0aWFsUmVmZXJlbmNlKSB7XHJcbiAgICAgICAgICB2YXIgc3IgPSBtZXRhZGF0YS5zcGF0aWFsUmVmZXJlbmNlLmxhdGVzdFdraWQgfHwgbWV0YWRhdGEuc3BhdGlhbFJlZmVyZW5jZS53a2lkO1xyXG4gICAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYXR0cmlidXRpb24gJiYgbWFwLmF0dHJpYnV0aW9uQ29udHJvbCAmJiBtZXRhZGF0YS5jb3B5cmlnaHRUZXh0KSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hdHRyaWJ1dGlvbiA9IG1ldGFkYXRhLmNvcHlyaWdodFRleHQ7XHJcbiAgICAgICAgICAgIG1hcC5hdHRyaWJ1dGlvbkNvbnRyb2wuYWRkQXR0cmlidXRpb24odGhpcy5nZXRBdHRyaWJ1dGlvbigpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChtYXAub3B0aW9ucy5jcnMgPT09IEwuQ1JTLkVQU0czODU3ICYmIHNyID09PSAxMDIxMDAgfHwgc3IgPT09IDM4NTcpIHtcclxuICAgICAgICAgICAgdGhpcy5fbG9kTWFwID0ge307XHJcbiAgICAgICAgICAgIC8vIGNyZWF0ZSB0aGUgem9vbSBsZXZlbCBkYXRhXHJcbiAgICAgICAgICAgIHZhciBhcmNnaXNMT0RzID0gbWV0YWRhdGEudGlsZUluZm8ubG9kcztcclxuICAgICAgICAgICAgdmFyIGNvcnJlY3RSZXNvbHV0aW9ucyA9IFRpbGVkTWFwTGF5ZXIuTWVyY2F0b3Jab29tTGV2ZWxzO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmNnaXNMT0RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgdmFyIGFyY2dpc0xPRCA9IGFyY2dpc0xPRHNbaV07XHJcbiAgICAgICAgICAgICAgZm9yICh2YXIgY2kgaW4gY29ycmVjdFJlc29sdXRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29ycmVjdFJlcyA9IGNvcnJlY3RSZXNvbHV0aW9uc1tjaV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3dpdGhpblBlcmNlbnRhZ2UoYXJjZ2lzTE9ELnJlc29sdXRpb24sIGNvcnJlY3RSZXMsIHRoaXMub3B0aW9ucy56b29tT2Zmc2V0QWxsb3dhbmNlKSkge1xyXG4gICAgICAgICAgICAgICAgICB0aGlzLl9sb2RNYXBbY2ldID0gYXJjZ2lzTE9ELmxldmVsO1xyXG4gICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnbG9kbWFwJyk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoIXByb2o0KSB7XHJcbiAgICAgICAgICAgICAgd2FybignTC5lc3JpLlRpbGVkTWFwTGF5ZXIgaXMgdXNpbmcgYSBub24tbWVyY2F0b3Igc3BhdGlhbCByZWZlcmVuY2UuIFN1cHBvcnQgbWF5IGJlIGF2YWlsYWJsZSB0aHJvdWdoIFByb2o0TGVhZmxldCBodHRwOi8vZXNyaS5naXRodWIuaW8vZXNyaS1sZWFmbGV0L2V4YW1wbGVzL25vbi1tZXJjYXRvci1wcm9qZWN0aW9uLmh0bWwnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgVGlsZUxheWVyLnByb3RvdHlwZS5vbkFkZC5jYWxsKHRoaXMsIG1hcCk7XHJcbiAgfSxcclxuXHJcbiAgbWV0YWRhdGE6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5zZXJ2aWNlLm1ldGFkYXRhKGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGlkZW50aWZ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLmlkZW50aWZ5KCk7XHJcbiAgfSxcclxuXHJcbiAgZmluZDogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VydmljZS5maW5kKCk7XHJcbiAgfSxcclxuXHJcbiAgcXVlcnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UucXVlcnkoKTtcclxuICB9LFxyXG5cclxuICBhdXRoZW50aWNhdGU6IGZ1bmN0aW9uICh0b2tlbikge1xyXG4gICAgdmFyIHRva2VuUXMgPSAnP3Rva2VuPScgKyB0b2tlbjtcclxuICAgIHRoaXMudGlsZVVybCA9ICh0aGlzLm9wdGlvbnMudG9rZW4pID8gdGhpcy50aWxlVXJsLnJlcGxhY2UoL1xcP3Rva2VuPSguKykvZywgdG9rZW5RcykgOiB0aGlzLnRpbGVVcmwgKyB0b2tlblFzO1xyXG4gICAgdGhpcy5vcHRpb25zLnRva2VuID0gdG9rZW47XHJcbiAgICB0aGlzLnNlcnZpY2UuYXV0aGVudGljYXRlKHRva2VuKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIF93aXRoaW5QZXJjZW50YWdlOiBmdW5jdGlvbiAoYSwgYiwgcGVyY2VudGFnZSkge1xyXG4gICAgdmFyIGRpZmYgPSBNYXRoLmFicygoYSAvIGIpIC0gMSk7XHJcbiAgICByZXR1cm4gZGlmZiA8IHBlcmNlbnRhZ2U7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0aWxlZE1hcExheWVyICh1cmwsIG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IFRpbGVkTWFwTGF5ZXIodXJsLCBvcHRpb25zKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgdGlsZWRNYXBMYXllcjtcclxuIiwiaW1wb3J0IHsgSW1hZ2VPdmVybGF5LCBDUlMsIERvbVV0aWwsIFV0aWwsIExheWVyLCBwb3B1cCwgbGF0TG5nLCBib3VuZHMgfSBmcm9tICdsZWFmbGV0JztcclxuaW1wb3J0IHsgY29ycyB9IGZyb20gJy4uL1N1cHBvcnQnO1xyXG5pbXBvcnQgeyBzZXRFc3JpQXR0cmlidXRpb24gfSBmcm9tICcuLi9VdGlsJztcclxuXHJcbnZhciBPdmVybGF5ID0gSW1hZ2VPdmVybGF5LmV4dGVuZCh7XHJcbiAgb25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIHRoaXMuX3RvcExlZnQgPSBtYXAuZ2V0UGl4ZWxCb3VuZHMoKS5taW47XHJcbiAgICBJbWFnZU92ZXJsYXkucHJvdG90eXBlLm9uQWRkLmNhbGwodGhpcywgbWFwKTtcclxuICB9LFxyXG4gIF9yZXNldDogZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMuX21hcC5vcHRpb25zLmNycyA9PT0gQ1JTLkVQU0czODU3KSB7XHJcbiAgICAgIEltYWdlT3ZlcmxheS5wcm90b3R5cGUuX3Jlc2V0LmNhbGwodGhpcyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBEb21VdGlsLnNldFBvc2l0aW9uKHRoaXMuX2ltYWdlLCB0aGlzLl90b3BMZWZ0LnN1YnRyYWN0KHRoaXMuX21hcC5nZXRQaXhlbE9yaWdpbigpKSk7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCB2YXIgUmFzdGVyTGF5ZXIgPSBMYXllci5leHRlbmQoe1xyXG4gIG9wdGlvbnM6IHtcclxuICAgIG9wYWNpdHk6IDEsXHJcbiAgICBwb3NpdGlvbjogJ2Zyb250JyxcclxuICAgIGY6ICdpbWFnZScsXHJcbiAgICB1c2VDb3JzOiBjb3JzLFxyXG4gICAgYXR0cmlidXRpb246IG51bGwsXHJcbiAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXHJcbiAgICBhbHQ6ICcnXHJcbiAgfSxcclxuXHJcbiAgb25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIC8vIGluY2x1ZGUgJ1Bvd2VyZWQgYnkgRXNyaScgaW4gbWFwIGF0dHJpYnV0aW9uXHJcbiAgICBzZXRFc3JpQXR0cmlidXRpb24obWFwKTtcclxuXHJcbiAgICB0aGlzLl91cGRhdGUgPSBVdGlsLnRocm90dGxlKHRoaXMuX3VwZGF0ZSwgdGhpcy5vcHRpb25zLnVwZGF0ZUludGVydmFsLCB0aGlzKTtcclxuXHJcbiAgICBtYXAub24oJ21vdmVlbmQnLCB0aGlzLl91cGRhdGUsIHRoaXMpO1xyXG5cclxuICAgIC8vIGlmIHdlIGhhZCBhbiBpbWFnZSBsb2FkZWQgYW5kIGl0IG1hdGNoZXMgdGhlXHJcbiAgICAvLyBjdXJyZW50IGJvdW5kcyBzaG93IHRoZSBpbWFnZSBvdGhlcndpc2UgcmVtb3ZlIGl0XHJcbiAgICBpZiAodGhpcy5fY3VycmVudEltYWdlICYmIHRoaXMuX2N1cnJlbnRJbWFnZS5fYm91bmRzLmVxdWFscyh0aGlzLl9tYXAuZ2V0Qm91bmRzKCkpKSB7XHJcbiAgICAgIG1hcC5hZGRMYXllcih0aGlzLl9jdXJyZW50SW1hZ2UpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLl9jdXJyZW50SW1hZ2UpIHtcclxuICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKHRoaXMuX2N1cnJlbnRJbWFnZSk7XHJcbiAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgaWYgKHRoaXMuX3BvcHVwKSB7XHJcbiAgICAgIHRoaXMuX21hcC5vbignY2xpY2snLCB0aGlzLl9nZXRQb3B1cERhdGEsIHRoaXMpO1xyXG4gICAgICB0aGlzLl9tYXAub24oJ2RibGNsaWNrJywgdGhpcy5fcmVzZXRQb3B1cFN0YXRlLCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgY29weXJpZ2h0IHRleHQgbGlzdGVkIGluIHNlcnZpY2UgbWV0YWRhdGFcclxuICAgIHRoaXMubWV0YWRhdGEoZnVuY3Rpb24gKGVyciwgbWV0YWRhdGEpIHtcclxuICAgICAgaWYgKCFlcnIgJiYgIXRoaXMub3B0aW9ucy5hdHRyaWJ1dGlvbiAmJiBtYXAuYXR0cmlidXRpb25Db250cm9sICYmIG1ldGFkYXRhLmNvcHlyaWdodFRleHQpIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMuYXR0cmlidXRpb24gPSBtZXRhZGF0YS5jb3B5cmlnaHRUZXh0O1xyXG4gICAgICAgIG1hcC5hdHRyaWJ1dGlvbkNvbnRyb2wuYWRkQXR0cmlidXRpb24odGhpcy5nZXRBdHRyaWJ1dGlvbigpKTtcclxuICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgb25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIGlmICh0aGlzLl9jdXJyZW50SW1hZ2UpIHtcclxuICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKHRoaXMuX2N1cnJlbnRJbWFnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuX3BvcHVwKSB7XHJcbiAgICAgIHRoaXMuX21hcC5vZmYoJ2NsaWNrJywgdGhpcy5fZ2V0UG9wdXBEYXRhLCB0aGlzKTtcclxuICAgICAgdGhpcy5fbWFwLm9mZignZGJsY2xpY2snLCB0aGlzLl9yZXNldFBvcHVwU3RhdGUsIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX21hcC5vZmYoJ21vdmVlbmQnLCB0aGlzLl91cGRhdGUsIHRoaXMpO1xyXG4gIH0sXHJcblxyXG4gIGJpbmRQb3B1cDogZnVuY3Rpb24gKGZuLCBwb3B1cE9wdGlvbnMpIHtcclxuICAgIHRoaXMuX3Nob3VsZFJlbmRlclBvcHVwID0gZmFsc2U7XHJcbiAgICB0aGlzLl9sYXN0Q2xpY2sgPSBmYWxzZTtcclxuICAgIHRoaXMuX3BvcHVwID0gcG9wdXAocG9wdXBPcHRpb25zKTtcclxuICAgIHRoaXMuX3BvcHVwRnVuY3Rpb24gPSBmbjtcclxuICAgIGlmICh0aGlzLl9tYXApIHtcclxuICAgICAgdGhpcy5fbWFwLm9uKCdjbGljaycsIHRoaXMuX2dldFBvcHVwRGF0YSwgdGhpcyk7XHJcbiAgICAgIHRoaXMuX21hcC5vbignZGJsY2xpY2snLCB0aGlzLl9yZXNldFBvcHVwU3RhdGUsIHRoaXMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgdW5iaW5kUG9wdXA6IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLl9tYXApIHtcclxuICAgICAgdGhpcy5fbWFwLmNsb3NlUG9wdXAodGhpcy5fcG9wdXApO1xyXG4gICAgICB0aGlzLl9tYXAub2ZmKCdjbGljaycsIHRoaXMuX2dldFBvcHVwRGF0YSwgdGhpcyk7XHJcbiAgICAgIHRoaXMuX21hcC5vZmYoJ2RibGNsaWNrJywgdGhpcy5fcmVzZXRQb3B1cFN0YXRlLCB0aGlzKTtcclxuICAgIH1cclxuICAgIHRoaXMuX3BvcHVwID0gZmFsc2U7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBicmluZ1RvRnJvbnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbiA9ICdmcm9udCc7XHJcbiAgICBpZiAodGhpcy5fY3VycmVudEltYWdlKSB7XHJcbiAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZS5icmluZ1RvRnJvbnQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGJyaW5nVG9CYWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMucG9zaXRpb24gPSAnYmFjayc7XHJcbiAgICBpZiAodGhpcy5fY3VycmVudEltYWdlKSB7XHJcbiAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZS5icmluZ1RvQmFjaygpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZ2V0QXR0cmlidXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYXR0cmlidXRpb247XHJcbiAgfSxcclxuXHJcbiAgZ2V0T3BhY2l0eTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5vcGFjaXR5O1xyXG4gIH0sXHJcblxyXG4gIHNldE9wYWNpdHk6IGZ1bmN0aW9uIChvcGFjaXR5KSB7XHJcbiAgICB0aGlzLm9wdGlvbnMub3BhY2l0eSA9IG9wYWNpdHk7XHJcbiAgICBpZiAodGhpcy5fY3VycmVudEltYWdlKSB7XHJcbiAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZS5zZXRPcGFjaXR5KG9wYWNpdHkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZ2V0VGltZVJhbmdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gW3RoaXMub3B0aW9ucy5mcm9tLCB0aGlzLm9wdGlvbnMudG9dO1xyXG4gIH0sXHJcblxyXG4gIHNldFRpbWVSYW5nZTogZnVuY3Rpb24gKGZyb20sIHRvKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMuZnJvbSA9IGZyb207XHJcbiAgICB0aGlzLm9wdGlvbnMudG8gPSB0bztcclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgbWV0YWRhdGE6IGZ1bmN0aW9uIChjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5zZXJ2aWNlLm1ldGFkYXRhKGNhbGxiYWNrLCBjb250ZXh0KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGF1dGhlbnRpY2F0ZTogZnVuY3Rpb24gKHRva2VuKSB7XHJcbiAgICB0aGlzLnNlcnZpY2UuYXV0aGVudGljYXRlKHRva2VuKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIHJlZHJhdzogZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgfSxcclxuXHJcbiAgX3JlbmRlckltYWdlOiBmdW5jdGlvbiAodXJsLCBib3VuZHMsIGNvbnRlbnRUeXBlKSB7XHJcbiAgICBpZiAodGhpcy5fbWFwKSB7XHJcbiAgICAgIC8vIGlmIG5vIG91dHB1dCBkaXJlY3RvcnkgaGFzIGJlZW4gc3BlY2lmaWVkIGZvciBhIHNlcnZpY2UsIE1JTUUgZGF0YSB3aWxsIGJlIHJldHVybmVkXHJcbiAgICAgIGlmIChjb250ZW50VHlwZSkge1xyXG4gICAgICAgIHVybCA9ICdkYXRhOicgKyBjb250ZW50VHlwZSArICc7YmFzZTY0LCcgKyB1cmw7XHJcbiAgICAgIH1cclxuICAgICAgLy8gY3JlYXRlIGEgbmV3IGltYWdlIG92ZXJsYXkgYW5kIGFkZCBpdCB0byB0aGUgbWFwXHJcbiAgICAgIC8vIHRvIHN0YXJ0IGxvYWRpbmcgdGhlIGltYWdlXHJcbiAgICAgIC8vIG9wYWNpdHkgaXMgMCB3aGlsZSB0aGUgaW1hZ2UgaXMgbG9hZGluZ1xyXG4gICAgICB2YXIgaW1hZ2UgPSBuZXcgT3ZlcmxheSh1cmwsIGJvdW5kcywge1xyXG4gICAgICAgIG9wYWNpdHk6IDAsXHJcbiAgICAgICAgY3Jvc3NPcmlnaW46IHRoaXMub3B0aW9ucy51c2VDb3JzLFxyXG4gICAgICAgIGFsdDogdGhpcy5vcHRpb25zLmFsdCxcclxuICAgICAgICBwYW5lOiB0aGlzLm9wdGlvbnMucGFuZSB8fCB0aGlzLmdldFBhbmUoKSxcclxuICAgICAgICBpbnRlcmFjdGl2ZTogdGhpcy5vcHRpb25zLmludGVyYWN0aXZlXHJcbiAgICAgIH0pLmFkZFRvKHRoaXMuX21hcCk7XHJcblxyXG4gICAgICB2YXIgb25PdmVybGF5RXJyb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKGltYWdlKTtcclxuICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJyk7XHJcbiAgICAgICAgaW1hZ2Uub2ZmKCdsb2FkJywgb25PdmVybGF5TG9hZCwgdGhpcyk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB2YXIgb25PdmVybGF5TG9hZCA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgaW1hZ2Uub2ZmKCdlcnJvcicsIG9uT3ZlcmxheUxvYWQsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0aGlzLl9tYXApIHtcclxuICAgICAgICAgIHZhciBuZXdJbWFnZSA9IGUudGFyZ2V0O1xyXG4gICAgICAgICAgdmFyIG9sZEltYWdlID0gdGhpcy5fY3VycmVudEltYWdlO1xyXG5cclxuICAgICAgICAgIC8vIGlmIHRoZSBib3VuZHMgb2YgdGhpcyBpbWFnZSBtYXRjaGVzIHRoZSBib3VuZHMgdGhhdFxyXG4gICAgICAgICAgLy8gX3JlbmRlckltYWdlIHdhcyBjYWxsZWQgd2l0aCBhbmQgd2UgaGF2ZSBhIG1hcCB3aXRoIHRoZSBzYW1lIGJvdW5kc1xyXG4gICAgICAgICAgLy8gaGlkZSB0aGUgb2xkIGltYWdlIGlmIHRoZXJlIGlzIG9uZSBhbmQgc2V0IHRoZSBvcGFjaXR5XHJcbiAgICAgICAgICAvLyBvZiB0aGUgbmV3IGltYWdlIG90aGVyd2lzZSByZW1vdmUgdGhlIG5ldyBpbWFnZVxyXG4gICAgICAgICAgaWYgKG5ld0ltYWdlLl9ib3VuZHMuZXF1YWxzKGJvdW5kcykgJiYgbmV3SW1hZ2UuX2JvdW5kcy5lcXVhbHModGhpcy5fbWFwLmdldEJvdW5kcygpKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SW1hZ2UgPSBuZXdJbWFnZTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucG9zaXRpb24gPT09ICdmcm9udCcpIHtcclxuICAgICAgICAgICAgICB0aGlzLmJyaW5nVG9Gcm9udCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuYnJpbmdUb0JhY2soKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX21hcCAmJiB0aGlzLl9jdXJyZW50SW1hZ2UuX21hcCkge1xyXG4gICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZS5zZXRPcGFjaXR5KHRoaXMub3B0aW9ucy5vcGFjaXR5KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW1hZ2UuX21hcC5yZW1vdmVMYXllcih0aGlzLl9jdXJyZW50SW1hZ2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAob2xkSW1hZ2UgJiYgdGhpcy5fbWFwKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKG9sZEltYWdlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG9sZEltYWdlICYmIG9sZEltYWdlLl9tYXApIHtcclxuICAgICAgICAgICAgICBvbGRJbWFnZS5fbWFwLnJlbW92ZUxheWVyKG9sZEltYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKG5ld0ltYWdlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZmlyZSgnbG9hZCcsIHtcclxuICAgICAgICAgIGJvdW5kczogYm91bmRzXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBJZiBsb2FkaW5nIHRoZSBpbWFnZSBmYWlsc1xyXG4gICAgICBpbWFnZS5vbmNlKCdlcnJvcicsIG9uT3ZlcmxheUVycm9yLCB0aGlzKTtcclxuXHJcbiAgICAgIC8vIG9uY2UgdGhlIGltYWdlIGxvYWRzXHJcbiAgICAgIGltYWdlLm9uY2UoJ2xvYWQnLCBvbk92ZXJsYXlMb2FkLCB0aGlzKTtcclxuXHJcbiAgICAgIHRoaXMuZmlyZSgnbG9hZGluZycsIHtcclxuICAgICAgICBib3VuZHM6IGJvdW5kc1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfdXBkYXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXRoaXMuX21hcCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHpvb20gPSB0aGlzLl9tYXAuZ2V0Wm9vbSgpO1xyXG4gICAgdmFyIGJvdW5kcyA9IHRoaXMuX21hcC5nZXRCb3VuZHMoKTtcclxuXHJcbiAgICBpZiAodGhpcy5fYW5pbWF0aW5nWm9vbSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuX21hcC5fcGFuVHJhbnNpdGlvbiAmJiB0aGlzLl9tYXAuX3BhblRyYW5zaXRpb24uX2luUHJvZ3Jlc3MpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh6b29tID4gdGhpcy5vcHRpb25zLm1heFpvb20gfHwgem9vbSA8IHRoaXMub3B0aW9ucy5taW5ab29tKSB7XHJcbiAgICAgIGlmICh0aGlzLl9jdXJyZW50SW1hZ2UpIHtcclxuICAgICAgICB0aGlzLl9jdXJyZW50SW1hZ2UuX21hcC5yZW1vdmVMYXllcih0aGlzLl9jdXJyZW50SW1hZ2UpO1xyXG4gICAgICAgIHRoaXMuX2N1cnJlbnRJbWFnZSA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBwYXJhbXMgPSB0aGlzLl9idWlsZEV4cG9ydFBhcmFtcygpO1xyXG5cclxuICAgIHRoaXMuX3JlcXVlc3RFeHBvcnQocGFyYW1zLCBib3VuZHMpO1xyXG4gIH0sXHJcblxyXG4gIF9yZW5kZXJQb3B1cDogZnVuY3Rpb24gKGxhdGxuZywgZXJyb3IsIHJlc3VsdHMsIHJlc3BvbnNlKSB7XHJcbiAgICBsYXRsbmcgPSBsYXRMbmcobGF0bG5nKTtcclxuICAgIGlmICh0aGlzLl9zaG91bGRSZW5kZXJQb3B1cCAmJiB0aGlzLl9sYXN0Q2xpY2suZXF1YWxzKGxhdGxuZykpIHtcclxuICAgICAgLy8gYWRkIHRoZSBwb3B1cCB0byB0aGUgbWFwIHdoZXJlIHRoZSBtb3VzZSB3YXMgY2xpY2tlZCBhdFxyXG4gICAgICB2YXIgY29udGVudCA9IHRoaXMuX3BvcHVwRnVuY3Rpb24oZXJyb3IsIHJlc3VsdHMsIHJlc3BvbnNlKTtcclxuICAgICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICB0aGlzLl9wb3B1cC5zZXRMYXRMbmcobGF0bG5nKS5zZXRDb250ZW50KGNvbnRlbnQpLm9wZW5Pbih0aGlzLl9tYXApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgX3Jlc2V0UG9wdXBTdGF0ZTogZnVuY3Rpb24gKGUpIHtcclxuICAgIHRoaXMuX3Nob3VsZFJlbmRlclBvcHVwID0gZmFsc2U7XHJcbiAgICB0aGlzLl9sYXN0Q2xpY2sgPSBlLmxhdGxuZztcclxuICB9LFxyXG5cclxuICBfY2FsY3VsYXRlQmJveDogZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHBpeGVsQm91bmRzID0gdGhpcy5fbWFwLmdldFBpeGVsQm91bmRzKCk7XHJcblxyXG4gICAgdmFyIHN3ID0gdGhpcy5fbWFwLnVucHJvamVjdChwaXhlbEJvdW5kcy5nZXRCb3R0b21MZWZ0KCkpO1xyXG4gICAgdmFyIG5lID0gdGhpcy5fbWFwLnVucHJvamVjdChwaXhlbEJvdW5kcy5nZXRUb3BSaWdodCgpKTtcclxuXHJcbiAgICB2YXIgbmVQcm9qZWN0ZWQgPSB0aGlzLl9tYXAub3B0aW9ucy5jcnMucHJvamVjdChuZSk7XHJcbiAgICB2YXIgc3dQcm9qZWN0ZWQgPSB0aGlzLl9tYXAub3B0aW9ucy5jcnMucHJvamVjdChzdyk7XHJcblxyXG4gICAgLy8gdGhpcyBlbnN1cmVzIG5lL3N3IGFyZSBzd2l0Y2hlZCBpbiBwb2xhciBtYXBzIHdoZXJlIG5vcnRoL3RvcCBib3R0b20vc291dGggaXMgaW52ZXJ0ZWRcclxuICAgIHZhciBib3VuZHNQcm9qZWN0ZWQgPSBib3VuZHMobmVQcm9qZWN0ZWQsIHN3UHJvamVjdGVkKTtcclxuXHJcbiAgICByZXR1cm4gW2JvdW5kc1Byb2plY3RlZC5nZXRCb3R0b21MZWZ0KCkueCwgYm91bmRzUHJvamVjdGVkLmdldEJvdHRvbUxlZnQoKS55LCBib3VuZHNQcm9qZWN0ZWQuZ2V0VG9wUmlnaHQoKS54LCBib3VuZHNQcm9qZWN0ZWQuZ2V0VG9wUmlnaHQoKS55XS5qb2luKCcsJyk7XHJcbiAgfSxcclxuXHJcbiAgX2NhbGN1bGF0ZUltYWdlU2l6ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gZW5zdXJlIHRoYXQgd2UgZG9uJ3QgYXNrIEFyY0dJUyBTZXJ2ZXIgZm9yIGEgdGFsbGVyIGltYWdlIHRoYW4gd2UgaGF2ZSBhY3R1YWwgbWFwIGRpc3BsYXlpbmcgd2l0aGluIHRoZSBkaXZcclxuICAgIHZhciBib3VuZHMgPSB0aGlzLl9tYXAuZ2V0UGl4ZWxCb3VuZHMoKTtcclxuICAgIHZhciBzaXplID0gdGhpcy5fbWFwLmdldFNpemUoKTtcclxuXHJcbiAgICB2YXIgc3cgPSB0aGlzLl9tYXAudW5wcm9qZWN0KGJvdW5kcy5nZXRCb3R0b21MZWZ0KCkpO1xyXG4gICAgdmFyIG5lID0gdGhpcy5fbWFwLnVucHJvamVjdChib3VuZHMuZ2V0VG9wUmlnaHQoKSk7XHJcblxyXG4gICAgdmFyIHRvcCA9IHRoaXMuX21hcC5sYXRMbmdUb0xheWVyUG9pbnQobmUpLnk7XHJcbiAgICB2YXIgYm90dG9tID0gdGhpcy5fbWFwLmxhdExuZ1RvTGF5ZXJQb2ludChzdykueTtcclxuXHJcbiAgICBpZiAodG9wID4gMCB8fCBib3R0b20gPCBzaXplLnkpIHtcclxuICAgICAgc2l6ZS55ID0gYm90dG9tIC0gdG9wO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzaXplLnggKyAnLCcgKyBzaXplLnk7XHJcbiAgfVxyXG59KTtcclxuIiwiaW1wb3J0IHsgVXRpbCB9IGZyb20gJ2xlYWZsZXQnO1xyXG5pbXBvcnQgeyBSYXN0ZXJMYXllciB9IGZyb20gJy4vUmFzdGVyTGF5ZXInO1xyXG5pbXBvcnQgeyBjbGVhblVybCB9IGZyb20gJy4uL1V0aWwnO1xyXG5pbXBvcnQgaW1hZ2VTZXJ2aWNlIGZyb20gJy4uL1NlcnZpY2VzL0ltYWdlU2VydmljZSc7XHJcblxyXG5leHBvcnQgdmFyIEltYWdlTWFwTGF5ZXIgPSBSYXN0ZXJMYXllci5leHRlbmQoe1xyXG5cclxuICBvcHRpb25zOiB7XHJcbiAgICB1cGRhdGVJbnRlcnZhbDogMTUwLFxyXG4gICAgZm9ybWF0OiAnanBncG5nJyxcclxuICAgIHRyYW5zcGFyZW50OiB0cnVlLFxyXG4gICAgZjogJ2ltYWdlJ1xyXG4gIH0sXHJcblxyXG4gIHF1ZXJ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLnF1ZXJ5KCk7XHJcbiAgfSxcclxuXHJcbiAgaWRlbnRpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UuaWRlbnRpZnkoKTtcclxuICB9LFxyXG5cclxuICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucy51cmwgPSBjbGVhblVybChvcHRpb25zLnVybCk7XHJcbiAgICB0aGlzLnNlcnZpY2UgPSBpbWFnZVNlcnZpY2Uob3B0aW9ucyk7XHJcbiAgICB0aGlzLnNlcnZpY2UuYWRkRXZlbnRQYXJlbnQodGhpcyk7XHJcblxyXG4gICAgVXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xyXG4gIH0sXHJcblxyXG4gIHNldFBpeGVsVHlwZTogZnVuY3Rpb24gKHBpeGVsVHlwZSkge1xyXG4gICAgdGhpcy5vcHRpb25zLnBpeGVsVHlwZSA9IHBpeGVsVHlwZTtcclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZ2V0UGl4ZWxUeXBlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnBpeGVsVHlwZTtcclxuICB9LFxyXG5cclxuICBzZXRCYW5kSWRzOiBmdW5jdGlvbiAoYmFuZElkcykge1xyXG4gICAgaWYgKFV0aWwuaXNBcnJheShiYW5kSWRzKSkge1xyXG4gICAgICB0aGlzLm9wdGlvbnMuYmFuZElkcyA9IGJhbmRJZHMuam9pbignLCcpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5vcHRpb25zLmJhbmRJZHMgPSBiYW5kSWRzLnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGdldEJhbmRJZHM6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYmFuZElkcztcclxuICB9LFxyXG5cclxuICBzZXROb0RhdGE6IGZ1bmN0aW9uIChub0RhdGEsIG5vRGF0YUludGVycHJldGF0aW9uKSB7XHJcbiAgICBpZiAoVXRpbC5pc0FycmF5KG5vRGF0YSkpIHtcclxuICAgICAgdGhpcy5vcHRpb25zLm5vRGF0YSA9IG5vRGF0YS5qb2luKCcsJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm9wdGlvbnMubm9EYXRhID0gbm9EYXRhLnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBpZiAobm9EYXRhSW50ZXJwcmV0YXRpb24pIHtcclxuICAgICAgdGhpcy5vcHRpb25zLm5vRGF0YUludGVycHJldGF0aW9uID0gbm9EYXRhSW50ZXJwcmV0YXRpb247XHJcbiAgICB9XHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGdldE5vRGF0YTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5ub0RhdGE7XHJcbiAgfSxcclxuXHJcbiAgZ2V0Tm9EYXRhSW50ZXJwcmV0YXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMubm9EYXRhSW50ZXJwcmV0YXRpb247XHJcbiAgfSxcclxuXHJcbiAgc2V0UmVuZGVyaW5nUnVsZTogZnVuY3Rpb24gKHJlbmRlcmluZ1J1bGUpIHtcclxuICAgIHRoaXMub3B0aW9ucy5yZW5kZXJpbmdSdWxlID0gcmVuZGVyaW5nUnVsZTtcclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gIH0sXHJcblxyXG4gIGdldFJlbmRlcmluZ1J1bGU6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMucmVuZGVyaW5nUnVsZTtcclxuICB9LFxyXG5cclxuICBzZXRNb3NhaWNSdWxlOiBmdW5jdGlvbiAobW9zYWljUnVsZSkge1xyXG4gICAgdGhpcy5vcHRpb25zLm1vc2FpY1J1bGUgPSBtb3NhaWNSdWxlO1xyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0TW9zYWljUnVsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5tb3NhaWNSdWxlO1xyXG4gIH0sXHJcblxyXG4gIF9nZXRQb3B1cERhdGE6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICB2YXIgY2FsbGJhY2sgPSBVdGlsLmJpbmQoZnVuY3Rpb24gKGVycm9yLCByZXN1bHRzLCByZXNwb25zZSkge1xyXG4gICAgICBpZiAoZXJyb3IpIHsgcmV0dXJuOyB9IC8vIHdlIHJlYWxseSBjYW4ndCBkbyBhbnl0aGluZyBoZXJlIGJ1dCBhdXRoZW50aWNhdGUgb3IgcmVxdWVzdGVycm9yIHdpbGwgZmlyZVxyXG4gICAgICBzZXRUaW1lb3V0KFV0aWwuYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5fcmVuZGVyUG9wdXAoZS5sYXRsbmcsIGVycm9yLCByZXN1bHRzLCByZXNwb25zZSk7XHJcbiAgICAgIH0sIHRoaXMpLCAzMDApO1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdmFyIGlkZW50aWZ5UmVxdWVzdCA9IHRoaXMuaWRlbnRpZnkoKS5hdChlLmxhdGxuZyk7XHJcblxyXG4gICAgLy8gc2V0IG1vc2FpYyBydWxlIGZvciBpZGVudGlmeSB0YXNrIGlmIGl0IGlzIHNldCBmb3IgbGF5ZXJcclxuICAgIGlmICh0aGlzLm9wdGlvbnMubW9zYWljUnVsZSkge1xyXG4gICAgICBpZGVudGlmeVJlcXVlc3Quc2V0TW9zYWljUnVsZSh0aGlzLm9wdGlvbnMubW9zYWljUnVsZSk7XHJcbiAgICAgIC8vIEBUT0RPOiBmb3JjZSByZXR1cm4gY2F0YWxvZyBpdGVtcyB0b28/XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQFRPRE86IHNldCByZW5kZXJpbmcgcnVsZT8gTm90IHN1cmUsXHJcbiAgICAvLyBzb21ldGltZXMgeW91IHdhbnQgcmF3IHBpeGVsIHZhbHVlc1xyXG4gICAgLy8gaWYgKHRoaXMub3B0aW9ucy5yZW5kZXJpbmdSdWxlKSB7XHJcbiAgICAvLyAgIGlkZW50aWZ5UmVxdWVzdC5zZXRSZW5kZXJpbmdSdWxlKHRoaXMub3B0aW9ucy5yZW5kZXJpbmdSdWxlKTtcclxuICAgIC8vIH1cclxuXHJcbiAgICBpZGVudGlmeVJlcXVlc3QucnVuKGNhbGxiYWNrKTtcclxuXHJcbiAgICAvLyBzZXQgdGhlIGZsYWdzIHRvIHNob3cgdGhlIHBvcHVwXHJcbiAgICB0aGlzLl9zaG91bGRSZW5kZXJQb3B1cCA9IHRydWU7XHJcbiAgICB0aGlzLl9sYXN0Q2xpY2sgPSBlLmxhdGxuZztcclxuICB9LFxyXG5cclxuICBfYnVpbGRFeHBvcnRQYXJhbXM6IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzciA9IHBhcnNlSW50KHRoaXMuX21hcC5vcHRpb25zLmNycy5jb2RlLnNwbGl0KCc6JylbMV0sIDEwKTtcclxuXHJcbiAgICB2YXIgcGFyYW1zID0ge1xyXG4gICAgICBiYm94OiB0aGlzLl9jYWxjdWxhdGVCYm94KCksXHJcbiAgICAgIHNpemU6IHRoaXMuX2NhbGN1bGF0ZUltYWdlU2l6ZSgpLFxyXG4gICAgICBmb3JtYXQ6IHRoaXMub3B0aW9ucy5mb3JtYXQsXHJcbiAgICAgIHRyYW5zcGFyZW50OiB0aGlzLm9wdGlvbnMudHJhbnNwYXJlbnQsXHJcbiAgICAgIGJib3hTUjogc3IsXHJcbiAgICAgIGltYWdlU1I6IHNyXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZnJvbSAmJiB0aGlzLm9wdGlvbnMudG8pIHtcclxuICAgICAgcGFyYW1zLnRpbWUgPSB0aGlzLm9wdGlvbnMuZnJvbS52YWx1ZU9mKCkgKyAnLCcgKyB0aGlzLm9wdGlvbnMudG8udmFsdWVPZigpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMucGl4ZWxUeXBlKSB7XHJcbiAgICAgIHBhcmFtcy5waXhlbFR5cGUgPSB0aGlzLm9wdGlvbnMucGl4ZWxUeXBlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbikge1xyXG4gICAgICBwYXJhbXMuaW50ZXJwb2xhdGlvbiA9IHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29tcHJlc3Npb25RdWFsaXR5KSB7XHJcbiAgICAgIHBhcmFtcy5jb21wcmVzc2lvblF1YWxpdHkgPSB0aGlzLm9wdGlvbnMuY29tcHJlc3Npb25RdWFsaXR5O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuYmFuZElkcykge1xyXG4gICAgICBwYXJhbXMuYmFuZElkcyA9IHRoaXMub3B0aW9ucy5iYW5kSWRzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIDAgaXMgZmFsc3kgKmFuZCogYSB2YWxpZCBpbnB1dCBwYXJhbWV0ZXJcclxuICAgIGlmICh0aGlzLm9wdGlvbnMubm9EYXRhID09PSAwIHx8IHRoaXMub3B0aW9ucy5ub0RhdGEpIHtcclxuICAgICAgcGFyYW1zLm5vRGF0YSA9IHRoaXMub3B0aW9ucy5ub0RhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5ub0RhdGFJbnRlcnByZXRhdGlvbikge1xyXG4gICAgICBwYXJhbXMubm9EYXRhSW50ZXJwcmV0YXRpb24gPSB0aGlzLm9wdGlvbnMubm9EYXRhSW50ZXJwcmV0YXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuc2VydmljZS5vcHRpb25zLnRva2VuKSB7XHJcbiAgICAgIHBhcmFtcy50b2tlbiA9IHRoaXMuc2VydmljZS5vcHRpb25zLnRva2VuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMucmVuZGVyaW5nUnVsZSkge1xyXG4gICAgICBwYXJhbXMucmVuZGVyaW5nUnVsZSA9IEpTT04uc3RyaW5naWZ5KHRoaXMub3B0aW9ucy5yZW5kZXJpbmdSdWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLm1vc2FpY1J1bGUpIHtcclxuICAgICAgcGFyYW1zLm1vc2FpY1J1bGUgPSBKU09OLnN0cmluZ2lmeSh0aGlzLm9wdGlvbnMubW9zYWljUnVsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHBhcmFtcztcclxuICB9LFxyXG5cclxuICBfcmVxdWVzdEV4cG9ydDogZnVuY3Rpb24gKHBhcmFtcywgYm91bmRzKSB7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmYgPT09ICdqc29uJykge1xyXG4gICAgICB0aGlzLnNlcnZpY2UucmVxdWVzdCgnZXhwb3J0SW1hZ2UnLCBwYXJhbXMsIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgICBpZiAoZXJyb3IpIHsgcmV0dXJuOyB9IC8vIHdlIHJlYWxseSBjYW4ndCBkbyBhbnl0aGluZyBoZXJlIGJ1dCBhdXRoZW50aWNhdGUgb3IgcmVxdWVzdGVycm9yIHdpbGwgZmlyZVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudG9rZW4pIHtcclxuICAgICAgICAgIHJlc3BvbnNlLmhyZWYgKz0gKCc/dG9rZW49JyArIHRoaXMub3B0aW9ucy50b2tlbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3JlbmRlckltYWdlKHJlc3BvbnNlLmhyZWYsIGJvdW5kcyk7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcGFyYW1zLmYgPSAnaW1hZ2UnO1xyXG4gICAgICB0aGlzLl9yZW5kZXJJbWFnZSh0aGlzLm9wdGlvbnMudXJsICsgJ2V4cG9ydEltYWdlJyArIFV0aWwuZ2V0UGFyYW1TdHJpbmcocGFyYW1zKSwgYm91bmRzKTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGltYWdlTWFwTGF5ZXIgKHVybCwgb3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgSW1hZ2VNYXBMYXllcih1cmwsIG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpbWFnZU1hcExheWVyO1xyXG4iLCJpbXBvcnQgeyBVdGlsIH0gZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCB7IFJhc3RlckxheWVyIH0gZnJvbSAnLi9SYXN0ZXJMYXllcic7XHJcbmltcG9ydCB7IGNsZWFuVXJsIH0gZnJvbSAnLi4vVXRpbCc7XHJcbmltcG9ydCBtYXBTZXJ2aWNlIGZyb20gJy4uL1NlcnZpY2VzL01hcFNlcnZpY2UnO1xyXG5cclxuZXhwb3J0IHZhciBEeW5hbWljTWFwTGF5ZXIgPSBSYXN0ZXJMYXllci5leHRlbmQoe1xyXG5cclxuICBvcHRpb25zOiB7XHJcbiAgICB1cGRhdGVJbnRlcnZhbDogMTUwLFxyXG4gICAgbGF5ZXJzOiBmYWxzZSxcclxuICAgIGxheWVyRGVmczogZmFsc2UsXHJcbiAgICB0aW1lT3B0aW9uczogZmFsc2UsXHJcbiAgICBmb3JtYXQ6ICdwbmcyNCcsXHJcbiAgICB0cmFuc3BhcmVudDogdHJ1ZSxcclxuICAgIGY6ICdqc29uJ1xyXG4gIH0sXHJcblxyXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zLnVybCA9IGNsZWFuVXJsKG9wdGlvbnMudXJsKTtcclxuICAgIHRoaXMuc2VydmljZSA9IG1hcFNlcnZpY2Uob3B0aW9ucyk7XHJcbiAgICB0aGlzLnNlcnZpY2UuYWRkRXZlbnRQYXJlbnQodGhpcyk7XHJcblxyXG4gICAgaWYgKChvcHRpb25zLnByb3h5IHx8IG9wdGlvbnMudG9rZW4pICYmIG9wdGlvbnMuZiAhPT0gJ2pzb24nKSB7XHJcbiAgICAgIG9wdGlvbnMuZiA9ICdqc29uJztcclxuICAgIH1cclxuXHJcbiAgICBVdGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0RHluYW1pY0xheWVyczogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5keW5hbWljTGF5ZXJzO1xyXG4gIH0sXHJcblxyXG4gIHNldER5bmFtaWNMYXllcnM6IGZ1bmN0aW9uIChkeW5hbWljTGF5ZXJzKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMuZHluYW1pY0xheWVycyA9IGR5bmFtaWNMYXllcnM7XHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGdldExheWVyczogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5sYXllcnM7XHJcbiAgfSxcclxuXHJcbiAgc2V0TGF5ZXJzOiBmdW5jdGlvbiAobGF5ZXJzKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMubGF5ZXJzID0gbGF5ZXJzO1xyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBnZXRMYXllckRlZnM6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMubGF5ZXJEZWZzO1xyXG4gIH0sXHJcblxyXG4gIHNldExheWVyRGVmczogZnVuY3Rpb24gKGxheWVyRGVmcykge1xyXG4gICAgdGhpcy5vcHRpb25zLmxheWVyRGVmcyA9IGxheWVyRGVmcztcclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZ2V0VGltZU9wdGlvbnM6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudGltZU9wdGlvbnM7XHJcbiAgfSxcclxuXHJcbiAgc2V0VGltZU9wdGlvbnM6IGZ1bmN0aW9uICh0aW1lT3B0aW9ucykge1xyXG4gICAgdGhpcy5vcHRpb25zLnRpbWVPcHRpb25zID0gdGltZU9wdGlvbnM7XHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIHF1ZXJ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLnF1ZXJ5KCk7XHJcbiAgfSxcclxuXHJcbiAgaWRlbnRpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UuaWRlbnRpZnkoKTtcclxuICB9LFxyXG5cclxuICBmaW5kOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLmZpbmQoKTtcclxuICB9LFxyXG5cclxuICBfZ2V0UG9wdXBEYXRhOiBmdW5jdGlvbiAoZSkge1xyXG4gICAgdmFyIGNhbGxiYWNrID0gVXRpbC5iaW5kKGZ1bmN0aW9uIChlcnJvciwgZmVhdHVyZUNvbGxlY3Rpb24sIHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmIChlcnJvcikgeyByZXR1cm47IH0gLy8gd2UgcmVhbGx5IGNhbid0IGRvIGFueXRoaW5nIGhlcmUgYnV0IGF1dGhlbnRpY2F0ZSBvciByZXF1ZXN0ZXJyb3Igd2lsbCBmaXJlXHJcbiAgICAgIHNldFRpbWVvdXQoVXRpbC5iaW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLl9yZW5kZXJQb3B1cChlLmxhdGxuZywgZXJyb3IsIGZlYXR1cmVDb2xsZWN0aW9uLCByZXNwb25zZSk7XHJcbiAgICAgIH0sIHRoaXMpLCAzMDApO1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdmFyIGlkZW50aWZ5UmVxdWVzdCA9IHRoaXMuaWRlbnRpZnkoKS5vbih0aGlzLl9tYXApLmF0KGUubGF0bG5nKTtcclxuXHJcbiAgICAvLyByZW1vdmUgZXh0cmFuZW91cyB2ZXJ0aWNlcyBmcm9tIHJlc3BvbnNlIGZlYXR1cmVzXHJcbiAgICBpZGVudGlmeVJlcXVlc3Quc2ltcGxpZnkodGhpcy5fbWFwLCAwLjUpO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMubGF5ZXJzKSB7XHJcbiAgICAgIGlkZW50aWZ5UmVxdWVzdC5sYXllcnMoJ3Zpc2libGU6JyArIHRoaXMub3B0aW9ucy5sYXllcnMuam9pbignLCcpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlkZW50aWZ5UmVxdWVzdC5sYXllcnMoJ3Zpc2libGUnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiBwcmVzZW50LCBwYXNzIGxheWVyIGlkcyBhbmQgc3FsIGZpbHRlcnMgdGhyb3VnaCB0byB0aGUgaWRlbnRpZnkgdGFza1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5sYXllckRlZnMgJiYgdHlwZW9mIHRoaXMub3B0aW9ucy5sYXllckRlZnMgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGZvciAodmFyIGlkIGluIHRoaXMub3B0aW9ucy5sYXllckRlZnMpIHtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmxheWVyRGVmcy5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcclxuICAgICAgICAgIGlkZW50aWZ5UmVxdWVzdC5sYXllckRlZihpZCwgdGhpcy5vcHRpb25zLmxheWVyRGVmc1tpZF0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlkZW50aWZ5UmVxdWVzdC5ydW4oY2FsbGJhY2spO1xyXG5cclxuICAgIC8vIHNldCB0aGUgZmxhZ3MgdG8gc2hvdyB0aGUgcG9wdXBcclxuICAgIHRoaXMuX3Nob3VsZFJlbmRlclBvcHVwID0gdHJ1ZTtcclxuICAgIHRoaXMuX2xhc3RDbGljayA9IGUubGF0bG5nO1xyXG4gIH0sXHJcblxyXG4gIF9idWlsZEV4cG9ydFBhcmFtczogZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNyID0gcGFyc2VJbnQodGhpcy5fbWFwLm9wdGlvbnMuY3JzLmNvZGUuc3BsaXQoJzonKVsxXSwgMTApO1xyXG5cclxuICAgIHZhciBwYXJhbXMgPSB7XHJcbiAgICAgIGJib3g6IHRoaXMuX2NhbGN1bGF0ZUJib3goKSxcclxuICAgICAgc2l6ZTogdGhpcy5fY2FsY3VsYXRlSW1hZ2VTaXplKCksXHJcbiAgICAgIGRwaTogOTYsXHJcbiAgICAgIGZvcm1hdDogdGhpcy5vcHRpb25zLmZvcm1hdCxcclxuICAgICAgdHJhbnNwYXJlbnQ6IHRoaXMub3B0aW9ucy50cmFuc3BhcmVudCxcclxuICAgICAgYmJveFNSOiBzcixcclxuICAgICAgaW1hZ2VTUjogc3JcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5keW5hbWljTGF5ZXJzKSB7XHJcbiAgICAgIHBhcmFtcy5keW5hbWljTGF5ZXJzID0gdGhpcy5vcHRpb25zLmR5bmFtaWNMYXllcnM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5sYXllcnMpIHtcclxuICAgICAgcGFyYW1zLmxheWVycyA9ICdzaG93OicgKyB0aGlzLm9wdGlvbnMubGF5ZXJzLmpvaW4oJywnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmxheWVyRGVmcykge1xyXG4gICAgICBwYXJhbXMubGF5ZXJEZWZzID0gdHlwZW9mIHRoaXMub3B0aW9ucy5sYXllckRlZnMgPT09ICdzdHJpbmcnID8gdGhpcy5vcHRpb25zLmxheWVyRGVmcyA6IEpTT04uc3RyaW5naWZ5KHRoaXMub3B0aW9ucy5sYXllckRlZnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudGltZU9wdGlvbnMpIHtcclxuICAgICAgcGFyYW1zLnRpbWVPcHRpb25zID0gSlNPTi5zdHJpbmdpZnkodGhpcy5vcHRpb25zLnRpbWVPcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmZyb20gJiYgdGhpcy5vcHRpb25zLnRvKSB7XHJcbiAgICAgIHBhcmFtcy50aW1lID0gdGhpcy5vcHRpb25zLmZyb20udmFsdWVPZigpICsgJywnICsgdGhpcy5vcHRpb25zLnRvLnZhbHVlT2YoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5zZXJ2aWNlLm9wdGlvbnMudG9rZW4pIHtcclxuICAgICAgcGFyYW1zLnRva2VuID0gdGhpcy5zZXJ2aWNlLm9wdGlvbnMudG9rZW47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5wcm94eSkge1xyXG4gICAgICBwYXJhbXMucHJveHkgPSB0aGlzLm9wdGlvbnMucHJveHk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdXNlIGEgdGltZXN0YW1wIHRvIGJ1c3Qgc2VydmVyIGNhY2hlXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmRpc2FibGVDYWNoZSkge1xyXG4gICAgICBwYXJhbXMuX3RzID0gRGF0ZS5ub3coKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGFyYW1zO1xyXG4gIH0sXHJcblxyXG4gIF9yZXF1ZXN0RXhwb3J0OiBmdW5jdGlvbiAocGFyYW1zLCBib3VuZHMpIHtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZiA9PT0gJ2pzb24nKSB7XHJcbiAgICAgIHRoaXMuc2VydmljZS5yZXF1ZXN0KCdleHBvcnQnLCBwYXJhbXMsIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgICBpZiAoZXJyb3IpIHsgcmV0dXJuOyB9IC8vIHdlIHJlYWxseSBjYW4ndCBkbyBhbnl0aGluZyBoZXJlIGJ1dCBhdXRoZW50aWNhdGUgb3IgcmVxdWVzdGVycm9yIHdpbGwgZmlyZVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRva2VuKSB7XHJcbiAgICAgICAgICByZXNwb25zZS5ocmVmICs9ICgnP3Rva2VuPScgKyB0aGlzLm9wdGlvbnMudG9rZW4pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnByb3h5KSB7XHJcbiAgICAgICAgICByZXNwb25zZS5ocmVmID0gdGhpcy5vcHRpb25zLnByb3h5ICsgJz8nICsgcmVzcG9uc2UuaHJlZjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlc3BvbnNlLmhyZWYpIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlckltYWdlKHJlc3BvbnNlLmhyZWYsIGJvdW5kcyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlckltYWdlKHJlc3BvbnNlLmltYWdlRGF0YSwgYm91bmRzLCByZXNwb25zZS5jb250ZW50VHlwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHBhcmFtcy5mID0gJ2ltYWdlJztcclxuICAgICAgdGhpcy5fcmVuZGVySW1hZ2UodGhpcy5vcHRpb25zLnVybCArICdleHBvcnQnICsgVXRpbC5nZXRQYXJhbVN0cmluZyhwYXJhbXMpLCBib3VuZHMpO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZHluYW1pY01hcExheWVyICh1cmwsIG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IER5bmFtaWNNYXBMYXllcih1cmwsIG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkeW5hbWljTWFwTGF5ZXI7XHJcbiIsImltcG9ydCBMIGZyb20gJ2xlYWZsZXQnO1xuXG52YXIgVmlydHVhbEdyaWQgPSBMLkxheWVyLmV4dGVuZCh7XG5cbiAgb3B0aW9uczoge1xuICAgIGNlbGxTaXplOiA1MTIsXG4gICAgdXBkYXRlSW50ZXJ2YWw6IDE1MFxuICB9LFxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICB0aGlzLl96b29taW5nID0gZmFsc2U7XG4gIH0sXG5cbiAgb25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcbiAgICB0aGlzLl9tYXAgPSBtYXA7XG4gICAgdGhpcy5fdXBkYXRlID0gTC5VdGlsLnRocm90dGxlKHRoaXMuX3VwZGF0ZSwgdGhpcy5vcHRpb25zLnVwZGF0ZUludGVydmFsLCB0aGlzKTtcbiAgICB0aGlzLl9yZXNldCgpO1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9LFxuXG4gIG9uUmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fbWFwLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5nZXRFdmVudHMoKSwgdGhpcyk7XG4gICAgdGhpcy5fcmVtb3ZlQ2VsbHMoKTtcbiAgfSxcblxuICBnZXRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXZlbnRzID0ge1xuICAgICAgbW92ZWVuZDogdGhpcy5fdXBkYXRlLFxuICAgICAgem9vbXN0YXJ0OiB0aGlzLl96b29tc3RhcnQsXG4gICAgICB6b29tZW5kOiB0aGlzLl9yZXNldFxuICAgIH07XG5cbiAgICByZXR1cm4gZXZlbnRzO1xuICB9LFxuXG4gIGFkZFRvOiBmdW5jdGlvbiAobWFwKSB7XG4gICAgbWFwLmFkZExheWVyKHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHJlbW92ZUZyb206IGZ1bmN0aW9uIChtYXApIHtcbiAgICBtYXAucmVtb3ZlTGF5ZXIodGhpcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgX3pvb21zdGFydDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3pvb21pbmcgPSB0cnVlO1xuICB9LFxuXG4gIF9yZXNldDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3JlbW92ZUNlbGxzKCk7XG5cbiAgICB0aGlzLl9jZWxscyA9IHt9O1xuICAgIHRoaXMuX2FjdGl2ZUNlbGxzID0ge307XG4gICAgdGhpcy5fY2VsbHNUb0xvYWQgPSAwO1xuICAgIHRoaXMuX2NlbGxzVG90YWwgPSAwO1xuICAgIHRoaXMuX2NlbGxOdW1Cb3VuZHMgPSB0aGlzLl9nZXRDZWxsTnVtQm91bmRzKCk7XG5cbiAgICB0aGlzLl9yZXNldFdyYXAoKTtcbiAgICB0aGlzLl96b29taW5nID0gZmFsc2U7XG4gIH0sXG5cbiAgX3Jlc2V0V3JhcDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBtYXAgPSB0aGlzLl9tYXA7XG4gICAgdmFyIGNycyA9IG1hcC5vcHRpb25zLmNycztcblxuICAgIGlmIChjcnMuaW5maW5pdGUpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgY2VsbFNpemUgPSB0aGlzLl9nZXRDZWxsU2l6ZSgpO1xuXG4gICAgaWYgKGNycy53cmFwTG5nKSB7XG4gICAgICB0aGlzLl93cmFwTG5nID0gW1xuICAgICAgICBNYXRoLmZsb29yKG1hcC5wcm9qZWN0KFswLCBjcnMud3JhcExuZ1swXV0pLnggLyBjZWxsU2l6ZSksXG4gICAgICAgIE1hdGguY2VpbChtYXAucHJvamVjdChbMCwgY3JzLndyYXBMbmdbMV1dKS54IC8gY2VsbFNpemUpXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmIChjcnMud3JhcExhdCkge1xuICAgICAgdGhpcy5fd3JhcExhdCA9IFtcbiAgICAgICAgTWF0aC5mbG9vcihtYXAucHJvamVjdChbY3JzLndyYXBMYXRbMF0sIDBdKS55IC8gY2VsbFNpemUpLFxuICAgICAgICBNYXRoLmNlaWwobWFwLnByb2plY3QoW2Nycy53cmFwTGF0WzFdLCAwXSkueSAvIGNlbGxTaXplKVxuICAgICAgXTtcbiAgICB9XG4gIH0sXG5cbiAgX2dldENlbGxTaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jZWxsU2l6ZTtcbiAgfSxcblxuICBfdXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLl9tYXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYm91bmRzID0gdGhpcy5fbWFwLmdldFBpeGVsQm91bmRzKCk7XG4gICAgdmFyIGNlbGxTaXplID0gdGhpcy5fZ2V0Q2VsbFNpemUoKTtcblxuICAgIC8vIGNlbGwgY29vcmRpbmF0ZXMgcmFuZ2UgZm9yIHRoZSBjdXJyZW50IHZpZXdcbiAgICB2YXIgY2VsbEJvdW5kcyA9IEwuYm91bmRzKFxuICAgICAgYm91bmRzLm1pbi5kaXZpZGVCeShjZWxsU2l6ZSkuZmxvb3IoKSxcbiAgICAgIGJvdW5kcy5tYXguZGl2aWRlQnkoY2VsbFNpemUpLmZsb29yKCkpO1xuXG4gICAgdGhpcy5fcmVtb3ZlT3RoZXJDZWxscyhjZWxsQm91bmRzKTtcbiAgICB0aGlzLl9hZGRDZWxscyhjZWxsQm91bmRzKTtcblxuICAgIHRoaXMuZmlyZSgnY2VsbHN1cGRhdGVkJyk7XG4gIH0sXG5cbiAgX2FkZENlbGxzOiBmdW5jdGlvbiAoYm91bmRzKSB7XG4gICAgdmFyIHF1ZXVlID0gW107XG4gICAgdmFyIGNlbnRlciA9IGJvdW5kcy5nZXRDZW50ZXIoKTtcbiAgICB2YXIgem9vbSA9IHRoaXMuX21hcC5nZXRab29tKCk7XG5cbiAgICB2YXIgaiwgaSwgY29vcmRzO1xuICAgIC8vIGNyZWF0ZSBhIHF1ZXVlIG9mIGNvb3JkaW5hdGVzIHRvIGxvYWQgY2VsbHMgZnJvbVxuICAgIGZvciAoaiA9IGJvdW5kcy5taW4ueTsgaiA8PSBib3VuZHMubWF4Lnk7IGorKykge1xuICAgICAgZm9yIChpID0gYm91bmRzLm1pbi54OyBpIDw9IGJvdW5kcy5tYXgueDsgaSsrKSB7XG4gICAgICAgIGNvb3JkcyA9IEwucG9pbnQoaSwgaik7XG4gICAgICAgIGNvb3Jkcy56ID0gem9vbTtcblxuICAgICAgICBpZiAodGhpcy5faXNWYWxpZENlbGwoY29vcmRzKSkge1xuICAgICAgICAgIHF1ZXVlLnB1c2goY29vcmRzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjZWxsc1RvTG9hZCA9IHF1ZXVlLmxlbmd0aDtcblxuICAgIGlmIChjZWxsc1RvTG9hZCA9PT0gMCkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuX2NlbGxzVG9Mb2FkICs9IGNlbGxzVG9Mb2FkO1xuICAgIHRoaXMuX2NlbGxzVG90YWwgKz0gY2VsbHNUb0xvYWQ7XG5cbiAgICAvLyBzb3J0IGNlbGwgcXVldWUgdG8gbG9hZCBjZWxscyBpbiBvcmRlciBvZiB0aGVpciBkaXN0YW5jZSB0byBjZW50ZXJcbiAgICBxdWV1ZS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICByZXR1cm4gYS5kaXN0YW5jZVRvKGNlbnRlcikgLSBiLmRpc3RhbmNlVG8oY2VudGVyKTtcbiAgICB9KTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBjZWxsc1RvTG9hZDsgaSsrKSB7XG4gICAgICB0aGlzLl9hZGRDZWxsKHF1ZXVlW2ldKTtcbiAgICB9XG4gIH0sXG5cbiAgX2lzVmFsaWRDZWxsOiBmdW5jdGlvbiAoY29vcmRzKSB7XG4gICAgdmFyIGNycyA9IHRoaXMuX21hcC5vcHRpb25zLmNycztcblxuICAgIGlmICghY3JzLmluZmluaXRlKSB7XG4gICAgICAvLyBkb24ndCBsb2FkIGNlbGwgaWYgaXQncyBvdXQgb2YgYm91bmRzIGFuZCBub3Qgd3JhcHBlZFxuICAgICAgdmFyIGJvdW5kcyA9IHRoaXMuX2NlbGxOdW1Cb3VuZHM7XG4gICAgICBpZiAoXG4gICAgICAgICghY3JzLndyYXBMbmcgJiYgKGNvb3Jkcy54IDwgYm91bmRzLm1pbi54IHx8IGNvb3Jkcy54ID4gYm91bmRzLm1heC54KSkgfHxcbiAgICAgICAgKCFjcnMud3JhcExhdCAmJiAoY29vcmRzLnkgPCBib3VuZHMubWluLnkgfHwgY29vcmRzLnkgPiBib3VuZHMubWF4LnkpKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5ib3VuZHMpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIGRvbid0IGxvYWQgY2VsbCBpZiBpdCBkb2Vzbid0IGludGVyc2VjdCB0aGUgYm91bmRzIGluIG9wdGlvbnNcbiAgICB2YXIgY2VsbEJvdW5kcyA9IHRoaXMuX2NlbGxDb29yZHNUb0JvdW5kcyhjb29yZHMpO1xuICAgIHJldHVybiBMLmxhdExuZ0JvdW5kcyh0aGlzLm9wdGlvbnMuYm91bmRzKS5pbnRlcnNlY3RzKGNlbGxCb3VuZHMpO1xuICB9LFxuXG4gIC8vIGNvbnZlcnRzIGNlbGwgY29vcmRpbmF0ZXMgdG8gaXRzIGdlb2dyYXBoaWNhbCBib3VuZHNcbiAgX2NlbGxDb29yZHNUb0JvdW5kczogZnVuY3Rpb24gKGNvb3Jkcykge1xuICAgIHZhciBtYXAgPSB0aGlzLl9tYXA7XG4gICAgdmFyIGNlbGxTaXplID0gdGhpcy5vcHRpb25zLmNlbGxTaXplO1xuICAgIHZhciBud1BvaW50ID0gY29vcmRzLm11bHRpcGx5QnkoY2VsbFNpemUpO1xuICAgIHZhciBzZVBvaW50ID0gbndQb2ludC5hZGQoW2NlbGxTaXplLCBjZWxsU2l6ZV0pO1xuICAgIHZhciBudyA9IG1hcC53cmFwTGF0TG5nKG1hcC51bnByb2plY3QobndQb2ludCwgY29vcmRzLnopKTtcbiAgICB2YXIgc2UgPSBtYXAud3JhcExhdExuZyhtYXAudW5wcm9qZWN0KHNlUG9pbnQsIGNvb3Jkcy56KSk7XG5cbiAgICByZXR1cm4gTC5sYXRMbmdCb3VuZHMobncsIHNlKTtcbiAgfSxcblxuICAvLyBjb252ZXJ0cyBjZWxsIGNvb3JkaW5hdGVzIHRvIGtleSBmb3IgdGhlIGNlbGwgY2FjaGVcbiAgX2NlbGxDb29yZHNUb0tleTogZnVuY3Rpb24gKGNvb3Jkcykge1xuICAgIHJldHVybiBjb29yZHMueCArICc6JyArIGNvb3Jkcy55O1xuICB9LFxuXG4gIC8vIGNvbnZlcnRzIGNlbGwgY2FjaGUga2V5IHRvIGNvb3JkaWFudGVzXG4gIF9rZXlUb0NlbGxDb29yZHM6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIga0FyciA9IGtleS5zcGxpdCgnOicpO1xuICAgIHZhciB4ID0gcGFyc2VJbnQoa0FyclswXSwgMTApO1xuICAgIHZhciB5ID0gcGFyc2VJbnQoa0FyclsxXSwgMTApO1xuXG4gICAgcmV0dXJuIEwucG9pbnQoeCwgeSk7XG4gIH0sXG5cbiAgLy8gcmVtb3ZlIGFueSBwcmVzZW50IGNlbGxzIHRoYXQgYXJlIG9mZiB0aGUgc3BlY2lmaWVkIGJvdW5kc1xuICBfcmVtb3ZlT3RoZXJDZWxsczogZnVuY3Rpb24gKGJvdW5kcykge1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9jZWxscykge1xuICAgICAgaWYgKCFib3VuZHMuY29udGFpbnModGhpcy5fa2V5VG9DZWxsQ29vcmRzKGtleSkpKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZUNlbGwoa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgX3JlbW92ZUNlbGw6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICB2YXIgY2VsbCA9IHRoaXMuX2FjdGl2ZUNlbGxzW2tleV07XG5cbiAgICBpZiAoY2VsbCkge1xuICAgICAgZGVsZXRlIHRoaXMuX2FjdGl2ZUNlbGxzW2tleV07XG5cbiAgICAgIGlmICh0aGlzLmNlbGxMZWF2ZSkge1xuICAgICAgICB0aGlzLmNlbGxMZWF2ZShjZWxsLmJvdW5kcywgY2VsbC5jb29yZHMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmZpcmUoJ2NlbGxsZWF2ZScsIHtcbiAgICAgICAgYm91bmRzOiBjZWxsLmJvdW5kcyxcbiAgICAgICAgY29vcmRzOiBjZWxsLmNvb3Jkc1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIF9yZW1vdmVDZWxsczogZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9jZWxscykge1xuICAgICAgdmFyIGJvdW5kcyA9IHRoaXMuX2NlbGxzW2tleV0uYm91bmRzO1xuICAgICAgdmFyIGNvb3JkcyA9IHRoaXMuX2NlbGxzW2tleV0uY29vcmRzO1xuXG4gICAgICBpZiAodGhpcy5jZWxsTGVhdmUpIHtcbiAgICAgICAgdGhpcy5jZWxsTGVhdmUoYm91bmRzLCBjb29yZHMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmZpcmUoJ2NlbGxsZWF2ZScsIHtcbiAgICAgICAgYm91bmRzOiBib3VuZHMsXG4gICAgICAgIGNvb3JkczogY29vcmRzXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgX2FkZENlbGw6IGZ1bmN0aW9uIChjb29yZHMpIHtcbiAgICAvLyB3cmFwIGNlbGwgY29vcmRzIGlmIG5lY2Vzc2FyeSAoZGVwZW5kaW5nIG9uIENSUylcbiAgICB0aGlzLl93cmFwQ29vcmRzKGNvb3Jkcyk7XG5cbiAgICAvLyBnZW5lcmF0ZSB0aGUgY2VsbCBrZXlcbiAgICB2YXIga2V5ID0gdGhpcy5fY2VsbENvb3Jkc1RvS2V5KGNvb3Jkcyk7XG5cbiAgICAvLyBnZXQgdGhlIGNlbGwgZnJvbSB0aGUgY2FjaGVcbiAgICB2YXIgY2VsbCA9IHRoaXMuX2NlbGxzW2tleV07XG4gICAgLy8gaWYgdGhpcyBjZWxsIHNob3VsZCBiZSBzaG93biBhcyBpc250IGFjdGl2ZSB5ZXQgKGVudGVyKVxuXG4gICAgaWYgKGNlbGwgJiYgIXRoaXMuX2FjdGl2ZUNlbGxzW2tleV0pIHtcbiAgICAgIGlmICh0aGlzLmNlbGxFbnRlcikge1xuICAgICAgICB0aGlzLmNlbGxFbnRlcihjZWxsLmJvdW5kcywgY29vcmRzKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5maXJlKCdjZWxsZW50ZXInLCB7XG4gICAgICAgIGJvdW5kczogY2VsbC5ib3VuZHMsXG4gICAgICAgIGNvb3JkczogY29vcmRzXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fYWN0aXZlQ2VsbHNba2V5XSA9IGNlbGw7XG4gICAgfVxuXG4gICAgLy8gaWYgd2UgZG9udCBoYXZlIHRoaXMgY2VsbCBpbiB0aGUgY2FjaGUgeWV0IChjcmVhdGUpXG4gICAgaWYgKCFjZWxsKSB7XG4gICAgICBjZWxsID0ge1xuICAgICAgICBjb29yZHM6IGNvb3JkcyxcbiAgICAgICAgYm91bmRzOiB0aGlzLl9jZWxsQ29vcmRzVG9Cb3VuZHMoY29vcmRzKVxuICAgICAgfTtcblxuICAgICAgdGhpcy5fY2VsbHNba2V5XSA9IGNlbGw7XG4gICAgICB0aGlzLl9hY3RpdmVDZWxsc1trZXldID0gY2VsbDtcblxuICAgICAgaWYgKHRoaXMuY3JlYXRlQ2VsbCkge1xuICAgICAgICB0aGlzLmNyZWF0ZUNlbGwoY2VsbC5ib3VuZHMsIGNvb3Jkcyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZmlyZSgnY2VsbGNyZWF0ZScsIHtcbiAgICAgICAgYm91bmRzOiBjZWxsLmJvdW5kcyxcbiAgICAgICAgY29vcmRzOiBjb29yZHNcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBfd3JhcENvb3JkczogZnVuY3Rpb24gKGNvb3Jkcykge1xuICAgIGNvb3Jkcy54ID0gdGhpcy5fd3JhcExuZyA/IEwuVXRpbC53cmFwTnVtKGNvb3Jkcy54LCB0aGlzLl93cmFwTG5nKSA6IGNvb3Jkcy54O1xuICAgIGNvb3Jkcy55ID0gdGhpcy5fd3JhcExhdCA/IEwuVXRpbC53cmFwTnVtKGNvb3Jkcy55LCB0aGlzLl93cmFwTGF0KSA6IGNvb3Jkcy55O1xuICB9LFxuXG4gIC8vIGdldCB0aGUgZ2xvYmFsIGNlbGwgY29vcmRpbmF0ZXMgcmFuZ2UgZm9yIHRoZSBjdXJyZW50IHpvb21cbiAgX2dldENlbGxOdW1Cb3VuZHM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYm91bmRzID0gdGhpcy5fbWFwLmdldFBpeGVsV29ybGRCb3VuZHMoKTtcbiAgICB2YXIgc2l6ZSA9IHRoaXMuX2dldENlbGxTaXplKCk7XG5cbiAgICByZXR1cm4gYm91bmRzID8gTC5ib3VuZHMoXG4gICAgICAgIGJvdW5kcy5taW4uZGl2aWRlQnkoc2l6ZSkuZmxvb3IoKSxcbiAgICAgICAgYm91bmRzLm1heC5kaXZpZGVCeShzaXplKS5jZWlsKCkuc3VidHJhY3QoWzEsIDFdKSkgOiBudWxsO1xuICB9XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgVmlydHVhbEdyaWQ7XG4iLCJmdW5jdGlvbiBCaW5hcnlTZWFyY2hJbmRleCAodmFsdWVzKSB7XG4gIHRoaXMudmFsdWVzID0gW10uY29uY2F0KHZhbHVlcyB8fCBbXSk7XG59XG5cbkJpbmFyeVNlYXJjaEluZGV4LnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgaW5kZXggPSB0aGlzLmdldEluZGV4KHZhbHVlKTtcbiAgcmV0dXJuIHRoaXMudmFsdWVzW2luZGV4XTtcbn07XG5cbkJpbmFyeVNlYXJjaEluZGV4LnByb3RvdHlwZS5nZXRJbmRleCA9IGZ1bmN0aW9uIGdldEluZGV4ICh2YWx1ZSkge1xuICBpZiAodGhpcy5kaXJ0eSkge1xuICAgIHRoaXMuc29ydCgpO1xuICB9XG5cbiAgdmFyIG1pbkluZGV4ID0gMDtcbiAgdmFyIG1heEluZGV4ID0gdGhpcy52YWx1ZXMubGVuZ3RoIC0gMTtcbiAgdmFyIGN1cnJlbnRJbmRleDtcbiAgdmFyIGN1cnJlbnRFbGVtZW50O1xuXG4gIHdoaWxlIChtaW5JbmRleCA8PSBtYXhJbmRleCkge1xuICAgIGN1cnJlbnRJbmRleCA9IChtaW5JbmRleCArIG1heEluZGV4KSAvIDIgfCAwO1xuICAgIGN1cnJlbnRFbGVtZW50ID0gdGhpcy52YWx1ZXNbTWF0aC5yb3VuZChjdXJyZW50SW5kZXgpXTtcbiAgICBpZiAoK2N1cnJlbnRFbGVtZW50LnZhbHVlIDwgK3ZhbHVlKSB7XG4gICAgICBtaW5JbmRleCA9IGN1cnJlbnRJbmRleCArIDE7XG4gICAgfSBlbHNlIGlmICgrY3VycmVudEVsZW1lbnQudmFsdWUgPiArdmFsdWUpIHtcbiAgICAgIG1heEluZGV4ID0gY3VycmVudEluZGV4IC0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN1cnJlbnRJbmRleDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gTWF0aC5hYnMofm1heEluZGV4KTtcbn07XG5cbkJpbmFyeVNlYXJjaEluZGV4LnByb3RvdHlwZS5iZXR3ZWVuID0gZnVuY3Rpb24gYmV0d2VlbiAoc3RhcnQsIGVuZCkge1xuICB2YXIgc3RhcnRJbmRleCA9IHRoaXMuZ2V0SW5kZXgoc3RhcnQpO1xuICB2YXIgZW5kSW5kZXggPSB0aGlzLmdldEluZGV4KGVuZCk7XG5cbiAgaWYgKHN0YXJ0SW5kZXggPT09IDAgJiYgZW5kSW5kZXggPT09IDApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICB3aGlsZSAodGhpcy52YWx1ZXNbc3RhcnRJbmRleCAtIDFdICYmIHRoaXMudmFsdWVzW3N0YXJ0SW5kZXggLSAxXS52YWx1ZSA9PT0gc3RhcnQpIHtcbiAgICBzdGFydEluZGV4LS07XG4gIH1cblxuICB3aGlsZSAodGhpcy52YWx1ZXNbZW5kSW5kZXggKyAxXSAmJiB0aGlzLnZhbHVlc1tlbmRJbmRleCArIDFdLnZhbHVlID09PSBlbmQpIHtcbiAgICBlbmRJbmRleCsrO1xuICB9XG5cbiAgaWYgKHRoaXMudmFsdWVzW2VuZEluZGV4XSAmJiB0aGlzLnZhbHVlc1tlbmRJbmRleF0udmFsdWUgPT09IGVuZCAmJiB0aGlzLnZhbHVlc1tlbmRJbmRleCArIDFdKSB7XG4gICAgZW5kSW5kZXgrKztcbiAgfVxuXG4gIHJldHVybiB0aGlzLnZhbHVlcy5zbGljZShzdGFydEluZGV4LCBlbmRJbmRleCk7XG59O1xuXG5CaW5hcnlTZWFyY2hJbmRleC5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24gaW5zZXJ0IChpdGVtKSB7XG4gIHRoaXMudmFsdWVzLnNwbGljZSh0aGlzLmdldEluZGV4KGl0ZW0udmFsdWUpLCAwLCBpdGVtKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5CaW5hcnlTZWFyY2hJbmRleC5wcm90b3R5cGUuYnVsa0FkZCA9IGZ1bmN0aW9uIGJ1bGtBZGQgKGl0ZW1zLCBzb3J0KSB7XG4gIHRoaXMudmFsdWVzID0gdGhpcy52YWx1ZXMuY29uY2F0KFtdLmNvbmNhdChpdGVtcyB8fCBbXSkpO1xuXG4gIGlmIChzb3J0KSB7XG4gICAgdGhpcy5zb3J0KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkJpbmFyeVNlYXJjaEluZGV4LnByb3RvdHlwZS5zb3J0ID0gZnVuY3Rpb24gc29ydCAoKSB7XG4gIHRoaXMudmFsdWVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gK2IudmFsdWUgLSArYS52YWx1ZTtcbiAgfSkucmV2ZXJzZSgpO1xuICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gIHJldHVybiB0aGlzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQmluYXJ5U2VhcmNoSW5kZXg7XG4iLCJpbXBvcnQgeyBVdGlsIH0gZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCBmZWF0dXJlTGF5ZXJTZXJ2aWNlIGZyb20gJy4uLy4uL1NlcnZpY2VzL0ZlYXR1cmVMYXllclNlcnZpY2UnO1xyXG5pbXBvcnQgeyBjbGVhblVybCwgd2Fybiwgc2V0RXNyaUF0dHJpYnV0aW9uIH0gZnJvbSAnLi4vLi4vVXRpbCc7XHJcbmltcG9ydCBWaXJ0dWFsR3JpZCBmcm9tICdsZWFmbGV0LXZpcnR1YWwtZ3JpZCc7XHJcbmltcG9ydCBCaW5hcnlTZWFyY2hJbmRleCBmcm9tICd0aW55LWJpbmFyeS1zZWFyY2gnO1xyXG5cclxuZXhwb3J0IHZhciBGZWF0dXJlTWFuYWdlciA9IFZpcnR1YWxHcmlkLmV4dGVuZCh7XHJcbiAgLyoqXHJcbiAgICogT3B0aW9uc1xyXG4gICAqL1xyXG5cclxuICBvcHRpb25zOiB7XHJcbiAgICBhdHRyaWJ1dGlvbjogbnVsbCxcclxuICAgIHdoZXJlOiAnMT0xJyxcclxuICAgIGZpZWxkczogWycqJ10sXHJcbiAgICBmcm9tOiBmYWxzZSxcclxuICAgIHRvOiBmYWxzZSxcclxuICAgIHRpbWVGaWVsZDogZmFsc2UsXHJcbiAgICB0aW1lRmlsdGVyTW9kZTogJ3NlcnZlcicsXHJcbiAgICBzaW1wbGlmeUZhY3RvcjogMCxcclxuICAgIHByZWNpc2lvbjogNlxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0cnVjdG9yXHJcbiAgICovXHJcblxyXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBWaXJ0dWFsR3JpZC5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG5cclxuICAgIG9wdGlvbnMudXJsID0gY2xlYW5Vcmwob3B0aW9ucy51cmwpO1xyXG4gICAgb3B0aW9ucyA9IFV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLnNlcnZpY2UgPSBmZWF0dXJlTGF5ZXJTZXJ2aWNlKG9wdGlvbnMpO1xyXG4gICAgdGhpcy5zZXJ2aWNlLmFkZEV2ZW50UGFyZW50KHRoaXMpO1xyXG5cclxuICAgIC8vIHVzZSBjYXNlIGluc2Vuc2l0aXZlIHJlZ2V4IHRvIGxvb2sgZm9yIGNvbW1vbiBmaWVsZG5hbWVzIHVzZWQgZm9yIGluZGV4aW5nXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmZpZWxkc1swXSAhPT0gJyonKSB7XHJcbiAgICAgIHZhciBvaWRDaGVjayA9IGZhbHNlO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZpZWxkc1tpXS5tYXRjaCgvXihPQkpFQ1RJRHxGSUR8T0lEfElEKSQvaSkpIHtcclxuICAgICAgICAgIG9pZENoZWNrID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG9pZENoZWNrID09PSBmYWxzZSkge1xyXG4gICAgICAgIHdhcm4oJ25vIGtub3duIGVzcmlGaWVsZFR5cGVPSUQgZmllbGQgZGV0ZWN0ZWQgaW4gZmllbGRzIEFycmF5LiAgUGxlYXNlIGFkZCBhbiBhdHRyaWJ1dGUgZmllbGQgY29udGFpbmluZyB1bmlxdWUgSURzIHRvIGVuc3VyZSB0aGUgbGF5ZXIgY2FuIGJlIGRyYXduIGNvcnJlY3RseS4nKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudGltZUZpZWxkLnN0YXJ0ICYmIHRoaXMub3B0aW9ucy50aW1lRmllbGQuZW5kKSB7XHJcbiAgICAgIHRoaXMuX3N0YXJ0VGltZUluZGV4ID0gbmV3IEJpbmFyeVNlYXJjaEluZGV4KCk7XHJcbiAgICAgIHRoaXMuX2VuZFRpbWVJbmRleCA9IG5ldyBCaW5hcnlTZWFyY2hJbmRleCgpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMudGltZUZpZWxkKSB7XHJcbiAgICAgIHRoaXMuX3RpbWVJbmRleCA9IG5ldyBCaW5hcnlTZWFyY2hJbmRleCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2NhY2hlID0ge307XHJcbiAgICB0aGlzLl9jdXJyZW50U25hcHNob3QgPSBbXTsgLy8gY2FjaGUgb2Ygd2hhdCBsYXllcnMgc2hvdWxkIGJlIGFjdGl2ZVxyXG4gICAgdGhpcy5fYWN0aXZlUmVxdWVzdHMgPSAwO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIExheWVyIEludGVyZmFjZVxyXG4gICAqL1xyXG5cclxuICBvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xyXG4gICAgLy8gaW5jbHVkZSAnUG93ZXJlZCBieSBFc3JpJyBpbiBtYXAgYXR0cmlidXRpb25cclxuICAgIHNldEVzcmlBdHRyaWJ1dGlvbihtYXApO1xyXG5cclxuICAgIHRoaXMuc2VydmljZS5tZXRhZGF0YShmdW5jdGlvbiAoZXJyLCBtZXRhZGF0YSkge1xyXG4gICAgICBpZiAoIWVycikge1xyXG4gICAgICAgIHZhciBzdXBwb3J0ZWRGb3JtYXRzID0gbWV0YWRhdGEuc3VwcG9ydGVkUXVlcnlGb3JtYXRzO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiBzb21lb25lIGhhcyByZXF1ZXN0ZWQgdGhhdCB3ZSBkb24ndCB1c2UgZ2VvSlNPTiwgZXZlbiBpZiBpdCdzIGF2YWlsYWJsZVxyXG4gICAgICAgIHZhciBmb3JjZUpzb25Gb3JtYXQgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGhpcy5zZXJ2aWNlLm9wdGlvbnMuaXNNb2Rlcm4gPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICBmb3JjZUpzb25Gb3JtYXQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVW5sZXNzIHdlJ3ZlIGJlZW4gdG9sZCBvdGhlcndpc2UsIGNoZWNrIHRvIHNlZSB3aGV0aGVyIHNlcnZpY2UgY2FuIGVtaXQgR2VvSlNPTiBuYXRpdmVseVxyXG4gICAgICAgIGlmICghZm9yY2VKc29uRm9ybWF0ICYmIHN1cHBvcnRlZEZvcm1hdHMgJiYgc3VwcG9ydGVkRm9ybWF0cy5pbmRleE9mKCdnZW9KU09OJykgIT09IC0xKSB7XHJcbiAgICAgICAgICB0aGlzLnNlcnZpY2Uub3B0aW9ucy5pc01vZGVybiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBhZGQgY29weXJpZ2h0IHRleHQgbGlzdGVkIGluIHNlcnZpY2UgbWV0YWRhdGFcclxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hdHRyaWJ1dGlvbiAmJiBtYXAuYXR0cmlidXRpb25Db250cm9sICYmIG1ldGFkYXRhLmNvcHlyaWdodFRleHQpIHtcclxuICAgICAgICAgIHRoaXMub3B0aW9ucy5hdHRyaWJ1dGlvbiA9IG1ldGFkYXRhLmNvcHlyaWdodFRleHQ7XHJcbiAgICAgICAgICBtYXAuYXR0cmlidXRpb25Db250cm9sLmFkZEF0dHJpYnV0aW9uKHRoaXMuZ2V0QXR0cmlidXRpb24oKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICBtYXAub24oJ3pvb21lbmQnLCB0aGlzLl9oYW5kbGVab29tQ2hhbmdlLCB0aGlzKTtcclxuXHJcbiAgICByZXR1cm4gVmlydHVhbEdyaWQucHJvdG90eXBlLm9uQWRkLmNhbGwodGhpcywgbWFwKTtcclxuICB9LFxyXG5cclxuICBvblJlbW92ZTogZnVuY3Rpb24gKG1hcCkge1xyXG4gICAgbWFwLm9mZignem9vbWVuZCcsIHRoaXMuX2hhbmRsZVpvb21DaGFuZ2UsIHRoaXMpO1xyXG5cclxuICAgIHJldHVybiBWaXJ0dWFsR3JpZC5wcm90b3R5cGUub25SZW1vdmUuY2FsbCh0aGlzLCBtYXApO1xyXG4gIH0sXHJcblxyXG4gIGdldEF0dHJpYnV0aW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmF0dHJpYnV0aW9uO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEZlYXR1cmUgTWFuYWdlbWVudFxyXG4gICAqL1xyXG5cclxuICBjcmVhdGVDZWxsOiBmdW5jdGlvbiAoYm91bmRzLCBjb29yZHMpIHtcclxuICAgIC8vIGRvbnQgZmV0Y2ggZmVhdHVyZXMgb3V0c2lkZSB0aGUgc2NhbGUgcmFuZ2UgZGVmaW5lZCBmb3IgdGhlIGxheWVyXHJcbiAgICBpZiAodGhpcy5fdmlzaWJsZVpvb20oKSkge1xyXG4gICAgICB0aGlzLl9yZXF1ZXN0RmVhdHVyZXMoYm91bmRzLCBjb29yZHMpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIF9yZXF1ZXN0RmVhdHVyZXM6IGZ1bmN0aW9uIChib3VuZHMsIGNvb3JkcywgY2FsbGJhY2spIHtcclxuICAgIHRoaXMuX2FjdGl2ZVJlcXVlc3RzKys7XHJcblxyXG4gICAgLy8gb3VyIGZpcnN0IGFjdGl2ZSByZXF1ZXN0IGZpcmVzIGxvYWRpbmdcclxuICAgIGlmICh0aGlzLl9hY3RpdmVSZXF1ZXN0cyA9PT0gMSkge1xyXG4gICAgICB0aGlzLmZpcmUoJ2xvYWRpbmcnLCB7XHJcbiAgICAgICAgYm91bmRzOiBib3VuZHNcclxuICAgICAgfSwgdHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX2J1aWxkUXVlcnkoYm91bmRzKS5ydW4oZnVuY3Rpb24gKGVycm9yLCBmZWF0dXJlQ29sbGVjdGlvbiwgcmVzcG9uc2UpIHtcclxuICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmV4Y2VlZGVkVHJhbnNmZXJMaW1pdCkge1xyXG4gICAgICAgIHRoaXMuZmlyZSgnZHJhd2xpbWl0ZXhjZWVkZWQnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gbm8gZXJyb3IsIGZlYXR1cmVzXHJcbiAgICAgIGlmICghZXJyb3IgJiYgZmVhdHVyZUNvbGxlY3Rpb24gJiYgZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgLy8gc2NoZWR1bGUgYWRkaW5nIGZlYXR1cmVzIHVudGlsIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZVxyXG4gICAgICAgIFV0aWwucmVxdWVzdEFuaW1GcmFtZShVdGlsLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdGhpcy5fYWRkRmVhdHVyZXMoZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXMsIGNvb3Jkcyk7XHJcbiAgICAgICAgICB0aGlzLl9wb3N0UHJvY2Vzc0ZlYXR1cmVzKGJvdW5kcyk7XHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBubyBlcnJvciwgbm8gZmVhdHVyZXNcclxuICAgICAgaWYgKCFlcnJvciAmJiBmZWF0dXJlQ29sbGVjdGlvbiAmJiAhZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgdGhpcy5fcG9zdFByb2Nlc3NGZWF0dXJlcyhib3VuZHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICB0aGlzLl9wb3N0UHJvY2Vzc0ZlYXR1cmVzKGJvdW5kcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwodGhpcywgZXJyb3IsIGZlYXR1cmVDb2xsZWN0aW9uKTtcclxuICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgX3Bvc3RQcm9jZXNzRmVhdHVyZXM6IGZ1bmN0aW9uIChib3VuZHMpIHtcclxuICAgIC8vIGRlaW5jcmVtZW50IHRoZSByZXF1ZXN0IGNvdW50ZXIgbm93IHRoYXQgd2UgaGF2ZSBwcm9jZXNzZWQgZmVhdHVyZXNcclxuICAgIHRoaXMuX2FjdGl2ZVJlcXVlc3RzLS07XHJcblxyXG4gICAgLy8gaWYgdGhlcmUgYXJlIG5vIG1vcmUgYWN0aXZlIHJlcXVlc3RzIGZpcmUgYSBsb2FkIGV2ZW50IGZvciB0aGlzIHZpZXdcclxuICAgIGlmICh0aGlzLl9hY3RpdmVSZXF1ZXN0cyA8PSAwKSB7XHJcbiAgICAgIHRoaXMuZmlyZSgnbG9hZCcsIHtcclxuICAgICAgICBib3VuZHM6IGJvdW5kc1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfY2FjaGVLZXk6IGZ1bmN0aW9uIChjb29yZHMpIHtcclxuICAgIHJldHVybiBjb29yZHMueiArICc6JyArIGNvb3Jkcy54ICsgJzonICsgY29vcmRzLnk7XHJcbiAgfSxcclxuXHJcbiAgX2FkZEZlYXR1cmVzOiBmdW5jdGlvbiAoZmVhdHVyZXMsIGNvb3Jkcykge1xyXG4gICAgdmFyIGtleSA9IHRoaXMuX2NhY2hlS2V5KGNvb3Jkcyk7XHJcbiAgICB0aGlzLl9jYWNoZVtrZXldID0gdGhpcy5fY2FjaGVba2V5XSB8fCBbXTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gZmVhdHVyZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgdmFyIGlkID0gZmVhdHVyZXNbaV0uaWQ7XHJcblxyXG4gICAgICBpZiAodGhpcy5fY3VycmVudFNuYXBzaG90LmluZGV4T2YoaWQpID09PSAtMSkge1xyXG4gICAgICAgIHRoaXMuX2N1cnJlbnRTbmFwc2hvdC5wdXNoKGlkKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5fY2FjaGVba2V5XS5pbmRleE9mKGlkKSA9PT0gLTEpIHtcclxuICAgICAgICB0aGlzLl9jYWNoZVtrZXldLnB1c2goaWQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy50aW1lRmllbGQpIHtcclxuICAgICAgdGhpcy5fYnVpbGRUaW1lSW5kZXhlcyhmZWF0dXJlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jcmVhdGVMYXllcnMoZmVhdHVyZXMpO1xyXG4gIH0sXHJcblxyXG4gIF9idWlsZFF1ZXJ5OiBmdW5jdGlvbiAoYm91bmRzKSB7XHJcbiAgICB2YXIgcXVlcnkgPSB0aGlzLnNlcnZpY2UucXVlcnkoKVxyXG4gICAgICAuaW50ZXJzZWN0cyhib3VuZHMpXHJcbiAgICAgIC53aGVyZSh0aGlzLm9wdGlvbnMud2hlcmUpXHJcbiAgICAgIC5maWVsZHModGhpcy5vcHRpb25zLmZpZWxkcylcclxuICAgICAgLnByZWNpc2lvbih0aGlzLm9wdGlvbnMucHJlY2lzaW9uKTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnNpbXBsaWZ5RmFjdG9yKSB7XHJcbiAgICAgIHF1ZXJ5LnNpbXBsaWZ5KHRoaXMuX21hcCwgdGhpcy5vcHRpb25zLnNpbXBsaWZ5RmFjdG9yKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVGaWx0ZXJNb2RlID09PSAnc2VydmVyJyAmJiB0aGlzLm9wdGlvbnMuZnJvbSAmJiB0aGlzLm9wdGlvbnMudG8pIHtcclxuICAgICAgcXVlcnkuYmV0d2Vlbih0aGlzLm9wdGlvbnMuZnJvbSwgdGhpcy5vcHRpb25zLnRvKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcXVlcnk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogV2hlcmUgTWV0aG9kc1xyXG4gICAqL1xyXG5cclxuICBzZXRXaGVyZTogZnVuY3Rpb24gKHdoZXJlLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5vcHRpb25zLndoZXJlID0gKHdoZXJlICYmIHdoZXJlLmxlbmd0aCkgPyB3aGVyZSA6ICcxPTEnO1xyXG5cclxuICAgIHZhciBvbGRTbmFwc2hvdCA9IFtdO1xyXG4gICAgdmFyIG5ld1NuYXBzaG90ID0gW107XHJcbiAgICB2YXIgcGVuZGluZ1JlcXVlc3RzID0gMDtcclxuICAgIHZhciByZXF1ZXN0RXJyb3IgPSBudWxsO1xyXG4gICAgdmFyIHJlcXVlc3RDYWxsYmFjayA9IFV0aWwuYmluZChmdW5jdGlvbiAoZXJyb3IsIGZlYXR1cmVDb2xsZWN0aW9uKSB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIHJlcXVlc3RFcnJvciA9IGVycm9yO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZmVhdHVyZUNvbGxlY3Rpb24pIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgIG5ld1NuYXBzaG90LnB1c2goZmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXNbaV0uaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcGVuZGluZ1JlcXVlc3RzLS07XHJcblxyXG4gICAgICBpZiAocGVuZGluZ1JlcXVlc3RzIDw9IDAgJiYgdGhpcy5fdmlzaWJsZVpvb20oKSkge1xyXG4gICAgICAgIHRoaXMuX2N1cnJlbnRTbmFwc2hvdCA9IG5ld1NuYXBzaG90O1xyXG4gICAgICAgIC8vIHNjaGVkdWxlIGFkZGluZyBmZWF0dXJlcyBmb3IgdGhlIG5leHQgYW5pbWF0aW9uIGZyYW1lXHJcbiAgICAgICAgVXRpbC5yZXF1ZXN0QW5pbUZyYW1lKFV0aWwuYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB0aGlzLnJlbW92ZUxheWVycyhvbGRTbmFwc2hvdCk7XHJcbiAgICAgICAgICB0aGlzLmFkZExheWVycyhuZXdTbmFwc2hvdCk7XHJcbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCByZXF1ZXN0RXJyb3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IHRoaXMuX2N1cnJlbnRTbmFwc2hvdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICBvbGRTbmFwc2hvdC5wdXNoKHRoaXMuX2N1cnJlbnRTbmFwc2hvdFtpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2FjdGl2ZUNlbGxzKSB7XHJcbiAgICAgIHBlbmRpbmdSZXF1ZXN0cysrO1xyXG4gICAgICB2YXIgY29vcmRzID0gdGhpcy5fa2V5VG9DZWxsQ29vcmRzKGtleSk7XHJcbiAgICAgIHZhciBib3VuZHMgPSB0aGlzLl9jZWxsQ29vcmRzVG9Cb3VuZHMoY29vcmRzKTtcclxuICAgICAgdGhpcy5fcmVxdWVzdEZlYXR1cmVzKGJvdW5kcywga2V5LCByZXF1ZXN0Q2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIGdldFdoZXJlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLndoZXJlO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFRpbWUgUmFuZ2UgTWV0aG9kc1xyXG4gICAqL1xyXG5cclxuICBnZXRUaW1lUmFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBbdGhpcy5vcHRpb25zLmZyb20sIHRoaXMub3B0aW9ucy50b107XHJcbiAgfSxcclxuXHJcbiAgc2V0VGltZVJhbmdlOiBmdW5jdGlvbiAoZnJvbSwgdG8sIGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICB2YXIgb2xkRnJvbSA9IHRoaXMub3B0aW9ucy5mcm9tO1xyXG4gICAgdmFyIG9sZFRvID0gdGhpcy5vcHRpb25zLnRvO1xyXG4gICAgdmFyIHBlbmRpbmdSZXF1ZXN0cyA9IDA7XHJcbiAgICB2YXIgcmVxdWVzdEVycm9yID0gbnVsbDtcclxuICAgIHZhciByZXF1ZXN0Q2FsbGJhY2sgPSBVdGlsLmJpbmQoZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIHJlcXVlc3RFcnJvciA9IGVycm9yO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuX2ZpbHRlckV4aXN0aW5nRmVhdHVyZXMob2xkRnJvbSwgb2xkVG8sIGZyb20sIHRvKTtcclxuXHJcbiAgICAgIHBlbmRpbmdSZXF1ZXN0cy0tO1xyXG5cclxuICAgICAgaWYgKGNhbGxiYWNrICYmIHBlbmRpbmdSZXF1ZXN0cyA8PSAwKSB7XHJcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCByZXF1ZXN0RXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLm9wdGlvbnMuZnJvbSA9IGZyb207XHJcbiAgICB0aGlzLm9wdGlvbnMudG8gPSB0bztcclxuXHJcbiAgICB0aGlzLl9maWx0ZXJFeGlzdGluZ0ZlYXR1cmVzKG9sZEZyb20sIG9sZFRvLCBmcm9tLCB0byk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy50aW1lRmlsdGVyTW9kZSA9PT0gJ3NlcnZlcicpIHtcclxuICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2FjdGl2ZUNlbGxzKSB7XHJcbiAgICAgICAgcGVuZGluZ1JlcXVlc3RzKys7XHJcbiAgICAgICAgdmFyIGNvb3JkcyA9IHRoaXMuX2tleVRvQ2VsbENvb3JkcyhrZXkpO1xyXG4gICAgICAgIHZhciBib3VuZHMgPSB0aGlzLl9jZWxsQ29vcmRzVG9Cb3VuZHMoY29vcmRzKTtcclxuICAgICAgICB0aGlzLl9yZXF1ZXN0RmVhdHVyZXMoYm91bmRzLCBrZXksIHJlcXVlc3RDYWxsYmFjayk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICByZWZyZXNoOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fYWN0aXZlQ2VsbHMpIHtcclxuICAgICAgdmFyIGNvb3JkcyA9IHRoaXMuX2tleVRvQ2VsbENvb3JkcyhrZXkpO1xyXG4gICAgICB2YXIgYm91bmRzID0gdGhpcy5fY2VsbENvb3Jkc1RvQm91bmRzKGNvb3Jkcyk7XHJcbiAgICAgIHRoaXMuX3JlcXVlc3RGZWF0dXJlcyhib3VuZHMsIGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMucmVkcmF3KSB7XHJcbiAgICAgIHRoaXMub25jZSgnbG9hZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmVhY2hGZWF0dXJlKGZ1bmN0aW9uIChsYXllcikge1xyXG4gICAgICAgICAgdGhpcy5fcmVkcmF3KGxheWVyLmZlYXR1cmUuaWQpO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfZmlsdGVyRXhpc3RpbmdGZWF0dXJlczogZnVuY3Rpb24gKG9sZEZyb20sIG9sZFRvLCBuZXdGcm9tLCBuZXdUbykge1xyXG4gICAgdmFyIGxheWVyc1RvUmVtb3ZlID0gKG9sZEZyb20gJiYgb2xkVG8pID8gdGhpcy5fZ2V0RmVhdHVyZXNJblRpbWVSYW5nZShvbGRGcm9tLCBvbGRUbykgOiB0aGlzLl9jdXJyZW50U25hcHNob3Q7XHJcbiAgICB2YXIgbGF5ZXJzVG9BZGQgPSB0aGlzLl9nZXRGZWF0dXJlc0luVGltZVJhbmdlKG5ld0Zyb20sIG5ld1RvKTtcclxuXHJcbiAgICBpZiAobGF5ZXJzVG9BZGQuaW5kZXhPZikge1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxheWVyc1RvQWRkLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHNob3VsZFJlbW92ZUxheWVyID0gbGF5ZXJzVG9SZW1vdmUuaW5kZXhPZihsYXllcnNUb0FkZFtpXSk7XHJcbiAgICAgICAgaWYgKHNob3VsZFJlbW92ZUxheWVyID49IDApIHtcclxuICAgICAgICAgIGxheWVyc1RvUmVtb3ZlLnNwbGljZShzaG91bGRSZW1vdmVMYXllciwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2NoZWR1bGUgYWRkaW5nIGZlYXR1cmVzIHVudGlsIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZVxyXG4gICAgVXRpbC5yZXF1ZXN0QW5pbUZyYW1lKFV0aWwuYmluZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHRoaXMucmVtb3ZlTGF5ZXJzKGxheWVyc1RvUmVtb3ZlKTtcclxuICAgICAgdGhpcy5hZGRMYXllcnMobGF5ZXJzVG9BZGQpO1xyXG4gICAgfSwgdGhpcykpO1xyXG4gIH0sXHJcblxyXG4gIF9nZXRGZWF0dXJlc0luVGltZVJhbmdlOiBmdW5jdGlvbiAoc3RhcnQsIGVuZCkge1xyXG4gICAgdmFyIGlkcyA9IFtdO1xyXG4gICAgdmFyIHNlYXJjaDtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVGaWVsZC5zdGFydCAmJiB0aGlzLm9wdGlvbnMudGltZUZpZWxkLmVuZCkge1xyXG4gICAgICB2YXIgc3RhcnRUaW1lcyA9IHRoaXMuX3N0YXJ0VGltZUluZGV4LmJldHdlZW4oc3RhcnQsIGVuZCk7XHJcbiAgICAgIHZhciBlbmRUaW1lcyA9IHRoaXMuX2VuZFRpbWVJbmRleC5iZXR3ZWVuKHN0YXJ0LCBlbmQpO1xyXG4gICAgICBzZWFyY2ggPSBzdGFydFRpbWVzLmNvbmNhdChlbmRUaW1lcyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWFyY2ggPSB0aGlzLl90aW1lSW5kZXguYmV0d2VlbihzdGFydCwgZW5kKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpID0gc2VhcmNoLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIGlkcy5wdXNoKHNlYXJjaFtpXS5pZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGlkcztcclxuICB9LFxyXG5cclxuICBfYnVpbGRUaW1lSW5kZXhlczogZnVuY3Rpb24gKGdlb2pzb24pIHtcclxuICAgIHZhciBpO1xyXG4gICAgdmFyIGZlYXR1cmU7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVGaWVsZC5zdGFydCAmJiB0aGlzLm9wdGlvbnMudGltZUZpZWxkLmVuZCkge1xyXG4gICAgICB2YXIgc3RhcnRUaW1lRW50cmllcyA9IFtdO1xyXG4gICAgICB2YXIgZW5kVGltZUVudHJpZXMgPSBbXTtcclxuICAgICAgZm9yIChpID0gZ2VvanNvbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgIGZlYXR1cmUgPSBnZW9qc29uW2ldO1xyXG4gICAgICAgIHN0YXJ0VGltZUVudHJpZXMucHVzaCh7XHJcbiAgICAgICAgICBpZDogZmVhdHVyZS5pZCxcclxuICAgICAgICAgIHZhbHVlOiBuZXcgRGF0ZShmZWF0dXJlLnByb3BlcnRpZXNbdGhpcy5vcHRpb25zLnRpbWVGaWVsZC5zdGFydF0pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZW5kVGltZUVudHJpZXMucHVzaCh7XHJcbiAgICAgICAgICBpZDogZmVhdHVyZS5pZCxcclxuICAgICAgICAgIHZhbHVlOiBuZXcgRGF0ZShmZWF0dXJlLnByb3BlcnRpZXNbdGhpcy5vcHRpb25zLnRpbWVGaWVsZC5lbmRdKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuX3N0YXJ0VGltZUluZGV4LmJ1bGtBZGQoc3RhcnRUaW1lRW50cmllcyk7XHJcbiAgICAgIHRoaXMuX2VuZFRpbWVJbmRleC5idWxrQWRkKGVuZFRpbWVFbnRyaWVzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciB0aW1lRW50cmllcyA9IFtdO1xyXG4gICAgICBmb3IgKGkgPSBnZW9qc29uLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgZmVhdHVyZSA9IGdlb2pzb25baV07XHJcbiAgICAgICAgdGltZUVudHJpZXMucHVzaCh7XHJcbiAgICAgICAgICBpZDogZmVhdHVyZS5pZCxcclxuICAgICAgICAgIHZhbHVlOiBuZXcgRGF0ZShmZWF0dXJlLnByb3BlcnRpZXNbdGhpcy5vcHRpb25zLnRpbWVGaWVsZF0pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX3RpbWVJbmRleC5idWxrQWRkKHRpbWVFbnRyaWVzKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfZmVhdHVyZVdpdGhpblRpbWVSYW5nZTogZnVuY3Rpb24gKGZlYXR1cmUpIHtcclxuICAgIGlmICghdGhpcy5vcHRpb25zLmZyb20gfHwgIXRoaXMub3B0aW9ucy50bykge1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZnJvbSA9ICt0aGlzLm9wdGlvbnMuZnJvbS52YWx1ZU9mKCk7XHJcbiAgICB2YXIgdG8gPSArdGhpcy5vcHRpb25zLnRvLnZhbHVlT2YoKTtcclxuXHJcbiAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy50aW1lRmllbGQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHZhciBkYXRlID0gK2ZlYXR1cmUucHJvcGVydGllc1t0aGlzLm9wdGlvbnMudGltZUZpZWxkXTtcclxuICAgICAgcmV0dXJuIChkYXRlID49IGZyb20pICYmIChkYXRlIDw9IHRvKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVGaWVsZC5zdGFydCAmJiB0aGlzLm9wdGlvbnMudGltZUZpZWxkLmVuZCkge1xyXG4gICAgICB2YXIgc3RhcnREYXRlID0gK2ZlYXR1cmUucHJvcGVydGllc1t0aGlzLm9wdGlvbnMudGltZUZpZWxkLnN0YXJ0XTtcclxuICAgICAgdmFyIGVuZERhdGUgPSArZmVhdHVyZS5wcm9wZXJ0aWVzW3RoaXMub3B0aW9ucy50aW1lRmllbGQuZW5kXTtcclxuICAgICAgcmV0dXJuICgoc3RhcnREYXRlID49IGZyb20pICYmIChzdGFydERhdGUgPD0gdG8pKSB8fCAoKGVuZERhdGUgPj0gZnJvbSkgJiYgKGVuZERhdGUgPD0gdG8pKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfdmlzaWJsZVpvb206IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIGNoZWNrIHRvIHNlZSB3aGV0aGVyIHRoZSBjdXJyZW50IHpvb20gbGV2ZWwgb2YgdGhlIG1hcCBpcyB3aXRoaW4gdGhlIG9wdGlvbmFsIGxpbWl0IGRlZmluZWQgZm9yIHRoZSBGZWF0dXJlTGF5ZXJcclxuICAgIGlmICghdGhpcy5fbWFwKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHZhciB6b29tID0gdGhpcy5fbWFwLmdldFpvb20oKTtcclxuICAgIGlmICh6b29tID4gdGhpcy5vcHRpb25zLm1heFpvb20gfHwgem9vbSA8IHRoaXMub3B0aW9ucy5taW5ab29tKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0gZWxzZSB7IHJldHVybiB0cnVlOyB9XHJcbiAgfSxcclxuXHJcbiAgX2hhbmRsZVpvb21DaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICghdGhpcy5fdmlzaWJsZVpvb20oKSkge1xyXG4gICAgICB0aGlzLnJlbW92ZUxheWVycyh0aGlzLl9jdXJyZW50U25hcHNob3QpO1xyXG4gICAgICB0aGlzLl9jdXJyZW50U25hcHNob3QgPSBbXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8qXHJcbiAgICAgIGZvciBldmVyeSBjZWxsIGluIHRoaXMuX2FjdGl2ZUNlbGxzXHJcbiAgICAgICAgMS4gR2V0IHRoZSBjYWNoZSBrZXkgZm9yIHRoZSBjb29yZHMgb2YgdGhlIGNlbGxcclxuICAgICAgICAyLiBJZiB0aGlzLl9jYWNoZVtrZXldIGV4aXN0cyBpdCB3aWxsIGJlIGFuIGFycmF5IG9mIGZlYXR1cmUgSURzLlxyXG4gICAgICAgIDMuIENhbGwgdGhpcy5hZGRMYXllcnModGhpcy5fY2FjaGVba2V5XSkgdG8gaW5zdHJ1Y3QgdGhlIGZlYXR1cmUgbGF5ZXIgdG8gYWRkIHRoZSBsYXllcnMgYmFjay5cclxuICAgICAgKi9cclxuICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLl9hY3RpdmVDZWxscykge1xyXG4gICAgICAgIHZhciBjb29yZHMgPSB0aGlzLl9hY3RpdmVDZWxsc1tpXS5jb29yZHM7XHJcbiAgICAgICAgdmFyIGtleSA9IHRoaXMuX2NhY2hlS2V5KGNvb3Jkcyk7XHJcbiAgICAgICAgaWYgKHRoaXMuX2NhY2hlW2tleV0pIHtcclxuICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzKHRoaXMuX2NhY2hlW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFNlcnZpY2UgTWV0aG9kc1xyXG4gICAqL1xyXG5cclxuICBhdXRoZW50aWNhdGU6IGZ1bmN0aW9uICh0b2tlbikge1xyXG4gICAgdGhpcy5zZXJ2aWNlLmF1dGhlbnRpY2F0ZSh0b2tlbik7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICBtZXRhZGF0YTogZnVuY3Rpb24gKGNhbGxiYWNrLCBjb250ZXh0KSB7XHJcbiAgICB0aGlzLnNlcnZpY2UubWV0YWRhdGEoY2FsbGJhY2ssIGNvbnRleHQpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgcXVlcnk6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UucXVlcnkoKTtcclxuICB9LFxyXG5cclxuICBfZ2V0TWV0YWRhdGE6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgaWYgKHRoaXMuX21ldGFkYXRhKSB7XHJcbiAgICAgIHZhciBlcnJvcjtcclxuICAgICAgY2FsbGJhY2soZXJyb3IsIHRoaXMuX21ldGFkYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubWV0YWRhdGEoVXRpbC5iaW5kKGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgICB0aGlzLl9tZXRhZGF0YSA9IHJlc3BvbnNlO1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCB0aGlzLl9tZXRhZGF0YSk7XHJcbiAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBhZGRGZWF0dXJlOiBmdW5jdGlvbiAoZmVhdHVyZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIHRoaXMuX2dldE1ldGFkYXRhKFV0aWwuYmluZChmdW5jdGlvbiAoZXJyb3IsIG1ldGFkYXRhKSB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjay5jYWxsKHRoaXMsIGVycm9yLCBudWxsKTsgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5zZXJ2aWNlLmFkZEZlYXR1cmUoZmVhdHVyZSwgVXRpbC5iaW5kKGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgICBpZiAoIWVycm9yKSB7XHJcbiAgICAgICAgICAvLyBhc3NpZ24gSUQgZnJvbSByZXN1bHQgdG8gYXBwcm9wcmlhdGUgb2JqZWN0aWQgZmllbGQgZnJvbSBzZXJ2aWNlIG1ldGFkYXRhXHJcbiAgICAgICAgICBmZWF0dXJlLnByb3BlcnRpZXNbbWV0YWRhdGEub2JqZWN0SWRGaWVsZF0gPSByZXNwb25zZS5vYmplY3RJZDtcclxuXHJcbiAgICAgICAgICAvLyB3ZSBhbHNvIG5lZWQgdG8gdXBkYXRlIHRoZSBnZW9qc29uIGlkIGZvciBjcmVhdGVMYXllcnMoKSB0byBmdW5jdGlvblxyXG4gICAgICAgICAgZmVhdHVyZS5pZCA9IHJlc3BvbnNlLm9iamVjdElkO1xyXG4gICAgICAgICAgdGhpcy5jcmVhdGVMYXllcnMoW2ZlYXR1cmVdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBlcnJvciwgcmVzcG9uc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSwgdGhpcykpO1xyXG4gICAgfSwgdGhpcykpO1xyXG4gIH0sXHJcblxyXG4gIHVwZGF0ZUZlYXR1cmU6IGZ1bmN0aW9uIChmZWF0dXJlLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgdGhpcy5zZXJ2aWNlLnVwZGF0ZUZlYXR1cmUoZmVhdHVyZSwgZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICBpZiAoIWVycm9yKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVMYXllcnMoW2ZlYXR1cmUuaWRdLCB0cnVlKTtcclxuICAgICAgICB0aGlzLmNyZWF0ZUxheWVycyhbZmVhdHVyZV0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yLCByZXNwb25zZSk7XHJcbiAgICAgIH1cclxuICAgIH0sIHRoaXMpO1xyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZUZlYXR1cmU6IGZ1bmN0aW9uIChpZCwgY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuICAgIHRoaXMuc2VydmljZS5kZWxldGVGZWF0dXJlKGlkLCBmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmICghZXJyb3IgJiYgcmVzcG9uc2Uub2JqZWN0SWQpIHtcclxuICAgICAgICB0aGlzLnJlbW92ZUxheWVycyhbcmVzcG9uc2Uub2JqZWN0SWRdLCB0cnVlKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIGVycm9yLCByZXNwb25zZSk7XHJcbiAgICAgIH1cclxuICAgIH0sIHRoaXMpO1xyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZUZlYXR1cmVzOiBmdW5jdGlvbiAoaWRzLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VydmljZS5kZWxldGVGZWF0dXJlcyhpZHMsIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgaWYgKCFlcnJvciAmJiByZXNwb25zZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXNwb25zZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgdGhpcy5yZW1vdmVMYXllcnMoW3Jlc3BvbnNlW2ldLm9iamVjdElkXSwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgZXJyb3IsIHJlc3BvbnNlKTtcclxuICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgfVxyXG59KTtcclxuIiwiaW1wb3J0IHsgVXRpbCwgR2VvSlNPTiwgbGF0TG5nIH0gZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCB7IEZlYXR1cmVNYW5hZ2VyIH0gZnJvbSAnLi9GZWF0dXJlTWFuYWdlcic7XHJcblxyXG5leHBvcnQgdmFyIEZlYXR1cmVMYXllciA9IEZlYXR1cmVNYW5hZ2VyLmV4dGVuZCh7XHJcblxyXG4gIG9wdGlvbnM6IHtcclxuICAgIGNhY2hlTGF5ZXJzOiB0cnVlXHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydWN0b3JcclxuICAgKi9cclxuICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgRmVhdHVyZU1hbmFnZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIHRoaXMuX29yaWdpbmFsU3R5bGUgPSB0aGlzLm9wdGlvbnMuc3R5bGU7XHJcbiAgICB0aGlzLl9sYXllcnMgPSB7fTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBMYXllciBJbnRlcmZhY2VcclxuICAgKi9cclxuXHJcbiAgb25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcclxuICAgIGZvciAodmFyIGkgaW4gdGhpcy5fbGF5ZXJzKSB7XHJcbiAgICAgIG1hcC5yZW1vdmVMYXllcih0aGlzLl9sYXllcnNbaV0pO1xyXG4gICAgICAvLyB0cmlnZ2VyIHRoZSBldmVudCB3aGVuIHRoZSBlbnRpcmUgZmVhdHVyZUxheWVyIGlzIHJlbW92ZWQgZnJvbSB0aGUgbWFwXHJcbiAgICAgIHRoaXMuZmlyZSgncmVtb3ZlZmVhdHVyZScsIHtcclxuICAgICAgICBmZWF0dXJlOiB0aGlzLl9sYXllcnNbaV0uZmVhdHVyZSxcclxuICAgICAgICBwZXJtYW5lbnQ6IGZhbHNlXHJcbiAgICAgIH0sIHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBGZWF0dXJlTWFuYWdlci5wcm90b3R5cGUub25SZW1vdmUuY2FsbCh0aGlzLCBtYXApO1xyXG4gIH0sXHJcblxyXG4gIGNyZWF0ZU5ld0xheWVyOiBmdW5jdGlvbiAoZ2VvanNvbikge1xyXG4gICAgdmFyIGxheWVyID0gR2VvSlNPTi5nZW9tZXRyeVRvTGF5ZXIoZ2VvanNvbiwgdGhpcy5vcHRpb25zKTtcclxuICAgIGxheWVyLmRlZmF1bHRPcHRpb25zID0gbGF5ZXIub3B0aW9ucztcclxuICAgIHJldHVybiBsYXllcjtcclxuICB9LFxyXG5cclxuICBfdXBkYXRlTGF5ZXI6IGZ1bmN0aW9uIChsYXllciwgZ2VvanNvbikge1xyXG4gICAgLy8gY29udmVydCB0aGUgZ2VvanNvbiBjb29yZGluYXRlcyBpbnRvIGEgTGVhZmxldCBMYXRMbmcgYXJyYXkvbmVzdGVkIGFycmF5c1xyXG4gICAgLy8gcGFzcyBpdCB0byBzZXRMYXRMbmdzIHRvIHVwZGF0ZSBsYXllciBnZW9tZXRyaWVzXHJcbiAgICB2YXIgbGF0bG5ncyA9IFtdO1xyXG4gICAgdmFyIGNvb3Jkc1RvTGF0TG5nID0gdGhpcy5vcHRpb25zLmNvb3Jkc1RvTGF0TG5nIHx8IEdlb0pTT04uY29vcmRzVG9MYXRMbmc7XHJcblxyXG4gICAgLy8gY29weSBuZXcgYXR0cmlidXRlcywgaWYgcHJlc2VudFxyXG4gICAgaWYgKGdlb2pzb24ucHJvcGVydGllcykge1xyXG4gICAgICBsYXllci5mZWF0dXJlLnByb3BlcnRpZXMgPSBnZW9qc29uLnByb3BlcnRpZXM7XHJcbiAgICB9XHJcblxyXG4gICAgc3dpdGNoIChnZW9qc29uLmdlb21ldHJ5LnR5cGUpIHtcclxuICAgICAgY2FzZSAnUG9pbnQnOlxyXG4gICAgICAgIGxhdGxuZ3MgPSBHZW9KU09OLmNvb3Jkc1RvTGF0TG5nKGdlb2pzb24uZ2VvbWV0cnkuY29vcmRpbmF0ZXMpO1xyXG4gICAgICAgIGxheWVyLnNldExhdExuZyhsYXRsbmdzKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnTGluZVN0cmluZyc6XHJcbiAgICAgICAgbGF0bG5ncyA9IEdlb0pTT04uY29vcmRzVG9MYXRMbmdzKGdlb2pzb24uZ2VvbWV0cnkuY29vcmRpbmF0ZXMsIDAsIGNvb3Jkc1RvTGF0TG5nKTtcclxuICAgICAgICBsYXllci5zZXRMYXRMbmdzKGxhdGxuZ3MpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdNdWx0aUxpbmVTdHJpbmcnOlxyXG4gICAgICAgIGxhdGxuZ3MgPSBHZW9KU09OLmNvb3Jkc1RvTGF0TG5ncyhnZW9qc29uLmdlb21ldHJ5LmNvb3JkaW5hdGVzLCAxLCBjb29yZHNUb0xhdExuZyk7XHJcbiAgICAgICAgbGF5ZXIuc2V0TGF0TG5ncyhsYXRsbmdzKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnUG9seWdvbic6XHJcbiAgICAgICAgbGF0bG5ncyA9IEdlb0pTT04uY29vcmRzVG9MYXRMbmdzKGdlb2pzb24uZ2VvbWV0cnkuY29vcmRpbmF0ZXMsIDEsIGNvb3Jkc1RvTGF0TG5nKTtcclxuICAgICAgICBsYXllci5zZXRMYXRMbmdzKGxhdGxuZ3MpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdNdWx0aVBvbHlnb24nOlxyXG4gICAgICAgIGxhdGxuZ3MgPSBHZW9KU09OLmNvb3Jkc1RvTGF0TG5ncyhnZW9qc29uLmdlb21ldHJ5LmNvb3JkaW5hdGVzLCAyLCBjb29yZHNUb0xhdExuZyk7XHJcbiAgICAgICAgbGF5ZXIuc2V0TGF0TG5ncyhsYXRsbmdzKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBGZWF0dXJlIE1hbmFnZW1lbnQgTWV0aG9kc1xyXG4gICAqL1xyXG5cclxuICBjcmVhdGVMYXllcnM6IGZ1bmN0aW9uIChmZWF0dXJlcykge1xyXG4gICAgZm9yICh2YXIgaSA9IGZlYXR1cmVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIHZhciBnZW9qc29uID0gZmVhdHVyZXNbaV07XHJcblxyXG4gICAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcnNbZ2VvanNvbi5pZF07XHJcbiAgICAgIHZhciBuZXdMYXllcjtcclxuXHJcbiAgICAgIGlmICh0aGlzLl92aXNpYmxlWm9vbSgpICYmIGxheWVyICYmICF0aGlzLl9tYXAuaGFzTGF5ZXIobGF5ZXIpKSB7XHJcbiAgICAgICAgdGhpcy5fbWFwLmFkZExheWVyKGxheWVyKTtcclxuICAgICAgICB0aGlzLmZpcmUoJ2FkZGZlYXR1cmUnLCB7XHJcbiAgICAgICAgICBmZWF0dXJlOiBsYXllci5mZWF0dXJlXHJcbiAgICAgICAgfSwgdHJ1ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHVwZGF0ZSBnZW9tZXRyeSBpZiBuZWNlc3NhcnlcclxuICAgICAgaWYgKGxheWVyICYmIHRoaXMub3B0aW9ucy5zaW1wbGlmeUZhY3RvciA+IDAgJiYgKGxheWVyLnNldExhdExuZ3MgfHwgbGF5ZXIuc2V0TGF0TG5nKSkge1xyXG4gICAgICAgIHRoaXMuX3VwZGF0ZUxheWVyKGxheWVyLCBnZW9qc29uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFsYXllcikge1xyXG4gICAgICAgIG5ld0xheWVyID0gdGhpcy5jcmVhdGVOZXdMYXllcihnZW9qc29uKTtcclxuICAgICAgICBuZXdMYXllci5mZWF0dXJlID0gZ2VvanNvbjtcclxuXHJcbiAgICAgICAgLy8gYnViYmxlIGV2ZW50cyBmcm9tIGluZGl2aWR1YWwgbGF5ZXJzIHRvIHRoZSBmZWF0dXJlIGxheWVyXHJcbiAgICAgICAgbmV3TGF5ZXIuYWRkRXZlbnRQYXJlbnQodGhpcyk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMub25FYWNoRmVhdHVyZSkge1xyXG4gICAgICAgICAgdGhpcy5vcHRpb25zLm9uRWFjaEZlYXR1cmUobmV3TGF5ZXIuZmVhdHVyZSwgbmV3TGF5ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY2FjaGUgdGhlIGxheWVyXHJcbiAgICAgICAgdGhpcy5fbGF5ZXJzW25ld0xheWVyLmZlYXR1cmUuaWRdID0gbmV3TGF5ZXI7XHJcblxyXG4gICAgICAgIC8vIHN0eWxlIHRoZSBsYXllclxyXG4gICAgICAgIHRoaXMuc2V0RmVhdHVyZVN0eWxlKG5ld0xheWVyLmZlYXR1cmUuaWQsIHRoaXMub3B0aW9ucy5zdHlsZSk7XHJcblxyXG4gICAgICAgIHRoaXMuZmlyZSgnY3JlYXRlZmVhdHVyZScsIHtcclxuICAgICAgICAgIGZlYXR1cmU6IG5ld0xheWVyLmZlYXR1cmVcclxuICAgICAgICB9LCB0cnVlKTtcclxuXHJcbiAgICAgICAgLy8gYWRkIHRoZSBsYXllciBpZiB0aGUgY3VycmVudCB6b29tIGxldmVsIGlzIGluc2lkZSB0aGUgcmFuZ2UgZGVmaW5lZCBmb3IgdGhlIGxheWVyLCBpdCBpcyB3aXRoaW4gdGhlIGN1cnJlbnQgdGltZSBib3VuZHMgb3Igb3VyIGxheWVyIGlzIG5vdCB0aW1lIGVuYWJsZWRcclxuICAgICAgICBpZiAodGhpcy5fdmlzaWJsZVpvb20oKSAmJiAoIXRoaXMub3B0aW9ucy50aW1lRmllbGQgfHwgKHRoaXMub3B0aW9ucy50aW1lRmllbGQgJiYgdGhpcy5fZmVhdHVyZVdpdGhpblRpbWVSYW5nZShnZW9qc29uKSkpKSB7XHJcbiAgICAgICAgICB0aGlzLl9tYXAuYWRkTGF5ZXIobmV3TGF5ZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGFkZExheWVyczogZnVuY3Rpb24gKGlkcykge1xyXG4gICAgZm9yICh2YXIgaSA9IGlkcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcnNbaWRzW2ldXTtcclxuICAgICAgaWYgKGxheWVyKSB7XHJcbiAgICAgICAgdGhpcy5fbWFwLmFkZExheWVyKGxheWVyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHJlbW92ZUxheWVyczogZnVuY3Rpb24gKGlkcywgcGVybWFuZW50KSB7XHJcbiAgICBmb3IgKHZhciBpID0gaWRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIHZhciBpZCA9IGlkc1tpXTtcclxuICAgICAgdmFyIGxheWVyID0gdGhpcy5fbGF5ZXJzW2lkXTtcclxuICAgICAgaWYgKGxheWVyKSB7XHJcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVmZWF0dXJlJywge1xyXG4gICAgICAgICAgZmVhdHVyZTogbGF5ZXIuZmVhdHVyZSxcclxuICAgICAgICAgIHBlcm1hbmVudDogcGVybWFuZW50XHJcbiAgICAgICAgfSwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKGxheWVyKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobGF5ZXIgJiYgcGVybWFuZW50KSB7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX2xheWVyc1tpZF07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjZWxsRW50ZXI6IGZ1bmN0aW9uIChib3VuZHMsIGNvb3Jkcykge1xyXG4gICAgaWYgKHRoaXMuX3Zpc2libGVab29tKCkgJiYgIXRoaXMuX3pvb21pbmcgJiYgdGhpcy5fbWFwKSB7XHJcbiAgICAgIFV0aWwucmVxdWVzdEFuaW1GcmFtZShVdGlsLmJpbmQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjYWNoZUtleSA9IHRoaXMuX2NhY2hlS2V5KGNvb3Jkcyk7XHJcbiAgICAgICAgdmFyIGNlbGxLZXkgPSB0aGlzLl9jZWxsQ29vcmRzVG9LZXkoY29vcmRzKTtcclxuICAgICAgICB2YXIgbGF5ZXJzID0gdGhpcy5fY2FjaGVbY2FjaGVLZXldO1xyXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmVDZWxsc1tjZWxsS2V5XSAmJiBsYXllcnMpIHtcclxuICAgICAgICAgIHRoaXMuYWRkTGF5ZXJzKGxheWVycyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCB0aGlzKSk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY2VsbExlYXZlOiBmdW5jdGlvbiAoYm91bmRzLCBjb29yZHMpIHtcclxuICAgIGlmICghdGhpcy5fem9vbWluZykge1xyXG4gICAgICBVdGlsLnJlcXVlc3RBbmltRnJhbWUoVXRpbC5iaW5kKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAodGhpcy5fbWFwKSB7XHJcbiAgICAgICAgICB2YXIgY2FjaGVLZXkgPSB0aGlzLl9jYWNoZUtleShjb29yZHMpO1xyXG4gICAgICAgICAgdmFyIGNlbGxLZXkgPSB0aGlzLl9jZWxsQ29vcmRzVG9LZXkoY29vcmRzKTtcclxuICAgICAgICAgIHZhciBsYXllcnMgPSB0aGlzLl9jYWNoZVtjYWNoZUtleV07XHJcbiAgICAgICAgICB2YXIgbWFwQm91bmRzID0gdGhpcy5fbWFwLmdldEJvdW5kcygpO1xyXG4gICAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmVDZWxsc1tjZWxsS2V5XSAmJiBsYXllcnMpIHtcclxuICAgICAgICAgICAgdmFyIHJlbW92YWJsZSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgIHZhciBsYXllciA9IHRoaXMuX2xheWVyc1tsYXllcnNbaV1dO1xyXG4gICAgICAgICAgICAgIGlmIChsYXllciAmJiBsYXllci5nZXRCb3VuZHMgJiYgbWFwQm91bmRzLmludGVyc2VjdHMobGF5ZXIuZ2V0Qm91bmRzKCkpKSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmFibGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZW1vdmFibGUpIHtcclxuICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxheWVycyhsYXllcnMsICF0aGlzLm9wdGlvbnMuY2FjaGVMYXllcnMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jYWNoZUxheWVycyAmJiByZW1vdmFibGUpIHtcclxuICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fY2FjaGVbY2FjaGVLZXldO1xyXG4gICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9jZWxsc1tjZWxsS2V5XTtcclxuICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fYWN0aXZlQ2VsbHNbY2VsbEtleV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sIHRoaXMpKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBTdHlsaW5nIE1ldGhvZHNcclxuICAgKi9cclxuXHJcbiAgcmVzZXRTdHlsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5vcHRpb25zLnN0eWxlID0gdGhpcy5fb3JpZ2luYWxTdHlsZTtcclxuICAgIHRoaXMuZWFjaEZlYXR1cmUoZnVuY3Rpb24gKGxheWVyKSB7XHJcbiAgICAgIHRoaXMucmVzZXRGZWF0dXJlU3R5bGUobGF5ZXIuZmVhdHVyZS5pZCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIHNldFN0eWxlOiBmdW5jdGlvbiAoc3R5bGUpIHtcclxuICAgIHRoaXMub3B0aW9ucy5zdHlsZSA9IHN0eWxlO1xyXG4gICAgdGhpcy5lYWNoRmVhdHVyZShmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgdGhpcy5zZXRGZWF0dXJlU3R5bGUobGF5ZXIuZmVhdHVyZS5pZCwgc3R5bGUpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICByZXNldEZlYXR1cmVTdHlsZTogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcnNbaWRdO1xyXG4gICAgdmFyIHN0eWxlID0gdGhpcy5fb3JpZ2luYWxTdHlsZSB8fCBMLlBhdGgucHJvdG90eXBlLm9wdGlvbnM7XHJcbiAgICBpZiAobGF5ZXIpIHtcclxuICAgICAgVXRpbC5leHRlbmQobGF5ZXIub3B0aW9ucywgbGF5ZXIuZGVmYXVsdE9wdGlvbnMpO1xyXG4gICAgICB0aGlzLnNldEZlYXR1cmVTdHlsZShpZCwgc3R5bGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgc2V0RmVhdHVyZVN0eWxlOiBmdW5jdGlvbiAoaWQsIHN0eWxlKSB7XHJcbiAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcnNbaWRdO1xyXG4gICAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBzdHlsZSA9IHN0eWxlKGxheWVyLmZlYXR1cmUpO1xyXG4gICAgfVxyXG4gICAgaWYgKGxheWVyLnNldFN0eWxlKSB7XHJcbiAgICAgIGxheWVyLnNldFN0eWxlKHN0eWxlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFV0aWxpdHkgTWV0aG9kc1xyXG4gICAqL1xyXG5cclxuICBlYWNoQWN0aXZlRmVhdHVyZTogZnVuY3Rpb24gKGZuLCBjb250ZXh0KSB7XHJcbiAgICAvLyBmaWd1cmUgb3V0IChyb3VnaGx5KSB3aGljaCBsYXllcnMgYXJlIGluIHZpZXdcclxuICAgIGlmICh0aGlzLl9tYXApIHtcclxuICAgICAgdmFyIGFjdGl2ZUJvdW5kcyA9IHRoaXMuX21hcC5nZXRCb3VuZHMoKTtcclxuICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLl9sYXllcnMpIHtcclxuICAgICAgICBpZiAodGhpcy5fY3VycmVudFNuYXBzaG90LmluZGV4T2YodGhpcy5fbGF5ZXJzW2ldLmZlYXR1cmUuaWQpICE9PSAtMSkge1xyXG4gICAgICAgICAgLy8gYSBzaW1wbGUgcG9pbnQgaW4gcG9seSB0ZXN0IGZvciBwb2ludCBnZW9tZXRyaWVzXHJcbiAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2xheWVyc1tpXS5nZXRMYXRMbmcgPT09ICdmdW5jdGlvbicgJiYgYWN0aXZlQm91bmRzLmNvbnRhaW5zKHRoaXMuX2xheWVyc1tpXS5nZXRMYXRMbmcoKSkpIHtcclxuICAgICAgICAgICAgZm4uY2FsbChjb250ZXh0LCB0aGlzLl9sYXllcnNbaV0pO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5fbGF5ZXJzW2ldLmdldEJvdW5kcyA9PT0gJ2Z1bmN0aW9uJyAmJiBhY3RpdmVCb3VuZHMuaW50ZXJzZWN0cyh0aGlzLl9sYXllcnNbaV0uZ2V0Qm91bmRzKCkpKSB7XHJcbiAgICAgICAgICAgIC8vIGludGVyc2VjdGluZyBib3VuZHMgY2hlY2sgZm9yIHBvbHlsaW5lIGFuZCBwb2x5Z29uIGdlb21ldHJpZXNcclxuICAgICAgICAgICAgZm4uY2FsbChjb250ZXh0LCB0aGlzLl9sYXllcnNbaV0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZWFjaEZlYXR1cmU6IGZ1bmN0aW9uIChmbiwgY29udGV4dCkge1xyXG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLl9sYXllcnMpIHtcclxuICAgICAgZm4uY2FsbChjb250ZXh0LCB0aGlzLl9sYXllcnNbaV0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgZ2V0RmVhdHVyZTogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fbGF5ZXJzW2lkXTtcclxuICB9LFxyXG5cclxuICBicmluZ1RvQmFjazogZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5lYWNoRmVhdHVyZShmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgaWYgKGxheWVyLmJyaW5nVG9CYWNrKSB7XHJcbiAgICAgICAgbGF5ZXIuYnJpbmdUb0JhY2soKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgYnJpbmdUb0Zyb250OiBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmVhY2hGZWF0dXJlKGZ1bmN0aW9uIChsYXllcikge1xyXG4gICAgICBpZiAobGF5ZXIuYnJpbmdUb0Zyb250KSB7XHJcbiAgICAgICAgbGF5ZXIuYnJpbmdUb0Zyb250KCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIHJlZHJhdzogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICBpZiAoaWQpIHtcclxuICAgICAgdGhpcy5fcmVkcmF3KGlkKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH0sXHJcblxyXG4gIF9yZWRyYXc6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgdmFyIGxheWVyID0gdGhpcy5fbGF5ZXJzW2lkXTtcclxuICAgIHZhciBnZW9qc29uID0gbGF5ZXIuZmVhdHVyZTtcclxuXHJcbiAgICAvLyBpZiB0aGlzIGxvb2tzIGxpa2UgYSBtYXJrZXJcclxuICAgIGlmIChsYXllciAmJiBsYXllci5zZXRJY29uICYmIHRoaXMub3B0aW9ucy5wb2ludFRvTGF5ZXIpIHtcclxuICAgICAgLy8gdXBkYXRlIGN1c3RvbSBzeW1ib2xvZ3ksIGlmIG5lY2Vzc2FyeVxyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnBvaW50VG9MYXllcikge1xyXG4gICAgICAgIHZhciBnZXRJY29uID0gdGhpcy5vcHRpb25zLnBvaW50VG9MYXllcihnZW9qc29uLCBsYXRMbmcoZ2VvanNvbi5nZW9tZXRyeS5jb29yZGluYXRlc1sxXSwgZ2VvanNvbi5nZW9tZXRyeS5jb29yZGluYXRlc1swXSkpO1xyXG4gICAgICAgIHZhciB1cGRhdGVkSWNvbiA9IGdldEljb24ub3B0aW9ucy5pY29uO1xyXG4gICAgICAgIGxheWVyLnNldEljb24odXBkYXRlZEljb24pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbG9va3MgbGlrZSBhIHZlY3RvciBtYXJrZXIgKGNpcmNsZU1hcmtlcilcclxuICAgIGlmIChsYXllciAmJiBsYXllci5zZXRTdHlsZSAmJiB0aGlzLm9wdGlvbnMucG9pbnRUb0xheWVyKSB7XHJcbiAgICAgIHZhciBnZXRTdHlsZSA9IHRoaXMub3B0aW9ucy5wb2ludFRvTGF5ZXIoZ2VvanNvbiwgbGF0TG5nKGdlb2pzb24uZ2VvbWV0cnkuY29vcmRpbmF0ZXNbMV0sIGdlb2pzb24uZ2VvbWV0cnkuY29vcmRpbmF0ZXNbMF0pKTtcclxuICAgICAgdmFyIHVwZGF0ZWRTdHlsZSA9IGdldFN0eWxlLm9wdGlvbnM7XHJcbiAgICAgIHRoaXMuc2V0RmVhdHVyZVN0eWxlKGdlb2pzb24uaWQsIHVwZGF0ZWRTdHlsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbG9va3MgbGlrZSBhIHBhdGggKHBvbHlnb24vcG9seWxpbmUpXHJcbiAgICBpZiAobGF5ZXIgJiYgbGF5ZXIuc2V0U3R5bGUgJiYgdGhpcy5vcHRpb25zLnN0eWxlKSB7XHJcbiAgICAgIHRoaXMucmVzZXRTdHlsZShnZW9qc29uLmlkKTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZlYXR1cmVMYXllciAob3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgRmVhdHVyZUxheWVyKG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmZWF0dXJlTGF5ZXI7XHJcbiJdLCJuYW1lcyI6WyJVdGlsIiwiRG9tVXRpbCIsInNoYWxsb3dDbG9uZSIsImFyY2dpc1RvR2VvSlNPTiIsImdlb2pzb25Ub0FyY0dJUyIsImcyYSIsImEyZyIsImxhdExuZyIsImxhdExuZ0JvdW5kcyIsIkxhdExuZ0JvdW5kcyIsIkxhdExuZyIsIkdlb0pTT04iLCJDbGFzcyIsInBvaW50IiwiRXZlbnRlZCIsIlRpbGVMYXllciIsIkltYWdlT3ZlcmxheSIsIkNSUyIsIkxheWVyIiwicG9wdXAiLCJib3VuZHMiLCJMIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0NDQU8sSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxjQUFjLElBQUksaUJBQWlCLElBQUksSUFBSSxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2hHLENBQU8sSUFBSSxhQUFhLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsYUFBYSxLQUFLLEVBQUUsQ0FBQzs7QUFFL0UsQ0FBTyxJQUFJLE9BQU8sR0FBRztBQUNyQixDQUFBLEVBQUUsSUFBSSxFQUFFLElBQUk7QUFDWixDQUFBLEVBQUUsYUFBYSxFQUFFLGFBQWE7QUFDOUIsQ0FBQSxDQUFDLENBQUM7O0NDTkssSUFBSSxPQUFPLEdBQUc7QUFDckIsQ0FBQSxFQUFFLHNCQUFzQixFQUFFLEVBQUU7QUFDNUIsQ0FBQSxDQUFDLENBQUM7O0NDRUYsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDOztBQUVsQixDQUFBLFNBQVMsU0FBUyxFQUFFLE1BQU0sRUFBRTtBQUM1QixDQUFBLEVBQUUsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDOztBQUVoQixDQUFBLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQzs7QUFFaEMsQ0FBQSxFQUFFLEtBQUssSUFBSSxHQUFHLElBQUksTUFBTSxFQUFFO0FBQzFCLENBQUEsSUFBSSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFD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QUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEYsQ0FBQSxFQUFFLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEYsQ0FBQSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXJGLENBQUEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7QUFDaEIsQ0FBQSxJQUFJLElBQUksRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDdEIsQ0FBQSxJQUFJLElBQUksRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7O0FBRXRCLENBQUEsSUFBSSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUU7QUFDbEQsQ0FBQSxNQUFNLE9BQU8sSUFBSSxDQUFDO0FBQ2xCLENBQUEsS0FBSztBQUNMLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFBLENBQUM7O0FBRUQsQ0FBQTtBQUNBLENBQUEsU0FBUyxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3JDLENBQUEsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDekMsQ0FBQSxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUMzQyxDQUFBLE1BQU0sSUFBSSxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ2xFLENBQUEsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUs7QUFDTCxDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQSxDQUFDOztBQUVELENBQUE7QUFDQSxDQUFBLFNBQVMsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRTtBQUN0RCxDQUFBLEVBQUUsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3ZCLENBQUEsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ3RFLENBQUEsSUFBSSxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEUsQ0FBQSxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekUsQ0FBQSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDakssQ0FBQSxNQUFNLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUMzQixDQUFBLEtBQUs7QUFDTCxDQUFB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QUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSTtBQUN6RSxDQUFBLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUN0QixDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLFVBQVUsRUFBRSxVQUFVLE1BQU0sRUFBRSxJQUFJLEVBQUU7QUFDdEMsQ0FBQSxJQUFJLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRTdDLENBQUEsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDNUUsQ0FBQSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUFFOUUsQ0FBQSxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7QUFDbEMsQ0FBQSxNQUFNLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQzVCLENBQUEsS0FBSzs7QUFFTCxDQUFBO0FBQ0EsQ0FBQTtBQUNBLENBQUE7QUFDQSxDQUFBO0FBQ0EsQ0FBQSxJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDOztBQUVsQixDQUFBO0FBQ0EsQ0FBQTtBQUNBLENBQUEsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9B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QUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFL0IsQ0FBQSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDOUIsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxTQUFTLEVBQUUsVUFBVSxNQUFNLEVBQUU7QUFDL0IsQ0FBQSxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNuQixDQUFBLElBQUksSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ3BDLENBQUEsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDOztBQUVuQyxDQUFBLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQztBQUNyQixDQUFBO0FBQ0EsQ0FBQSxJQUFJLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNuRCxDQUFBLE1BQU0sS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3JELENBQUEsUUFBUSxNQUFNLEdBQUdBLFlBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUEsUUFBUSxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQzs7QUFFeEIsQ0FBQSxRQUFRLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN2QyxDQUFBLFVBQVUsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixDQUFBLFNBQVM7QUFDVCxDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUs7O0FBRUwsQ0FBQSxJQUFJLElBQUksV0FB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RUFBRSxTQUFTLEVBQUUsVUFBVSxNQUFNLEVBQUU7QUFDL0IsQ0FBQSxJQUFJLE9BQU8sTUFBTSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUN0RCxDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLFlBQVksRUFBRSxVQUFVLFFBQVEsRUFBRSxNQUFNLEVBQUU7QUFDNUMsQ0FBQSxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDckMsQ0FBQSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7O0FBRTlDLENBQUEsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDbkQsQ0FBQSxNQUFNLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7O0FBRTlCLENBQUEsTUFBTSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDcEQsQ0FBQSxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDdkMsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDL0MsQ0FBQSxRQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2xDLENBQUEsT0FBTztBQUNQLENBQUEsS0FBSzs7QUFFTCxD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