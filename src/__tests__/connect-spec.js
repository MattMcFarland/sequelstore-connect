/** Dependencies **/
import {
  express,
  cookieParser,
  bodyParser,
  compression,
  // passport,
  session,
  request,
  path,
  Sequelize,
  SequelizeStore
} from './modules';


/** Test Modules **/
import {
  expect
} from 'chai';
import { describe,
  before,
  it
} from 'mocha';

const assertOK = (obj) => {
  return expect(obj).to.not.be.an('undefined');
};


const database = new Sequelize('session_test', null, null, {
  dialect: 'sqlite',
  logging: false
});
var store = new SequelizeStore({database});

describe('SequelStore Bootstrap', function () {

  it('database exists', () => {
    assertOK(database);
  });
  it('store exists', () => {
    assertOK(store);
  });
  describe('=> Express Server', function () {
    const app = express();
    var server;
    before(done => {
      app.use(compression({level: 9}));
      app.use(cookieParser());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({extended: true}));
      app.use(session({
        secret: 'nyan cat',
        store,
        name: '___test',
        resave: true,
        saveUninitialized: false
      }));
      app.get('/', (req, res) => {
        res.status(200).send('ok');
      });
      server = app.listen(5555, done);
    });

    it('server is defined', () => {
      assertOK(server);
    });

    it('server response', (done) => {
      request(app)
        .get('/')
        .expect(200)
        .end(done);
    });
    describe('=> Store', function () {
      before(() => {
        return store.sync();
      });
      it('has zero length', (done) => {
        store.length((err, count) => {
          expect(err).to.be.a('null');
          expect(count).to.equal(0);
          done();
        });
      });
    });




    describe('=> Custom Store', function () {
      var customDB;
      var customStore;
      before((done) => {
        customDB = new Sequelize('custom_test', null, null, {
          dialect: 'sqlite',
          logging: false
        });
        customDB.import(path.join(__dirname, 'resources', 'customModel'));
        done();
      });

      it('should load a custom model if ' +
        'one is passed in as sessionModel param.', () => {
        customStore = new SequelizeStore({
          database: customDB,
          sessionModel: customDB.models.CustomModel
        });
        expect(customStore.sessionModel.name).to.equal('CustomModel');
      });
    });







    describe('=> Pre-Existing Store', function () {
      var preExistingDB;
      var preExistingStore;
      before((done) => {
        preExistingDB = new Sequelize('pre_existing_test', null, null, {
          dialect: 'sqlite',
          logging: false
        });
        preExistingDB.sync().then(() => {
          preExistingDB.import(path.join(
            __dirname, 'resources', 'preExistingModel')
          );
          done();
        });


      });

      it('should load a pre-existing model if the provided database ' +
        'contains a Model Class named "ConnectSession".', () => {
        preExistingStore = new SequelizeStore({database: preExistingDB});
        expect(preExistingStore.sessionModel.name).to.equal('ConnectSession');
      });

    });







    describe('=> Default (fallback) Store', function () {
      var fallbackDB;
      var fallbackStore;
      before(() => {
        fallbackDB = new Sequelize('fallback_test', null, null, {
          dialect: 'sqlite',
          logging: false
        });
      });

      it('should create a model for you if you do not provide one.', () => {
        fallbackStore = new SequelizeStore({database: fallbackDB});
        expect(fallbackStore.sessionModel.name).to.equal('DefaultSession');
        assertOK(fallbackDB.DefaultSession);
      });

    });







  });

});



