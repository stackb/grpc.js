/**
 * @fileoverview Test transport implementation.
 *
 */
goog.module('grpc.transport.Fetch');

const FetchObserver = goog.require('grpc.transport.fetch.Observer');
const Transport = goog.require('grpc.Transport');


/**
 * Transport implementation that uses the Fetch API.
 *
 * @struct
 * @implements {Transport}
 * @template T
 * @template E
 */
class Fetch {

  /**
   * @param {!grpc.Options} options
   */  
  constructor(options) {
    /** @const @private @type{!grpc.Options} */
    this.options_ = options;
  }
  
  /**
   * @override
   */
  call(name, encoder, decoder, observer, opt_endpoint) {
    return new FetchObserver(this.options_, name, encoder, decoder, observer, opt_endpoint);
  }
  
}

exports = Fetch;
