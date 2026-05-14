import { describe, it, expect } from 'vitest';
import {
  normalizeEmail,
  normalizePhone,
  normalizeLeadSource,
  normalizeLeadSourceOrNull,
  normalizeLeadStage,
  stringOrNull
} from './normalization';

describe('normalizeEmail', () => {
  it('retorna null para valores não-string', () => {
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(123)).toBeNull();
    expect(normalizeEmail({})).toBeNull();
  });

  it('retorna null para email vazio ou sem @ (valores inválidos)', () => {
    expect(normalizeEmail('')).toBeNull();
    expect(normalizeEmail('   ')).toBeNull();
    expect(normalizeEmail('emailsemarroba.com')).toBeNull();
  });

  it('remove espaços vazios e converte para letras minúsculas (duplicidade de formatos)', () => {
    expect(normalizeEmail(' EMAIL.TESTE@exemplo.com ')).toBe('email.teste@exemplo.com');
  });
});

describe('normalizePhone', () => {
  it('retorna nulls para valores não-string ou valores vazios', () => {
    expect(normalizePhone(null)).toEqual({ display: null, e164: null });
    expect(normalizePhone(123)).toEqual({ display: null, e164: null });
    expect(normalizePhone('   ')).toEqual({ display: null, e164: null });
  });

  it('retorna nulls quando não há dígitos no telefone', () => {
    expect(normalizePhone('abc')).toEqual({ display: null, e164: null });
  });

  it('adiciona código +55 para números de 10 ou 11 dígitos (telefone brasileiro)', () => {
    expect(normalizePhone('11999999999')).toEqual({ display: '11999999999', e164: '+5511999999999' });
    expect(normalizePhone('(11) 9999-9999')).toEqual({ display: '(11) 9999-9999', e164: '+551199999999' });
  });

  it('mantém o código 55 se já estiver presente no início', () => {
    expect(normalizePhone('5511999999999')).toEqual({ display: '5511999999999', e164: '+5511999999999' });
    expect(normalizePhone('+55 (11) 99999-9999')).toEqual({ display: '+55 (11) 99999-9999', e164: '+5511999999999' });
  });

  it('lida com outros códigos e quantidades de dígitos', () => {
    expect(normalizePhone('1234567')).toEqual({ display: '1234567', e164: '+1234567' });
  });
});

describe('normalizeLeadSource', () => {
  it('retorna manual para origens desconhecidas ou inválidas', () => {
    expect(normalizeLeadSource('desconhecido')).toBe('manual');
    expect(normalizeLeadSource(null)).toBe('manual');
  });

  it('retorna a origem exata para origens permitidas', () => {
    expect(normalizeLeadSource('meta_lead_ads')).toBe('meta_lead_ads');
    expect(normalizeLeadSource('csv_import')).toBe('csv_import');
  });

  it('normaliza aliases e formatos variados corretamente', () => {
    expect(normalizeLeadSource('Meta Lead Ads')).toBe('meta_lead_ads');
    expect(normalizeLeadSource('  CSV   ')).toBe('csv_import');
    expect(normalizeLeadSource('importação de csv')).toBe('csv_import');
    expect(normalizeLeadSource('ZAPIER')).toBe('make_zapier');
  });
});

describe('normalizeLeadSourceOrNull', () => {
  it('retorna null para valores não mapeados ou inválidos', () => {
    expect(normalizeLeadSourceOrNull('desconhecido')).toBeNull();
    expect(normalizeLeadSourceOrNull(123)).toBeNull();
  });

  it('retorna a origem mapeada para aliases válidos', () => {
    expect(normalizeLeadSourceOrNull('make')).toBe('make_zapier');
  });
});

describe('normalizeLeadStage', () => {
  it('retorna new para estágios desconhecidos ou inválidos', () => {
    expect(normalizeLeadStage('desconhecido')).toBe('new');
    expect(normalizeLeadStage(null)).toBe('new');
  });

  it('retorna o estágio exato para estágios permitidos', () => {
    expect(normalizeLeadStage('qualification')).toBe('qualification');
    expect(normalizeLeadStage('won')).toBe('won');
  });
});

describe('stringOrNull', () => {
  it('retorna null para strings vazias ou valores não-string', () => {
    expect(stringOrNull('')).toBeNull();
    expect(stringOrNull('   ')).toBeNull();
    expect(stringOrNull(123)).toBeNull();
    expect(stringOrNull(null)).toBeNull();
  });

  it('retorna a string sem os espaços em branco nas extremidades', () => {
    expect(stringOrNull('  texto válido  ')).toBe('texto válido');
  });
});
