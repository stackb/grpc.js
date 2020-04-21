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
     * @public @const
     */
    this.message = message;

    /**
     * @public @const
     */
    this.status = status;

    /**
     * @public @const
     */
    this.headers = headers;

    /**
     * @public @const
     */
    this.trailers = trailers;

  }

}

exports = Rejection;
