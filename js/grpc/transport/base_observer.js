/**
 * @fileoverview Base transport observer implementation.
 *
 */
goog.module('grpc.transport.BaseObserver');

const Chunk = goog.require('grpc.chunk.Parser');
const Endpoint = goog.require('grpc.Endpoint');
const EventHandler = goog.require('goog.events.EventHandler');
const GrpcOptions = goog.require('grpc.Options');
const GrpcStatus = goog.require('grpc.Status');
const GrpcStreamRejection = goog.require('grpc.Rejection');
const HttpStatus = goog.require('goog.net.HttpStatus');
const JspbByteSource = goog.require('jspb.ByteSource');
const StreamObserver = goog.require('grpc.stream.Observer');
const asserts = goog.require('goog.asserts');

/**
 * Base observer implementation.
 *
 * @implements {StreamObserver}
 */
class Observer {

  /**
   * @param {!GrpcOptions} options
   * @param {string} name
   * @param {!function(!jspb.Message):!JspbByteSource} encoder A serializer function that can encode input messages.
   * @param {!function(!JspbByteSource):!jspb.Message} decoder A serializer function that can decode output messages.
   * @param {!StreamObserver<!jspb.Message>} observer
   * @param {?Endpoint=} opt_endpoint
   */
  constructor(options, name, encoder, decoder, observer, opt_endpoint) {

    // console.log('grpc options: ', options);
    // console.log('opt_endpoint: ', opt_endpoint);
    
    /** @const @protected */
    this.options = options;
    
    /** @const @private */
    this.name_ = name;

    /** @const @private */
    this.encoder_ = encoder;

    /** @const @private */
    this.decoder_ = decoder;

    /** @const @protected */
    this.observer = observer;

     /** @const @private */
    this.endpoint_ = opt_endpoint;

    /** @const @private */
    this.handler_ = new EventHandler(this);

    /**
     * These are the headers that get assigned to the initial xhr
     * request.  They get pumped in via the onProgress method.
     *
     * @protected
     * @type {?Object<string,string>|undefined}
     */
    this.headers = null;

    /**
     * This is jspb.Message that will be pumped into this object as
     * input via the onNext method.
     *
     * @private
     * @type {?jspb.Message}
     */
    this.value_ = null;

    /**
     * An internal flag to track what the observer state is in. We
     * manually assign values pre-flight (before xhr has actually
     * started) to fit our scenario and then assign this to the final
     * return value of the gRPC call.  We start out in INTERNAL.
     *
     * @private
     * @type {GrpcStatus}
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
     * A flag to track if we've reported completion to the output observer.
     * @private
     * @type {boolean}
     */
    this.complete_ = false;
  }


  /**
   * @override
   */
  onProgress(headers, isTrailing) {
    this.headers = headers;
  }

  /**
   * @return {?jspb.Message}
   */
  getValue() {
      return this.value_;
  }

  /**
   * @override
   * @param {!jspb.Message} value
   */
  onNext(value) {
    if (this.status_ != GrpcStatus.INTERNAL) {
      this.reportError(GrpcStatus.FAILED_PRECONDITION, 'No more input is possible, observer has already completed with status code: ' + this.status_);
      return;
    }

    if (goog.isDefAndNotNull(this.value_)) {
      this.reportError(GrpcStatus.UNIMPLEMENTED, 'Xhr observer goes not support multiple (streaming) requests to the server');
      return;
    }

    this.value_ = value;
    return;
  }

  /**
   * @override
   */
  onError(err) {
    if (err.status != GrpcStatus.INTERNAL) {
      this.reportError(GrpcStatus.FAILED_PRECONDITION, 'No more input is possible, observer has already completed with status code: ' + this.status_);
      return;
    }

    // In theory, we interpret onError as the client telling us something bad
    // happened in-preparation before the send.  In practice the way the
    // code-generation is setup, this can't happen.  InvalidArgument seems like
    // the best choice, though arbitrary.
    //
    this.reportError(GrpcStatus.INVALID_ARGUMENT, 'Client terminated request prior to sending the request: ' + err.message);
    return;
  }

