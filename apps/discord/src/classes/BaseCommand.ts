import { Locale } from 'discord-api-types/v10';
import { SlashCommand, SlashCommandOptions, SlashCreator } from 'slash-create/web';
import { EnvContext } from '../env';

// Environment constants for registration mode detection
const REGISTRATION_ENV_FLAG = 'FRUGAL_REGISTRATION_MODE';
const REGISTRATION_I18N_KEY = '__FRUGAL_REGISTRATION_I18N__';

/**
 * Base class for Discord slash commands with internationalization support
 *
 * This class automatically handles command localization during both:
 * - Registration time (using global i18n instance from registration script)
 * - Runtime (using EnvContext.i18n from worker environment)
 */
export abstract class BaseCommand extends SlashCommand {
  constructor(creator: SlashCreator, options: SlashCommandOptions) {
    super(creator, options);
  }

  /**
   * Build a localization map containing only valid Discord locales
   * @param translations - Raw translations object with all locales
   * @returns Filtered object with only valid Discord locale keys
   */
  private static buildLocalizationMap(translations: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.values(Locale)
        .filter((locale) => translations[locale])
        .map((locale) => [locale, translations[locale]])
    );
  }

  /**
   * Get the appropriate i18n instance based on current execution context
   * @returns i18n instance or null if not available
   */
  private getI18nInstance() {
    const isRegistrationMode = process.env[REGISTRATION_ENV_FLAG] === 'true';

    if (isRegistrationMode) {
      // During registration, use global i18n instance from registration script
      return (global as any)[REGISTRATION_I18N_KEY] || null;
    }

    // During runtime, use EnvContext i18n
    return EnvContext.i18n;
  }

  /**
   * Apply localizations to command and its options
   * Called automatically by slash-create during registration/sync
   */
  async onLocaleUpdate(): Promise<void> {
    const commandKey = `commands.${this.commandName}`;
    const i18n = this.getI18nInstance();

    if (!i18n) {
      console.warn(`⚠️ i18n not available for ${this.commandName} - skipping localization`);
      return;
    }

    try {
      // Get command name and description translations
      const [descriptions, names] = await Promise.all([
        i18n.translateAll(`${commandKey}.description`),
        i18n.translateAll(`${commandKey}.name`)
      ]);

      // Apply command localizations
      this.descriptionLocalizations = BaseCommand.buildLocalizationMap(descriptions);
      this.nameLocalizations = BaseCommand.buildLocalizationMap(names);

      // Apply option localizations if command has options
      if (this.options?.length) {
        await this.localizeOptions(i18n, commandKey);
      }
      console.log(`✅ Localized ${this.commandName}`);
    } catch (error) {
      console.warn(`⚠️ Failed to apply localizations for ${this.commandName}:`, error);
    }
  }

  /**
   * Apply localizations to command options
   * @param i18n - i18n instance to use for translations
   * @param commandKey - Base translation key for the command
   */
  private async localizeOptions(i18n: any, commandKey: string): Promise<void> {
    if (!this.options?.length) return;

    await Promise.all(
      this.options.map(async (option) => {
        const optionKey = `${commandKey}.options.${option.name}`;

        const [optionDescriptions, optionNames] = await Promise.all([
          i18n.translateAll(`${optionKey}.description`),
          i18n.translateAll(`${optionKey}.name`)
        ]);

        option.description_localizations = BaseCommand.buildLocalizationMap(optionDescriptions);
        option.name_localizations = BaseCommand.buildLocalizationMap(optionNames);
      })
    );
  }
}
