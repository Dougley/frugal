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
    errors: {
      check_failed: "Kon premiumstatus niet controleren",
      database_unavailable: "Premiumservice tijdelijk niet beschikbaar",
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
} satisfies Partial<typeof enUS>;
