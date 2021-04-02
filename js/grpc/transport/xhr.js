/**
 * @fileoverview Xhr transport implementation.
 *
 */
goog.module('grpc.transport.Xhr');

const Chunk = goog.require('grpc.chunk.Parser');
const Endpoint = goog.require('grpc.Endpoint');
const EventHandler = goog.require('goog.events.EventHandler');
const GrpcOptions = goog.require('grpc.Options');
const GrpcStatus = goog.require('grpc.Status');
const GrpcStreamRejection = goog.require('grpc.Rejection');
const HttpStatus = goog.require('goog.net.HttpStatus');
const JspbByteSource = goog.require('jspb.ByteSource');
const NetEventType = goog.require('goog.net.EventType');
const Options = goog.require('grpc.Options');
const ReadyState = goog.require('goog.net.XmlHttp.ReadyState');
const StreamObserver = goog.require('grpc.Observer');
const Transport = goog.require('grpc.Transport');
const asserts = goog.require('goog.asserts');
const objects = goog.require('goog.object');


/**
 * Xhr transport implementation that uses an XmlHttpRequest.
 *
 * @implements {Transport}
 */
class XhrImpl {

  /**
   * @param {!Options} options
   */
  constructor(options) {
    /** @const @private */
    this.options_ = options;
  }

  /**
   * @override
   */
  call(name, encoder, decoder, observer, opt_endpoint) {
    return new XhrObserver(this, this.options_, name, encoder, decoder, observer, opt_endpoint);
  }

  /**
   * @return {!XMLHttpRequest}
   */
  createObject() {
    return new XMLHttpRequest();
  }

}
exports = XhrImpl;


/**
 * Observer implementation that uses an XmlHttpRequest.
 *
 * @implements {StreamObserver}
 * @template T
 */
class XhrObserver {

  /**
   * @param {!XhrImpl} xhrTransport
   * @param {!GrpcOptions} options
   * @param {string} name
   * @param {!function(T):!JspbByteSource} encoder A serializer function that can encode input messages.
   * @param {!function(!JspbByteSource):T} decoder A serializer function that can decode output messages.
   * @param {!StreamObserver<T>} observer
   * @param {?Endpoint=} opt_endpoint
   */
  constructor(xhrTransport, options, name, encoder, decoder, observer, opt_endpoint) {

    // console.log('grpc options: ', options);
    // console.log('opt_endpoint: ', opt_endpoint);

    /**
     * Instance of the xhrTransport.
     * @const @private 
     */
    this.xhrTransport_ = xhrTransport;

    /** @const @private @type{!GrpcOptions} */
    this.options_ = options;

    /** @const @private @type {string} */
    this.name_ = name;

    /** @const @private @type {!function(T):!JspbByteSource} */
    this.encoder_ = encoder;

    /** @const @private @type {!function(!JspbByteSource):T} */
    this.decoder_ = decoder;

    /** @const @private @type {!StreamObserver<T>} */
    this.observer_ = observer;

    /** @const @private @type {?Endpoint|undefined} */
    this.endpoint_ = opt_endpoint;

    /** @const @private @type {!EventHandler} */
    this.handler_ = new EventHandler(this);

    /**
     * Instance of the xhr.  If null, request has not started yet.
     * @private @type {?XMLHttpRequest}
     */
    this.xhr_ = null;

    /**
     * These are the headers that get assigned to the initial xhr
     * request.  They get pumped in via the onProgress method.
     *
     * @private
     * @type {?Object<string,string>|undefined}
     */
    this.headers_ = null;

    /**
     * This is jspb.Message that will be pumped into this object as
     * input via the onNext method.
     *
     * @private
     * @type {?T}
     */
    this.value_ = null;

    /**
     * An internal flag to track what the observer state is in. We
     * manually assign values pre-flight (before xhr has actually
     * started) to fit our scenario and then assign this to the final
     * return value of the gRPC call.  We start out in INTERNAL.
     *
     * @private
     * @type {!GrpcStatus}
     */
    this.status_ = GrpcStatus.INTERNAL;

    /**
     * The chunk parser used for this call.  It is stateful, so we use
     * one per request.
     * @const
     * @private
     * @type {!Chunk.Parser}
     */
    this.parser_ = new Chunk.Parser();

    /**
     * An integer offset into the length of the response that we've
     * seen to far.  We update this as progress events come in.

     * @private
     * @type {number}
     */
    this.index_ = 0;

  }


  /**
   * @override
   */
  onProgress(headers, isTrailing) {
    this.headers_ = headers;
    //return this;
  }


