import type enUS from "./en-US";

export default {
  locale: "Nederlands (Nederland)",
  common: {
    errors: {
      giveaway_state_unavailable: "Giveawaystatus niet beschikbaar",
      database_unavailable: "Database tijdelijk niet beschikbaar",
    },
    winner_singular: "1 winnaar",
    winners_plural: "{count} winnaars",
    ends: "Eindigt",
  },
  premium: {
    upgrade_required:
      "Dit command vereist een premium-abonnement. Upgrade om geavanceerde functies te ontgrendelen!",
    dm_upgrade_required:
      "Dit command vereist premium en kan alleen in servers worden gebruikt.",
    limit_exceeded:
      "Je hebt de {feature}-limiet bereikt ({current}/{maxValue}). Upgrade naar premium om je limiet te verhogen naar {premiumMaxValue}!",
    feature_upgrade_nags: {
      more_winners: "🥳 Meer winnaars nodig?",
      longer_duration: "⏰ Langere giveaway-duur gewenst?",
      customization: "🎨 Op zoek naar aanpassingsopties?",
      more_giveaways: "🎉 Meer giveaways tegelijk draaien?",
    },
    upgrade_button: {
      label: "Upgrade naar Premium",
      emoji: "⭐",
    },
    upgrade_cta: "Upgrade naar Premium voor meer functies!",
    upgrade_link: "https://discord.com/application-directory/YOUR_APP_ID/store",
    status: {
      active: "✨ Premium Actief",
      lifetime: "levenslang abonnement",
      expires: "verloopt {date}",
      free: "🆓 Gratis",
    },
    errors: {
      check_failed: "Kon premiumstatus niet controleren",
      database_unavailable: "Premiumservice tijdelijk niet beschikbaar",
    },
    upgrade_messages: {
      feature_limited:
        "🔒 **{feature}** is beperkt in de gratis versie.\n\n📊 **Huidig:** {current}\n🎯 **Gratis limiet:** {freeLimit}\n✨ **Premium limiet:** {premiumLimit}\n\nUpgrade naar Premium om hogere limieten te ontgrendelen!",
      premium_indicator: " ✨ *Premium*",
      expires_soon: " ✨ *Premium (verloopt {date})*",
    },
  },
  commands: {
    ping: {
      name: "ping",
      description: "Test de latency van de bot",
      messages: {
        pinging: "🏓 Pingen...",
        error: "🏓 Pong! Kon de RTT niet berekenen.",
        success: "🏓 Pong! RTT is `{rtt}`ms",
      },
    },
    list: {
      name: "list",
      description:
        "Lijst alle giveaways die momenteel in deze server actief zijn",
      errors: {
        guild_only: "Dit command kan alleen in een server gebruikt worden.",
      },
      messages: {
        no_giveaways: "Er zijn geen giveaways actief in deze server.",
        title: "Giveaways die momenteel actief zijn",
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
        duration_too_long_premium:
          "Maximale giveawayduur voor premium is {maxDays} dagen.",
        duration_too_long: "Giveaways mogen niet langer dan 14 dagen duren",
        duration_too_short: "Giveaways mogen niet korter dan 10 seconden duren",
        winners_too_many:
          "Te veel winnaars. Max is {max} voor je abonnement (premium max: {premiumMax}).",
        failed_to_create_message: "Kon giveawaybericht niet aanmaken",
        failed_to_start: "Kon giveaway niet starten: {error}",
        concurrent_giveaways_limit_exceeded:
          "Er draaien al te veel giveaways in deze server. Max is {freeMax} (premium max: {premiumMax}).",
        guild_only: "Dit command kan alleen in een server gebruikt worden.",
      },
      messages: {
        success:
          "Giveaway voor **{prize}** met {winners} winnaar(s) is aangemaakt en loopt {duration}!",
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
      errors: {
        giveaway_not_found: "Die giveaway bestaat niet of is al verlopen.",
      },
      messages: {
        success: "Giveaway succesvol gestopt! Winnaars worden getrokken...",
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
      errors: {
        giveaway_not_found: "Die giveaway bestaat niet of is verlopen.",
      },
    },
    reroll: {
      name: "reroll",
      description: "Hertrek winnaars voor een giveaway",
      options: {
        id: {
          name: "id",
          description: "ID van de giveaway om opnieuw te trekken",
        },
        count: {
          name: "count",
          description:
            "Aantal winnaars om opnieuw te trekken (gratis standaard 1; premium kan meerdere/allemaal)",
        },
      },
      errors: {
        giveaway_not_found: "Die giveaway bestaat niet.",
        giveaway_still_running:
          "Die giveaway loopt nog. Je kunt pas opnieuw trekken als hij is geëindigd. Probeer hem eerst te stoppen.",
        no_winners_available:
          "Er konden geen nieuwe winnaars worden getrokken, omdat er geen (andere) inzendingen waren.",
        count_limit_free:
          "Gratis gebruikers kunnen maar 1 winnaar per keer opnieuw trekken. Upgrade naar premium om meerdere winnaars opnieuw te trekken.",
        count_too_many:
          "Je kunt maximaal {max} winnaars tegelijk opnieuw trekken.",
        unexpected: "Er is een onverwachte fout opgetreden.",
      },
      messages: {
        partial_success_singular:
          "🎉 Een nieuwe winnaar is getrokken!\nGefeliciteerd {winners}!",
        partial_success_plural:
          "🎉 {count} nieuwe winnaars zijn getrokken!\nGefeliciteerd {winners}!",
        success_singular:
          "🎉 Nieuwe winnaar is getrokken!\nGefeliciteerd {winners}!",
        success_plural:
          "🎉 Nieuwe winnaars zijn getrokken!\nGefeliciteerd {winners}!",
      },
    },
    debug: {
      name: "debug",
      description: "Debug en diagnostiek",
      options: {
        action: {
          name: "action",
          description: "Welke debug-actie moet worden uitgevoerd",
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
          "Dit command is alleen beschikbaar in de development guild.",
        unknown_action: "Onbekende debug-actie",
        missing_object_id: "Ontbrekend object-ID",
        giveaway_not_found: "Die giveaway bestaat niet.",
        no_entitlement_scope:
          "Geen entitlement-scope beschikbaar in deze context",
        unexpected: "Er is een onverwachte fout opgetreden.",
      },
      messages: {
        starting_full_test: "Savestate volledige test starten...",
        full_test_started: `**Savestate Volledige Test Gestart**
🎁 **Prijs:** {prize}
👥 **Winnaars:** {winners}
⏱️ **Duur:** {duration} seconden
👤 **Inzendingen:** {entries}
📌 **Status:** {status}
🆔 **Object ID:** {id}

Alarm gaat af om {endTime}`,
        alarm_started:
          "Testalarm gestart dat afgaat over {duration} seconden! (Object ID: {id})",
        giveaway_info: `**Giveaway Informatie**
🎁 **Prijs:** {prize}
👥 **Winnaars:** {winners}
👤 **Inzendingen:** {entries}
📌 **Status:** {status}
⏱️ **Eindtijd:** {endTime}
⌛ **Resterend:** {remaining}
🆔 **Object ID:** {id}

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
      errors: {
        invalid_giveaway_id: "Ongeldige giveaway-ID",
        giveaway_state_unavailable:
          "Giveawayservice is momenteel niet beschikbaar.",
        giveaway_not_found: "Giveaway niet gevonden",
        giveaway_not_open: "Deze giveaway accepteert geen inzendingen meer.",
        already_entered: "Je doet al mee aan deze giveaway.",
        not_entered: "Je doet niet mee aan deze giveaway.",
        giveaway_ended: "Deze giveaway is al geëindigd.",
        rate_limited: "Je wordt rate limited. Probeer het later opnieuw.",
        unexpected_error:
          "Er is een onverwachte fout opgetreden. Probeer het opnieuw.",
      },
      messages: {
        successfully_entered:
          "Je doet nu mee aan de giveaway voor **{prize}**!",
        successfully_left:
          "Je hebt de giveaway voor **{prize}** succesvol verlaten!",
        already_entered_leave:
          "Je doet al mee aan deze giveaway. In plaats daarvan verlaten?",
        leave_button: "Verlaat Giveaway",
      },
    },
    edit_modal: {
      errors: {
        giveaway_state_unavailable:
          "Giveawayservice is momenteel niet beschikbaar.",
        giveaway_not_found: "Die giveaway bestaat niet of is verlopen.",
        invalid_modal_submission: "Ongeldige modal-inzending.",
        required_fields: "Prijs en winnaars zijn verplichte velden.",
        invalid_winners_count: "Aantal winnaars moet tussen 1 en 50 zijn.",
        update_failed: "Kon giveaway niet bijwerken: {error}",
      },
      messages: {
        update_success: "Giveaway is succesvol bijgewerkt!",
      },
    },
  },
  autocomplete: {
    stop: {
      winners_singular: "{winners} winnaar",
      winners_plural: "{winners} winnaars",
    },
    edit: {
      ends_text: "Eindigt {date} met {winners} winnaar",
      ends_text_plural: "Eindigt {date} met {winners} winnaars",
    },
    reroll: {
      winners_singular: "{winners} winnaar",
      winners_plural: "{winners} winnaars",
    },
  },
  giveaway: {
    ended: {
      no_winners:
        "😔 De giveaway voor **{prize}** is geëindigd, maar er konden geen winnaars worden getrokken.\n\nBedankt aan iedereen die heeft meegedaan!",
      no_valid_winners:
        "😔 De giveaway voor **{prize}** is geëindigd, maar er konden geen geldige winnaars worden vastgesteld.\n\nBedankt aan iedereen die heeft meegedaan!",
      with_winners:
        "🎉 De giveaway voor **{prize}** is geëindigd!\n\nGefeliciteerd aan de winnaars: {winners}\n\nBedankt aan iedereen die heeft meegedaan!",
      nobody_won: "Niemand heeft gewonnen",
    },
    errors: {
      not_found: "Giveaway niet gevonden",
      already_entered: "Gebruiker heeft al meegedaan aan deze giveaway",
      not_entered: "Gebruiker doet niet mee aan deze giveaway",
      rate_limited:
        "Rate limited. Probeer het opnieuw over {seconds} seconden.",
      invalid_state_single:
        "Giveaway moet in {state} status zijn, maar is momenteel {current}",
      invalid_state_multiple:
        "Giveaway moet in een van de volgende statussen zijn: {states}. Momenteel {current}",
      reservation_db_error: "Kon giveawayslot niet reserveren",
      concurrent_limit_exceeded: "Te veel gelijktijdige giveaways",
    },
  },
  utils: {
    giveaway: {
      title: "Giveaway!",
      title_ended: "Giveaway geëindigd!",
      winners: "Winnaars",
      ends: "Eindigt",
      ended: "Geëindigd",
      hosted_by: "Gehost door",
      description_note: "Beschrijving van de host",
      prize: "Prijs",
      entries: "Deelnemers",
      enter_cta: "Klik op de knop hieronder om mee te doen!",
      participants: "{count, plural, one {# deelnemer} other {# deelnemers}}",
      winner_count: "{count, plural, one {# winnaar} other {# winnaars}}",
    },
    join_button: {
      label: "Doe mee aan giveaway",
    },
    edit_modal: {
      button_label: "Bewerk giveaway",
      modal_title: "Bewerk giveaway",
      prize_label: "Prijs",
      winners_label: "Winnaars (1-50)",
      description_label: "Beschrijving (optioneel)",
    },
  },
} satisfies Partial<typeof enUS>;
