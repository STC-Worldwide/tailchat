import { PluginManifest, getLanguage } from 'tailchat-shared';

/**
 * Get manifest field with i18n support,
 * for example: get `label.zh-CN` than `label` in zh-CN language.
 * @param info Plugin Manifest Info
 * @param field Plugin Manifest Field
 */
export function getManifestFieldWithI18N(
  info: PluginManifest,
  field: 'label' | 'description'
): string {
  const language = getLanguage();

  return (info as any)[`${field}.${language}`] ?? info[field];
}
