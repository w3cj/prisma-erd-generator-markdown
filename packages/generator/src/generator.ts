import { generatorHandler, GeneratorOptions } from '@prisma/generator-helper'
import { logger } from '@prisma/sdk'
import { GENERATOR_NAME } from './constants'
import genMermaid from './helpers/genMermaid'
import { writeFileSafely } from './utils/writeFileSafely'

const { version } = require('../package.json')

generatorHandler({
  onManifest() {
    logger.info(`${GENERATOR_NAME}:Registered`)
    return {
      version,
      defaultOutput: '../generated',
      prettyName: GENERATOR_NAME,
    }
  },
  onGenerate: async (options: GeneratorOptions) => {
    const mermaid = genMermaid(options.dmmf.datamodel);
    await writeFileSafely(options.generator.output?.value!, mermaid)
  },
})
