goog.module('grpc.Api');

const FetchTransport = goog.require('grpc.transport.Fetch');
const GrpcOptions = goog.require('grpc.Options');
const Transport = goog.require('grpc.Transport');
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

    const options = opt_options || new GrpcOptions();

    /**
     * @const @private
     * @type {!Transport}
     */
    this.transport_ = opt_transport || (
      fetchSupported() ? new FetchTransport(options) : new XhrTransport(options));
  }

  /**
   * @return {!Transport}
   */
  getTransport() {
    return this.transport_;
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
