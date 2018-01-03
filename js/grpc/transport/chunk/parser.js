/**
 * @fileoverview Test transport implementation.
 *
 */
goog.module('grpc.chunk.Parser');

const Chunk = goog.require('grpc.chunk.Object');
const crypt = goog.require('goog.crypt');
const gString = goog.require('goog.string'); // best require ever

const HEADER_SIZE = 5;

let instance_ = null;

/**
 * Parser implementation that converts a raw buffer into a list of
 * chunks.
 */
class Parser {

  /**
   * @return {!Parser}
   */
  static getInstance() {
    if (!instance_) {
      instance_ = new Parser();
    }
    return instance_;
  }

  constructor() {

    /** @private @type {?Uint8Array} */
    this.buffer_ = null;

    /** @private @type {number} */
    this.position_ = 0;

  }

  /**
   * @param {!Uint8Array} bytes The buffer to parse
   * @return {!Array<!Chunk>}
   */
  parse(bytes) {
    
    //console.log('Parsing chunks now...', bytes);
    const chunks = [];

    if (!this.buffer_) {
      this.buffer_ = bytes;
      this.position_ = 0;
    } else if (this.position_ === this.buffer_.byteLength) {
      this.buffer_ = bytes;
      this.position_ = 0;
    } else {
      const remaining = this.buffer_.byteLength - this.position_;
      //console.log('remaining', remaining);
      const newBuf = new Uint8Array(remaining + bytes.byteLength);
      const fromExisting = sliceUint8Array(this.buffer_, this.position_);
      newBuf.set(fromExisting, 0);
      const latestDataBuf = new Uint8Array(bytes);
      newBuf.set(latestDataBuf, remaining);
      //console.log('newBuf', newBuf);
      this.buffer_ = newBuf;
      this.position_ = 0;
    }

    while (true) {
      if (!hasEnoughBytes(this.buffer_, this.position_, HEADER_SIZE)) {
        //console.log('No more chunks');
        return chunks;
      }

      let headerBuffer = sliceUint8Array(this.buffer_, this.position_, this.position_ + HEADER_SIZE);
      //console.log('HeaderBuffer', headerBuffer);
      const headerView = new DataView(headerBuffer.buffer, headerBuffer.byteOffset, headerBuffer.byteLength);
      //console.log('HeaderView', headerView);

      const msgLength = readLengthFromHeader(headerView);
      //console.log('MsgLength', msgLength);
      if (!hasEnoughBytes(this.buffer_, this.position_, HEADER_SIZE + msgLength)) {
        //console.log('No more chunks (msgLength): ' + msgLength, chunks);
        return chunks;
      }

      const messageData = sliceUint8Array(this.buffer_, this.position_ + HEADER_SIZE, this.position_ + HEADER_SIZE + msgLength);
      this.position_ += HEADER_SIZE + msgLength;
      //console.log('Position advanced to ' + this.position_);
      if (isTrailerHeader(headerView)) {
        chunks.push(new Chunk(null, parseTrailerData(messageData)));
        //console.log('No more chunks (got trailer?)');
        return chunks;
      } else {
        //console.log('Adding chunk', messageData, String(messageData));
        
        chunks.push(new Chunk(messageData, null));
      }
    }

  }

}


/**
 * Slice the given array at the given inclusive..exclusive bounds.
 * Returns a new array.  Uses the native slice function if present.
 *
 * @param {!Uint8Array} buffer
 * @param {number} from
 * @param {number=} opt_to
 * @return {!Uint8Array}
 */
function sliceUint8Array(buffer, from, opt_to) {
  if (buffer.slice) {
    return buffer.slice(from, opt_to);
  }

  let end = buffer.length;
  if (opt_to !== undefined) {
    end = opt_to;
  }

  const num = end - from;
  const array = new Uint8Array(num);
  let arrayIndex = 0;
  for (let i = from; i < end; i++) {
    array[arrayIndex++] = buffer[i];
  }
  return array;
}


/**
 * Given the buffer, return true if the given buffer is a header or
 * trailer.  If false, the data contains a Message.  This is encoded
 * in the MSB of the grpc header's first byte.
 *
 * @param {!DataView} headerView
 * @return {boolean}
 */
function isTrailerHeader(headerView) {
  return (headerView.getUint8(0) & 0x80) === 0x80;
}


/**
 * Given a sequence of bytes, parse it as UTF-8 into a list of headers.
 *
 * @param {!Uint8Array} msgData
 * @return {!Object<string,string>}
 */
function parseTrailerData(msgData) {
  // TODO: fetch BrowserHeaders npm shim
  //return new Headers(new TextDecoder("utf-8").decode(msgData));
  //const decoded = new TextDecoder("utf-8").decode(msgData);
  const decoded = crypt.utf8ByteArrayToString(msgData);
  //console.log('DECODED Trailer data', decoded);
  return parseHeaders(decoded);
}


/**
 * Given an \r\n delimited list of headers, parse them into an object.
 *
 * @param {string} raw
 * @return {!Object<string,string>}
 */
function parseHeaders(raw) {
  /** @type {!Object<string,string>} */
  const headers = {};
  if (!raw) {
    return headers;
  }
  const list = raw.split('\r\n');
  for (var i = 0; i < list.length; i++) {
    if (gString.isEmptyOrWhitespace(list[i])) {
      continue;
    }
    var keyValue = gString.splitLimit(list[i], ': ', 2);
    if (headers[keyValue[0]]) {
      headers[keyValue[0]] += ', ' + keyValue[1];
    } else {
      headers[keyValue[0]] = keyValue[1];
    }
  }

  return headers;
}


/**
 * Get the length of the header section, encoded as a unsigned 32bit
 * integer at position 2 in [Type, Length, HeaderData...].
 *
 * @param {!DataView} headerView
 * @return {number}
 */
function readLengthFromHeader(headerView) {
  return headerView.getUint32(1, false);
}


/**
 * Return true if the positional offset into the buffer is long enough
 * to read byteCount length of data.
 *
 * @param {!Uint8Array} buffer
 * @param {number} position
 * @param {number} byteCount
 * @return {boolean}
 */
function hasEnoughBytes(buffer, position, byteCount) {
  return buffer.byteLength - position >= byteCount;
}

exports = { Parser, parseHeaders };
