module.exports = function (sequelize, DataTypes) {
  return sequelize.define('User', {
    type: {
      type: new DataTypes.VIRTUAL(DataTypes.STRING),
      get() {
        return 'userType';
      }
    },
    displayName: {
      type: DataTypes.STRING
    },
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING
  });
};
