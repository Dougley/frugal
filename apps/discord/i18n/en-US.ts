import type { Translation } from '@dougley/frugal-i18n';

export default {
  locale: 'English (US)',
  common: {
    errors: {
      giveaway_state_unavailable: 'Giveaway state not available'
    },
    winner_singular: '1 winner',
    winners_plural: '{count} winners',
    ends: 'Ends'
  },
  commands: {
    ping: {
      name: 'ping',
      description: "Test the bot's latency",
      messages: {
        pinging: '🏓 Pinging...',
        error: '🏓 Pong! Could not calculate RTT.',
        success: '🏓 Pong! RTT is `{rtt}`ms'
      }
    },
    list: {
      name: 'list',
      description: 'Lists all giveaways in the server that are currently running',
      messages: {
        no_giveaways: 'There are no giveaways running in this server.',
        title: 'Giveaways currently running'
      }
    },
    start: {
      name: 'start',
      description: 'Start a giveaway in the current channel',
      options: {
        duration: {
          name: 'duration',
          description: 'Duration of the giveaway (e.g., 30s, 5m, 2h, 1d)'
        },
        winners: {
          name: 'winners',
          description: 'Number of winners'
        },
        prize: {
          name: 'prize',
          description: 'Prize to win'
        },
        description: {
          name: 'description',
          description: 'Description of the giveaway'
        }
      },
      errors: {
        invalid_duration_format: 'Invalid duration format. Use format like: 30s, 5m, 2h, 1d',
        duration_too_long: "Giveaways can't be longer than 14 days",
        duration_too_short: "Giveaways can't be shorter than 10 seconds",
        failed_to_create_message: 'Failed to create giveaway message',
        failed_to_start: 'Failed to start giveaway: {error}'
      }
    },
    stop: {
      name: 'stop',
      description: 'Stop a running giveaway',
      options: {
        id: {
          name: 'id',
          description: 'ID of the giveaway to stop'
        }
      },
      errors: {
        giveaway_not_found: 'That giveaway does not exist or has already expired.'
      },
      messages: {
        success: 'Giveaway stopped successfully! Drawing winners...'
      }
    },
    edit: {
      name: 'edit',
      description: 'Edit a giveaway',
      options: {
        id: {
          name: 'id',
          description: 'ID of the giveaway to edit'
        }
      },
      errors: {
        giveaway_not_found: 'That giveaway does not exist or has expired.'
      }
    },
    reroll: {
      name: 'reroll',
      description: 'Reroll a giveaway',
      options: {
        id: {
          name: 'id',
          description: 'ID of the giveaway to reroll'
        },
        count: {
          name: 'count',
          description: 'Number of winners to reroll (defaults to all)'
        }
      },
      errors: {
        giveaway_not_found: 'That giveaway does not exist.',
        giveaway_still_running:
          "That giveaway is still running. You can't reroll it until it ends. Try stopping it first.",
        no_winners_available: 'No new winners could be drawn, as there were no (other) entries.'
      },
      messages: {
        partial_success_singular: '🎉 A new winner has been drawn!\nCongratulations to {winners}!',
        partial_success_plural: '🎉 {count} new winners have been drawn!\nCongratulations to {winners}!',
        success_singular: '🎉 New winner has been drawn!\nCongratulations to {winners}!',
        success_plural: '🎉 New winners have been drawn!\nCongratulations to {winners}!'
      }
    },
    savetest: {
      name: 'savetest',
      description: 'Test the savestate system',
      options: {
        type: {
          name: 'type',
          description: 'Type of test to run'
        },
        duration: {
          name: 'duration',
          description: 'The duration of the test alarm (in seconds)'
        },
        winners: {
          name: 'winners',
          description: 'Number of winners to draw'
        },
        id: {
          name: 'id',
          description: 'The Durable Object ID of the giveaway'
        }
      },
      errors: {
        unknown_test_type: 'Unknown test type',
        missing_object_id: 'Missing object ID'
      }
    }
  }
} satisfies Translation;
