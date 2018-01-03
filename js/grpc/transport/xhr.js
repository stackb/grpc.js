/**
 * @fileoverview Test transport implementation.
 *
 */
goog.module('grpc.transport.Xhr');

const Transport = goog.require('grpc.Transport');
const XhrObserver = goog.require('grpc.transport.xhr.Observer');


/**
 * Xhr transport implementation that uses an XmlHttpRequest.
 *
 * @struct
 * @implements {Transport}
 * @template T
 * @template E
 */
class Xhr {
  
  /**
   * @override
   */
  call(name, encoder, decoder, observer, opt_endpoint) {
    return new XhrObserver(this, name, encoder, decoder, observer, opt_endpoint);
  }

  /**
   * @return {!XMLHttpRequest}
   */
  createObject() {
    const xhr = new XMLHttpRequest();
    return xhr;
  }

}

exports = Xhr;
