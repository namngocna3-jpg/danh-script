/// <reference types="vite/client" />
import type { DanhScriptApi } from '../../preload/index'
import type { JSX as ReactJSX } from 'react'

declare global {
  interface Window {
    danh: DanhScriptApi
  }
  // React 19 chuyển JSX vào React.JSX — vá lại global cho gọn
  namespace JSX {
    type Element = ReactJSX.Element
    type ElementClass = ReactJSX.ElementClass
    type IntrinsicElements = ReactJSX.IntrinsicElements
  }
}

export {}
