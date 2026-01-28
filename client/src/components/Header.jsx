import { FileText } from 'lucide-react';

function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-lg">
            <FileText className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Gerador de Propostas Comerciais
            </h1>
            <p className="text-sm text-gray-500">
              Automatize suas propostas em poucos cliques
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
