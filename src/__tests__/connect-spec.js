/** Dependencies **/
import {
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


describe('SequelStore', function () {


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
        sessionModel: customDB.models.CustomSession
      });
      expect(customStore.sessionModel.name).to.equal('CustomSession');
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
