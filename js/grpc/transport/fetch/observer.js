/**
 * @fileoverview Fetch transport implementation.
 *
 */
goog.module('grpc.transport.fetch.Observer');

const BaseObserver = goog.require('grpc.transport.BaseObserver');
const Endpoint = goog.require('grpc.Endpoint');
const GrpcOptions = goog.require('grpc.Options');
const GrpcStatus = goog.require('grpc.Status');
const JspbByteSource = goog.require('jspb.ByteSource');
const StreamObserver = goog.require('grpc.Observer');
const asserts = goog.require('goog.asserts');
const base64 = goog.require('goog.crypt.base64');
const objects = goog.require('goog.object');

/**
 * Object returned from a read call.
 * @typedef {{
 * done: boolean,
 * value: *,
 * }}
 */
var ReadableStreamResult;

/**
 * Observer implementation that uses the http Fetch API.
 *
 * @template T
 */
class Observer extends BaseObserver {

  /**
   * @param {!GrpcOptions} options
   * @param {string} name
   * @param {!function(T):!JspbByteSource} encoder A serializer function that can encode input messages.
   * @param {!function(!JspbByteSource):T} decoder A serializer function that can decode output messages.
   * @param {!StreamObserver<T>} observer
   * @param {?Endpoint=} opt_endpoint
   */
  constructor(options, name, encoder, decoder, observer, opt_endpoint) {
    super(options, name, encoder, decoder, observer, opt_endpoint);

    /**
     * Cancellation flag
     * @private @type {boolean}
     */
    this.cancelled_ = false;

    /**
     * The fetch reader
     * @private @type {?ReadableStreamDefaultReader|?ReadableStreamBYOBReader}
     */
    this.reader_ = null;

    /**
     * The fetch abort controller
     * @private @type {?AbortController}
     */
    this.controller_ = null;
  }

  /**
   *
   * @override
   */
  onCompleted() {
    super.onCompleted();

    if (this.getStatus() !== GrpcStatus.UNKNOWN) {
      return; // superclass failed, don't continue
    }

    let url = this.getEndpointUrl();
    const controller = this.controller_ = new AbortController();
    const headers = new Headers();

    headers.append("Content-Type", "application/grpc-web+proto");
    headers.append("x-grpc-web", "1");
    headers.append("x-user-agent", "grpc-web-javascript/0.1");

    // Per-transport headers
    const perRpcHeaders = this.options.getPerRpcMetadata()(url);

    // Headers for every call
    if (perRpcHeaders) {
      perRpcHeaders.forEach((val, key) => {
        headers.append(key, val);
      });
    }

    // Headers for this call
    if (this.headers != null) {
      objects.forEach(this.headers, (/** string */val, /** string */key) => {
        headers.append(key, val);
      });
    }

    const method = this.getEndpointMethod();
    const body = this.frameRequest(asserts.assertObject(this.getValue()));
    const signal = controller.signal;
    let options = { method, headers, body, signal };

    if (options.method === "GET") {
      const b64 = base64.encodeByteArray(/** @type {!Uint8Array} **/(body));
      headers.append('x-grpc-web-request', b64);
      options = { method, headers, signal };
    }

    fetch(url, options)
      .then(res => this.handleFetchResponse(res))
      .catch(err => this.handleFetchError(err));
  }

  /**
   * 
   * @param {!Response} res 
   */
  handleFetchResponse(res) {
    // console.warn("Fetch response", res);

    const grpcStatus = this.getGrpcStatusFromHttpStatus(res.status);
    this.setStatus(grpcStatus);

    // report headers
    this.observer.onProgress(getHeadersAsObject(res.headers), grpcStatus, false);

    // If the response was not 200, fail now
    if (grpcStatus !== GrpcStatus.OK) {
      this.reportError(grpcStatus, res.statusText);
      return;
    }

    // start the pump cycle if this is a readable stream
    if (res.body) {
      // console.info("fetch responsed with a body, starting pump cycle...");
      this.pump(res.body.getReader());
      return;
    }

    if (res.arrayBuffer) {
      // console.info("fetch responsed with an array buffer, handling chunk...");
      res.arrayBuffer().then(buf => this.handleChunk(new Uint8Array(buf)));
      return;
    }

    // console.warn("Response has no arrayBuffer promiser", res);
  }

  /**
   * @param {*} e
   */
  handleFetchError(e) {
    const err = /** @type {!TypeError} */(e);
    // console.warn("Fetch error", err, arguments);
    if (this.cancelled_) {
      return;
    }

    this.cancelled_ = true;
    this.reportError(GrpcStatus.UNAVAILABLE, `fetch API: ${err.message}`);
  }

  /**
   * @param {?ReadableStreamDefaultReader|?ReadableStreamBYOBReader} reader 
   * @suppress {reportUnknownTypes}
   */
  pump(reader) {
    if (!reader) {
      // console.warn("pump: reader null, aborting");
      return;
    }
    if (this.cancelled_) {
      // console.warn("pump: observation cancelled, aborting");
      reader.cancel("Observation previously cancelled.");
      return;
    }

    this.reader_ = reader;

    reader.read()
      .then(result => this.handleReadResult(result))
      .catch(err => this.handleReadError(err));
  }

  /**
   * @param {!ReadableStreamResult} result 
   */
  handleReadResult(result) {
    if (result.value) {
      this.handleChunk(asserts.assertObject(/** @type {!Uint8Array} */(result.value)));
    }

    if (result.done) {
      // console.warn("handleReadResult: result.done, reporing completion");
      this.reportCompleted();
      return;
    }

    this.pump(this.reader_);
  }

  /**
   * @param {*} e
   * @return {?} 
   */
  handleReadError(e) {
    const err = /** @type {!TypeError} */(e);
    // console.warn("Fetch read error", err, arguments);
    this.reportError(GrpcStatus.UNAVAILABLE, `Fetch read error: ${err.message}`);
  }

  /**
   * Cancel the request
   */
  cancel() {
    if (this.cancelled_) {
      return;
    }
    this.cancelled_ = true;

    if (this.reader_) {
      this.reader_.cancel("Observation forcefully cancelled");
    }
    if (this.controller_) {
      this.controller_.abort();
    }

    this.reportError(GrpcStatus.ABORTED, `Fetch was cancelled`);
  }

  /**
   * @param {!Headers} headers
   * @return {?GrpcStatus}
   */
  getGrpcStatusFromHeaders(headers) {
    try {
      const grpcStatus = headers.get("Grpc-Status");
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
   * @param {!Headers} headers
   * @return {?string}
   */
  getGrpcMessageFromHeaders(headers) {
    return headers.get("Grpc-Message");
  }


  /**
   * @override
   */
  dispose() {
    super.dispose();
    this.reader_ = null;
    this.controller_ = null;
  }

}

/**
 * 
 * @param {!Headers} headers 
 * @return {!Object<string,string>}
 */
function getHeadersAsObject(headers) {
  const h = {};
  for (let pair of headers.entries()) {
    h[pair[0]] = pair[1];
  }
  return h;
}

exports = Observer;
