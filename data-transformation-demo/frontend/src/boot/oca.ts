import { boot } from 'quasar/wrappers'
import init, { OcaJs } from 'oca.js-form-core'

export default boot(async ({ app }) => {
  await init()

  const ocaJs = new OcaJs({
    dataVaults: [],
    ocaRepositories: []
  })

  app.config.globalProperties.$ocaJs = ocaJs
})
