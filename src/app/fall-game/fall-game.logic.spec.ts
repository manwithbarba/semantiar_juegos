import { buildFallGamePrompts, validateFallGameData } from './fall-game.logic';

describe('fall game data and prompt builder', () => {
  it('keeps the provisional calibration bank structurally valid', () => {
    expect(validateFallGameData()).toEqual([]);
  });

  it('builds one playable prompt per calibration annotation with four options', () => {
    const prompts = buildFallGamePrompts();

    expect(prompts).toHaveLength(75);
    expect(prompts.every((prompt) => prompt.options.length > 0)).toBe(true);
    expect(prompts.every((prompt) => prompt.options.length === 4)).toBe(true);
    expect(
      prompts.every((prompt) =>
        prompt.options.some((option) => option.id === prompt.correctOptionId)
      )
    ).toBe(true);
  });

  it('keeps distractors unique inside each prompt', () => {
    const prompts = buildFallGamePrompts();

    expect(
      prompts.every((prompt) => {
        const ids = prompt.options.map((option) => option.id);
        return new Set(ids).size === ids.length;
      })
    ).toBe(true);
  });

  it('varies the challenge across brief forms, clinical mentions, and attributes', () => {
    const prompts = buildFallGamePrompts();

    expect(prompts.some((prompt) => prompt.kind === 'forma-breve')).toBe(true);
    expect(prompts.some((prompt) => prompt.kind === 'forma-clinica')).toBe(true);
    expect(prompts.some((prompt) => prompt.kind === 'atributos')).toBe(true);
    expect(prompts.every((prompt) => prompt.instruction.includes(prompt.literal))).toBe(true);
  });
});
