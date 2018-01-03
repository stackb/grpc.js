/**
 * @fileoverview Test transport implementation.
 *
 */
goog.provide('grpc.transport.Testing');
goog.provide('grpc.transport.Testing.CopyObserver');
goog.require('grpc.Transport');
goog.require('grpc.stream.Observer');

goog.require('jspb.ByteSource');
goog.require('proto.grpc.transport.Options');


/**
 * Testing transport implementation that simply copies
 * messages from source to sink, bypassing a server.
 * The request and response types must be the same.
 *
 * @constructor
 * @struct
 * @implements {grpc.Transport}
 * @param {!proto.grpc.transport.Options=} opt_options
 * @template T
 * @template E
 */
grpc.transport.Testing = function(opt_options) {
  /** @private @type {!proto.grpc.transport.Options} */
  this.options_ = opt_options || new proto.grpc.transport.Options();
};


/**
 * @override
 */
grpc.transport.Testing.prototype.call = function(path, encoder, decoder, callback, opt_headers, opt_options) {
  console.log('Invoking remote procedure ' + path);
  var delay = opt_options ? opt_options.getTimeout() : undefined;
  if (!goog.isNumber(delay)) {
    delay = this.options_.getTimeout();
  }
  if (!goog.isNumber(delay)) {
    delay = 250;
  }
  return new grpc.transport.Testing.CopyObserver(encoder, decoder, callback, delay);
};


/**
 * Observer implementation that simply copies source messages to the
 * sink callback.
 *
 * @constructor
 * @struct
 * @implements {grpc.stream.Observer}
 * @param {!function(T):!jspb.ByteSource} encoder A serializer function that can encode input messages.
 * @param {!function(!jspb.ByteSource):T} decoder A serializer function that can decode output messages.
 * @param {!grpc.stream.Observer<T,E>} callback
 * @param {number} delay
 * @template T
 * @template E
 */
grpc.transport.Testing.CopyObserver = function(encoder, decoder, callback, delay) {
  /** @private @type {!function(T):!jspb.ByteSource} */
  this.encoder_ = encoder;
  /** @private @type {!function(!jspb.ByteSource):T} */
  this.decoder_ = decoder;
  /** @private @type {!grpc.stream.Observer<T,E>} */
  this.callback_ = callback;
  ///** @private @type {number} */
  //this.delay_ = delay;
};


/**
 * @override
 * @param {T} value
 */
grpc.transport.Testing.CopyObserver.prototype.onNext = function(value) {
  var callback = this.callback_,
      encoder = this.encoder_,
      decoder = this.decoder_;
  //setTimeout(function() {
  var bytes = encoder(value);
  var decoded = decoder(bytes);
  //console.log('onNext', value, bytes, decoded);
  callback.onNext(decoded);
  //}, this.delay_);
  return this;
};


/**
 * @override
 * @param {*} value
 */
grpc.transport.Testing.CopyObserver.prototype.onError = function(value) {
  var callback = this.callback_;
  //setTimeout(function() {
    callback.onError(/** @type {*} */ (value));
  //}, this.delay_);
  return this;
};


/**
 * @override
 */
grpc.transport.Testing.CopyObserver.prototype.onCompleted = function() {
  this.callback_.onCompleted();
  return this;
};
