import { Building2, Scale } from 'lucide-react';

// Configuração dos templates
const TEMPLATES = [
  {
    id: 'RPBANK',
    name: 'RPBANK',
    description: 'Modelo para propostas do RPBANK com cálculo de intermediação',
    icon: Building2,
    color: 'from-blue-500 to-blue-700',
    file: 'modeloB.odt',
    fields: [
      { key: 'DATA', label: 'Data', type: 'date' },
      { key: 'PROPOSTA', label: 'Número da Proposta', type: 'text' },
      { key: 'AC', label: 'A/C (Aos Cuidados)', type: 'text' },
      { key: 'REQUERENTE', label: 'Requerente', type: 'text' },
      { key: 'NUMEROPROCESSO', label: 'Número do Processo', type: 'text' },
      { key: 'TOTAL', label: 'Valor Total', type: 'currency' },
      { key: 'VALORLIQUIDO', label: 'Valor Líquido', type: 'currency' },
      { key: 'VALORPROPOSTA', label: 'Valor da Proposta', type: 'currency' },
      { key: 'TAXAINTERMEDIACAO', label: 'Taxa de Intermediação', type: 'currency' },
      { key: 'INTERMEDIACAO', label: 'Valor Intermediação', type: 'currency' },
      { key: 'PARCERIA', label: 'Parceria', type: 'currency' },
      { key: 'ESCRITORIO', label: 'Escritório', type: 'currency' }
    ]
  },
  {
    id: 'SD-RESOLV',
    name: 'SD-RESOLV',
    description: 'Modelo simplificado para propostas SD-RESOLV',
    icon: Scale,
    color: 'from-emerald-500 to-emerald-700',
    file: 'MODELOA.ODT',
    fields: [
      { key: 'DATA', label: 'Data', type: 'date' },
      { key: 'AC', label: 'A/C (Aos Cuidados)', type: 'text' },
      { key: 'PROCESSONUMERO', label: 'Número do Processo', type: 'text' },
      { key: 'VALORLIQUIDO', label: 'Valor Líquido', type: 'currency' },
      { key: 'VALORPROPOSTA', label: 'Valor Proposta', type: 'currency' },
      { key: 'VALORINTERMEDIACAO', label: 'Valor de Intermediação', type: 'currency' },
      { key: 'TOTAL', label: 'Total', type: 'currency' }
    ]
  }
];

function TemplateSelector({ onSelect }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {TEMPLATES.map((template) => {
        const IconComponent = template.icon;
        
        return (
          <div
            key={template.id}
            onClick={() => onSelect(template)}
            className="card-hover group"
          >
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <IconComponent className="text-white" size={32} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {template.name}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {template.description}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {template.fields.slice(0, 4).map((field) => (
                <span
                  key={field.key}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                >
                  {field.label}
                </span>
              ))}
              {template.fields.length > 4 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  +{template.fields.length - 4} campos
                </span>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Arquivo: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{template.file}</code>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TemplateSelector;
