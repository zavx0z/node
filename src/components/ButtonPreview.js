const html = String.raw

class ButtonPreview extends HTMLElement {
  /** @type {HTMLButtonElement} */ #button
  constructor() {
    super()
    const host = this.attachShadow({ mode: "closed" })
    host.innerHTML = html`
      <style>
        button {
          padding: 0;
          background-color: transparent;
          border: none;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          & path {
            transition: fill 0.2s ease-in-out;
            fill: var(--primary-300);
          }
          &:hover path {
            fill: var(--primary-500);
          }
        }
      </style>
    `
    const button = document.createElement("button")
    button.onclick = () => (this.preview = !this.preview)
    host.appendChild(button)
    this.#button = button
  }
  static get observedAttributes() {
    return ["preview"]
  }
  attributeChangedCallback(name) {
    this.#button.innerHTML = this.preview
      ? html`
          <svg
            width="24px"
            height="24px"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="426.004 433 12.9912 9.00195">
            <path
              fill="#4d4a4a"
              opacity="1"
              stroke="none"
              d="M432.5 433C429.222 432.999 427.464 435.721 426.136 437.162C425.96 437.354 425.96 437.648 426.136 437.84C427.464 439.281 429.222 442 432.5 442.002C435.778 442.004 437.536 439.281 438.863 437.84C439.039 437.648 439.039 437.354 438.863 437.162C437.535 435.721 435.777 433.001 432.5 433ZM432.5 434C434.433 434 436 435.567 436 437.5C436 439.433 434.433 441 432.5 441C430.567 441 429 439.433 429 437.5C429 435.567 430.567 434 432.5 434ZM432.5 436C431.671 436 431 436.672 431 437.5C431 438.328 431.671 439 432.5 439C433.328 439 434 438.328 434 437.5C434 436.672 433.328 436 432.5 436Z" />
          </svg>
        `
      : html`
          <svg
            width="24px"
            height="24px"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="405.032 436.999 12.9633 1">
            <path
              fill="#4d4a4a"
              opacity="1"
              stroke="none"
              d="M405.502 437C405.308 437.012 405.138 437.135 405.067 437.316C404.996 437.497 405.036 437.703 405.17 437.844C406.494 439.282 408.252 442.002 411.515 442.002C414.779 442.002 416.539 439.282 417.863 437.844C418.05 437.64 418.037 437.324 417.834 437.137C417.63 436.95 417.314 436.963 417.127 437.166C415.691 438.725 414.221 441.002 411.515 441.002C408.81 441.002 407.34 438.725 405.904 437.166C405.802 437.052 405.654 436.991 405.502 437Z" />
          </svg>
        `
  }
  get preview() {
    return this.getAttribute("preview") === "true"
  }
  set preview(value) {
    this.setAttribute("preview", value)
  }
}
customElements.define("button-preview", ButtonPreview)
