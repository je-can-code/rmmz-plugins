//region strip-esm-for-vm
/**
 * Strips ESM syntax so SDP `__models` sources can run in a plain VM bundle (legacy test harness).
 *
 * @param {string} source
 * @returns {string}
 */
export function stripEsmForVm(source)
{
  return source
    .replace(/^import .+;\r?\n/gm, '')
    .replace(/^export default .+;\r?\n/gm, '');
}
//endregion strip-esm-for-vm