'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var defaultSerialize = exports.defaultSerialize = function defaultSerialize(session) {
  var obj = {};
  var cookie = session.cookie;

  return Object.keys(session).forEach(function (prop) {
    if (prop === 'cookie') {
      obj.cookie = cookie.toJSON ? cookie.toJSON() : cookie;
    } else {
      obj[prop] = session[prop];
    }
  });
};

var transforms = exports.transforms = function transforms(options, defaultStringify) {
  if (options.serialize || options.unserialize) {
    return {
      serialize: options.serialize || defaultSerialize,
      unserialize: options.unserialize || function (x) {
        return x;
      }
    };
  }

  if (options.stringify === false || defaultStringify === false) {
    return {
      serialize: defaultSerialize,
      unserialize: function unserialize(x) {
        return x;
      }
    };
  }

  if (options.stringify === true || defaultStringify === true) {
    return {
      serialize: JSON.stringify,
      unserialize: JSON.parse
    };
  }
};