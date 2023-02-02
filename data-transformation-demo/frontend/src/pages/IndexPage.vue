<template>
  <q-page class="q-pa-md">
    <div class="items-center justify-evenly">
      <div class="row">
        <div class="col-1" />
        <div class="col-4">
          <q-file
            v-model="file"
            label="Pick OCA Bundle zip file"
            accept=".zip"
            filled />
          <!-- eslint-disable vue/no-v-html -->
          <br>
          <span v-html="parsingResult"></span>
          <!-- eslint-enable vue/no-v-html -->
        </div>
        <div class="col-1" />
        <div class="col-6">
          <div class="col-12">
            <q-spinner v-if="loading" color="primary" size="5em" />
            <div class="q-gutter-y-md" style="max-width: 100vw; width: 100%">
              <q-card v-if="htmlOCAForm">
                <q-tabs
                  v-model="tab"
                  dense
                  class="text-grey"
                  active-color="primary"
                  indicator-color="primary"
                  align="justify"
                  narrow-indicator>
                  <q-tab name="form" label="Form" :disable="!htmlOCAForm" />
                  <q-tab name="ocaJson" label="JSON" />
                </q-tabs>

                <q-separator />

                <q-tab-panels v-model="tab" animated>
                  <q-tab-panel
                    style="display: flex; justify-content: center"
                    name="form">
                    <!-- eslint-disable vue/no-v-html -->
                    <div
                      style="min-width: 300px; max-width: 30vw"
                      v-html="htmlOCAForm" />
                    <!--eslint-enable-->
                  </q-tab-panel>

                  <q-tab-panel
                    name="ocaJson">
                    <div>
                      <json-viewer :value="oca" copyable :expand-depth=3></json-viewer>
                    </div>
                  </q-tab-panel>
                </q-tab-panels>
              </q-card>
            </div>
          </div>
        </div>
      </div>
      <br>
      <div class="row">
        <div class="col-1" />
        <div class="col-4">
          <q-file
            v-model="dataSetFile"
            label="Pick Data Set file"
            accept=".csv"
            filled />

          <!-- eslint-disable vue/no-v-html -->
          <br>
          <span v-html="dataSetParsingResult"></span>
          <!-- eslint-enable vue/no-v-html -->
          <br>
          Transformation overlays
          <q-input
            v-model="transformationOverlays"
            filled
            type="textarea">
          </q-input>
        </div>
        <div class="col-1" />
        <div class="col-6">
          <q-spinner v-if="dataSetLoading" color="primary" size="5em" />
          <div class="q-gutter-y-md" style="max-width: 100vw; width: 100%">
            <q-card v-if="dataSetTableRows">
              <q-table
                :columns="dataSetTableColumns"
                :rows="dataSetTableRows"
              />
            </q-card>
          </div>
        </div>
      </div>
      <br>
      <div class="row">
        <div class="col-1" />
        <div class="col-4">
          <q-btn
            color="primary"
            :disabled="!oca || !dataSetFile"
            @click="sendTransformRequest">
            Transform
          </q-btn>
          <!-- eslint-disable vue/no-v-html -->
          <br>
          <span v-html="transformationResult"></span>
          <!-- eslint-enable vue/no-v-html -->
        </div>
        <div class="col-1" />
        <div class="col-6">
          <q-spinner v-if="transformationLoading" color="primary" size="5em" />
          <div class="q-gutter-y-md" style="max-width: 100vw; width: 100%">
            <q-card v-if="transformedDataSetTableRows">
              <q-table
                :columns="transformedDataSetTableColumns"
                :rows="transformedDataSetTableRows"
              />
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, watch, getCurrentInstance } from 'vue'
import { resolveFromZip, OcaJs } from 'oca.js-form-core'
import { renderOCAForm } from 'oca.js-form-html'
import JsonViewer from 'vue-json-viewer'
import Papa from 'papaparse'
import { AxiosInstance } from 'axios'

import { Config } from '@/types/config'

