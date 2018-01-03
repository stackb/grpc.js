goog.module('grpc.transport.chunk.ParserTest');
goog.setTestOnly('grpc.transport.chunk.ParserTest');

const Parser = goog.require('grpc.chunk.Parser');
const crypt = goog.require('goog.crypt');
const jsunit = goog.require('goog.testing.jsunit');
const objects = goog.require('goog.object');
const testSuite = goog.require('goog.testing.testSuite');

testSuite({

  setUp: () => {
    assertNotNull(jsunit);
  },
  
  testEmpty: () => {
    const parser = new Parser();
    const buffer = new Uint8Array([]);
    const chunks = parser.parse(buffer);
    assertNotNull(chunks);
    assertEquals(0, chunks.length);
  },

  testTooShortMessage: () => {
    const parser = new Parser();
    const buffer = new Uint8Array([0, 0, 0, 0]);
    const chunks = parser.parse(buffer);
    assertNotNull(chunks);
    assertEquals(0, chunks.length);
  },

  testZeroLengthMessage: () => {
    const parser = new Parser();
    const buffer = new Uint8Array([0, 0, 0, 0, 0]);
    const chunks = parser.parse(buffer);
    assertNotNull(chunks);
    assertEquals(1, chunks.length);
    const chunk = chunks[0];
    assertNotNull(chunk);
    assertTrue(chunk.isMessage());
    assertNotNull(chunk.getData());
    assertEquals(0, chunk.getData().length);
  },

  testOneByteMessage: () => {
    const parser = new Parser();
    const buffer = new Uint8Array([0, 0, 0, 0, 1, 97]); // Length 1, 'A'
    const chunks = parser.parse(buffer);
    assertNotNull(chunks);
    assertEquals(1, chunks.length);
    const chunk = chunks[0];
    assertNotNull(chunk);
    assertTrue(chunk.isMessage());
    assertNotNull(chunk.getData());
    assertEquals(1, chunk.getData().length);
    assertEquals(97, chunk.getData()[0]);
  },

  testMessageIgnoresExtraTrailingBytes: () => {
    const parser = new Parser();
    // Lenth is 1, but three extra ints.  Ignore them.
    const buffer = new Uint8Array([0, 0, 0, 0, 1, 97, 0, 0, 0]);
    const chunks = parser.parse(buffer);
    assertNotNull(chunks);
    assertEquals(1, chunks.length);
    const chunk = chunks[0];
    assertNotNull(chunk);
    assertTrue(chunk.isMessage());
    assertNotNull(chunk.getData());
    assertEquals(1, chunk.getData().length);
    assertEquals(97, chunk.getData()[0]);
  },

  testZeroLengthTrailer: () => {
    const parser = new Parser();
    const buffer = new Uint8Array([253, 0, 0, 0, 0]);
    const chunks = parser.parse(buffer);
    assertNotNull(chunks);
    assertEquals(1, chunks.length);
    const chunk = chunks[0];
    assertNotNull(chunk);
    assertNotNull(chunk.getTrailers());
    assertTrue(objects.isEmpty(chunk.getTrailers()));
    assertFalse(chunk.isMessage());
  },

  testSingleEntryTrailer: () => {
    const trailer = "Key: Value";
    const trailerBytes = crypt.stringToUtf8ByteArray(trailer);
    const trailerBuffer = new Uint8Array(trailerBytes.length);
    trailerBuffer.set(trailerBytes, 0);
    const headerBuffer = new Uint8Array([253, 0, 0, 0, trailerBuffer.length]);
    assertNotNull(headerBuffer);
    const buffer = new Uint8Array(headerBuffer.length + trailerBuffer.length);
    assertNotNull(buffer);
    assertEquals(15, buffer.length);
    buffer.set(headerBuffer, 0);
    buffer.set(trailerBuffer, headerBuffer.length);
    
    const parser = new Parser();
    const chunks = parser.parse(buffer);
    assertNotNull(chunks);
    assertEquals(1, chunks.length);
    const chunk = chunks[0];
    assertNotNull(chunk);

    const trailers = chunk.getTrailers();
    assertNotNull(trailers);
    assertEquals(1, objects.getCount(trailers));
    assertEquals("Value", trailers["Key"]);
  },

  testMultipleEntryTrailer: () => {
    const trailer = "Key: Value\r\nFoo: Bar";
    const trailerBytes = crypt.stringToUtf8ByteArray(trailer);
    const trailerBuffer = new Uint8Array(trailerBytes.length);
    trailerBuffer.set(trailerBytes, 0);
    const headerBuffer = new Uint8Array([253, 0, 0, 0, trailerBuffer.length]);
    assertNotNull(headerBuffer);
    const buffer = new Uint8Array(headerBuffer.length + trailerBuffer.length);
    assertNotNull(buffer);
    buffer.set(headerBuffer, 0);
    buffer.set(trailerBuffer, headerBuffer.length);
    
    const parser = new Parser();
    const chunks = parser.parse(buffer);
    assertNotNull(chunks);
    assertEquals(1, chunks.length);
    const chunk = chunks[0];
    assertNotNull(chunk);

    const trailers = chunk.getTrailers();
    assertNotNull(trailers);
    assertEquals(2, objects.getCount(trailers));
    assertEquals("Value", trailers["Key"]);
    assertEquals("Bar", trailers["Foo"]);
  },
  
});
