import genMermaid from '../helpers/genMermaid'
import { getSampleDMMF } from './__fixtures__/getSampleDMMF'

test('mermaid generation', async () => {
  const sampleDMMF = await getSampleDMMF()
  expect(genMermaid(sampleDMMF.datamodel)).toMatchSnapshot('sample-dmmf');
})
