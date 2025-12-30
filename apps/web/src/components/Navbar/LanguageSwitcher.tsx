import {
  Modal,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconCheck,
  IconLanguage,
  IconSearch,
  IconSkull,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  languageInfo,
  type SupportedLanguage,
  supportedLanguages,
} from "~/lib/i18n";
import { useI18nContext } from "../I18nProvider";
import classes from "./LanguageSwitcher.module.css";
import navClasses from "./Navbar.module.css";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage } = useI18nContext();
  const [opened, { open, close }] = useDisclosure(false);
  const [search, setSearch] = useState("");

  // Filter languages based on search query
  const filteredLanguages = useMemo(() => {
    const query = search.toLowerCase().trim();

    // Easter egg: only show pirate when searching for it
    const visibleLanguages = supportedLanguages.filter((lang) => {
      if (lang === "en-pirate") {
        return query === "pirate" || language === "en-pirate";
      }
      return true;
    });

    if (!query) return [...visibleLanguages];

    return visibleLanguages.filter((lang) => {
      const info = languageInfo[lang];
      return (
        info.nativeName.toLowerCase().includes(query) ||
        info.englishName.toLowerCase().includes(query) ||
        lang.toLowerCase().includes(query)
      );
    });
  }, [search, language]);

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    close();
    setSearch("");
  };

  return (
    <>
      <NavLink
        className={navClasses.link}
        href="#"
        label={t("settings.language")}
        leftSection={
          <IconLanguage
            className={navClasses.linkIcon}
            stroke={1.5}
            aria-hidden="true"
          />
        }
        onClick={(e) => {
          e.preventDefault();
          open();
        }}
      />

      <Modal
        opened={opened}
        onClose={() => {
          close();
          setSearch("");
        }}
        title={t("settings.language")}
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            placeholder={t("settings.languageSearch")}
            leftSection={<IconSearch size={16} aria-hidden="true" />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            autoFocus
          />

          <ScrollArea.Autosize mah={300} type="scroll">
            <Stack gap={4}>
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((lang) => {
                  const info = languageInfo[lang];
                  const isSelected = lang === language;

                  return (
                    <UnstyledButton
                      key={lang}
                      className={classes.languageOption}
                      data-selected={isSelected || undefined}
                      onClick={() => handleSelect(lang)}
                    >
                      <span className={classes.langCode}>
                        {lang === "en-pirate" ? (
                          <IconSkull size={18} aria-hidden="true" />
                        ) : (
                          <Text size="sm" fw={500}>
                            {lang.toUpperCase()}
                          </Text>
                        )}
                      </span>
                      <div className={classes.labelGroup}>
                        <Text size="sm" fw={isSelected ? 600 : 400}>
                          {info.nativeName}
                        </Text>
                        {info.nativeName !== info.englishName && (
                          <Text size="xs" c="dimmed">
                            {info.englishName}
                          </Text>
                        )}
                      </div>
                      {isSelected && (
                        <IconCheck
                          size={16}
                          className={classes.checkIcon}
                          aria-hidden="true"
                        />
                      )}
                    </UnstyledButton>
                  );
                })
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  {t("settings.noLanguagesFound")}
                </Text>
              )}
            </Stack>
          </ScrollArea.Autosize>
        </Stack>
      </Modal>
    </>
  );
}
