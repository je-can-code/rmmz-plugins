//region install-serializable-registry-stub
/**
 * Installs a do-nothing {@link SerializableRegistry} stand-in onto the realm, for test files whose
 * import chain reaches a model that registers its save codec at module-evaluation time.
 *
 * Import this BEFORE the source module under test- static imports evaluate in declaration order,
 * so this module's side effect lands ahead of the registration that needs it. Files that actually
 * exercise codec behavior want the real registry from `install-save-registration-realm.js` instead;
 * the `??=` here yields to whichever registry a test installed first.
 */
globalThis.SerializableRegistry ??= {
  /**
   * Accepts and discards a codec registration.
   */
  register()
  {
  },

  /**
   * Accepts and discards a codec extension.
   */
  extend()
  {
  },
};
//endregion install-serializable-registry-stub