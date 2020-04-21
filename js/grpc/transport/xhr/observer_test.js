goog.module('grpc.transport.xhr.ObserverTest');
goog.setTestOnly('grpc.transport.xhr.ObserverTest');

const GrpcOptions = goog.require('grpc.Options');
const GrpcStatus = goog.require('grpc.Status');
const JspbBinaryReader = goog.require('jspb.BinaryReader');
const JspbBinaryWriter = goog.require('jspb.BinaryWriter');
const JspbByteSource = goog.require('jspb.ByteSource');
const JspbMessage = goog.require('jspb.Message');
const StreamObserver = goog.require('grpc.Observer');
const TestXhrIo = goog.require('goog.testing.net.XhrIo');
const Xhr = goog.require('grpc.transport.Xhr');
const XhrObserver = goog.require('grpc.transport.xhr.Observer');
const arrays = goog.require('goog.array');
const crypt = goog.require('goog.crypt');
const jsunit = goog.require('goog.testing.jsunit');
const objects = goog.require('goog.object');
const testSuite = goog.require('goog.testing.testSuite');

testSuite({

  setUp: () => {
    assertNotNull(jsunit);
  },

  testEmpty: () => {

    const options = new GrpcOptions();
    const xhr = new MockXhrIo();
    const mockXhrTransport = new MockXhr(options, xhr);
    const mockObserver = new MockObserver();
    const mockMessage = new MockProtocolBuffer();

    const stream = new XhrObserver(
      mockXhrTransport,
      options,
      'mockService.getFoo',
      mockEncoder,
      mockDecoder,
      mockObserver);
    assertNotNull(stream);

    // Should start out in INTERNAL state
    assertEquals(GrpcStatus.INTERNAL, stream.getStatus());

    // Should take a single input value
    stream.onNext(mockMessage);

    // Stream should fire send when we trigger onCompleted()
    stream.onCompleted();

    // Should transition to UNKNOWN state
    assertEquals(GrpcStatus.UNKNOWN, stream.getStatus());

    // POSTing to root of origin with given name.
    assertEquals('POST', xhr.getLastMethod());
    assertEquals('/mockService.getFoo', xhr.getLastUri());
    assertEquals("application/grpc-web+proto", xhr.getLastRequestHeaders()["content-type"]);
    assertEquals("1", xhr.getLastRequestHeaders()["x-grpc-web"]);
    assertTrue(/** @type {!Uint8Array} */(xhr.getLastContent()) instanceof Uint8Array);
    // First 5 is the frame header, then the encoded protobuf
    assertUint8ArrayEquals(new Uint8Array([0, 0, 0, 0, 5, 10, 3, 102, 111, 111]), xhr.getLastContent());

    xhr.simulatePartialResponse("", {
      "Grpc-Status": "0",
      "Grpc-Message": "All Good"
    });

    assertEquals(2, objects.getCount(xhr.getResponseHeaders()));

    // AT LOADING PHASE
    //xhr.simulateReadyStateChange(3);
    assertEquals(200, xhr.getStatus());

    // Stream should be in OK state
    assertEquals(GrpcStatus.OK, stream.getStatus());

    // Mock observer should have recvd a progress message
    assertEquals(1, mockObserver.progressStack.length);
    assertEquals(GrpcStatus.OK, mockObserver.progressStack[0].status);
    assertEquals(2, objects.getCount(mockObserver.progressStack[0].headers));
    assertEquals("All Good", mockObserver.progressStack[0].headers["Grpc-Message"]);

    xhr.simulateHeaderTrailerResponse({
      "Key": "Value",
      "键": "酒吧" // 'key' -> 'bar'
    }, false);

    assertEquals(2, mockObserver.progressStack.length);
    assertEquals(GrpcStatus.OK, mockObserver.progressStack[1].status);
    assertEquals(2, objects.getCount(mockObserver.progressStack[1].headers));
    assertEquals("Value", mockObserver.progressStack[1].headers["Key"]);
    assertEquals("酒吧", mockObserver.progressStack[1].headers["键"]);

    // Now simulate a message
    assertEquals(0, mockObserver.messageStack.length);
    xhr.simulateMessageResponse([10, 3, 65, 66, 67]);
    assertEquals(1, mockObserver.messageStack.length);
    assertEquals("ABC", /** @type {!MockProtocolBuffer} */(mockObserver.messageStack[0]).name);

    // And a trailer
    xhr.simulateHeaderTrailerResponse({
      "Sent-Message-Count": "1",
    }, true);

    assertEquals(3, mockObserver.progressStack.length);
    assertEquals(GrpcStatus.OK, mockObserver.progressStack[2].status);
    assertTrue(mockObserver.progressStack[2].isTrailer);
    assertEquals(1, objects.getCount(mockObserver.progressStack[2].headers));
    assertEquals("1", mockObserver.progressStack[2].headers["Sent-Message-Count"]);

    // Now simulate success
  },

});


