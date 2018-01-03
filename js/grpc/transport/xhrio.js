/**
 * @fileoverview Test transport implementation.
 *
 */
goog.module('grpc.transport.XhrIo');

const Transport = goog.require('grpc.Transport');
const XhrFactory = goog.require('grpc.transport.xhr.Factory');
const GoogXhrIo = goog.require('goog.net.XhrIo');
const GoogXhrIoPool = goog.require('goog.net.XhrIoPool');
const XhrObserver = goog.require('grpc.transport.xhrio.Observer');

/**
 * Xhr transport implementation that uses an XmlHttpRequest.
 *
 * @struct
 * @implements {Transport}
 * @template T
 * @template E
 */
class XhrIo extends XhrIoPool {

  /**
   * @override
   */
  call(name, encoder, decoder, observer, opt_endpoint) {
    return new XhrObserver(this, name, encoder, decoder, observer, opt_endpoint);
  }

  /**
   * @override
   */
  createObject() {
    const xhr = new GoogXhrIo(XhrFactory.getInstance());
    xhr.setProgressEventsEnabled(true);
    xhr.setResponseType(GoogXhrIo.ResponseType.TEXT);
    xhr.headers.set("content-type", "application/grpc-web+proto");
    xhr.headers.set("x-grpc-web", "1");
    xhr.headers.set("x-user-agent", "grpc-web-javascript/0.1");
    return xhr;
  }

}

exports = XhrIo;
