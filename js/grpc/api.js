goog.module('grpc.Api');

const FetchTransport = goog.require('grpc.transport.Fetch');
const GrpcEndpoint = goog.require('grpc.Endpoint');
const GrpcOptions = goog.require('grpc.Options');
const Transport = goog.require('grpc.Transport');
const WebsocketTransport = goog.require('grpc.transport.Websocket');
const XhrTransport = goog.require('grpc.transport.Xhr');
const browser = goog.require('goog.labs.userAgent.browser');


/**
 * Base API class.  The code generator will produce a class that
 * extends from this one.
 */
class Api {

  /**
   * @param {?GrpcOptions=} opt_options
   * @param {?Transport=} opt_transport
   */
  constructor(opt_options, opt_transport) {

    /**
     * @private @const {!GrpcOptions}
     */
    this.options_ = opt_options || new GrpcOptions();

    /**
     * @const @private
     * @type {!Transport}
     */
    this.transport_ = opt_transport || (
      fetchSupported() ? new FetchTransport(this.options_) : new XhrTransport(options_));
  }

  /**
   * @param {?GrpcEndpoint=} opt_endpoint Optional endpoint config allows caller
   * to select a per-call transport.
   * @return {!Transport}
   */
  getTransport(opt_endpoint) {
    if (opt_endpoint && opt_endpoint.transport) {
      return this.getTransportByName(opt_endpoint.transport);
    } 
    return this.transport_;
  }

  /**
   * Returns a transport by name.
   * @param {string} name 
   */
  getTransportByName(name) {
    switch (name) {
      case 'fetch':
        return new FetchTransport(this.options_);
      case 'xhr':
        return new XhrTransport(this.options_);
      case 'websocket':
        return new WebsocketTransport(this.options_);
      default:
        throw new Error(`unknown transport name: ${name}`);
    }
  }

}

/**
* Check if browser supports fetch API.
* @return {boolean}
*/
function fetchSupported() {
  return browser.isChrome();
}


exports = Api;
