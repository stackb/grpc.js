goog.module('grpc.Rejection');

const GrpcStatus = goog.require("grpc.Status");

/**
 * Stream Response type provided resolver.reject method if the call
 * errors out.
 */
class Rejection {

  /**
   * @param {string} message
   * @param {!GrpcStatus} status
   * @param {!Object<string,string>} headers
   * @param {!Object<string,string>} trailers
   */
  constructor(message, status, headers, trailers) {

    /**
     * @public @const @type {string}
     */
    this.message = message;

    /**
     * @public @const @type {GrpcStatus}
     */
    this.status = status;

    /**
     * @public @const @type {!Object<string,string>}
     */
    this.headers = headers;

    /**
     * @public @const @type {!Object<string,string>}
     */
    this.trailers = trailers;

  }

}

exports = Rejection;
