// Author: Erman CANITATLI
// Tiny holder for socket.io instance.
'use strict';

let ioInstance = null;

// Sets the active io instance.
function setIO(io) {
  ioInstance = io;
}

// Returns the active io instance.
function getIO() {
  return ioInstance;
}

module.exports = { setIO, getIO };
