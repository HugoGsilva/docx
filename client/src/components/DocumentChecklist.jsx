import { CheckCircle2, FileText, CreditCard, MapPin, User } from 'lucide-react';

const REQUIRED_DOCUMENTS = [
  {
    id: 'cpf',
    name: 'CPF',
    icon: CreditCard,
    description: 'Cadastro de Pessoa Física'
  },
  {
    id: 'birth_certificate',
    name: 'Certidão de Nascimento',
    icon: FileText,
    description: 'Documento de certidão original ou cópia autenticada'
  },
  {
    id: 'rg_cnh',
    name: 'RG / CNH',
    icon: User,
    description: 'Documento de identidade com foto'
  },
  {
    id: 'address_proof',
    name: 'Comprovante de Endereço',
    icon: MapPin,
    description: 'Conta de luz, água ou telefone (últimos 3 meses)'
  }
];

function DocumentChecklist() {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-100 p-2 rounded-lg">
          <CheckCircle2 className="text-amber-600" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Documentos Necessários
          </h3>
          <p className="text-sm text-gray-600">
            Certifique-se de ter os seguintes documentos em mãos
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const IconComponent = doc.icon;
          
          return (
            <div
              key={doc.id}
              className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <IconComponent className="text-gray-600" size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{doc.name}</h4>
                <p className="text-sm text-gray-600">{doc.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DocumentChecklist;
