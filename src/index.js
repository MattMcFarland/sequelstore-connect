/**
 * Connect Sequelize
 * Author: Matt McFarland <contact@mattmcfarland.com>
 * License: MIT
 *
 *  Based in part off of:
 *    * connect-session-sequelize.js
 *      - https://github.com/mweibel/connect-session-sequelize
 *      - by Michael Weibel <micheal.weibel@gmail.com>
 *      - MIT Licensed
 *    * connect-mongo
 *      - https://github.com/kcbanner/connect-mongo/
 *      - by Casey Banner <kcbanner@gmail.com>
 *      - by Jerome Desboeufs <jerome.desboeufs@gmail.com>
 *      - MIT Licensed
 *    * connect-redis
 *      - https://github.com/tj/connect-redis
 *      - by TJ Holowaychuk <tj@vision-media.ca>
 *      - MIT Licensed
 */
// import { transforms } from './utils';
const path = require('path');
const debug = require('debug')('connect:sequelize');
const noop = function () { };

type Options = {
  fallbackMemory: any;
  transform: any;
  database: any;
  ttl: any;
  autoRemoveInterval: number;
  removeInterval: any;
  all: any;
  destroy: any;
  clear: any;
  length: any;
}
type ExpressSession = {
  Store: any;
  MemoryStore: any;
  session: ExpressSession;
}
type SessionModel = {
  asCallback: any;
  findAll: any;
  find: any;
  destroy: any;
  count: any;
  update: any
}
type ConnectStore = {
  options: Options;
  ttl: number;
  sessionModel: SessionModel;
  applyProps: any,
  emit: any;
  transform: any;
  database: any;
  ttl: any;
  autoRemoveInterval: number;
  removeInterval: any;
  all: any;
  destroy: any;
  clear: any;
  length: any;
  startExpiringSessions: any
}

/**
 * Returns a constructor with the specified connect middleware's Store
 * class as its prototype
 *
 * ####Example:
 *
 *     SeqStore(require('express-session'));
 *
 * @param {Function} connect connect-compatible session middleware
 * @api public
 */

