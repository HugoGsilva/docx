import { useState } from 'react';
import { FileDown, Loader2, Calendar, DollarSign, Percent, Type } from 'lucide-react';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

function ProposalForm({ template, onBack }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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

  // Formatar data para exibição
  const formatDateDisplay = (value) => {
    if (!value) return '';
    const date = new Date(value + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  // Handler para mudança de campos
  const handleChange = (key, value, type) => {
    let formattedValue = value;
    
    if (type === 'currency') {
      formattedValue = formatCurrency(value);
    } else if (type === 'currency_raw') {
      formattedValue = formatCurrencyRaw(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [key]: formattedValue
    }));
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

      // Criar link para download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proposta_${template.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
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
  const getFieldIcon = (type) => {
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
    const { key, label, type } = field;

    if (type === 'date') {
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
              type="date"
              className="input-field pl-10"
              onChange={(e) => handleDateChange(key, e.target.value)}
            />
          </div>
          {formData[key] && (
            <p className="text-xs text-gray-500 mt-1">
              Valor formatado: {formData[key]}
            </p>
          )}
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
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {template.fields.map(renderField)}
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