  /**
   * @override
   */
  onNext(value) {
    if (this.status_ != GrpcStatus.INTERNAL) {
      this.setStatus(GrpcStatus.FAILED_PRECONDITION);
      this.reportError('No more input is possible, observer has already completed with status code: ' + this.status_);
      return;
      //return this;
    }

    if (this.value_) {
      this.setStatus(GrpcStatus.UNIMPLEMENTED);
      this.reportError('Xhr observer goes not support multiple (streaming) requests to the server');
      return;
      //return this;
    }

    this.value_ = value;
    return;
    //return this;
  }


  /**
   * @override
   */
  onError(err) {
    if (err.status != GrpcStatus.INTERNAL) {
      this.setStatus(GrpcStatus.FAILED_PRECONDITION);
      this.reportError('No more input is possible, observer has already completed with status code: ' + this.status_);
      return;
    }

    // In theory, we interpret onError as the client telling us
    // something bad happened in-preparation before the send.  In
    // practice the way the code-generation is setup, this can't
    // happen.  InvalidArgument seems like the best choice, though
    // arbitrary.
    //
    this.setStatus(GrpcStatus.INVALID_ARGUMENT);
    this.reportError('Client terminated request prior to sending the request: ' + err.message);
    return;
  }


  /**
   *
   * @override
   */
  onCompleted() {
    if (this.status_ != GrpcStatus.INTERNAL) {
      this.setStatus(GrpcStatus.FAILED_PRECONDITION);
      this.reportError('No more input is possible, observer has already completed with status code: ' + this.status_);
      return;
    }

    // Switch to UNKNOWN status just before sending the request.
    // Demarcates that the request has committed.
    this.setStatus(GrpcStatus.UNKNOWN);

    // Get an xhr
    const xhr = this.xhr_ = this.xhrTransport_.createObject();

    xhr.open(this.getEndpointMethod(), this.getEndpointUrl());

    xhr.responseType = "text";
    xhr.overrideMimeType("text/plain; charset=x-user-defined");

    // Basic Headers for grpc
    xhr.setRequestHeader("content-type", "application/grpc-web+proto");
    xhr.setRequestHeader("x-grpc-web", "1");
    xhr.setRequestHeader("x-user-agent", "grpc-web-javascript/0.1");

    // Per-transport headers
    const perRpcHeaders = this.options_.getPerRpcMetadata()(this.getEndpointUrl());

    // Headers for every call
    if (perRpcHeaders) {
      perRpcHeaders.forEach((val, key) => {
        xhr.setRequestHeader(key, val);
      });
    }

    // Headers for this call
    if (this.headers_) {
      objects.forEach(this.headers_, (val, key) => {
        xhr.setRequestHeader(key, val);
      });
    }

    // Setup listeners
    this.handler_.listen(xhr, NetEventType.READY_STATE_CHANGE, this.handleXhrReadyStateChange);
    this.handler_.listen(xhr, NetEventType.PROGRESS, this.handleXhrProgress);
    this.handler_.listen(xhr, 'loadend', this.handleXhrLoadEnd);
    this.handler_.listen(xhr, NetEventType.ERROR, this.handleXhrError);
    this.handler_.listen(xhr, NetEventType.ABORT, this.handleXhrAbort);
    this.handler_.listen(xhr, NetEventType.TIMEOUT, this.handleXhrTimeout);

    // Send it!
    xhr.send(this.frameRequest(this.value_));

    return;
  }

  /**
   * getEndpointUrl returns the endpoint URL.
   * @protected
   * @return {string} THe URL to connect to
   */
  getEndpointMethod() {
    if (this.endpoint_ && this.endpoint_.method) {
      return this.endpoint_.method;
    }
    return "POST";
  }

  /**
   * getEndpointUrl returns the endpoint URL.
   * @protected
   * @return {string} THe URL to connect to
   */
  getEndpointUrl() {
    let url = "";
    if (this.endpoint_ && this.endpoint_.host) {
      url += this.endpoint_.host;
    } else if (this.options_.getHost()) {
      url += this.options_.getHost();
    }
    if (this.endpoint_ && this.endpoint_.port) {
      url += ':' + this.endpoint_.port;
    } else if (this.options_.getPort()) {
      url += ':' + this.options_.getPort();
    }
    if (this.endpoint_ && this.endpoint_.path) {
      url += '/' + this.endpoint_.path;
    } else if (this.options_.getPath()) {
      url += '/' + this.options_.getPath();
    }
    url += '/' + this.name_;
    return url;
  }

  /**
   * Relay an error.  This is a terminal event and releases the XHR.
   * @protected
   * @param {string} message A human-readable string that explains the error.
   * @param {!Object<string,string>=} opt_headers Optional headers associated with the error.
   */
  reportError(message, opt_headers) {
    this.observer_.onError(new GrpcStreamRejection(message, this.status_, opt_headers || {}, {}));
    this.releaseXhr();
  }