/**
 * @param {*} a
 * @param {*} b
 * @return {boolean} 
 */
function assertUint8ArrayEquals(a, b) {
  assertNotNull(a);
  assertNotNull(b);
  const ua = /** @type {!Uint8Array} */ (a);
  const ub = /** @type {!Uint8Array} */ (b);

  // for (let i = 0; i < ua.length; i++) {
  //   console.log(`a[${i}: ${ua[i]}`);
  // }
  // for (let i = 0; i < ub.length; i++) {
  //   console.log(`b[${i}: ${ub[i]}`);
  // }

  assertEquals('Buffer lengths should match', ua.byteLength, ub.byteLength);
  for (let i = 0; i < ua.length; i++) {
    assertEquals('Should match at position ' + i, ua[i], ub[i]);
  }
  return true;
}

/**
 * @param {!JspbMessage} message
 * @return {!JspbByteSource} 
 */
function mockEncoder(message) {
  const mock = /** @type {!MockProtocolBuffer} */ (message);
  return mock.serializeBinary();
}


/**
 * @type {function(!JspbByteSource):!JspbMessage} 
 */
function mockDecoder(bytes) {
  /** @protected @type {!Uint8Array} */
  const buffer = /** @type {!Uint8Array} */ (bytes);
  console.log(`Decoder input (${buffer.constructor} ${buffer.length}): ` + crypt.byteArrayToString(buffer));
  return MockProtocolBuffer.fromBytes(bytes);
}


class MockProtocolBuffer extends JspbMessage {

  /**
   * @param {!JspbByteSource} bytes
   * @return {!MockProtocolBuffer}
   */
  static fromBytes(bytes) {
    const message = new MockProtocolBuffer();
    message.deserializeBinary(bytes);
    return message;
  }

  constructor() {
    super();
    /** @public @type {string} */
    this.name = "foo";
  }


  /**
   * Deserializes binary data (in protobuf wire format).
   * @param {!JspbByteSource} bytes The bytes to deserialize.
   * @return {!JspbMessage}
   */
  deserializeBinary(bytes) {
    var reader = new JspbBinaryReader(bytes);
    return this.deserializeBinaryFromReader(reader);
  }

  /**
   * Deserializes binary data (in protobuf wire format) from the
   * given reader into the given message object.
   * @param {!JspbBinaryReader} reader The BinaryReader to use.
   * @return {!JspbMessage}
   */
  deserializeBinaryFromReader(reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) {
        break;
      }
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          const value = /** @type {string} */ (reader.readString());
          this.name = value;
          break;
        default:
          throw new Error(`Unexpected input field: ${field}` + reader);
      }
    }
    return this;
  }


  /**
   * Serializes the message to binary data (in protobuf wire format).
   * @return {!Uint8Array}
   */
  serializeBinary() {
    var writer = new JspbBinaryWriter();
    this.serializeBinaryToWriter(writer);
    return writer.getResultBuffer();
  }


  /**
   * Serializes the given message to binary data (in protobuf wire
   * format), writing to the given BinaryWriter.
   * @param {!JspbBinaryWriter} writer
   */
  serializeBinaryToWriter(writer) {
    writer.writeString(1, this.name);
  }

}


/**
 * Mock XhrIo class that can simulate progressive message / headers
 * responses.
 */
class MockXhrIo extends TestXhrIo {

  /**
   * 
   * @return {!XMLHttpRequest}  
   */
  createXMLHttpRequest() {
    return /** @type {!XMLHttpRequest} */(super.createXhr());
  }

