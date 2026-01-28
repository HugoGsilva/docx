import { useState } from 'react';
import TemplateSelector from './components/TemplateSelector';
import ProposalForm from './components/ProposalForm';
import Header from './components/Header';
import { ArrowLeft } from 'lucide-react';

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!selectedTemplate ? (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Selecione o Modelo de Proposta
              </h2>
              <p className="text-gray-600">
                Escolha o template adequado para gerar sua proposta comercial
              </p>
            </div>
            
            <TemplateSelector onSelect={handleTemplateSelect} />
          </>
        ) : (
          <>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Voltar para seleção de modelos</span>
            </button>
            
            <ProposalForm 
              template={selectedTemplate} 
              onBack={handleBack}
            />
          </>
        )}
      </main>

      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>© 2026 Gerador de Propostas Comerciais. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default App;
