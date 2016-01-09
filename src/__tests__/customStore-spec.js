/** Dependencies **/
import {
  express,
  cookieParser,
  bodyParser,
  compression,
  passport,
  session,
  request,
  path,
  Sequelize,
  SequelizeStore,
  sessionTester
} from './modules';


/** Test Modules **/
import {
  expect
} from 'chai';
import { describe,
  before,
  it
} from 'mocha';

const OK = (obj) => {
  return expect(obj).to.not.be.an('undefined');
};


var db = {};

// #1 Set up database
describe('CustomSession Tests', function () {

  var sequelize;
  var store;
  var auth;
  var login;
  var signUp;

  before(done => {
    sequelize = new Sequelize('custom_test', null, null, {
      dialect: 'sqlite',
      logging: false
    });
    sequelize.sync().then((database) => {
      sequelize.import(path.join(__dirname, 'resources', 'userModel'));
      sequelize.import(path.join(__dirname, 'resources', 'customModel'));
      db = database;
      done();
    });
  });

  it('Maps Models to Database', function () {
    db.User = sequelize.models.User;
    db.CustomSession = sequelize.models.CustomSession;
    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
    OK(db);
    OK(db.User);
    OK(db.CustomSession);
  });



  it('Connects Database to the Store', function (done) {
    auth = require('./resources/auth')(db.User);
    login = auth.login;
    signUp = auth.signUp;
    store = new SequelizeStore({
      database: db,
      sessionModel: db.CustomSession
    });
    OK(auth);
    OK(store);
    OK(login);
    OK(signUp);
    db.User.sync();
    done();
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
        saveUninitialized: true
      }));


      app.use(passport.initialize());
      app.use(passport.session());

      app.get('/', (req, res) => {
        console.log(req.cookies);
        if (req.sessionID) {
          res.json(req.sessionID);
        } else {
          res.status(200).send('ok');
        }
      });
      app.get('/session', (req, res) => {
        console.log(req.cookies);
        if (req.sessionID) {
          res.json(req.sessionID);
        } else {
          res.status(500);
          res.send('error');
        }
      });
      app.get('/auth', (req, res) => {
        console.log(req.cookies);
        console.log(req.session);
        res.send(req.isAuthenticated());
      });
      app.post('/api/login', login(), (req, res, next) => {
        next();
      });
      app.post('/api/logout', (req, res) => {
        console.log(req.cookies);
        req.logout();
        res.json({logout: true});
      });
      app.post('/api/signup', signUp(), (req, res, next) => {
        next();
      });

      server = app.listen(5555, done);
    });

    it('server is defined', () => {
      OK(server);
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
      it('has length of one', (done) => {
        store.length((err, count) => {
          expect(err).to.be.a('null');
          expect(count).to.equal(1);
          done();
        });
      });



      it('can signup', (done) => {
        sessionTester(app)
          .post('/api/signup')
          .send({
            username: 'someuser',
            email: 'hubhub@hub.com',
            password: 'password'})
          .expect(200)
          .end((err, res) => {

            expect(err).to.equal(null);
            OK(res);
            OK(res.body);
            expect(res.body.user.username).to.equal('someuser');
            expect(res.body.user.email).to.equal('hubhub@hub.com');
            expect(res.body.user.password)
              .to.equal('5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8');

            db.User.findAll({
              where: {
                username: 'someuser'
              }
            }).then(newUser => {
              let {username, id} = newUser[0].dataValues;
              expect(username).equal('someuser');
              expect(id).be.gt(0);
              done();
            });
          });
      });

      it('logs out', done => {
        sessionTester(app)
          .post('/api/logout')
          .expect(200)
          .end(done);
      });

      it('bad username fail', (done) => {
        sessionTester(app)
          .post('/api/login')
          .send({username: 'asdf', password: 'asdf'})
          .expect(401)
          .end(done);
      });

      it('bad password fail', (done) => {
        request(app)
          .post('/api/login')
          .send({username: 'someuser', password: 'asdf'})
          .expect(401)
          .end(done);
      });

      it('succeeds login', (done) => {
        sessionTester(app)
          .post('/api/login')
          .send({username: 'someuser', password: 'password'})
          .expect(200)
          .end(done);
      });

      it('has sessionID', (done) => {
        sessionTester(app)
          .get('/session')
          .expect(200)
          .end((function (err, res) {
            if (err) {
              done(err);
            } else {
              OK(res.body);
              done();
            }
          }));
      });

      it('stays logged in', (done) => {
        sessionTester(app)
          .get('/auth')
          .expect(200)
          .end((function (err, res) {
            if (err) {
              done(err);
            } else {
              expect(res.body).to.equal(true);
              done();
            }
          }));
      });

    });






  });


});
