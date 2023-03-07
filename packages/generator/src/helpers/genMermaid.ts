import { DMMF, GeneratorOptions } from '@prisma/generator-helper'

type Relationship = {
  from: string;
  to: string;
  name: string;
  arrow: '}|--||' | '||--||' | '||--|{' | '}|--|{' | '}o--||' | '||--||' | '||--o{' | '}|--|{',
}

export default function genMermaid(datamodel: DMMF.Datamodel) {
  let mermaid = `erDiagram
`;
    const relationships: (Relationship | string)[] = [];
    const typeToDBName = new Map<string, string>();
    datamodel.models.forEach(async (modelInfo) => {
      const modelName = modelInfo.dbName || modelInfo.name;
      typeToDBName.set(modelInfo.name, modelName);
    });
    datamodel.models.forEach(async (modelInfo) => {
      const modelName = modelInfo.dbName || modelInfo.name;
      let modelDiagram = `\t${modelName} {\n`;
      const objectFields = modelInfo.fields.filter((field) => field.kind === 'object');
      const otherFields = modelInfo.fields.filter((field) => field.kind !== 'object');
      const foreignKeys = new Set<string>();
      objectFields.forEach((field) => {
        const fieldName = field.dbName || field.name;
        field.relationFromFields?.forEach((fromField) => {
          foreignKeys.add(fromField);
        });
        if (!field.isList) {
          const fromFieldName = field.relationFromFields ? field.relationFromFields[0] : '';
          const fromField = otherFields.find((f) => f.name === fromFieldName || f.dbName === fromFieldName);
          const isUnique = fromField ? fromField.isUnique : false;
          const relationship: Relationship = {
            from: modelName,
            to: typeToDBName.get(field.type) || field.type,
            name: fieldName,
            arrow: isUnique ? '||--||' : '}o--||',
          };
          const existing = relationships.find((r) => {
            if (typeof r === 'object') {
              return r.from === relationship.to && r.to === relationship.from;
            }
            return false;
          });
          if (existing && typeof existing === 'object') {
            existing.arrow = '}|--|{';
            relationship.arrow = '}|--|{';
          }
          relationships.push(relationship);
        }
      });
      otherFields.forEach((field) => {
        const fieldName = field.dbName || field.name;
        const nullable = !field.isRequired ? 'nullable' : '';
        if (field.kind === 'scalar') {
          const key = field.isId ? 'PK' : foreignKeys.has(fieldName) ? 'FK' : '';
          // @ts-ignore
          const defaultValue = field.default ? `${field.default.name}(${field.default.args.join(', ')})` : '';
          const comments = [nullable, defaultValue].filter((c) => c).join(', ');
          const parts = [field.type, fieldName, key, comments.length ? ` "${comments}"` : ''].filter((p) => p);
          modelDiagram += `\t\t${parts.join(' ')}\n`
        } else if (field.kind === 'enum') {
          const defaultValue = field.default ? `"${field.default}"` : '';
          const parts = [field.type, fieldName, defaultValue].filter((p) => p);
          modelDiagram += `\t\t${parts.join(' ')}\n`
          let relationship = `\t${modelName} }o--|| ${typeToDBName.get(field.type)} : "enum:${fieldName}"\n`;
          relationships.push(relationship);
        }
      })
      modelDiagram += '\t}\n';
      mermaid += modelDiagram;
    });
    datamodel.enums.forEach(async (enumInfo) => {
      const enumName = enumInfo.dbName || enumInfo.name;
      let enumDiagram = `\t${enumName} {\n`;
      enumInfo.values.forEach((value) => {
        const valueName = value.dbName || value.name;
        enumDiagram += `\t\tvalue ${valueName}\n`
      })
      enumDiagram += '\t}\n'
      mermaid += enumDiagram;
    })
    relationships.forEach((relationship) => {
      if (typeof relationship === 'string') {
        mermaid += relationship;
      } else {
        mermaid += `\t${relationship.from} ${relationship.arrow} ${relationship.to} : ${relationship.name}\n`;
      }
    });
    const markdown = `\`\`\`mermaid
${mermaid}
\`\`\``
  return markdown;
}