  /**
   * Set the observer grpc status code.
   * @protected
   * @param {!GrpcStatus} status The status to assign.
   */
  setStatus(status) {
    //console.warn(`Status change: ${this.status_} -> ${status}`);
    this.status_ = asserts.assertNumber(status);
  }

  /**
   * Get the current observer grpc status code.
   * @return {!GrpcStatus} 
   */
  getStatus() {
    return this.status_;
  }


  /**
   * Convert the protobuf encoded bytes to a grpc-request frame.
   * @param {T} value
   * @return {!ArrayBufferView}
   */
  frameRequest(value) {
    const bytes = /** @type {!Uint8Array} */ (this.encoder_(value));
    const frame = new ArrayBuffer(bytes.byteLength + 5);
    new DataView(frame, 1, 4).setUint32(0, bytes.length, false /* big endian */);
    new Uint8Array(frame, 5).set(bytes);
    const data = new Uint8Array(frame);
    //console.log("frameRequestData: " + data.toString());
    return data;
  }


  /**
   * Convert the raw string to an ArrayBuffer
   * @param {string} str The string to conver
   * @return {!Uint8Array}
   */
  stringToArrayBuffer(str) {
    const buffer = new Uint8Array(str.length);
    let bufIndex = 0;
    for (let i = 0; i < str.length; i++) {
      //const codePoint = (String.prototype as any).codePointAt ? (str as any).codePointAt(i) : codePointAtPolyfill(str, i);
      const codePoint = str.codePointAt(i);
      //console.log(`raw[${bufIndex},${i}] = ${codePoint} (${str.charAt(i)})`);
      buffer[bufIndex++] = codePoint & 0xFF;
    }
    return buffer;
  }


  /**
   * @param {!Event} e
   */
  handleXhrReadyStateChange(e) {
    //console.log('READYSTATECHANGE! ' + this.xhr_.getReadyState(), e);
    if (this.xhr_.readyState === ReadyState.LOADED) {
      //console.warn('GOING LOADED! ');
      this.handleXhrReadyStateLoaded();
    }
  }


  /**
   * Called when readystate LOADED.  We can look at the response
   * status and the response headers now.
   */
  handleXhrReadyStateLoaded() {
    //console.log(`LOADED !` + this.xhr_.getStatus());
    this.setStatus(this.getGrpcStatusFromHttpStatus());
    const headers = this.xhr_.getAllResponseHeaders();
    //console.log(`RESPONSE HEADERS: ` + JSON.stringify(headers));
    this.observer_.onProgress(Chunk.parseHeaders(headers), this.status_, false);
  }


  /**
   * @param {!ProgressEvent} e
   */
  handleXhrProgress(e) {
    //console.log(`PROGRESS! ` + this.status_);

    //const raw = this.xhr_.getResponseText();
    const raw = this.xhr_.response;
    //console.log(`Raw Response Text: "${raw}"`, raw);
    for (let i = 0; i < raw.length; i++) {
    }
    if (raw) {
      // Get the most recent part of the response
      const latest = raw.substr(this.index_);
      // convert to arraybuffer
      const buffer = this.stringToArrayBuffer(latest);


      // for (let i = 0; i < buffer.length; i++) {
      //   console.log(`lastest ${this.index_}: ${i} - buffer[${i}]: ${this.byteString(buffer[i])} ${String.fromCharCode(buffer[i])} ${buffer[i]}`);
      // }
      // console.log(`Advancing index to ${raw.length}`);

      // advance the pointer
      this.index_ = raw.length;

      // process the chunk
      this.handleChunk(buffer);
    }
  }

  /**
   * Take a number in the range 0..255 and show it as a binary-encoded BYTE.
   * https://stackoverflow.com/questions/24337260/javascript-a-byte-is-suppose-to-be-8-bits
   *
   * @param {number} n 
   * @return {string}
   */
  byteString(n) {
    if (n < 0 || n > 255 || n % 1 !== 0) {
      throw new Error(n + " does not fit in a byte");
    }
    return ("000000000" + n.toString(2)).substr(-8);
  }

