goog.module('grpc.chunk.Object');

const asserts = goog.require('goog.asserts');

/**
 * Chunk holds a data array and possibly trailers.
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
    return this.data_ != null;
  }

}

exports = Chunk;
