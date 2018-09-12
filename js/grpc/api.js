goog.module('grpc.Api');

const GrpcOptions = goog.require('grpc.Options');
const Transport = goog.require('grpc.Transport');
const XhrTransport = goog.require('grpc.transport.Xhr');


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
     * @const @private
     * @type {!Transport}
     */
    this.transport_ = opt_transport || new XhrTransport(opt_options || new GrpcOptions());

  }

  /**
   * @return {!Transport}
   */
  getTransport() {
    return this.transport_;
  }
  
}

exports = Api;