  /**
   * Parse the buffer into a chunk and pass it on as either a message
   * or a set of trailers.
   *
   * @param {!Uint8Array} buffer The string to conver
   */
  handleChunk(buffer) {
    let chunks = [];

    try {
      chunks = this.parser_.parse(buffer);
      //console.warn('Parsed chunks: ' + chunks.length);
    } catch (e) {
      this.setStatus(GrpcStatus.INVALID_ARGUMENT);
      this.reportError(`Error occurred while parsing the response: ${e.message}`);
      return;
    }

    //console.warn("CHUNK", buffer, chunks);

    chunks.forEach(chunk => {
      if (chunk.isMessage()) {
        //console.warn("CHUNK MESSAGE", chunk);
        const proto = this.decoder_(chunk.getData());
        //console.warn("CHUNK PROTO", proto);
        this.observer_.onNext(proto);
      } else {
        //console.warn("CHUNK HEADERS/TRAILERS", chunk);
        this.observer_.onProgress(chunk.getTrailers(), this.status_, true);
      }
    });
  }


  /**
   * @param {!Event} e
   */
  handleXhrLoadEnd(e) {
    //this.status_ = GrpcStatus.OK;
    this.observer_.onCompleted();
    this.releaseXhr();
  }


  /**
   * @param {!Event} e
   */
  handleXhrTimeout(e) {
    // console.log('TIMEOUT!', e);
    if (this.status_ === GrpcStatus.UNKNOWN) {
      this.setStatus(GrpcStatus.DEADLINE_EXCEEDED);
      this.reportError("Xhr timed out while processing the request / " + this.xhr_.statusText);
      return;
    }
  }


  /**
   * @param {!Event} e
   */
  handleXhrAbort(e) {
    // console.log('ABORT!', e);
    if (this.status_ === GrpcStatus.UNKNOWN) {
      this.setStatus(GrpcStatus.ABORTED);
      this.reportError("Xhr was forcefully aborted while processing the request / " + this.xhr_.statusText);
      return;
    }
  }


  /**
   * @param {!Event} e
   */
  handleXhrError(e) {
    // console.log('ERROR!', e);
    if (this.status_ === GrpcStatus.UNKNOWN) {
      this.setStatus(GrpcStatus.ABORTED);
      this.reportError("Xhr suffered an error while processing the request / " + this.xhr_.statusText);
      return;
    }
  }


  /**
   * @protected
   * @return {!GrpcStatus}
   */
  getGrpcStatusFromHttpStatus() {
    //console.log('Mapping HTTP status code to grpc status code: ' + this.xhr_.getStatus());
    switch (this.xhr_.status) {
      case 0:
        return GrpcStatus.INTERNAL;
      case HttpStatus.OK: // 200
        return GrpcStatus.OK;
      case HttpStatus.BAD_REQUEST: // 400
        return GrpcStatus.INVALID_ARGUMENT;
      case HttpStatus.UNAUTHORIZED: // 401
        return GrpcStatus.UNAUTHENTICATED;
      case HttpStatus.FORBIDDEN: // 403
        return GrpcStatus.PERMISSION_DENIED;
      case HttpStatus.NOT_FOUND: // 404
        return GrpcStatus.NOT_FOUND;
      case HttpStatus.CONFLICT: // 409
        return GrpcStatus.ABORTED;
      case HttpStatus.PRECONDITION_FAILED: // 412
        return GrpcStatus.FAILED_PRECONDITION;
      case HttpStatus.TOO_MANY_REQUESTS: // 429
        return GrpcStatus.RESOURCE_EXHAUSTED;
      case 499:
        return GrpcStatus.CANCELED;
      case HttpStatus.INTERNAL_SERVER_ERROR: // 500
        return GrpcStatus.UNKNOWN;
      case HttpStatus.NOT_IMPLEMENTED: // 501
        return GrpcStatus.UNIMPLEMENTED;
      case HttpStatus.SERVICE_UNAVAILABLE: // 503
        return GrpcStatus.UNAVAILABLE;
      case HttpStatus.GATEWAY_TIMEOUT: // 504
        return GrpcStatus.DEADLINE_EXCEEDED;
      default:
        return GrpcStatus.UNKNOWN;
    }
  }


  /**
   * @protected
   * @return {?GrpcStatus}
   */
  getGrpcStatusFromResponseHeader() {
    try {
      const grpcStatus = this.xhr_.getResponseHeader("Grpc-Status");
      if (grpcStatus == null) {
        return null;
      }
      const statusCode = /** @type {!GrpcStatus} */ (parseInt(grpcStatus, 10));
      return statusCode;
    } catch (e) {
      return null;
    }
  }


  /**
   * Return the 'Grpc-Message' response header value.  Only valid to
   * check once the request has completed.
   *
   * @return {string|undefined}
   */
  getGrpcMessageFromResponseHeader() {
    return this.xhr_.getResponseHeader("Grpc-Message");
  }


  /**
   * Releases the XHR back to the pool.
   * @protected
   */
  releaseXhr() {
    if (this.handler_) {
      this.handler_.dispose();
    }
    this.xhr_ = null;
  }


}
