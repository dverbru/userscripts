/*
 * Type definitions for userscript environment.
 * Rather than including https://github.com/violentmonkey/types, I define the
 * specific APIs I use, in a cross-userscript-manager compatible form.
 */

interface GMInfo {
  scriptHandler: string
}

interface GMObject {
  info: GMInfo
  setClipboard: (data: string, type?: string) => void | Promise<void>
}

declare global {
  var GM: GMObject
}

export {}
