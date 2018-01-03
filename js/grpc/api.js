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
   * @param {?GrpcOptions=} options
   */
  constructor(options) {

    /**
     * @private
     * @type {!GrpcOptions}
     */
    this.options_ = options || {};

    /**
     * @private
     * @type {!Transport}
     */
    this.transport_ = new XhrTransport();
  }

  /**
   * @return {!Transport}
   */
  getTransport() {
    return this.transport_;
  }

  /**
   * @return {!GrpcOptions}
   */
  getOptions() {
    return this.options_;
  }
  
}

exports = Api;