export default defineComponent({
  name: 'IndexPage',
  components: { JsonViewer },
  setup() {
    const currentInstance = getCurrentInstance()
    if (!currentInstance) {
      return
    }
    const $ocaJs = currentInstance.appContext.config.globalProperties
      .$ocaJs as OcaJs
    const $axios = currentInstance.appContext.config.globalProperties
      .$axios as AxiosInstance
    const parsingResult = ref('')
    const dataSetParsingResult = ref('')
    const transformationResult = ref('')
    const file = ref()
    const dataSetFile = ref()
    const oca = ref()
    const loading = ref(false)
    const dataSetLoading = ref(false)
    const transformationLoading = ref(false)
    const htmlOCAForm = ref()
    const tab = ref('form')
    const dataSetTableColumns = ref()
    const dataSetTableRows = ref()
    const transformationOverlays = ref('')
    const transformedDataSetTableColumns = ref()
    const transformedDataSetTableRows = ref()

    watch(file, async newFile => {
      htmlOCAForm.value = null
      parsingResult.value = ''
      loading.value = true
      try {
        oca.value = await resolveFromZip(newFile)
        const structure = await $ocaJs.createStructure(oca.value)

        if (structure.formLayout) {
          const form = await renderOCAForm(
            structure,
            {},
            {
              showFlagged: true,
              onSubmitHandler: capturedData => console.log(capturedData)
            }
          )
          htmlOCAForm.value = form
        }
        if (!htmlOCAForm.value) {
          tab.value = 'ocaJson'
        }
      } catch (e) {
        parsingResult.value += '<div style="color: #FC100D">Failure!</div>'
        parsingResult.value += e
        console.error(e)
      } finally {
        loading.value = false
      }
    })

    watch(dataSetFile, async newFile => {
      dataSetParsingResult.value = ''
      dataSetLoading.value = true
      try {
        Papa.parse(newFile, {
          header: true,
          complete: (results) => {
            if (results && results.meta && results.meta.fields) {
              dataSetTableColumns.value = results.meta.fields.map(f => ({
                name: f,
                'label': f,
                align: 'left',
                field: f,
                sortable: true
              }))
            }
            dataSetTableRows.value = results.data
            dataSetTableRows.value.pop()
          }
        })
      } catch (e) {
        dataSetParsingResult.value += '<div style="color: #FC100D">Failure!</div>'
        dataSetParsingResult.value += e
        console.error(e)
      } finally {
        dataSetLoading.value = false
      }
    })

    const sendTransformRequest = async () => {
      transformedDataSetTableRows.value = null
      transformedDataSetTableColumns.value = null
      transformationResult.value = ''
      transformationLoading.value = true
      // @ts-ignore
      const requestUrl = `${(config as Config).env.BACKEND}/api/transform`
      const formData = new FormData()
      formData.append('oca', JSON.stringify(oca.value))
      formData.append('dataSetFile', dataSetFile.value)
      formData.append('transformationOverlays', transformationOverlays.value)

      /* eslint-disable */
      try {
        const transformResponse = await $axios.post(requestUrl, formData)
        if (transformResponse.data.success) {
          const { data, delimiter } = transformResponse.data.result
          const parsedData = Papa.parse(data, { header: true, delimiter }).data
          transformedDataSetTableRows.value = parsedData
          // @ts-ignore
          transformedDataSetTableColumns.value = Object.keys(parsedData[0]).map(f => ({
            name: f,
            'label': f,
            align: 'left',
            field: f,
            sortable: true
          }))
        } else {
          console.error(transformResponse.data.message)
          transformationResult.value += `<div style="color: #FC100D">Failure!</div><ul><li>${transformResponse.data.message}</li></ul>`
        }
      } catch(e: any) {
        transformationResult.value = `<div style="color: #FC100D">Failure!</div><br><div>${e}<br>${e.response.data.message}</div>`
      } finally {
        transformationLoading.value = false
      }
      /* eslint-enable */
    }

    return {
      htmlOCAForm,
      parsingResult,
      loading,
      oca,
      tab,
      file,
      dataSetFile,
      dataSetParsingResult,
      dataSetLoading,
      dataSetTableColumns,
      dataSetTableRows,
      transformationOverlays,
      sendTransformRequest,
      transformationResult,
      transformedDataSetTableColumns,
      transformedDataSetTableRows,
      transformationLoading,
    }
  }
})
</script>
