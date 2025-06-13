import type enUS from './en-US';

export default {
  locale: 'Nederlands (Nederland)',
  common: {
    errors: {
      giveaway_state_unavailable: 'Giveawaystatus niet beschikbaar'
    },
    winner_singular: '1 winnaar',
    winners_plural: '{count} winnaars',
    ends: 'Eindigt'
  },
  commands: {
    ping: {
      name: 'ping',
      description: 'Test de latency van de bot',
      messages: {
        pinging: '🏓 Pingen...',
        error: '🏓 Pong! Kon de RTT niet berekenen.',
        success: '🏓 Pong! RTT is `{rtt}`ms'
      }
    },
    list: {
      name: 'list',
      description: 'Lijst alle giveaways die momenteel in deze server actief zijn',
      messages: {
        no_giveaways: 'Er draaien geen giveaways in deze server.',
        title: 'Actieve giveaways'
      }
    },
    start: {
      name: 'start',
      description: 'Start een giveaway in het huidige kanaal',
      options: {
        duration: {
          name: 'duration',
          description: 'Duur van de giveaway (bijv. 30s, 5m, 2h, 1d)'
        },
        winners: {
          name: 'winners',
          description: 'Aantal winnaars'
        },
        prize: {
          name: 'prize',
          description: 'Prijs om te winnen'
        },
        description: {
          name: 'description',
          description: 'Beschrijving van de giveaway'
        }
      },
      errors: {
        invalid_duration_format: 'Ongeldig duurformaat. Gebruik bijvoorbeeld: 30s, 5m, 2h, 1d',
        duration_too_long: 'Giveaways mogen niet langer dan 14 dagen duren',
        duration_too_short: 'Giveaways mogen niet korter dan 10 seconden duren',
        failed_to_create_message: 'Kon giveawaybericht niet aanmaken',
        failed_to_start: 'Kon giveaway niet starten: {error}'
      }
    },
    stop: {
      name: 'stop',
      description: 'Stop een lopende giveaway',
      options: {
        id: {
          name: 'id',
          description: 'ID van de giveaway om te stoppen'
        }
      },
      errors: {
        giveaway_not_found: 'Die giveaway bestaat niet of is al verlopen.'
      },
      messages: {
        success: 'Giveaway succesvol gestopt! Winnaars worden getrokken...'
      }
    },
    edit: {
      name: 'edit',
      description: 'Bewerk een giveaway',
      options: {
        id: {
          name: 'id',
          description: 'ID van de giveaway om te bewerken'
        }
      },
      errors: {
        giveaway_not_found: 'Die giveaway bestaat niet of is verlopen.'
      }
    },
    reroll: {
      name: 'reroll',
      description: 'Hertrek winnaars voor een giveaway',
      options: {
        id: {
          name: 'id',
          description: 'ID van de giveaway om opnieuw te trekken'
        },
        count: {
          name: 'count',
          description: 'Aantal winnaars om opnieuw te trekken (standaard allemaal)'
        }
      },
      errors: {
        giveaway_not_found: 'Die giveaway bestaat niet.',
        giveaway_still_running:
          'Die giveaway loopt nog. Je kunt pas opnieuw trekken als hij is geëindigd. Probeer hem eerst te stoppen.',
        no_winners_available:
          'Er konden geen nieuwe winnaars worden getrokken, omdat er geen (andere) inzendingen waren.'
      },
      messages: {
        partial_success_singular: '🎉 Een nieuwe winnaar is getrokken!\nGefeliciteerd {winners}!',
        partial_success_plural: '🎉 {count} nieuwe winnaars zijn getrokken!\nGefeliciteerd {winners}!',
        success_singular: '🎉 Nieuwe winnaar is getrokken!\nGefeliciteerd {winners}!',
        success_plural: '🎉 Nieuwe winnaars zijn getrokken!\nGefeliciteerd {winners}!'
      }
    },
    savetest: {
      name: 'savetest',
      description: 'Test het savestate-systeem',
      options: {
        type: {
          name: 'type',
          description: 'Type test om uit te voeren'
        },
        duration: {
          name: 'duration',
          description: 'De duur van het testalarm (in seconden)'
        },
        winners: {
          name: 'winners',
          description: 'Aantal winnaars om te trekken'
        },
        id: {
          name: 'id',
          description: 'De Durable Object ID van de giveaway'
        }
      },
      errors: {
        unknown_test_type: 'Onbekend testtype',
        missing_object_id: 'Ontbrekend object-ID'
      }
    }
  }
} satisfies Partial<typeof enUS>;