  /**
   * Convert the raw string to an ArrayBuffer
   * @param {!Uint8Array} buffer
   * @return {string} 
   */
  arrayBufferToString(buffer) {
    let s = '';
    for (let i = 0; i < buffer.length; i++) {
      const ch = String.fromCharCode(buffer[i]);
      s += ch;
    }
    return s;
  }


  /**
   * @param {!Object<string,string>} headers
   * @param {boolean} isTrailer
   */
  simulateHeaderTrailerResponse(headers, isTrailer) {
    const keys = objects.getKeys(headers);
    keys.sort();
    /** @type {!Array<string>} */
    const h = [];
    keys.forEach(key => h.push(`${key}: ${headers[key]}`));
    const headerString = h.join("\r\n");
    const headerBytes = crypt.stringToUtf8ByteArray(headerString);
    console.log('HEADER BYTES: ' + headerBytes.length);
    const buffer = new Uint8Array(arrays.concat([253, 0, 0, 0, headerBytes.length], headerBytes));
    //const raw = crypt.utf8ByteArrayToString(buffer);
    const raw = this.arrayBufferToString(buffer);
    // We have to encode as base64 for the test as the base XhrIo
    // class makes it hard to set the response text as an object.
    //const encoded = base64.encodeByteArray();
    this.simulatePartialResponse(raw);
    this.simulateProgress(true, 0, raw.length);
  }


  /**
   * @param {!Array<number>} data
   */
  simulateMessageResponse(data) {
    const buffer = new Uint8Array(arrays.concat([0, 0, 0, 0, data.length], data));
    const raw = this.arrayBufferToString(buffer);
    this.simulatePartialResponse(raw);
    this.simulateProgress(true, 0, raw.length);
  }


  /**
   * Decode the base64 content we set above.
   * 
   * @override
   */
  getResponseText() {
    return super.getResponseText();
  }

  /**
   * The base class is excessively strict (?) about making sure the
   * response status is completed before accessing the response
   * headers.  Kinda dumb that we have to re-parse them (and naively
   * so at that).
   * 
   * @override
   */
  getResponseHeaders() {
    const headers = {};
    const s = this.getAllStreamingResponseHeaders();
    const pairs = s.split("\r\n");
    pairs.forEach(pair => {
      const tokens = pair.split(":");
      headers[tokens[0].trim()] = tokens[1].trim();
    });
    return headers;
  }

}

/**
 * Mock Xhr that returns our MockXhr implementation.  Should
 * only be called once.
 */
class MockXhr extends Xhr {

  /** 
   * @param {!GrpcOptions} options
   * @param {!MockXhrIo} xhr
   */
  constructor(options, xhr) {
    super(options);

    /** @public @type {!MockXhrIo} */
    this.xhr = xhr;

    xhr.setProgressEventsEnabled(true);
    xhr.headers.set("content-type", "application/grpc-web+proto");
    xhr.headers.set("x-grpc-web", "1");
    xhr.headers.set("x-user-agent", "grpc-web-javascript/0.1");
  }

  /**
   * @override
   */
  createObject() {
    return this.xhr.createXMLHttpRequest();
  }

}


/**
 * Mock observer impl that keeps a log of stuff that happened to it.
 * 
 * @implements {StreamObserver}
 * #template T
 */
class MockObserver {

  constructor() {

    /** @public @type {!Array<{headers:!Object<string,string>,status:GrpcStatus,isTrailer:(boolean|undefined)}>} */
    this.progressStack = [];

    /** @public @type {!Array<!Object>} */
    this.messageStack = [];

    /** @public @type {!Array<!grpc.Rejection>} */
    this.errorStack = [];

    /** @public @type {number}} */
    this.isCompleted = 0;

  }

  /** @override */
  onProgress(headers, status, isTrailer) {
    console.log('Progress recvd ' + status + isTrailer, JSON.stringify(headers));
    this.progressStack.push({
      headers: headers,
      status: status,
      isTrailer: isTrailer
    });
  }

  /** @override */
  onError(rejection) {
    this.errorStack.push(rejection);
  }

  /** 
   * @override 
   * @param {!Object} value
   */
  onNext(value) {
    this.messageStack.push(value);
  }

  /** @override */
  onCompleted() {
    this.isCompleted++;
  }

}
