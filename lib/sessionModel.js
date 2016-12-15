'use strict';

/**
 * Session Model
 * https://github.com/mweibel/connect-session-sequelize/blob/master/lib/model.js
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('DefaultSession', {
    sid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    expires: DataTypes.DATE,
    data: DataTypes.TEXT
  });
};