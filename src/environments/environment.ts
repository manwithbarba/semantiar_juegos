// Development environment (default).
export const environment = {
  production: false,
  // Single terminology server for dev and prod: SnowstormX demo (implementation-demo).
  terminologyServer: 'https://implementation-demo.snomedtools.org/fhir',
  // Fallback edition/language. The active edition is auto-detected at startup:
  // if the Argentina edition is present it is used in Spanish, else this fallback.
  editionUri: 'http://snomed.info/sct',
  displayLanguage: 'en',
};