module.exports = function connectSequelize(connect:ExpressSession) {
  const Store = connect.Store || connect.session.Store;
  const MemoryStore = connect.MemoryStore || connect.session.MemoryStore;
  const defaults = {
    transform: JSON.stringify,
    state: {},
    ttl: 1209600, // 14 days
    autoRemoveInterval: 15 * 60 * 1000 // check for expirey every 15.
  };

  class SequelStoreError extends Error {
    constructor({message}) {
      super(message);
      this.filename = path.join(__dirname, 'index.js');
      this.name = 'SequelizeStore Exception';
      this.message = message;
    }
  }
  const handleError = ({message}) => {
    throw new SequelStoreError({message});
  };

  class SequelStore extends Store<ConnectStore> {

    constructor(options = {}) {
      /* Fallback */
      if (options.fallbackMemory && MemoryStore) {
        return new MemoryStore();
      }
      super(options);
      this.setupListeners();
      this.applySessionModel(options);
      this.applyProps(options);
      this.startExpiringSessions();
    }

    setupListeners = () => {
      this.on('error', (err => (handleError(err))));
    };

    applyProps = (options) => {
      this.options = Object.assign(defaults, options);
      return this;
    };

    // Apply the sessionModel in the following order:
    //
    //    passed in database.ConnectSession first
    //    any model passed in under the 'sessionModel' param.
    //    -- or --
    //    fallback to the default model named DefaultSessionModel
    //    create a DefaultSessionModel and append it to the user db if
    //    neither of the former parameters are used.
    //
    applySessionModel = (options) => {
      if (!options.database) {
        return this.emit('error', { message: 'No database'});
      }

      if (options.database.models.ConnectSession) {
        this.sessionModel = options.database.models.ConnectSession;
      } else if (options.sessionModel) {
        this.sessionModel = Object.assign({}, options.sessionModel);
      } else {
        this.sessionModel = options.database.import(
          path.join(__dirname, 'sessionModel'));
      }
      this.sync = function () {
        return this.sessionModel.sync();
      };
    }

    /**
     * Retrieve all sessions from store as an array.
     * @param cb  {Function} cb(error, sessions)
     */
    all = (cb = noop) => {
      debug('session:all');
      return this.sessionModel.findAll().asCallback(cb);
    }

    /**
     * destroy/delete a session from the store given a session ID (sid).
     * The callback should be called as callback(error) once the session
     * is destroyed.
     * @param sid
     * @param cb
     */
    destroy = (sid:string, cb = noop) => {
      debug('session:destroy %s', sid);
      return this.sessionModel.find(
        {where: {sid}}
      ).then(session => {
        // If the session wasn't found, then consider it destroyed already.
        if (session === null) {
          debug('Session not found, assuming destroyed %s', sid);
          return null;
        }
        return session.destroy();
      }).asCallback(cb);
    }
    /**
     * This optional method is used to delete all sessions from the store.
     * The callback should be called as callback(error) once the store
     * is cleared.
     * @param cb
     */
    clear = (cb = noop) => {
      return this.sessionModel.destroy().asCallback(cb);
    }

    /**
     * This optional method is used to get the count of all sessions in
     * the store. The callback should be called as callback(error, len).
     * @param cb
     */
    length = (cb = noop) => {
      debug('session:length');
      return this.sessionModel.count().asCallback(cb);
    }

    /**
     * This required method is used to get a session from the store given a
     * session ID (sid). The callback should be called as
     * callback(error, session).The session argument should be a session if
     * found, otherwise null or undefined if the session was not found
     * (and there was no error). A special case is made when
     * error.code === 'ENOENT' to act like callback(null, null).
     * @param sid
     * @param cb
     */
    get = (sid:string, cb = noop) => {
      debug('session:get', sid);
      return this.sessionModel.find(
        { where: { sid } }
      ).then(session => {
        if (!session) {
          debug('Did not find session %s', sid);
          return null;
        }
        debug('FOUND %s with data %s', session.sid, session.data);

        return this.transform(session.data);
      }).asCallback(cb);
    }


    /**
     * This required method is used to upsert a session into the store
     * given a session ID (sid) and session (session) object. The callback
     * should be called as callback(error) once the session has been set in
     * the store.
     * @param sid
     * @param session
     * @param cb
     */
    set = (sid:string, session:string, cb = noop) => {
      var sessionModel = this.sessionModel;

      debug('INSERT "%s"', sid);
      let stringData = this.transform(session);
      let expires;

      if (session.cookie && session.cookie.expires) {
        expires = session.cookie.expires;
      } else {
        expires = new Date(Date.now() + this.options.ttl);
      }

      return sessionModel.findOrCreate(
        {where: {sid}, defaults: {
          data: stringData, expires: expires
        }}).spread(ns => {
        if (ns['data'] !== stringData) {
          ns['data'] = this.transform(ns);
          ns['expires'] = expires;
          return ns.save().return(ns);
        }
        return session;
      }).asCallback(cb);
    };

    /**
     * This recommended method is used to "touch" a given session given a
     * session ID (sid) and session (session) object. The callback should
     * be called as callback(error) once the session has been touched.
     * This is primarily used when the store will automatically delete
     * idle sessions and this method is used to signal to the store the
     * given session is active, potentially resetting the idle timer.
     * @param sid
     * @param session
     * @param cb
     */
    touch = (sid:string, session:string, cb = noop) => {
      debug('session:touch', sid);
      var expires;

      if (session.cookie && session.cookie.expires) {
        expires = session.cookie.expires;
      } else {
        expires = new Date(Date.now() + this.options.ttl);
      }

      return this.sessionModel.update(
        { expires }, { where: { sid } }
      ).return(null).asCallback(cb);

    }

    clearExpiredSessions = (cb) => {
      debug('session:clearExpiredSessions');
      return this.sessionModel.destroy(
        {where: {
          expires: {
            lt: new Date()
          }
        }
        }
      ).asCallback(cb);
    }

    startExpiringSessions = () => {
      debug('session:startExpiringSessions');
      this.stopExpiringSessions();
      if (this.autoRemoveInterval > 0) {
        this.removeInterval = setInterval(
          this.clearExpiredSessions,
          this.autoRemoveInterval
        );
      }
    }

    stopExpiringSessions = () => {
      debug('session:stopExpiringSessions');
      if (this.removeInterval) {
        clearInterval(this.removeInterval);
      }
    }
  }

  return SequelStore;
};
