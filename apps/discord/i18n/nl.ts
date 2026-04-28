import type enUS from "./en-US";

export default {
  locale: "Nederlands (Nederland)",

  common: {
    errors: {
      guild_only: "Dit commando kan alleen in een server worden gebruikt.",
      giveaway_not_found: "Die giveaway bestaat niet.",
      giveaway_expired: "Die giveaway bestaat niet of is verlopen.",
      giveaway_state_unavailable:
        "Giveawayservice is momenteel niet beschikbaar.",
      database_unavailable: "Database tijdelijk niet beschikbaar.",
      unexpected: "Er is een onverwachte fout opgetreden. Probeer het opnieuw.",
      rate_limited: "Je wordt rate limited. Probeer het later opnieuw.",
      manage_required:
        "Je hebt Server beheren of Berichten beheren nodig om hier giveaways te maken.",
      manage_giveaway_denied:
        "Alleen de giveawayhost of een servermoderator kan deze giveaway beheren.",
      not_giveaway_message:
        "Dat bericht is geen giveaway die door deze bot is gemaakt.",
    },
    labels: {
      winners: "{count, plural, one {# winnaar} other {# winnaars}}",
      participants: "{count, plural, one {# deelnemer} other {# deelnemers}}",
      ends: "Eindigt",
      ended: "Geëindigd",
    },
  },

  commands: {
    ping: {
      name: "ping",
      description: "Test de latency van de bot",
      messages: {
        pinging: "Pingen...",
        success: "Pong! RTT is `{rtt}`ms",
        error: "Pong! Kon de RTT niet berekenen.",
      },
    },

    list: {
      name: "list",
      description: "Toont alle actieve giveaways in deze server",
      messages: {
        title: "Actieve Giveaways",
        no_giveaways: "Er zijn geen actieve giveaways in deze server.",
      },
    },

    start: {
      name: "start",
      description: "Start een giveaway in het huidige kanaal",
      options: {
        duration: {
          name: "duration",
          description: "Duur van de giveaway (bijv. 30s, 5m, 2h, 1d)",
        },
        winners: {
          name: "winners",
          description: "Aantal winnaars",
        },
        prize: {
          name: "prize",
          description: "Prijs om te winnen",
        },
        description: {
          name: "description",
          description: "Beschrijving van de giveaway",
        },
      },
      errors: {
        invalid_duration_format:
          "Ongeldig duurformaat. Gebruik bijvoorbeeld: 30s, 5m, 2h, 1d",
        duration_too_short:
          "Giveaways mogen niet korter dan 10 seconden duren.",
        duration_too_long:
          "Giveaways mogen niet langer dan {maxDays} dagen duren.",
        winners_too_many:
          "Te veel winnaars. Max is {max} voor jouw plan (premium max: {premiumMax}).",
        concurrent_limit:
          "Er draaien al te veel giveaways in deze server. Max is {max} (premium max: {premiumMax}).",
        failed_to_create: "Kon giveawaybericht niet aanmaken.",
        failed_to_start: "Kon giveaway niet starten: {error}",
      },
      messages: {
        success:
          "Giveaway voor **{prize}** met {winners} is aangemaakt en loopt {duration}!",
      },
    },

    stop: {
      name: "stop",
      description: "Stop een lopende giveaway",
      options: {
        id: {
          name: "id",
          description: "ID van de giveaway om te stoppen",
        },
      },
      messages: {
        success:
          "Giveaway voor **{prize}** succesvol gestopt! Winnaars worden getrokken...",
      },
      errors: {
        not_running: "Die giveaway loopt momenteel niet.",
        failed: "Kon giveaway niet stoppen. Probeer het opnieuw.",
      },
    },

    edit: {
      name: "edit",
      description: "Bewerk een giveaway",
      options: {
        id: {
          name: "id",
          description: "ID van de giveaway om te bewerken",
        },
      },
    },

    giveaway_status: {
      name: "Giveaway Status",
      description: "Toon de giveawaystatus van een giveawaybericht",
      messages: {
        status: `**{prize}**
Status: {status}
Inzendingen: {entries}
Winnaars: {winners}
Eindigt: {endTime}
Host: {host}
Jouw inzending: {entryStatus}`,
      },
      status: {
        open: "Open",
        closed: "Geëindigd",
        entered: "Ingeschreven",
        not_entered: "Niet ingeschreven",
      },
    },

    check_entries: {
      name: "Controleer Inzendingen",
      description:
        "Bekijk bij welke giveaways een gebruiker is ingeschreven in deze server",
      errors: {
        no_target: "Kon de doelgebruiker niet identificeren.",
      },
      messages: {
        no_active_giveaways:
          "Er zijn geen actieve giveaways in deze server waar {user} voor kan zijn ingeschreven.",
        not_entered_any:
          "{user} is niet ingeschreven voor {total} van de actieve giveaways.",
        result:
          "{user} is ingeschreven voor {entered} van de {total} actieve giveaways:\n\n{entries}",
        entry_line: "• [{prize}]({link}) - Eindigt {endTime}",
      },
    },

    copy_giveaway_id: {
      name: "Kopieer Giveaway-ID",
      description: "Kopieer het giveaway-ID van een giveawaybericht",
      messages: {
        result:
          "Giveaway-ID voor **{prize}** ({state}):\n```\n{id}\n```\nGebruik dit ID met `/edit`, `/stop` of `/reroll`.",
      },
    },

    reroll: {
      name: "reroll",
      description: "Hertrek winnaars voor een beëindigde giveaway",
      options: {
        id: {
          name: "id",
          description: "ID van de giveaway om opnieuw te trekken",
        },
        count: {
          name: "count",
          description:
            "Aantal winnaars om opnieuw te trekken (gratis: 1, premium: meer)",
        },
      },
      errors: {
        still_running:
          "Die giveaway loopt nog. Stop hem eerst voordat je opnieuw trekt.",
        no_entries:
          "Er konden geen nieuwe winnaars worden getrokken, omdat er geen (andere) inzendingen waren.",
        count_limit_free:
          "Gratis gebruikers kunnen maar 1 winnaar per keer opnieuw trekken. Upgrade naar premium voor meer.",
        count_too_many:
          "Je kunt maximaal {max} winnaars tegelijk opnieuw trekken.",
      },
      messages: {
        success:
          "{count, plural, one {Een nieuwe winnaar is getrokken!} other {# nieuwe winnaars zijn getrokken!}}\nGefeliciteerd {winners}!",
      },
    },

    debug: {
      name: "debug",
      description: "Debug en diagnostiek",
      options: {
        action: {
          name: "action",
          description: "Welke debug-actie uit te voeren",
        },
        duration: {
          name: "duration",
          description: "De duur van het testalarm (in seconden)",
        },
        winners: {
          name: "winners",
          description: "Aantal winnaars om te trekken",
        },
        id: {
          name: "id",
          description: "De Durable Object ID van de giveaway",
        },
        entries: {
          name: "entries",
          description: "Aantal testinzendingen om te genereren (standaard: 10)",
        },
        scope: {
          name: "scope",
          description: "Entitlement-scope (guild/user/both)",
        },
        limit: {
          name: "limit",
          description: "Max aantal entitlement-rijen (standaard: 10)",
        },
      },
      errors: {
        not_allowed:
          "Dit commando is alleen beschikbaar in de development guild.",
        unknown_action: "Onbekende debug-actie.",
        missing_object_id: "Ontbrekend object-ID.",
        no_entitlement_scope:
          "Geen entitlement-scope beschikbaar in deze context.",
      },
      messages: {
        starting_full_test: "Savestate volledige test starten...",
        full_test_started: `**Savestate Volledige Test Gestart**
Prijs: {prize}
Winnaars: {winners}
Duur: {duration} seconden
Inzendingen: {entries}
Status: {status}
Object ID: {id}

Alarm gaat af om {endTime}`,
        alarm_started:
          "Testalarm gestart dat afgaat over {duration} seconden! (Object ID: {id})",
        giveaway_info: `**Giveaway Informatie**
Prijs: {prize}
Winnaars: {winners}
Inzendingen: {entries}
Status: {status}
Eindtijd: {endTime}
Resterend: {remaining}
Object ID: {id}

{entriesList}`,
        no_entries: "Nog geen inzendingen.",
        entries_header: "**Inzendingen:**",
        and_more: "...en nog {count}",
        premium_status: `**Premium Status**
- hasPremium: {hasPremium}
- source: {source}
- isLifetime: {isLifetime}
- expiresAt: {expiresAt}
- entitlementType: {entitlementType}
- entitlementId: {entitlementId}
- skuId: {skuId}
- isTest: {isTest}`,
        entitlements: `**Entitlements ({count})** (scope: {scope})
{rows}`,
      },
    },
  },

  components: {
    join_button: {
      label: "Doe mee aan Giveaway",
      leave_label: "Verlaat Giveaway",
      errors: {
        invalid_id: "Ongeldige giveaway-ID.",
        invalid_action: "Ongeldige giveaway-actie.",
        not_open: "Deze giveaway accepteert geen inzendingen meer.",
        already_entered: "Je doet al mee aan deze giveaway.",
        not_entered: "Je doet niet mee aan deze giveaway.",
        ended: "Deze giveaway is al geëindigd.",
      },
      messages: {
        entered: "Je doet nu mee aan de giveaway voor **{prize}**!",
        left: "Je hebt de giveaway voor **{prize}** verlaten!",
        already_entered_prompt:
          "Je doet al mee aan deze giveaway. In plaats daarvan verlaten?",
      },
    },

    edit_modal: {
      button_label: "Bewerk Giveaway",
      title: "Bewerk Giveaway",
      fields: {
        prize: "Prijs",
        winners: "Winnaars (1-50)",
        description: "Beschrijving (optioneel)",
      },
      errors: {
        invalid_submission: "Ongeldige modal-inzending.",
        not_open: "Alleen lopende giveaways kunnen worden bewerkt.",
        required_fields: "Prijs en winnaars zijn verplichte velden.",
        invalid_winners: "Aantal winnaars moet tussen 1 en 50 zijn.",
        update_failed: "Kon giveaway niet bijwerken: {error}",
      },
      messages: {
        success: "Giveaway is succesvol bijgewerkt!",
      },
    },
  },

  autocomplete: {
    giveaway: {
      format: "{prize} - {winners} - Eindigt {date}",
    },
  },

  giveaway: {
    embed: {
      title: "Giveaway!",
      title_ended: "Giveaway Geëindigd!",
      prize: "Prijs",
      winners: "Winnaars",
      entries: "Inzendingen",
      hosted_by: "Gehost door",
      enter_cta: "Klik op de knop hieronder om mee te doen!",
      description_note: "Beschrijving van de host",
    },

    ended: {
      no_entries:
        "De giveaway voor **{prize}** is geëindigd, maar er konden geen winnaars worden getrokken.\n\nBedankt aan iedereen die heeft meegedaan!",
      no_valid_winners:
        "De giveaway voor **{prize}** is geëindigd, maar er konden geen geldige winnaars worden vastgesteld.\n\nBedankt aan iedereen die heeft meegedaan!",
      with_winners:
        "De giveaway voor **{prize}** is geëindigd!\n\nGefeliciteerd aan de winnaars: {winners}\n\nBedankt aan iedereen die heeft meegedaan!",
      nobody_won: "Niemand heeft gewonnen",
    },

    errors: {
      already_entered: "Gebruiker doet al mee aan deze giveaway.",
      not_entered: "Gebruiker doet niet mee aan deze giveaway.",
      rate_limited:
        "Rate limited. Probeer het opnieuw over {seconds} seconden.",
      invalid_state:
        "Giveaway moet in {expected} status zijn, maar is momenteel {current}.",
      reservation_failed: "Kon giveawayslot niet reserveren.",
      concurrent_limit: "Te veel gelijktijdige giveaways.",
    },
  },

  premium: {
    required: "Deze functie vereist een premium-abonnement.",
    required_guild:
      "Deze functie vereist premium en kan alleen in servers worden gebruikt.",

    status: {
      active: "Premium Actief",
      lifetime: "Levenslang abonnement",
      expires: "Verloopt {date}",
      free: "Gratis",
    },

    limits: {
      exceeded:
        "Je hebt de {feature}-limiet bereikt ({current}/{max}). Upgrade naar premium voor maximaal {premiumMax}!",
    },

    upsell: {
      more_winners: "Meer winnaars nodig?",
      longer_duration: "Langere giveaway-duur gewenst?",
      customization: "Op zoek naar aanpassingsopties?",
      more_giveaways: "Meer giveaways tegelijk draaien?",
    },

    upgrade: {
      label: "Upgrade naar Premium",
      cta: "Upgrade naar Premium voor meer functies!",
    },

    errors: {
      check_failed: "Kon premiumstatus niet controleren.",
      unavailable: "Premiumservice tijdelijk niet beschikbaar.",
    },
  },
} satisfies Partial<typeof enUS>;
