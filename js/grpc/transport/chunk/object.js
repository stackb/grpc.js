goog.module('grpc.chunk.Object');

const asserts = goog.require('goog.asserts');

/**
 * Parser implementation that converts a raw buffer into a list of
 * chunks.
 */
class Chunk {

  /**
   * @param {?Uint8Array} data
   * @param {?Object<string,string>} trailers
   */
  constructor(data, trailers) {

    /**
     * @const
     * @private
     * @type {?Uint8Array}
     */
    this.data_ = data;

    /**
     * @const @private
     * @type {?Object<string,string>}
     */
    this.trailers_ = trailers;

  }

  /**
   * Return the trailers.  Should only be called if this.isMessage is false.
   *
    * @return {!Object<string,string>}
   */
  getTrailers() {
    return asserts.assertObject(this.trailers_);
  }

  /**
   * Return the data.  Should only be called if this.isMessage is true.
   *
   * @return {!Uint8Array}
   */
  getData() {
    return asserts.assertObject(this.data_);
  }

  /**
   * Return the true if this is a message chunk.
   *
   * @return {boolean}
   */
  isMessage() {
    return goog.isDefAndNotNull(this.data_);
  }

}

exports = Chunk;
