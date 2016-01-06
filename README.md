# An express-session store for Sequelize.js

[![npm](https://img.shields.io/npm/v/sequelstore-connect.svg)](https://www.npmjs.com/package/sequelstore-connect)
[![Travis](https://img.shields.io/travis/rust-lang/rust.svg)](https://travis-ci.org/MattMcFarland/sequelstore-connect)
[![Coverage Status](https://coveralls.io/repos/MattMcFarland/sequelstore-connect/badge.svg?branch=master&service=github)](https://coveralls.io/github/MattMcFarland/sequelstore-connect?branch=master)

Sequelize session store for [Connect](https://github.com/senchalabs/connect) and [Express](http://expressjs.com/)

## Compatibility

* Support Express `4.x` and `5.0`
* Support Node.js `0.10`, `0.12`, `4.x`, `5.x` and all [io.js](https://iojs.org) versions
* Support for [Sequelize](http://docs.sequelizejs.com/en/latest/) up to version  `3.15`


### Express or Connect integration

Express `4.x`, `5.0` and Connect `3.x`:

```js
const session = require('express-session');
const SequelStore = require('sequelstore-connect')(session);

app.use(session({
    secret: 'foo',
    store: new SequelStore(options)
}));
```

### Connection to Sequelize

`sequelstore-connect` can be used in three different ways,
depending on your architecture, you should pick one which fits your
requirements and architecture the best.

- Usage with your existing database by adding a specific model.

- Usage with your existing database by passing a custom model into it.

- Or it can create the model for you.


```js
const Sequelize = require('sequelize');

// Basic usage
const database = new Sequelize(config);

app.use(session({
    store: new SequelizeStore({database})
}));
```


#### Re-use your Sequelize instance.

In this case, you just have to give your `Db` instance to `sequelstore-connect`.
If the connection is not opened, `sequelstore-connect` will do it for you.

```js
/*
** There are many ways to create an instance.
** You should refer to the ORM documentation
** http://docs.sequelizejs.com/en/latest/
*/



const database = require ('./models').sequelize;

app.use(session({
    store: new MongoStore({ database })
}));
```


### Using your own session models

Automatically use your db by creating a Model named `ConnectSession`

```js
/*
 * IF this model exists anywhere in your db then
 * it will be used for session storage. It must be named "ConnectSession"
 */
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ConnectSession', {
    sid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    expires: DataTypes.DATE
  });
};
```

### Using a custom session model

Use the `sessionModel` option for custom integration.

```js
store = new SequelStore({
  database,
  sessionModel: db.models.FooModel
});
```



## Session expiration

When the session cookie has an expiration date, `sequelstore-connect` will use it.

Otherwise, it will create a new one, using `ttl` option.

```js
app.use(session({
    store: new MongoStore({
      database: db,
      ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    })
}));
```

__Note:__ Each time an user interacts with the server, its session expiration date is refreshed.


## Remove expired sessions
Expired session are removed from the database every 15 minutes by default.
You can change it by setting `autoRemoveInterval`


```js
app.use(session({
    store: new MongoStore({
      database,
      autoRemoveInterval: 15 * 60 * 1000 // = 15 minutes. Default.
    })
}));
```

### Disable expired sessions cleaning

You are in production environment and/or you manage the TTL index elsewhere.

```js
app.use(session({
    store: new MongoStore({
      url: 'mongodb://localhost/test-app',
      autoRemoveInterval: 0
    })
}));
```


## More options

  - `fallbackMemory` Fallback to `MemoryStore`. Useful if you want to use MemoryStore in some case, like in development environment.
  - `transform` Default is `JSON.stringify` - you can change the function that handles the session data.

## Tests

    npm install && npm test

# Contributing

After cloning this repo, ensure dependencies are installed by running:

```sh
npm install
```

This library is written in ES6 and uses [Babel](http://babeljs.io/) for ES5
transpilation and [Flow](http://flowtype.org/) for type safety. Widely
consumable JavaScript can be produced by running:

```sh
npm run build
```

Once `npm run build` has run, you may `import` or `require()` directly from
node.

After developing, the full test suite can be evaluated by running:

```sh
npm test
```

While actively developing, we recommend running

```sh
npm run watch
```

in a terminal. This will watch the file system run lint, tests, and type
checking automatically whenever you save a js file.

To lint the JS files and run type interface checks run `npm run lint`.

# Acknowledgements

The following sources were heavily studied and/or used to product this library.

* connect-session-sequelize.js
  - https://github.com/mweibel/connect-session-sequelize
  - by Michael Weibel
  - MIT Licensed
* connect-mongo
  - https://github.com/kcbanner/connect-mongo/
  - by Casey Banner
  - by Jerome Desboeufs
  - MIT Licensed
* connect-redis
  - https://github.com/tj/connect-redis
  - by TJ Holowaychuk
  - MIT Licensed

## License

The MIT License
