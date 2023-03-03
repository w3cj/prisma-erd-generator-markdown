import prettier from 'prettier'

export const formatFile = (content: string): Promise<string> => {
  return new Promise((res, rej) =>
    prettier.resolveConfig(process.cwd()).then((options = {}) => {
      try {
        const formatted = prettier.format(content, {
          ...options,
          parser: 'markdown',
        })

        res(formatted)
      } catch (error) {
        rej(error)
      }
    })
  )
}
