/**
 * @fileoverview Websocket transport observer implementation.
 *
 */
goog.module('grpc.transport.websocket.Observer');

const BaseObserver = goog.require('grpc.transport.BaseObserver');
const Endpoint = goog.require('grpc.Endpoint');
const GrpcOptions = goog.require('grpc.Options');
const GrpcStatus = goog.require('grpc.Status');
const GoogNetWebSocket = goog.require('goog.net.WebSocket');
const JspbByteSource = goog.require('jspb.ByteSource');
const StreamObserver = goog.require('grpc.Observer');
const objects = goog.require('goog.object');
const { encodeASCII } = goog.require('grpc.chunk.Parser');


/**
 * A special data frame for relaying that send phase is over.
 */
const finishSendFrame = new Uint8Array([1]);


/**
 * Observer implementation that uses the Websocket API.
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
     * The websocket instance
     * @private @type {!GoogNetWebSocket}
     */
    this.websocket_ = new GoogNetWebSocket({
      binaryType: GoogNetWebSocket.BinaryType.ARRAY_BUFFER,
    });

    this.getHandler()
      .listen(this.websocket_, GoogNetWebSocket.EventType.OPENED, this.handleWebsocketOpened)
      .listen(this.websocket_, GoogNetWebSocket.EventType.MESSAGE, this.handleWebsocketMessage)
      .listen(this.websocket_, GoogNetWebSocket.EventType.CLOSED, this.handleWebsocketClosed)
      .listen(this.websocket_, GoogNetWebSocket.EventType.ERROR, this.handleWebsocketError);

    // using grpc-web 'grpc-websockets' subprotocol from
    // https://github.com/improbable-eng/grpc-web/blob/cd3cae9a5c1c1f4ea7b15ce13e976cf74d8b954c/client/grpc-web/src/transports/websocket/websocket.ts#L56
    this.websocket_.open(this.getEndpointUrl(), "grpc-websockets");
  }

  /**
   * Client has supplied a request.
   * @override
   */
  onNext(request) {
    super.onNext(request);

    this.sendFrame(new Uint8Array(this.frameRequest(request)));
  }

  /**
   * Client has signaled that no more requests are incoming.
   * @override
   */
  onCompleted() {
    super.onCompleted();

    // this finishSendFrame can be sent directly to websocket and not via the
    // sendFrame function.
    this.websocket_.send(finishSendFrame);
  }

  /**
   * Use the opened callback as the time to send request headers.
   */
  handleWebsocketOpened() {
    const headers = new Headers();

    headers.append("content-type", "application/grpc-web+proto");
    headers.append("x-grpc-web", "1");
    headers.append("x-user-agent", "grpc-web-javascript/0.1");

    // Per-transport headers
    const perRpcHeaders = this.options.getPerRpcMetadata()(this.getEndpointUrl());

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

    this.sendFrame(headersToBytes(headers));
  }

  /**
   * @param {!GoogNetWebSocket.MessageEvent} e 
   * @suppress {reportUnknownTypes} compiler cannot figure out 'e' type?
   */
  handleWebsocketMessage(e) {
    this.handleChunk(new Uint8Array(/** @type {!ArrayBuffer} */(e.message)));
  }

  /**
   * Callback when websocket is closed.
   */
  handleWebsocketClosed() {
    this.reportCompleted();
  }

  /**
   * @param {!GoogNetWebSocket.ErrorEvent} e 
   */
  handleWebsocketError(e) {
    if (this.cancelled_) {
      return;
    }
    this.cancelled_ = true;

    this.reportError(GrpcStatus.UNKNOWN, `websocket error: ${e.data}`);
  }

  /**
   * Cancel the request
   */
  cancel() {
    if (this.cancelled_) {
      return;
    }
    this.cancelled_ = true;

    this.websocket_.close();
  }


  /**
   * Sends a message to the websocket in a custom framing.
   * 
   * @param {!Uint8Array} byteArray 
   */
  sendFrame(byteArray) {
    const c = new Int8Array(byteArray.byteLength + 1);
    c.set(new Uint8Array([0]));
    c.set(byteArray, 1);

    this.websocket_.send(c);
  }

  /**
   * @override
   */
  dispose() {
    super.dispose();

    this.websocket_.dispose();
    delete this.websocket_;
  }

}
exports = Observer;


/**
 * Convert headers to ascii-encoded string
 * @param {!Headers} headers
 * @returns {!Uint8Array}
 */
function headersToBytes(headers) {
  let buf = '';
  for (const entry of headers.entries()) {
    buf += `${entry[0]}: ${entry[1]}\r\n`;
  }
  return encodeASCII(buf);
}
