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
   */
  constructor(opt_options) {

    /**
     * @private
     * @type {!Transport}
     */
    this.transport_ = new XhrTransport(opt_options || new GrpcOptions());

  }

  /**
   * @return {!Transport}
   */
  getTransport() {
    return this.transport_;
  }
  
}

exports = Api;
