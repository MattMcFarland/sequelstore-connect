'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _modules = require('./modules');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

_modules.winston.add(_modules.winston.transports.File, { filename: 'sequelstore.index.log' });
_modules.winston.remove(_modules.winston.transports.Console);
var noop = function noop() {};

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

module.exports = function (connect) {
  var Store = connect.Store || connect.session.Store;
  var MemoryStore = connect.MemoryStore || connect.session.MemoryStore;
  var defaults = {
    database: Object,
    fallbackMemory: false,
    transform: JSON.stringify,
    state: {},
    ttl: 1209600, // 14 days
    autoRemoveInterval: 15 * 60 * 1000 // check for expirey every 15.
  };

  var SequelStoreError = function (_Error) {
    _inherits(SequelStoreError, _Error);

    function SequelStoreError(_ref) {
      var message = _ref.message;

      _classCallCheck(this, SequelStoreError);

      var _this = _possibleConstructorReturn(this, (SequelStoreError.__proto__ || Object.getPrototypeOf(SequelStoreError)).call(this, message));

      _this.name = 'SequelizeStore Exception';
      _this.message = message;
      return _this;
    }

    return SequelStoreError;
  }(Error);

  var handleError = function handleError(_ref2) {
    var message = _ref2.message;

    throw new SequelStoreError({ message: message });
  };

  var SequelStore = function (_Store) {
    _inherits(SequelStore, _Store);

    function SequelStore(options) {
      _classCallCheck(this, SequelStore);

      /* Fallback */
      if (options.fallbackMemory && MemoryStore) {
        var _ret;

        return _ret = new MemoryStore(), _possibleConstructorReturn(_this2, _ret);
      }

      var _this2 = _possibleConstructorReturn(this, (SequelStore.__proto__ || Object.getPrototypeOf(SequelStore)).call(this, options));

      _this2.setupListeners = _this2.setupListeners.bind(_this2);
      _this2.applyProps = _this2.applyProps.bind(_this2);
      _this2.all = _this2.all.bind(_this2);
      _this2.destroy = _this2.destroy.bind(_this2);
      _this2.clear = _this2.clear.bind(_this2);
      _this2.length = _this2.length.bind(_this2);
      _this2.get = _this2.get.bind(_this2);
      _this2.set = _this2.set.bind(_this2);
      _this2.touch = _this2.touch.bind(_this2);
      _this2.clearExpiredSessions = _this2.clearExpiredSessions.bind(_this2);
      _this2.startExpiringSessions = _this2.startExpiringSessions.bind(_this2);
      _this2.stopExpiringSessions = _this2.stopExpiringSessions.bind(_this2);
      _this2.sync = _this2.sync.bind(_this2);
      _this2.setupListeners();
      _this2.applyProps(options);
      _this2.applySessionModel(options);
      _this2.startExpiringSessions();
      return _this2;
    }

    _createClass(SequelStore, [{
      key: 'sync',
      value: function sync() {
        return this.sessionModel.sync();
      }
    }, {
      key: 'setupListeners',
      value: function setupListeners() {
        this.on('error', function (err) {
          return handleError(err);
        });
      }
    }, {
      key: 'applyProps',
      value: function applyProps(options) {
        this.options = Object.assign(defaults, options);
        return this;
      }

      // Apply the sessionModel in the following order:
      //
      //    passed in database.ConnectSession first
      //    any model passed in under the 'sessionModel' param.
      //    -- or --
      //    fallback to the default model named DefaultSession
      //    create a DefaultSession and append it to the user db if
      //    neither of the former parameters are used.
      //

    }, {
      key: 'applySessionModel',
      value: function applySessionModel(options) {
        if (!options.database) {
          return this.emit('error', { message: 'No database' });
        }

        if (options.database.models.ConnectSession) {
          this.sessionModel = options.database.models.ConnectSession;
          this.sessionModel.sync();
        } else if (options.sessionModel) {
          this.sessionModel = options.sessionModel;
          this.sessionModel.sync();
        } else {
          this.sessionModel = options.database.import(_modules.path.join(__dirname, 'sessionModel'));
          options.database[this.sessionModel.name] = this.sessionModel;
          this.sessionModel.sync();
        }
      }

      /**
       * Retrieve all sessions from store as an array.
       * @param cb  {Function} cb(error, sessions)
       */

    }, {
      key: 'all',
      value: function all() {
        var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : noop;

        _modules.winston.log('debug', 'session:all');
        return this.sessionModel.findAll().asCallback(cb);
      }

      /**
       * destroy/delete a session from the store given a session ID (sid).
       * The callback should be called as callback(error) once the session
       * is destroyed.
       * @param sid
       * @param cb
       */

    }, {
      key: 'destroy',
      value: function destroy(sid) {
        var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;

        _modules.winston.log('debug', 'session:destroy %s', sid);
        return this.sessionModel.find({ where: { sid: sid } }).then(function (session) {
          // If the session wasn't found, then consider it destroyed already.
          if (session === null) {
            _modules.winston.log('debug', 'Session not found, assuming destroyed %s', sid);
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

    }, {
      key: 'clear',
      value: function clear() {
        var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : noop;

        return this.sessionModel.destroy().asCallback(cb);
      }

      /**
       * This optional method is used to get the count of all sessions in
       * the store. The callback should be called as callback(error, len).
       * @param cb
       */

    }, {
      key: 'length',
      value: function length() {
        var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : noop;

        _modules.winston.log('debug', 'session:length');
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

    }, {
      key: 'get',
      value: function get(sid) {
        var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;

        _modules.winston.log('debug', 'session:get', sid);
        return this.sessionModel.find({ where: { sid: sid } }).then(function (session) {
          if (!session) {
            _modules.winston.log('debug', 'Did not find session %s', sid);
            return null;
          }
          _modules.winston.log('debug', 'FOUND %s with data %s', session.sid, session.data);

          return JSON.parse(session.data);
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

    }, {
      key: 'set',
      value: function set(sid, session) {
        var _this3 = this;

        var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;

        var sessionModel = this.sessionModel;

        _modules.winston.log('debug', 'INSERT "%s"', sid);
        var stringData = this.options.transform(session);
        var expires = void 0;

        if (session.cookie && session.cookie.expires) {
          expires = session.cookie.expires;
        } else {
          expires = new Date(Date.now() + this.options.ttl);
        }

        return sessionModel.findOrCreate({ where: { sid: sid }, defaults: {
            data: stringData, expires: expires
          } }).spread(function (ns) {
          if (ns['data'] !== stringData) {
            ns['data'] = _this3.options.transform(ns);
            ns['expires'] = expires;
            return ns.save().return(ns);
          }
          return session;
        }).asCallback(cb);
      }

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

    }, {
      key: 'touch',
      value: function touch(sid, session) {
        var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;

        _modules.winston.log('debug', 'session:touch', sid);
        var expires;

        if (session.cookie && session.cookie.expires) {
          expires = session.cookie.expires;
        } else {
          expires = new Date(Date.now() + this.options.ttl);
        }

        return this.sessionModel.update({ expires: expires }, { where: { sid: sid } }).return(null).asCallback(cb);
      }
    }, {
      key: 'clearExpiredSessions',
      value: function clearExpiredSessions(cb) {
        _modules.winston.log('debug', 'session:clearExpiredSessions');
        return this.sessionModel.destroy({ where: {
            expires: {
              lt: new Date()
            }
          }
        }).asCallback(cb);
      }
    }, {
      key: 'startExpiringSessions',
      value: function startExpiringSessions() {
        _modules.winston.log('debug', 'session:startExpiringSessions');
        this.stopExpiringSessions();
        if (this.autoRemoveInterval > 0) {
          this.removeInterval = setInterval(this.clearExpiredSessions, this.autoRemoveInterval);
        }
      }
    }, {
      key: 'stopExpiringSessions',
      value: function stopExpiringSessions() {
        _modules.winston.log('debug', 'session:stopExpiringSessions');
        if (this.removeInterval) {
          clearInterval(this.removeInterval);
        }
      }
    }]);

    return SequelStore;
  }(Store);

  return SequelStore;
};