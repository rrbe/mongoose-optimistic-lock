const defaultHooks = [
  'save',
  'update',
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
];

function versionKeyPlugin(schema, options = { hooks: defaultHooks }) {
  /**
   * @this {import("mongoose").Document}
   */
  function preSave(next) {
    const versionKey = schema.get('versionKey');
    // in subdocument, this.increment is not a function
    if (versionKey && typeof this.increment === 'function') {
      this.$where = {
        ...this.$where,
        [versionKey]: this[versionKey],
      };
      this.increment();
    }

    next();
  }

  /**
   * @this {import("mongoose").Query}
   */
  function preUpdate(next) {
    const versionKey = schema.get('versionKey');
    if (versionKey) {
      const update = this.getUpdate();

      if (update.__v != null) delete update.__v;

      update.$inc = update.$inc || {};
      update.$inc.__v = 1;

      if (update.$setOnInsert) {
        delete update.$setOnInsert.__v;
      }
    }

    next();
  }

  const { hooks } = options;
  for (const hook of hooks) {
    if (!defaultHooks.includes(hook)) {
      throw new Error(`invalid hook ${hook}`);
    }

    if (hook === 'save') {
      schema.pre(hook, preSave);
    } else {
      schema.pre(hook, preUpdate);
    }
  }
}

module.exports = versionKeyPlugin;