  /**
   * Notify observer complete and dispose resources.
   */
  reportCompleted() {
    if (this.complete_) {
      console.error("reportCompleted called more than once");
      return;
    }
    this.complete_ = true;
    this.observer.onCompleted();
    this.dispose();
  }

  /**
   * Make sure to override this in subclass, but call the base impl.
   * @override
   */
  onCompleted() {
    if (this.status_ != GrpcStatus.INTERNAL) {
      this.reportError(GrpcStatus.FAILED_PRECONDITION, 'No more input is possible, observer has already completed with status code: ' + this.status_);
      return ;
    }

    // Switch to UNKNOWN status just before sending the request.
    // Demarcates that the request has committed.
    this.setStatus(GrpcStatus.UNKNOWN);
  }

  
  /**
   * Set the observer grpc status code.
   * @protected
   * @return {string} THe URL to connect to
   */
  getEndpointUrl() {
    let url = "";
    if (this.endpoint_ && this.endpoint_.host) {
      url += this.endpoint_.host;
    } else if (this.options.getHost()) {
      url += this.options.getHost();
    }
    if (this.endpoint_ && this.endpoint_.port) {
      url += ':' + this.endpoint_.port;
    } else if (this.options.getPort()) {
      url += ':' + this.options.getPort();
    }
    if (this.endpoint_ && this.endpoint_.path) {
      url += '/' + this.endpoint_.path;
    } else if (this.options.getPath()) {
      url += '/' + this.options.getPath();
    }
    url += '/' + this.name_;
    return url;
  }

  /**
   * Relay an error.  This is a terminal event and releases the XHR/fetch.
   * @protected
   * @param {GrpcStatus} status The error status to assign.
   * @param {string} message A human-readable string that explains the error.
   * @param {!Object<string,string>=} opt_headers Optional headers associated with the error.
   */
  reportError(status, message, opt_headers) {
    this.setStatus(status);
    this.observer.onError(new GrpcStreamRejection(message, this.status_, opt_headers || {}, {}));
    this.dispose();
  }

  /**
   * Set the observer grpc status code.
   * @protected
   * @param {GrpcStatus} status The status to assign.
   */
  setStatus(status) {
    this.status_ = asserts.assertNumber(status);
  }

  /**
   * Get the current observer grpc status code.
   * @return {GrpcStatus} 
   */
  getStatus() {
    return this.status_;
  }


  /**
   * Convert the protobuf encoded bytes to a grpc-request frame.
   * @param {!jspb.Message} value
   * @return {!ArrayBufferView}
   */
  frameRequest(value)  {
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
   * @param {!Uint8Array} buffer The bytes to process
   * @suppress {reportUnknownTypes}
   */
  handleChunk(buffer) {
    let chunks = [];
    
    try {
      chunks = this.parser_.parse(buffer);
      //console.warn('Parsed chunks: ' + chunks.length);
    } catch (/** !Error */e) {
      this.reportError(GrpcStatus.INVALID_ARGUMENT, `Error occurred while parsing the response: ${e.message}`);
      return;
    }

    //console.warn("CHUNK", buffer, chunks);
    
    chunks.forEach(chunk => {
      if (chunk.isMessage()) {
        //console.warn("CHUNK MESSAGE", chunk);
        const proto = this.decoder_(chunk.getData());
        //console.warn("CHUNK PROTO", proto);
        this.observer.onNext(proto);
      } else {
        //console.warn("CHUNK HEADERS/TRAILERS", chunk);
        this.observer.onProgress(chunk.getTrailers(), this.status_, true);
      }
    });
  }

  /**
   * @protected
   * @param {number} status
   * @return {!GrpcStatus}
   */
  getGrpcStatusFromHttpStatus(status) {
    // console.log(`Mapping HTTP status code ${status} to grpc status code`);
    switch (status) {
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
   * Releases resources.
   * @protected
   */
  dispose() {
    if (this.handler_) {
      this.handler_.dispose();
    }
  }


}

exports = Observer;
