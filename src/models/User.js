'use strict';

const { Schema, model } = require('mongoose');
const basePlugin = require('./plugins/basePlugin');

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 32 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true, index: true },
    lastOnlineAt: { type: Date, default: null }
  },
  { timestamps: true }
);


UserSchema.plugin(basePlugin);

UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  }
});

module.exports = model('User', UserSchema);
