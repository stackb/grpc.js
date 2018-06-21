goog.module('grpc.stream.Rejection');

/**
 * Stream Response type provided resolver.reject method if the call
 * errors out.
 */
class Rejection {

  /**
   * @param {string} message
   * @param {grpc.Status} status
   * @param {!Object<string,string>} headers
   * @param {!Object<string,string>} trailers
   */
  constructor(message, status, headers, trailers) {

    /**
     * @public @type {string}
     */
    this.message = message;

    /**
     * @public @type {grpc.Status}
     */
    this.status = status;

    /**
     * @public @type {!Object<string,string>}
     */
    this.headers = headers;

    /**
     * @public @type {!Object<string,string>}
     */
    this.trailers = trailers;

  }

}

exports = Rejection;
