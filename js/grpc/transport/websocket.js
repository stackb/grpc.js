/**
 * @fileoverview Websocket transport implementation.
 *
 */
goog.module('grpc.transport.WebSocket');

const Observer = goog.require('grpc.transport.websocket.Observer');
const Options = goog.require('grpc.Options');
const Transport = goog.require('grpc.Transport');


/**
 * Transport implementation that uses the WebSocket API.
 *
 * @struct
 * @implements {Transport}
 * @template T
 * @template E
 */
class WebSocket {

  /**
   * @param {!Options} options
   */
  constructor(options) {
    /** @const @private @type{!Options} */
    this.options_ = options;
  }

  /**
   * @override
   */
  call(name, encoder, decoder, observer, opt_endpoint) {
    return new Observer(this.options_, name, encoder, decoder, observer, opt_endpoint);
  }

}

exports = WebSocket;
