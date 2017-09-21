import { Util, DomUtil } from 'leaflet';
import Support from './Support';
import { warn } from './Util';

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
  console.log('create request with callback and context', callback, context);
  var httpRequest = new window.XMLHttpRequest();

  httpRequest.onerror = function (e) {
    console.log('createRequest onerror', e);
    httpRequest.onreadystatechange = Util.falseFn;

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

      httpRequest.onerror = Util.falseFn;

      console.log('createRequest call the god damn callback');
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
export function request (url, params, callback, context) {
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

export function jsonp (url, params, callback, context) {
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

  var script = DomUtil.create('script', null, document.body);
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

// choose the correct AJAX handler depending on CORS support
export { get };

// always use XMLHttpRequest for posts
export { xmlHttpPost as post };

// export the Request object to call the different handlers for debugging
export var Request = {
  request: request,
  get: get,
  post: xmlHttpPost
};

export default Request;
