import { useState, useEffect } from 'react';
import { FileDown, Loader2, Calendar, DollarSign, Percent, Type, Lock, Edit3 } from 'lucide-react';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

function ProposalForm({ template, onBack }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [manualMode, setManualMode] = useState(false); // Modo de entrada manual

  // Inicializar com data de hoje
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR');
    setFormData(prev => ({
      ...prev,
      DATA: formattedDate
    }));
  }, []);

  // Formatar valor monetário com R$
  const formatCurrency = (value) => {
    if (!value) return '';
    const numericValue = value.replace(/\D/g, '');
    const floatValue = parseInt(numericValue, 10) / 100;
    return floatValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Formatar valor monetário SEM R$ (só número formatado)
  const formatCurrencyRaw = (value) => {
    if (!value) return '';
    const numericValue = value.replace(/\D/g, '');
    const floatValue = parseInt(numericValue, 10) / 100;
    return floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Converter valor formatado para número
  const parseCurrencyToNumber = (value) => {
    if (!value) return 0;
    // Remove tudo exceto números, vírgula e ponto
    // Usa /\./g para remover TODOS os pontos (separadores de milhar)
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  // Formatar número para moeda R$
  const numberToCurrency = (num) => {
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Formatar data para exibição
  const formatDateDisplay = (value) => {
    if (!value) return '';
    const date = new Date(value + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  // Calcular campos automáticos
  const calculateFields = (data) => {
    const newData = { ...data };

    if (template.id === 'RPBANK') {
      const valorProposta = parseCurrencyToNumber(data.VALORPROPOSTA);
      const taxaIntermediacao = parseCurrencyToNumber(data.TAXAINTERMEDIACAO);

      // TOTAL = VALORPROPOSTA - TAXAINTERMEDIACAO
      const total = valorProposta - taxaIntermediacao;

      // Intermediação = 10% do TOTAL
      const intermediacao = total * 0.10;

      // Parceria e Escritório = 80% e 20% da INTERMEDIAÇÃO
      const parceria = intermediacao * 0.80;    // 80% da intermediação
      const escritorio = intermediacao * 0.20;  // 20% da intermediação

      newData.TOTAL = numberToCurrency(total);
      newData.INTERMEDIACAO = numberToCurrency(intermediacao);
      newData.PARCERIA = numberToCurrency(parceria);
      newData.ESCRITORIO = numberToCurrency(escritorio);
    }

    if (template.id === 'SD-RESOLV') {
      const valorProposta = parseCurrencyToNumber(data.VALORPROPOSTA);
      const valorIntermediacao = parseCurrencyToNumber(data.VALORINTERMEDIACAO);

      // TOTAL = VALORPROPOSTA - VALORINTERMEDIACAO
      const total = valorProposta - valorIntermediacao;
      newData.TOTAL = numberToCurrency(total);
    }

    return newData;
  };

  // Handler para mudança de campos
  const handleChange = (key, value, type) => {
    let formattedValue = value;

    if (type === 'currency') {
      formattedValue = formatCurrency(value);
    } else if (type === 'currency_raw') {
      formattedValue = formatCurrencyRaw(value);
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        [key]: formattedValue
      };
      // Só recalcular campos automáticos se NÃO estiver em modo manual
      if (manualMode) {
        return updated; // Não recalcula, apenas atualiza o valor
      }
      return calculateFields(updated);
    });
  };

  // Handler para data
  const handleDateChange = (key, value) => {
    const formattedDate = formatDateDisplay(value);
    setFormData(prev => ({
      ...prev,
      [key]: formattedDate
    }));
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post('/api/proposals/generate', {
        templateId: template.id,
        formData: formData
      }, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.API_KEY}`
        }
      });

      // Gerar nome do arquivo personalizado
      let fileName = `proposta_${template.id}.pdf`;

      if (template.fileNameFields) {
        const processo = formData[template.fileNameFields.processo] || '';
        const nome = formData[template.fileNameFields.nome] || '';
        const data = formData[template.fileNameFields.data] || '';

        // Limpar caracteres inválidos para nome de arquivo
        const cleanStr = (str) => str.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');

        if (processo && nome && data) {
          fileName = `${cleanStr(processo)}_${cleanStr(nome)}_${cleanStr(data)}.pdf`;
        }
      }

      // Criar link para download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Erro ao gerar proposta:', err);

      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          setError(json.error || 'Erro ao gerar proposta');
        } catch {
          setError('Erro ao gerar proposta. Verifique se o template está configurado.');
        }
      } else {
        setError(err.response?.data?.error || 'Erro ao gerar proposta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderizar ícone do campo
  const getFieldIcon = (type, calculated) => {
    if (calculated) {
      return <Lock size={18} className="text-blue-500" />;
    }
    switch (type) {
      case 'date':
        return <Calendar size={18} className="text-gray-400" />;
      case 'currency':
      case 'currency_raw':
        return <DollarSign size={18} className="text-gray-400" />;
      case 'percentage':
        return <Percent size={18} className="text-gray-400" />;
      default:
        return <Type size={18} className="text-gray-400" />;
    }
  };

  // Renderizar campo baseado no tipo
  const renderField = (field) => {
    const { key, label, type, calculated, autoFill } = field;

    // Campo calculado - bloqueado ou editável dependendo do modo
    if (calculated) {
      const isEditable = manualMode;
      return (
        <div key={key} className="relative">
          <label className="block text-sm font-medium text-blue-700 mb-2">
            {label} <span className="text-xs text-blue-500">
              {isEditable ? '(modo manual)' : '(calculado automaticamente)'}
            </span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {getFieldIcon(type, !isEditable)}
            </div>
            {isEditable ? (
              <input
                type="text"
                className="input-field pl-10 bg-blue-50 text-blue-800 font-semibold hover:bg-blue-100 focus:bg-white transition-colors"
                value={formData[key] || ''}
                placeholder="R$ 0,00"
                onChange={(e) => handleChange(key, e.target.value, 'currency')}
              />
            ) : (
              <input
                type="text"
                className="input-field pl-10 bg-blue-50 text-blue-800 font-semibold cursor-not-allowed opacity-80"
                value={formData[key] || 'R$ 0,00'}
                placeholder="R$ 0,00"
                readOnly
                disabled
              />
            )}
          </div>
        </div>
      );
    }

    if (type === 'date') {
      // Converter DD/MM/YYYY para YYYY-MM-DD para o input date
      const getDateInputValue = () => {
        if (!formData[key]) return '';
        const parts = formData[key].split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return '';
      };

      return (
        <div key={key} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {autoFill && <span className="text-xs text-green-600">(preenchido)</span>}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {getFieldIcon(type)}
            </div>
            <input
              type="date"
              className="input-field pl-10"
              value={getDateInputValue()}
              onChange={(e) => handleDateChange(key, e.target.value)}
            />
          </div>
        </div>
      );
    }

    if (type === 'currency') {
      return (
        <div key={key} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {getFieldIcon(type)}
            </div>
            <input
              type="text"
              className="input-field pl-10"
              placeholder="R$ 0,00"
              value={formData[key] || ''}
              onChange={(e) => handleChange(key, e.target.value, type)}
            />
          </div>
        </div>
      );
    }

    if (type === 'currency_raw') {
      return (
        <div key={key} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {getFieldIcon(type)}
            </div>
            <input
              type="text"
              className="input-field pl-10"
              placeholder="0,00"
              value={formData[key] || ''}
              onChange={(e) => handleChange(key, e.target.value, type)}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Valor sem R$ (o template já inclui)
          </p>
        </div>
      );
    }

    if (type === 'percentage') {
      return (
        <div key={key} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {getFieldIcon(type)}
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="input-field pl-10"
              placeholder="0.00"
              value={formData[key] || ''}
              onChange={(e) => handleChange(key, e.target.value, type)}
            />
          </div>
        </div>
      );
    }

    return (
      <div key={key} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {getFieldIcon(type)}
          </div>
          <input
            type="text"
            className="input-field pl-10"
            placeholder={`Digite ${label.toLowerCase()}`}
            value={formData[key] || ''}
            onChange={(e) => handleChange(key, e.target.value, type)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="card max-w-3xl mx-auto">
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">
          Proposta {template.name}
        </h2>
        <p className="text-gray-600 mt-1">
          Preencha os campos abaixo para gerar sua proposta em PDF
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {template.fields.map(renderField)}
        </div>

        {/* Botão para alternar modo manual */}
        <div className="mb-6 flex justify-center">
          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${manualMode
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
              }`}
          >
            <Edit3 size={16} />
            {manualMode ? 'Voltar ao cálculo automático' : 'Inserir dados manualmente'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Erro</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Sucesso!</p>
            <p className="text-sm">Proposta gerada e baixada com sucesso.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Gerando PDF...</span>
            </>
          ) : (
            <>
              <FileDown size={20} />
              <span>Gerar Proposta PDF</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default ProposalForm;
