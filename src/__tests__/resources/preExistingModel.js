/*
 * Pre-Existing Model - if it simply exists in the provided database then
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
