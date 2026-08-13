import { TRAINING_CASES } from './training-case-bank';
import { validateTrainingCaseBank } from './training-case-validation';

describe('training case bank', () => {
  it('is valid against the operational SemantIAr contract', () => {
    expect(validateTrainingCaseBank(TRAINING_CASES)).toEqual([]);
  });

  it('rejects an annotation category outside the operational contract', () => {
    const altered = structuredClone(TRAINING_CASES) as any[];
    altered[0].expected.annotation.cat = 'Medición/observable';

    expect(validateTrainingCaseBank(altered)).toContain('TRN-001: categoría fuera del contrato.');
  });

  it('rejects a well-formed SCTID that was not reviewed for the training release', () => {
    const altered = structuredClone(TRAINING_CASES) as any[];
    altered[0].expected.annotation.sctid = '123456789';

    expect(validateTrainingCaseBank(altered)).toContain(
      'TRN-001: SCTID no incluido en la lista terminológica verificada.'
    );
  });

  it('rejects a display term that diverges from the pinned terminology edition', () => {
    const altered = structuredClone(TRAINING_CASES) as any[];
    altered[0].expected.annotation.term = 'Dyspnea';

    expect(validateTrainingCaseBank(altered)).toContain(
      'TRN-001: el término no coincide con el display terminológico verificado.'
    );
  });

  it('rejects a literal that is padded with surrounding context', () => {
    const altered = structuredClone(TRAINING_CASES) as any[];
    altered[0].expected.annotation.textoLiteral = ' disnea ';

    expect(validateTrainingCaseBank(altered)).toContain(
      'TRN-001: el literal debe ser una mención contigua, mínima y presente en la nota (literal-minimo-contiguo-contexto-separado).'
    );
  });
});
