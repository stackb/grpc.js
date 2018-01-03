goog.module('grpc.transport.xhrio.Factory');

const XmlHttpFactory = goog.require('goog.net.XmlHttpFactory');

let instance_ = null;

class Factory extends XmlHttpFactory {

  static getInstance() {
    return instance_;
  }

  constructor() {
    super();
    instance_ = this;
  }

  /**
   * @override
   */
  createInstance() {
    const xhr = new XMLHttpRequest();
    xhr.overrideMimeType("text/plain; charset=x-user-defined");
    //xhr.responseType = "arraybuffer";
    return xhr;
  }
  // \u0 \u0 \u0 \u0 \u89 \u12 \u1f 0 0 0 0 137 18 30
}

exports = Factory;
