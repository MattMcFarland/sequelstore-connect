/*
 * Used to test custom model loading
 */
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('CustomModel', {
    sid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    expires: DataTypes.DATE,
    data: DataTypes.STRING(50000)
  });
};
