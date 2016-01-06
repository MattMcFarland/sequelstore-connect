export const defaultSerialize = (session) => {
  const obj = {};
  let cookie = session.cookie;

  return Object.keys(session).forEach(prop => {
    if (prop === 'cookie') {
      obj.cookie = cookie.toJSON ? cookie.toJSON() : cookie;
    } else {
      obj[prop] = session[prop];
    }
  });
};

export const transforms = (options, defaultStringify) => {
  if (options.serialize || options.unserialize) {
    return {
      serialize: options.serialize || defaultSerialize,
      unserialize: options.unserialize || (x => x)
    };
  }

  if (options.stringify === false || defaultStringify === false) {
    return {
      serialize: defaultSerialize,
      unserialize: x => x
    };
  }

  if (options.stringify === true || defaultStringify === true) {
    return {
      serialize: JSON.stringify,
      unserialize: JSON.parse
    };
  }
};
