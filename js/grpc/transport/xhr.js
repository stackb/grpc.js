/**
 * @fileoverview Xhr transport implementation.
 *
 */
goog.module('grpc.transport.Xhr');

const Transport = goog.require('grpc.Transport');
const XhrObserver = goog.require('grpc.transport.xhr.Observer');


/**
 * Xhr transport implementation that uses an XmlHttpRequest.
 *
 * @implements {Transport}
 */
class XhrImpl {

  /**
   * @param {!grpc.Options} options
   */  
  constructor(options) {
    /** @const @private */
    this.options_ = options;
  }
  
  /**
   * @override
   */
  call(name, encoder, decoder, observer, opt_endpoint) {
    return new XhrObserver(this, this.options_, name, encoder, decoder, observer, opt_endpoint);
  }

  /**
   * @return {!XMLHttpRequest}
   */
  createObject() {
    const xhr = new XMLHttpRequest();
    return xhr;
  }
  
}

exports = XhrImpl;
