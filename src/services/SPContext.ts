import { spfi, SPFx, SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";
import { WebPartContext } from "@microsoft/sp-webpart-base";

let _sp: SPFI;

export function initSP(context: WebPartContext): void {
  _sp = spfi().using(SPFx(context));
}

export function getSP(): SPFI {
  if (!_sp) {
    throw new Error("SP context not initialized. Call initSP(context) from the web part's onInit.");
  }
  return _sp;
}
