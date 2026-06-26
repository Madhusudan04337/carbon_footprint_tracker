import { TsJestTransformer } from 'ts-jest';

const baseTransformer = new TsJestTransformer();

export default {
  process(sourceText, sourcePath, options) {
    const modifiedText = sourceText.replace(/import\.meta\.env/g, 'process.env');
    return baseTransformer.process(modifiedText, sourcePath, options);
  },
  getCacheKey(sourceText, sourcePath, options) {
    return baseTransformer.getCacheKey(sourceText, sourcePath, options);
  }
};
