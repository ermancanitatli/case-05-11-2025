// Author: Erman CANITATLI
// Soft-delete + timestamps plugin for Mongoose.
'use strict';

// Attaches soft-delete helpers to a schema.
module.exports = function basePlugin(schema) {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  });

  function addNotDeletedFilter() {
    if (!this.getQuery) return;
    const q = this.getQuery();
    if (Object.prototype.hasOwnProperty.call(q, 'isDeleted')) return;
    this.where({ isDeleted: false });
  }

  schema.pre('find', addNotDeletedFilter);
  schema.pre('findOne', addNotDeletedFilter);
  schema.pre('countDocuments', addNotDeletedFilter);
  schema.pre('findOneAndUpdate', addNotDeletedFilter);

  schema.query.withDeleted = function () {
    const q = this.getQuery();
    if (q && Object.prototype.hasOwnProperty.call(q, 'isDeleted') && q.isDeleted === false) {
      delete q.isDeleted;
    }
    return this;
  };

  schema.query.onlyDeleted = function () {
    return this.where({ isDeleted: true });
  };

  schema.statics.softDeleteById = function (id) {
    return this.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true }).withDeleted();
  };

  schema.statics.restoreById = function (id) {
    return this.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true }).withDeleted();
  };

  schema.methods.softDelete = function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  };

  schema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
  };

  if (!schema.options.timestamps) {
    schema.set('timestamps', true);
  }

  if (!schema.options.toJSON) schema.options.toJSON = {};
  schema.options.toJSON.transform = function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  };
};
