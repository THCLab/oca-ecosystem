const express = require('express')
const multer = require('multer')
const fs = require('fs')
const { Transformer, CSVDataSet } = require('oca-data-transformer')

const app = express()
const port = 3000

const upload = multer({
  storage: multer.diskStorage({
    destination: function (_req, _file, cb) {
      cb(null, '/tmp')
    }
  })
})

app.post(`/api/transform`, upload.single('dataSetFile'),
  async (req, res) => {
    try {
      const data = fs.readFileSync(req.file.path, 'utf8');
      const delimiter = ','
      const oca = JSON.parse(req.body.oca)

      const overlays = []
      if (req.body.transformationOverlays.trim().length > 0) {
        const transformationOverlays = JSON.parse(req.body.transformationOverlays)
        if (Array.isArray(transformationOverlays)) {
          transformationOverlays.forEach(o => overlays.push(JSON.stringify(o)))
        } else {
          overlays.push(req.body.transformationOverlays)
        }
      }
      const transformer = new Transformer(oca)
        .addDataSet(new CSVDataSet(data, delimiter))
        .transform(overlays)

      const result = transformer.getRawDatasets()[0]

      res.status(200).json({ success: true, result: { data: result, delimiter }});
    } catch (error) {
      console.log(error)
      res.status(500).json({ success: false, message: error });
    }
  }
);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
