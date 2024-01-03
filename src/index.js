import Params from "./components/Params.js"
import { i18n } from "./utils.js"

export default class Node extends HTMLElement {
  /** @type {ShadowRoot} */ #host
  constructor() {
    super()
    this.#host = this.attachShadow({ mode: "closed" })
  }
  async connectedCallback() {
    const schema = await fetch(this.getAttribute("schema")).then((data) => data.json())

    const socketTypes = new Set()
    const input = Params(schema.input, socketTypes)
    const output = Params(schema.output, socketTypes)
    for (let socketType of socketTypes) {
      switch (socketType) {
        case "string":
          import("./components/SocketString.js").then((module) => customElements.define("input-string", module.default))
          break
        default:
          break
      }
    }
    this.#host.innerHTML = /*html*/ `
    <h1 class="node-title">
      ${i18n(schema.title)} 
    </h1>

    <p class="node-description">
      ${i18n(schema.description)}
    </p>

    <div class="sockets-input">
      ${input}
    </div>

    <div class="sockets-output">
      ${output}
    </div>
  `
  }
}
